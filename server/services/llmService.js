import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const SYSTEM_INSTRUCTION = `You are AskIQ, an intelligent AI assistant...`;

export const generateAnswerStream = async (prompt, onChunk) => {
  try {
    const stream = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile", // free, fast
      messages: [
        { role: "system", content: SYSTEM_INSTRUCTION },
        { role: "user", content: prompt },
      ],
      stream: true,
    });

    let fullText = "";
    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || "";
      fullText += text;
      if (text) onChunk(text);
    }

    return fullText;
  } catch (error) {
    console.error("Groq error:", error.message);
    throw error;
  }
};

export const generateAnswer = async (prompt) => {
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_INSTRUCTION },
        { role: "user", content: prompt },
      ],
    });
    return completion.choices[0]?.message?.content || "";
  } catch (error) {
    console.error("Groq error:", error.message);
    throw error;
  }
};