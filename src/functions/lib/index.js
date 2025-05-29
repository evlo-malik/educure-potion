"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.callAI = void 0;
const https_1 = require("firebase-functions/v2/https");
const axios_1 = __importDefault(require("axios"));
// Helper to delay retries
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function callOpenAIWithRetries(payload, retries = 3) {
    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            const response = await axios_1.default.post("https://api.openai.com/v1/chat/completions", payload, {
                headers: {
                    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                    "Content-Type": "application/json",
                },
            });
            return response;
        }
        catch (err) {
            const status = err.response?.status;
            if (status === 429 && attempt < retries - 1) {
                const wait = Math.pow(2, attempt) * 1000;
                console.warn(`Rate limited (429). Retrying in ${wait}ms...`);
                await delay(wait);
            }
            else {
                throw err;
            }
        }
    }
}
// Firebase Cloud Function
exports.callAI = (0, https_1.onRequest)({ secrets: ["OPENAI_API_KEY"] }, async (req, res) => {
    try {
        const payload = {
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: "Hello!" }],
        };
        const result = await callOpenAIWithRetries(payload);
        res.status(200).send(result.data);
    }
    catch (err) {
        console.error("OpenAI call failed:", err);
        res.status(500).send("AI call failed");
    }
});
