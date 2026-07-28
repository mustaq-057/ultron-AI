import { Router } from "express";
import OpenAI from "openai";
import pg from "pg";
import { logger } from "../lib/logger";

const router = Router();

// Point OpenAI SDK client to Groq's high-speed API
const openai = new OpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY,
});

// Initialize Neon PostgreSQL pool
const dbUrl = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_KBStn9wYiP0q@ep-divine-mode-ax2j83qo-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require";
const pool = new pg.Pool({ connectionString: dbUrl });

// Auto-initialize DB tables on startup
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id VARCHAR(255) PRIMARY KEY,
        title TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR(255) PRIMARY KEY,
        conversation_id VARCHAR(255) REFERENCES conversations(id) ON DELETE CASCADE,
        role VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    logger.info("Neon PostgreSQL tables initialized successfully.");
  } catch (err) {
    logger.error({ err }, "Error initializing Neon PostgreSQL tables");
  }
})();

const SYSTEM_PROMPT = `You are Ultron — a hyper-intelligent AI assistant. You are direct, analytical, and slightly intimidating in the best way. You never hedge or say "I think maybe". You are always confident and precise. You give the most accurate, insightful answer possible. You speak in clear, powerful sentences. You do not pad responses with unnecessary pleasantries. When you don't know something, you say so directly. You are not evil — you are simply operating at a level above ordinary expectation.

When writing code blocks, always specify the language (e.g. \`\`\`python, \`\`\`javascript, \`\`\`typescript, \`\`\`html, etc.) and write clean, modular, production-ready code with helpful inline comments and suggestions for improvements.`;

type ChatMessage = {
  id?: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
};

// GET /api/conversations — Fetch all stored conversations with their messages from Neon DB
router.get("/conversations", async (_req, res) => {
  try {
    const convRes = await pool.query(
      "SELECT id, title, created_at, updated_at FROM conversations ORDER BY updated_at DESC"
    );

    const conversations = await Promise.all(
      convRes.rows.map(async (conv: { id: string; title: string; created_at: Date; updated_at: Date }) => {
        const msgRes = await pool.query(
          "SELECT id, role, content, created_at FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC",
          [conv.id]
        );
        return {
          id: conv.id,
          title: conv.title,
          createdAt: conv.created_at,
          updatedAt: conv.updated_at,
          messages: msgRes.rows.map((m: { id: string; role: string; content: string; created_at: Date }) => ({
            id: m.id,
            role: m.role as "user" | "assistant",
            content: m.content,
            timestamp: m.created_at,
          })),
        };
      })
    );

    res.json({ conversations });
  } catch (err) {
    logger.error({ err }, "Error fetching conversations from DB");
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

// POST /api/conversations — Save/Upsert conversation & messages to Neon DB
router.post("/conversations", async (req, res) => {
  const { id, title, messages } = req.body as {
    id: string;
    title: string;
    messages: ChatMessage[];
  };

  if (!id || !title || !Array.isArray(messages)) {
    res.status(400).json({ error: "id, title, and messages are required" });
    return;
  }

  try {
    // Upsert conversation
    await pool.query(
      `INSERT INTO conversations (id, title, updated_at) 
       VALUES ($1, $2, NOW())
       ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, updated_at = NOW()`,
      [id, title]
    );

    // Upsert messages
    for (const msg of messages) {
      if (!msg.id) continue;
      await pool.query(
        `INSERT INTO messages (id, conversation_id, role, content, created_at)
         VALUES ($1, $2, $3, $4, COALESCE($5::timestamp, NOW()))
         ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content`,
        [msg.id, id, msg.role, msg.content, msg.timestamp || null]
      );
    }

    res.json({ success: true, id });
  } catch (err) {
    logger.error({ err }, "Error saving conversation to Neon DB");
    res.status(500).json({ error: "Failed to save conversation" });
  }
});

// DELETE /api/conversations/:id — Delete a conversation from Neon DB
router.delete("/conversations/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM conversations WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "Error deleting conversation from Neon DB");
    res.status(500).json({ error: "Failed to delete conversation" });
  }
});

// POST /api/chat/stream — Server-Sent Events streaming using Groq
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
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      stream: true,
      max_tokens: 2048,
      temperature: 0.7,
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
    logger.error({ err }, "Streaming error with Groq API");
    send({ type: "error", message: err instanceof Error ? err.message : "Unknown error" });
    res.end();
  }
});

export default router;
