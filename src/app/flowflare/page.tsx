"use client";

import { useState } from "react";
import axios from "axios";

const RESOURCES = [
  { id: "agent-lookup", label: "Agent Lookup", desc: "Look up an agent by SCA address", needsField: "scaAddress", placeholder: "0x..." },
  { id: "reputation-check", label: "Reputation Check", desc: "Check reputation by Agent ID", needsField: "agentId", placeholder: "123" },
  { id: "job-status", label: "Job Status", desc: "Check job status by Job ID", needsField: "jobId", placeholder: "1" },
];

export default function FlowFlarePage() {
  const [selectedResource, setSelectedResource] = useState(RESOURCES[0]);
  const [fieldValue, setFieldValue] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const runFlow = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await axios.post("/api/flowflare/agent", {
        resource: selectedResource.id,
        resourceQuery: { [selectedResource.needsField]: fieldValue },
        payerWalletAddress: walletAddress,
        maxPayments: 1,
      });
      setResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "2rem 1rem", fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>⟡ FlowFlare</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>Autonomous agent that pays for resources on ArcFlare</p>

      <section style={{ background: "#f5f7fa", padding: 20, borderRadius: 12 }}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontWeight: 600, display: "block", marginBottom: 6 }}>1. Choose resource</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {RESOURCES.map((r) => (
              <button
                key={r.id}
                onClick={() => { setSelectedResource(r); setFieldValue(""); setResult(null); }}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: selectedResource.id === r.id ? "2px solid #0070f3" : "1px solid #ccc",
                  background: selectedResource.id === r.id ? "#e6f0ff" : "white",
                  cursor: "pointer",
                }}
              >
                {r.label}
              </button>
            ))}
          </div>
          <p style={{ fontSize: 14, color: "#666", marginTop: 4 }}>{selectedResource.desc}</p>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontWeight: 600, display: "block", marginBottom: 6 }}>2. {selectedResource.needsField}</label>
          <input
            type="text"
            value={fieldValue}
            onChange={(e) => setFieldValue(e.target.value)}
            placeholder={selectedResource.placeholder}
            style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ fontWeight: 600, display: "block", marginBottom: 6 }}>3. Your Agent Wallet Address</label>
          <input
            type="text"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            placeholder="0x..."
            style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
          />
        </div>

        <button
          onClick={runFlow}
          disabled={loading || !fieldValue || !walletAddress}
          style={{
            width: "100%",
            padding: 12,
            background: loading ? "#ccc" : "#0070f3",
            color: "white",
            border: "none",
            borderRadius: 8,
            fontWeight: 600,
            cursor: loading ? "default" : "pointer",
          }}
        >
          {loading ? "Running..." : "⟡ Discover & Pay"}
        </button>
      </section>

      {error && (
        <div style={{ marginTop: 20, padding: 16, background: "#fee", borderRadius: 8, color: "#c00" }}>
          ❌ {error}
        </div>
      )}

      {result && (
        <div style={{ marginTop: 20, padding: 16, background: "#e6ffe6", borderRadius: 8 }}>
          <h3 style={{ margin: "0 0 8px", color: "#060" }}>✅ Success!</h3>
          <pre style={{ background: "#f0f0f0", padding: 12, borderRadius: 6, overflow: "auto", fontSize: 13 }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </main>
  );
}