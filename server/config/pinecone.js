import { Pinecone } from "@pinecone-database/pinecone";

// ✅ Validate environment variables
if (!process.env.PINECONE_API_KEY) {
  throw new Error("❌ PINECONE_API_KEY is missing");
}

if (!process.env.PINECONE_INDEX) {
  throw new Error("❌ PINECONE_INDEX is missing");
}

// ✅ Initialize client
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

// ✅ Export function (safe + debug)
export const getPineconeIndex = () => {
  try {
    const indexName = process.env.PINECONE_INDEX;

    if (!indexName) {
      throw new Error("PINECONE_INDEX not defined");
    }

    console.log(`📡 Connecting to Pinecone index: ${indexName}`);

    return pinecone.index(indexName);

  } catch (error) {
    console.error("❌ Pinecone init error:", error.message);
    throw error;
  }
};