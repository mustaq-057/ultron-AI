import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY,
});

(async () => {
  try {
    const toolReq = await openai.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "You are an AI that can execute Windows terminal commands. If the user asks to open an app, use `run_terminal_command`." },
        { role: "user", content: "open terminal" }
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "run_terminal_command",
            description: "Execute a command on the local Windows OS (e.g., 'start cmd', 'calc', 'notepad', 'start msedge', 'dir').",
            parameters: { type: "object", properties: { command: { type: "string" } }, required: ["command"] }
          }
        }
      ],
      tool_choice: "auto",
    });

    console.log("Response:", JSON.stringify(toolReq.choices[0].message, null, 2));
  } catch (e) {
    console.error("Error:", e.message);
  }
})();
