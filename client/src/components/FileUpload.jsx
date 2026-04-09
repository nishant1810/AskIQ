import { useState, useRef } from "react";
import API from "../services/api";

const FileUpload = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const inputRef = useRef(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    setError("");
    setSuccess("");

    // ✅ Validate file type
    if (selected && !selected.name.match(/\.(pdf|txt)$/i)) {
      setError("Only PDF and TXT files are allowed");
      setFile(null);
      return;
    }

    // ✅ Validate file size (10MB)
    if (selected && selected.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      setFile(null);
      return;
    }

    setFile(selected);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError("");
    setSuccess("");
    setProgress("Uploading and processing...");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await API.post("/rag/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          const percent = Math.round((e.loaded * 100) / e.total);
          setProgress(`Uploading: ${percent}%`);
        },
      });

      setSuccess(
        `✅ "${res.data.document.fileName}" indexed successfully! (${res.data.document.chunkCount} chunks)`
      );
      setFile(null);

      // ✅ Reset file input
      if (inputRef.current) inputRef.current.value = "";

      // ✅ Notify parent
      if (onUploadSuccess) onUploadSuccess(res.data.document);

    } catch (err) {
      setError(err.response?.data?.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      setProgress("");
    }
  };

  // ✅ Drag and drop handlers
  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped) {
      setFile(dropped);
      setError("");
      setSuccess("");
    }
  };

  const handleDragOver = (e) => e.preventDefault();

  return (
    <div className="p-4 space-y-3">
      <p className="text-zinc-400 text-xs font-medium uppercase tracking-wider">
        Upload Document
      </p>

      {/* ✅ Drag and drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-zinc-600 hover:border-green-500
                   rounded-lg p-4 text-center cursor-pointer transition-colors"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.txt"
          className="hidden"
          onChange={handleFileChange}
        />

        {file ? (
          <div className="text-green-400 text-sm">
            <p>📄 {file.name}</p>
            <p className="text-zinc-500 text-xs mt-1">
              {(file.size / 1024).toFixed(1)} KB
            </p>
          </div>
        ) : (
          <div className="text-zinc-500 text-sm">
            <p>📁 Drop PDF/TXT here</p>
            <p className="text-xs mt-1">or click to browse</p>
          </div>
        )}
      </div>

      {/* ✅ Upload button */}
      {file && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-zinc-600
                     disabled:cursor-not-allowed text-white text-sm py-2 px-4
                     rounded-lg transition-colors"
        >
          {uploading ? progress || "Processing..." : "Upload & Index"}
        </button>
      )}

      {/* ✅ Error message */}
      {error && (
        <p className="text-red-400 text-xs bg-red-500/10 p-2 rounded">
          {error}
        </p>
      )}

      {/* ✅ Success message */}
      {success && (
        <p className="text-green-400 text-xs bg-green-500/10 p-2 rounded">
          {success}
        </p>
      )}
    </div>
  );
};

export default FileUpload;