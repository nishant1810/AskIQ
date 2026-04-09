import { Pinecone } from "@pinecone-database/pinecone";

if (!process.env.PINECONE_API_KEY) {
  throw new Error("PINECONE_API_KEY is missing from environment variables");
}

export const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

// Export index directly so services don't repeat this every time
export const getPineconeIndex = () => {
  return pinecone.index(process.env.PINECONE_INDEX);
};