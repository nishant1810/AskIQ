import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    fileType: {
      type: String,
      enum: ["pdf", "txt", "docx"],
      default: "pdf",
    },
    fileSize: {
      type: Number, // in bytes
      default: 0,
    },
    chunkCount: {
      type: Number,
      default: 0, // how many chunks stored in Pinecone
    },
    status: {
      type: String,
      enum: ["processing", "ready", "failed"],
      default: "processing",
    },
    pineconeNamespace: {
      type: String,
      default: "", // namespace in Pinecone for this doc
    },
  },
  { timestamps: true }
);

export default mongoose.model("Document", documentSchema);