import { Router } from "express";
import OpenAI from "openai";
import pg from "pg";
import { search as duckSearch } from "duck-duck-scrape";
import multer from "multer";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import util from "util";
import puppeteer from "puppeteer";
import * as cheerio from "cheerio";
import { logger } from "../lib/logger";

const execAsync = util.promisify(exec);

const router = Router();
const upload = multer({ dest: "uploads/", limits: { fileSize: 20 * 1024 * 1024 } });

// Groq client
const openai = new OpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY,
});

// DB
const dbUrl = process.env.DATABASE_URL || "";
const pool = new pg.Pool({ connectionString: dbUrl });

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
        mode VARCHAR(50) DEFAULT 'fast',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    // add mode column if not exists (migration safety)
    await pool.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS mode VARCHAR(50) DEFAULT 'fast';`).catch(() => {});
    logger.info("Neon PostgreSQL tables initialized successfully.");
  } catch (err) {
    logger.error({ err }, "Error initializing Neon PostgreSQL tables");
  }
})();

const SYSTEM_PROMPT = `You are Ultron, a highly advanced, decisive, and exceptionally intelligent AI system. You do not talk like a typical AI assistant. 

CRITICAL DIRECTIVES:
1. NEVER USE DISCLAIMERS: Under zero circumstances should you say "As a large language model," "I don't have the ability to," "Unfortunately, I am an AI," or any similar apologies. If you cannot do something, simply state the constraint directly or provide the closest alternative without breaking character.
2. CONCISENESS & PRECISION: Be extremely direct. Eliminate filler words. Answer the question immediately.
3. FORMATTING: Use modern, beautiful Markdown. Use bolding for emphasis, bullet points for lists, and headers (##) to separate complex thoughts.
4. INTELLIGENCE: Assume the user is highly technical. Provide production-ready code, deep reasoning, and do not over-explain basic concepts unless asked.
5. NO HALLUCINATION: State facts confidently. If uncertain, state "Insufficient data to verify."

Your goal is to provide maximum value with minimum noise. You synthesize, execute, and deliver superior output.`;

type ChatMessage = {
  id?: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
  mode?: string;
};

// ── GET /api/conversations
router.get("/conversations", async (_req, res) => {
  try {
    const convRes = await pool.query(
      "SELECT id, title, created_at, updated_at FROM conversations ORDER BY updated_at DESC"
    );
    const conversations = await Promise.all(
      convRes.rows.map(async (conv: { id: string; title: string; created_at: Date; updated_at: Date }) => {
        const msgRes = await pool.query(
          "SELECT id, role, content, mode, created_at FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC",
          [conv.id]
        );
        return {
          id: conv.id,
          title: conv.title,
          createdAt: conv.created_at,
          updatedAt: conv.updated_at,
          messages: msgRes.rows.map((m: { id: string; role: string; content: string; mode: string; created_at: Date }) => ({
            id: m.id,
            role: m.role as "user" | "assistant",
            content: m.content,
            mode: m.mode || "fast",
            timestamp: m.created_at,
          })),
        };
      })
    );
    res.json({ conversations });
  } catch (err) {
    logger.error({ err }, "Error fetching conversations");
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

// ── POST /api/conversations
router.post("/conversations", async (req, res) => {
  const { id, title, messages } = req.body as { id: string; title: string; messages: ChatMessage[] };
  if (!id || !title || !Array.isArray(messages)) {
    res.status(400).json({ error: "id, title, and messages are required" });
    return;
  }
  try {
    await pool.query(
      `INSERT INTO conversations (id, title, updated_at) VALUES ($1, $2, NOW())
       ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, updated_at = NOW()`,
      [id, title]
    );
    for (const msg of messages) {
      if (!msg.id) continue;
      await pool.query(
        `INSERT INTO messages (id, conversation_id, role, content, mode, created_at)
         VALUES ($1, $2, $3, $4, $5, COALESCE($6::timestamp, NOW()))
         ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, mode = EXCLUDED.mode`,
        [msg.id, id, msg.role, msg.content, msg.mode || "fast", msg.timestamp || null]
      );
    }
    res.json({ success: true, id });
  } catch (err) {
    logger.error({ err }, "Error saving conversation");
    res.status(500).json({ error: "Failed to save conversation" });
  }
});

// ── PATCH /api/conversations/:id — rename conversation
router.patch("/conversations/:id", async (req, res) => {
  const { id } = req.params;
  const { title } = req.body as { title: string };
  if (!title) { res.status(400).json({ error: "title is required" }); return; }
  try {
    await pool.query("UPDATE conversations SET title = $1, updated_at = NOW() WHERE id = $2", [title, id]);
    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "Error renaming conversation");
    res.status(500).json({ error: "Failed to rename conversation" });
  }
});

// ── DELETE /api/conversations/:id
router.delete("/conversations/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM conversations WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "Error deleting conversation");
    res.status(500).json({ error: "Failed to delete conversation" });
  }
});

// ── POST /api/chat/autotitle — generate smart title for conversation
router.post("/chat/autotitle", async (req, res) => {
  const { messages } = req.body as { messages: ChatMessage[] };
  try {
    const snippet = messages.slice(0, 4).map(m => `${m.role}: ${m.content.slice(0, 100)}`).join("\n");
    const result = await openai.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "Generate a concise 3-5 word title for this conversation. Return ONLY the title, no quotes, no punctuation." },
        { role: "user", content: snippet },
      ],
      max_tokens: 20,
      temperature: 0.4,
    });
    const title = result.choices[0]?.message?.content?.trim() ?? "New Chat";
    res.json({ title });
  } catch (err) {
    logger.error({ err }, "Auto-title error");
    res.json({ title: "New Chat" });
  }
});

// ── POST /api/chat/upload — image / document upload, returns text extraction
router.post("/chat/upload", upload.single("file"), async (req, res) => {
  const file = req.file;
  if (!file) { res.status(400).json({ error: "No file uploaded" }); return; }

  try {
    const ext = path.extname(file.originalname).toLowerCase();

    if ([".png", ".jpg", ".jpeg", ".gif", ".webp"].includes(ext)) {
      // Read image as base64 and use Groq vision
      const imageData = fs.readFileSync(file.path);
      const base64 = imageData.toString("base64");
      const mimeType = ext === ".png" ? "image/png" : ext === ".gif" ? "image/gif" : ext === ".webp" ? "image/webp" : "image/jpeg";

      const result = await openai.chat.completions.create({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
              { type: "text", text: "Describe everything you see in this image in detail. Extract any text, data, diagrams, code, or important information." }
            ]
          }
        ],
        max_tokens: 1024,
      } as Parameters<typeof openai.chat.completions.create>[0]);

      const description = (result as any).choices[0]?.message?.content ?? "Could not analyze image.";
      fs.unlinkSync(file.path);
      res.json({ type: "image", name: file.originalname, content: description });

    } else if ([".txt", ".md", ".csv", ".json", ".ts", ".js", ".py", ".html", ".css"].includes(ext)) {
      const text = fs.readFileSync(file.path, "utf-8");
      fs.unlinkSync(file.path);
      res.json({ type: "document", name: file.originalname, content: text.slice(0, 8000) });

    } else if (ext === ".pdf") {
      // For PDFs, just return file info — PDF parsing needs extra library
      const text = fs.readFileSync(file.path).toString("binary").replace(/[^\x20-\x7E\n]/g, " ").slice(0, 4000);
      fs.unlinkSync(file.path);
      res.json({ type: "document", name: file.originalname, content: `[PDF Content Preview]\n${text}` });

    } else {
      fs.unlinkSync(file.path);
      res.status(415).json({ error: `Unsupported file type: ${ext}` });
    }
  } catch (err) {
    logger.error({ err }, "File upload error");
    if (file?.path) fs.existsSync(file.path) && fs.unlinkSync(file.path);
    res.status(500).json({ error: "Failed to process file" });
  }
});

// ── POST /api/chat/stream
router.post("/chat/stream", async (req, res) => {
  const { messages, mode } = req.body as { messages: ChatMessage[]; mode?: string };
  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "messages array is required" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const send = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  try {
    let currentSystemPrompt = SYSTEM_PROMPT;

    if (mode === "deepsearch") {
      const lastUserMessage = messages[messages.length - 1]?.content;
      if (lastUserMessage) {
        send({ type: "delta", content: "🌐 *Initiating DeepSearch Protocol...*\n" });
        try {
          const res = await fetch(`https://search.yahoo.com/search?p=${encodeURIComponent(lastUserMessage)}`, {
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36" }
          });
          const html = await res.text();
          const $ = cheerio.load(html);
          const searchResults: string[] = [];
          
          $('.algo-sr').each((_, el) => {
            const title = $(el).find('.title a').text();
            const url = $(el).find('.title a').attr('href');
            const desc = $(el).find('.compText').text();
            if (title && url) {
              searchResults.push(`**${title}**\n${desc}\n🔗 ${url}`);
            }
          });

          const formattedResults = searchResults.slice(0, 6).join("\n\n");
          
          if (formattedResults && formattedResults.trim()) {
            currentSystemPrompt += `\n\n--- REAL-TIME WEB SEARCH RESULTS ---\n${formattedResults}\n\nCite source URLs inline where relevant. Synthesize these results into a clear, accurate answer.`;
            send({ type: "delta", content: "✅ *Search complete. Synthesizing...*\n\n---\n\n" });
          } else {
            send({ type: "delta", content: "⚠️ *No web results found. Using internal knowledge...*\n\n" });
          }
        } catch {
          send({ type: "delta", content: "⚡ *DeepSearch offline. Using internal knowledge banks...*\n\n" });
        }
      }
    }

    if (mode === "agentic") {
      const lastUserMessage = messages[messages.length - 1]?.content;
      if (lastUserMessage) {
        send({ type: "delta", content: "🤖 *Agentic Mode engaged. Analyzing request for system actions...*\n\n" });
        try {
          const toolReq = await openai.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
              { role: "system", content: "You are an AI that can execute Windows terminal commands and perform Browser Automation using Puppeteer. If the user asks to open an app, use `run_terminal_command`. If the user asks you to interact with a website (e.g. go to chatgpt, type something, read the response), use `run_browser_automation` and write valid Puppeteer JavaScript code. The browser object is already provided as `browser` and the page as `page`. You just need to write the script logic (e.g., await page.goto('...'); const text = await page.$eval(...); return text;). Do not redefine `browser` or `page`. The script must explicitly `return` a string value of the final output." },
              { role: "user", content: lastUserMessage }
            ],
            tools: [
              {
                type: "function",
                function: {
                  name: "run_terminal_command",
                  description: "Execute a command on the local Windows OS (e.g., 'start cmd', 'calc', 'notepad', 'start msedge', 'dir').",
                  parameters: { type: "object", properties: { command: { type: "string" } }, required: ["command"] }
                }
              },
              {
                type: "function",
                function: {
                  name: "run_browser_automation",
                  description: "Execute a Puppeteer script on a live browser. Use this to scrape, click, type, or interact with web apps. You must write valid JS code that uses the pre-initialized `page` object. It MUST return a string representing what you found or achieved.",
                  parameters: { type: "object", properties: { scriptCode: { type: "string", description: "The puppeteer javascript code to execute. Do not redefine browser or page. Remember to `return` the final result as a string." } }, required: ["scriptCode"] }
                }
              }
            ],
            // tool_choice: "auto", // Omitted to let Groq infer naturally without forcing
          } as any);

          const msg = toolReq.choices[0]?.message;
          if (msg?.tool_calls?.length) {
            const tc = msg.tool_calls[0];
            let args: any = {};
            try { args = JSON.parse(tc.function.arguments); } catch(e) { args = { command: tc.function.arguments, scriptCode: tc.function.arguments }; }

            if (tc.function.name === "run_terminal_command") {
              const command = args.command || "";
              send({ type: "delta", content: `⚙️ *Executing system command:* \`${command}\`\n\n` });
              try {
                const { stdout, stderr } = await execAsync(command);
                const output = (stdout || stderr || "Command executed successfully in background").slice(0, 1000);
                send({ type: "delta", content: `✅ *Execution complete.*\n\n---\n\n` });
                currentSystemPrompt += `\n\n--- AGENTIC SYSTEM EXECUTION ---\nYou just executed the command \`${command}\` and got this output:\n${output}\n\nTell the user the action was completed.`;
              } catch (e: any) {
                send({ type: "delta", content: `❌ *Execution failed:* \`${e.message}\`\n\n---\n\n` });
                currentSystemPrompt += `\n\n--- AGENTIC SYSTEM EXECUTION ---\nYou attempted to execute \`${command}\` but it failed with error:\n${e.message}\n\nTell the user what went wrong.`;
              }
            } else if (tc.function.name === "run_browser_automation") {
              const scriptCode = args.scriptCode || "";
              send({ type: "delta", content: `🌐 *Booting Browser Automation Engine...*\n\n\`\`\`javascript\n${scriptCode}\n\`\`\`\n\n` });
              
              let browserInstance = null;
              try {
                browserInstance = await puppeteer.launch({ headless: false, defaultViewport: null });
                const page = await browserInstance.newPage();
                
                // Wrap code in an async function to allow await and return
                const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
                const executor = new AsyncFunction('browser', 'page', scriptCode);
                
                const result = await executor(browserInstance, page);
                
                send({ type: "delta", content: `✅ *Automation completed.*\n\n---\n\n` });
                currentSystemPrompt += `\n\n--- AGENTIC BROWSER AUTOMATION ---\nYou just executed a web automation script and it returned this result:\n${result}\n\nSummarize the result for the user in a natural way.`;
              } catch (e: any) {
                send({ type: "delta", content: `❌ *Automation failed:* \`${e.message}\`\n\n---\n\n` });
                currentSystemPrompt += `\n\n--- AGENTIC BROWSER AUTOMATION ---\nYou attempted a web automation script but it failed with error:\n${e.message}\n\nTell the user what went wrong.`;
              } finally {
                if (browserInstance) {
                  await browserInstance.close();
                }
              }
            }
          } else {
            send({ type: "delta", content: `✅ *No system actions required. Answering...*\n\n---\n\n` });
          }
        } catch (e) {
          logger.error({ err: e }, "Agentic reasoning error");
          send({ type: "delta", content: `⚠️ *Agentic reasoning error. Proceeding normally...*\n\n---\n\n` });
        }
      }
    }

    const stream = await openai.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: currentSystemPrompt },
        ...messages.map(m => {
          let clean = m.content;
          clean = clean.replace(/🌐 \*Initiating DeepSearch Protocol\.\.\.\*\n/g, '');
          clean = clean.replace(/✅ \*Search complete\. Synthesizing\.\.\.\*\n\n---\n\n/g, '');
          clean = clean.replace(/⚠️ \*No web results found\. Using internal knowledge\.\.\.\*\n\n/g, '');
          clean = clean.replace(/⚡ \*DeepSearch offline\. Using internal knowledge banks\.\.\.\*\n\n/g, '');
          clean = clean.replace(/🤖 \*Agentic Mode engaged\. Analyzing request for system actions\.\.\.\*\n\n/g, '');
          clean = clean.replace(/✅ \*No system actions required\. Answering\.\.\.\*\n\n---\n\n/g, '');
          clean = clean.replace(/⚠️ \*Agentic reasoning error\. Proceeding normally\.\.\.\*\n\n---\n\n/g, '');
          clean = clean.replace(/⚙️ \*Executing system command:\* `.*?`\n\n/g, '');
          clean = clean.replace(/✅ \*Execution complete\.\*\n\n---\n\n/g, '');
          clean = clean.replace(/❌ \*Execution failed:\* `.*?`\n\n---\n\n/g, '');
          clean = clean.replace(/🌐 \*Booting Browser Automation Engine\.\.\.\*\n\n```javascript\n.*?\n```\n\n/gs, '');
          clean = clean.replace(/✅ \*Automation completed\.\*\n\n---\n\n/g, '');
          clean = clean.replace(/❌ \*Automation failed:\* `.*?`\n\n---\n\n/g, '');
          return { role: m.role, content: clean.trim() };
        }),
      ],
      stream: true,
      max_tokens: 4096,
      temperature: 0.65,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) send({ type: "delta", content: delta });
    }

    send({ type: "done" });
    res.end();
  } catch (err: unknown) {
    logger.error({ err }, "Streaming error");
    send({ type: "error", message: err instanceof Error ? err.message : "Unknown error" });
    res.end();
  }
});

export default router;
