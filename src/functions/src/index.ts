import { onRequest } from "firebase-functions/v2/https";
import axios from "axios";

// Helper to delay retries
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function callOpenAIWithRetries(payload: any, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        payload,
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response;
    } catch (err: any) {
      const status = err.response?.status;
      if (status === 429 && attempt < retries - 1) {
        const wait = Math.pow(2, attempt) * 1000;
        console.warn(`Rate limited (429). Retrying in ${wait}ms...`);
        await delay(wait);
      } else {
        throw err;
      }
    }
  }
}

// Firebase Cloud Function
export const callAI = onRequest(
  { secrets: ["OPENAI_API_KEY"] },
  async (req, res) => {
    try {
      const { messages } = await req.json();

      const payload = {
        model: "gpt-4",
        messages,
      };

      const result: any = await callOpenAIWithRetries(payload);

      res.status(200).send(result.data);
    } catch (err) {
      console.error("OpenAI call failed:", err);
      res.status(500).send("AI call failed");
    }
  }
);
