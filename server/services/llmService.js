import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_INSTRUCTION = `
You are AskIQ, an intelligent AI assistant.
Answer clearly and based on provided context.
`;

export const generateAnswer = async (prompt) => {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_INSTRUCTION },
        { role: "user", content: prompt },
      ],
    });

    return completion.choices[0]?.message?.content || "No response";

  } catch (error) {
    console.error("LLM ERROR:", error.message);
    throw error;
  }
};