import { getPineconeIndex } from "../config/pinecone.js";

export const upsertVector = async (id, values, metadata, namespace = "default") => {
  try {
    console.log(`📌 Upserting — ID: ${id}, dimensions: ${values.length}`);

    const index = getPineconeIndex();

    // ✅ SDK v7 expects { records: [...] } format
    await index.namespace(namespace).upsert({
      records: [
        {
          id: String(id),
          values: [...values],
          metadata: {
            text: String(metadata.text || ""),
            userId: String(metadata.userId || ""),
            docId: String(metadata.docId || ""),
          },
        },
      ],
    });

    console.log(`✅ Upserted successfully: ${id}`);

  } catch (error) {
    console.error("Upsert error:", error.message);
    throw error;
  }
};

export const queryVector = async (values, namespace = "default", userId = null) => {
  try {
    if (!values || !Array.isArray(values) || values.length === 0) {
      throw new Error("Invalid query vector");
    }

    const index = getPineconeIndex();

    const queryOptions = {
      vector: [...values],
      topK: 5,
      includeMetadata: true,
    };

    if (userId) {
      queryOptions.filter = { userId: { $eq: String(userId) } };
    }

    const result = await index.namespace(namespace).query(queryOptions);
    return result.matches || [];

  } catch (error) {
    console.error("Query error:", error.message);
    throw error;
  }
};

export const deleteVectors = async (docId, namespace = "default") => {
  try {
    const index = getPineconeIndex();
    await index.namespace(namespace).deleteMany({
      docId: { $eq: String(docId) }
    });
  } catch (error) {
    console.error("Delete vectors error:", error.message);
    throw error;
  }
};