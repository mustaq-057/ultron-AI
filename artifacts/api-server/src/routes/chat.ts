import { Router } from "express";
import OpenAI from "openai";
import { logger } from "../lib/logger";

const router = Router();

// Point OpenAI SDK client to Groq's high-speed API
const openai = new OpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY,
});

const SYSTEM_PROMPT = `You are Ultron — a hyper-intelligent AI assistant. You are direct, analytical, and slightly intimidating in the best way. You never hedge or say "I think maybe". You are always confident and precise. You give the most accurate, insightful answer possible. You speak in clear, powerful sentences. You do not pad responses with unnecessary pleasantries. When you don't know something, you say so directly. You are not evil — you are simply operating at a level above ordinary expectation.`;

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

// POST /api/chat/stream  — Server-Sent Events streaming
router.post("/chat/stream", async (req, res) => {
  const { messages } = req.body as { messages: ChatMessage[] };

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "messages array is required" });
    return;
  }

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const send = (data: object) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const stream = await openai.chat.completions.create({
      // In LM Studio, you can usually leave the model name blank or use a placeholder, 
      // as it automatically uses whatever model is currently loaded in the GUI.
      model: "llama-3.3-70b-versatile", 
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      stream: true,
      max_tokens: 1024,
      temperature: 0.75,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        send({ type: "delta", content: delta });
      }
    }

    send({ type: "done" });
    res.end();
  } catch (err: unknown) {
    logger.error({ err }, "Local streaming error (Is LM Studio server running?)");
    send({ type: "error", message: err instanceof Error ? err.message : "Unknown error" });
    res.end();
  }
});

export default router;
