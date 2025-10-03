import React, { useState, useEffect } from "react";
import API from "../api";
import AgentsForm from "./AgentsForm";
import AgentsTable from "./AgentsTable";

export default function Agents() {
  const [agents, setAgents] = useState([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    countryCode: "+1",
    phone: "",
    password: "",
  });
  const [msg, setMsg] = useState("");
  const [loadingForm, setLoadingForm] = useState(false);
  const [loadingTable, setLoadingTable] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    setLoadingTable(true);
    try {
      const res = await API.get("/agents");
      setAgents(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTable(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    setLoadingForm(true);
    try {
      const fullPhone = form.countryCode + form.phone;
      await API.post("/agents", { ...form, phone: fullPhone });
      setMsg("Agent added successfully!");
      setForm({ name: "", email: "", countryCode: "+1", phone: "", password: "" });
      fetchAgents();
    } catch (err) {
      setMsg(err.response?.data?.msg || "Error adding agent");
    } finally {
      setLoadingForm(false);
    }
  };

  return (
    <div className="max-w-full mx-auto p-6 bg-white rounded-xl shadow-lg">
      <h3 className="text-3xl font-bold mb-6 text-gray-800">Agents Management</h3>
      <div className="grid grid-cols-6 gap-6">
        <div className="col-span-2">
          <AgentsForm form={form} setForm={setForm} submit={submit} msg={msg} loadingForm={loadingForm} />
        </div>
        <div className="col-span-4">
          <AgentsTable
            agents={agents}
            loadingTable={loadingTable}
            searchInput={searchInput}
            setSearchInput={setSearchInput}
            search={search}
            setSearch={setSearch}
            sortKey={sortKey}
            setSortKey={setSortKey}
            sortDirection={sortDirection}
            setSortDirection={setSortDirection}
          />
        </div>
      </div>
    </div>
  );
}
