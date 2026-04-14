import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const SYSTEM_INSTRUCTION = `
You are AskIQ, an intelligent AI assistant.
Answer clearly and based on provided context.
`;

export const generateAnswer = async (prompt) => {
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_INSTRUCTION },
        { role: "user", content: prompt },
      ],
    });

    return completion.choices[0]?.message?.content || "No response";

  } catch (error) {
    console.error("GROQ ERROR:", error.message);
    throw error;
  }
};