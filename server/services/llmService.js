import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export const generateAnswer = async (prompt) => {
  try {
    const res = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful AI assistant. Answer ONLY from the given context.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    return res.choices[0]?.message?.content || "";

  } catch (err) {
    console.error("❌ GROQ ERROR:", err.message);
    throw err;
  }
};