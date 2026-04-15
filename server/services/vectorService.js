import { getPineconeIndex } from "../config/pinecone.js";

// ================= UPSERT =================
export const upsertVector = async (
  id,
  values,
  metadata,
  namespace = "default"
) => {
  try {
    // ✅ Validate vector
    if (!values || !Array.isArray(values) || values.length === 0) {
      throw new Error("Invalid embedding vector");
    }

    const index = getPineconeIndex();

    console.log(`📌 Upserting — ID: ${id}, dim: ${values.length}`);

    // ✅ Ensure values are plain numbers
    const cleanValues = values.map((v) => Number(v));

    const record = {
      id: String(id),
      values: cleanValues,
      metadata: {
        text: String(metadata?.text || ""),
        userId: String(metadata?.userId || ""),
        docId: String(metadata?.docId || ""),
      },
    };

    // ✅ CORRECT FOR NEW SDK
    await index.namespace(namespace).upsert({
      records: [record],
    });

    console.log(`✅ Upsert success: ${id}`);
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
      vector: values.map((v) => Number(v)),
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