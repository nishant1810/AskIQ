export const chunkText = (text, chunkSize = 1000, overlap = 200) => {
  // Clean text first
  const cleaned = text
    .replace(/\s+/g, " ")        // collapse multiple spaces
    .replace(/\n+/g, " ")        // remove newlines
    .trim();

  const words = cleaned.split(" ");
  const chunks = [];
  let i = 0;

  while (i < words.length) {
    // Slice a chunk of words
    const chunkWords = words.slice(i, i + chunkSize);
    const chunk = chunkWords.join(" ").trim();

    // Only add non-empty chunks
    if (chunk.length > 50) {
      chunks.push(chunk);
    }

    // Move forward by chunkSize minus overlap
    // Overlap ensures context is not lost at boundaries
    i += chunkSize - overlap;
  }

  return chunks;
};