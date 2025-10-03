import { useState } from "react";
import API from "../api";

export default function UploadCSV({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false); // loading state

  async function submit(e) {
    e.preventDefault();
    if (!file) return setErr("Select a file");

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      await API.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setErr("");
      setSuccessMsg("Upload successful! Items distributed.");
      setFile(null);

      if (onUploadSuccess) onUploadSuccess();
    } catch (error) {
      setErr(error.response?.data?.msg || "Upload failed");
      setSuccessMsg("");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 relative">
      <h3 className="text-xl font-semibold mb-4">Upload CSV/XLSX</h3>

      <form onSubmit={submit} className="flex flex-col space-y-4">
        <input
          type="file"
          accept=".csv,.xlsx,.xls,.axls"
          onChange={(e) => setFile(e.target.files[0])}
          className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition flex items-center justify-center"
          disabled={loading}
        >
          {loading ? (
            <>
              <svg
                className="animate-spin h-5 w-5 mr-2 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
              Uploading...
            </>
          ) : (
            "Upload & Distribute"
          )}
        </button>
      </form>

      {err && <div className="text-red-600 mt-2">{err}</div>}
      {successMsg && <div className="text-green-600 mt-2">{successMsg}</div>}
    </div>
  );
}
