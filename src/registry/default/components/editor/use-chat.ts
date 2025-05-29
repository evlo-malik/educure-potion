"use client";

import { useChat as useBaseChat } from "@ai-sdk/react";

//   const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

//   return useBaseChat({
//     id: "editor",
//     api: "https://api.openai.com/v1/chat/completions",
//     fetch: async (input, init) => {
//       const { messages } = JSON.parse(init?.body as string);

//       const response = await fetch(input, {
//         method: "POST",
//         headers: {
//           Authorization: `Bearer ${apiKey}`,
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           model: "gpt-3.5-turbo",
//           messages,
//           temperature: 0.7,
//           stream: true,
//         }),
//       });
//       console.log("Response...", response);
//       return response;
//     },
//   });
// };

export const useChat = () => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  return useBaseChat({
    id: "editor",
    api: "https://api.openai.com/v1/chat/completions",
    fetch: async (input, init) => {
      const { messages } = JSON.parse(init?.body as string);

      const response = await fetch(input, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages,
          temperature: 0.7,
          stream: true,
        }),
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      const encoder = new TextEncoder();

      const transformedStream = new ReadableStream({
        async start(controller) {
          let fullText = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });

            for (const line of chunk.split("\n")) {
              if (line.trim().startsWith("data:")) {
                const jsonStr = line.replace("data: ", "").trim();
                if (jsonStr === "[DONE]") continue;

                try {
                  const parsed = JSON.parse(jsonStr);
                  const delta = parsed.choices?.[0]?.delta?.content;

                  if (delta) {
                    fullText += delta;
                    controller.enqueue(
                      encoder.encode(`0:${JSON.stringify(delta)}\n`)
                    );
                  }
                } catch (e) {
                  console.warn("Failed to parse SSE chunk:", jsonStr, e);
                }
              }
            }
          }

          controller.enqueue(
            encoder.encode(
              `d:${JSON.stringify({
                finishReason: "stop",
                usage: {
                  promptTokens: 0,
                  completionTokens: fullText.split(" ").length,
                },
              })}\n`
            )
          );
          controller.close();
        },
      });

      return new Response(transformedStream, {
        headers: {
          "Content-Type": "text/plain",
          Connection: "keep-alive",
        },
      });
    },
  });
};
