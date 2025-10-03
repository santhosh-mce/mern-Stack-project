import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Agents from "./Agents";
import UploadCSV from "./UploadCSV";
import AgentListView from "./AgentListView";
import API from "../api";

export default function Dashboard() {
  const [lists, setLists] = useState([]);
  const [loadingLists, setLoadingLists] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchLists();
  }, []);

  async function fetchLists() {
    setLoadingLists(true);
    try {
      const res = await API.get("/upload/lists");
      setLists(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLists(false);
    }
  }

  function handleLogout() {
    API.post("/auth/logout").catch((err) => console.error(err));
    localStorage.removeItem("token");
    navigate("/login");
  }

  return (
    <div className="max-w-11/12 mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
        >
          Logout
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 mb-6">
        <Agents />
      </div>

      <div className="max-w-full mx-auto p-6 bg-white rounded-xl shadow-lg">
        <h3 className="text-3xl font-bold mb-6 text-gray-800">
          Distribute Lists
        </h3>
        <div className="grid grid-cols-4 mb-2 gap-4">
          <div className="col-span-1">
            <UploadCSV onUploadSuccess={fetchLists} />
          </div>
          <div className="col-span-3">
            <AgentListView lists={lists} loading={loadingLists} />
          </div>
        </div>
      </div>
    </div>
  );
}
