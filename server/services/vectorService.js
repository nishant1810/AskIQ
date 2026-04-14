import { getPineconeIndex } from "../config/pinecone.js";

// ================= UPSERT =================
export const upsertVector = async (
  id,
  values,
  metadata,
  namespace = "default"
) => {
  try {
    if (!values || !Array.isArray(values) || values.length === 0) {
      throw new Error("Invalid embedding vector");
    }

    const index = getPineconeIndex();

    console.log(`📌 Upserting — ID: ${id}, dim: ${values.length}`);

    await index.namespace(namespace).upsert([
      {
        id: String(id),
        values: values,
        metadata: {
          text: String(metadata?.text || ""),
          userId: String(metadata?.userId || ""),
          docId: String(metadata?.docId || ""),
        },
      },
    ]);

    console.log(`✅ Upserted: ${id}`);
  } catch (error) {
    console.error("❌ UPSERT ERROR:", error.message);
    throw error;
  }
};

// ================= QUERY =================
export const queryVector = async (
  values,
  namespace = "default",
  userId = null
) => {
  try {
    if (!values || !Array.isArray(values) || values.length === 0) {
      throw new Error("Invalid query vector");
    }

    const index = getPineconeIndex();

    const query = {
      vector: values,
      topK: 5,
      includeMetadata: true,
    };

    if (userId) {
      query.filter = {
        userId: { $eq: String(userId) },
      };
    }

    const result = await index.namespace(namespace).query(query);

    console.log(`🔍 Matches found: ${result.matches?.length || 0}`);

    return result.matches || [];
  } catch (error) {
    console.error("❌ QUERY ERROR:", error.message);
    throw error;
  }
};

// ================= DELETE =================
export const deleteVectors = async (
  docId,
  namespace = "default"
) => {
  try {
    const index = getPineconeIndex();

    // ✅ Correct way: delete using filter
    await index.namespace(namespace).delete({
      filter: {
        docId: { $eq: String(docId) },
      },
    });

    console.log(`🗑️ Deleted vectors for doc: ${docId}`);
  } catch (error) {
    console.error("❌ DELETE ERROR:", error.message);
    throw error;
  }
};