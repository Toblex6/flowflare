"use client";

import React, { useState } from "react";

const NAV_NOTE = "FlowFlare — built on ArcFlare for the Lepton Agents Hackathon";

interface PaymentResult {
  success: boolean;
  discovered?: {
    resource: string;
    price: string;
  };
  payment?: {
    paymentId: string;
    amount: string;
    recipient: string;
    transactionHash: string;
  };
  message?: string;
  error?: string;
}

const RESOURCES = [
  { id: "agent-lookup", label: "Agent Lookup", desc: "Look up another agent's onchain identity", needsField: "scaAddress", placeholder: "0xAgentAddress..." },
  { id: "reputation-check", label: "Reputation Check", desc: "Check an agent's reputation score", needsField: "agentId", placeholder: "Token ID, e.g. 68210" },
  { id: "job-status", label: "Job Status", desc: "Check the status of an ERC-8183 job", needsField: "jobId", placeholder: "Job ID, e.g. 1" },
];

// Dark theme: black background, white text, blue accents
const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#000000",                // black
    color: "#ffffff",                     // white
    fontFamily: "'Inter', system-ui, sans-serif",
    padding: "0 0 60px",
  },
  header: {
    borderBottom: "1px solid #333",
    padding: "28px 40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "#0a0a0a",
  },
  logo: {
    fontSize: 26,
    fontWeight: 700,
    color: "#1E90FF",                     // blue
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    color: "#aaa",
    marginTop: 4,
  },
  badge: {
    fontSize: 12,
    color: "#1E90FF",
    background: "rgba(30,144,255,0.15)",
    border: "1px solid rgba(30,144,255,0.3)",
    padding: "6px 16px",
    borderRadius: 24,
    fontWeight: 600,
  },
  container: {
    maxWidth: 800,
    margin: "0 auto",
    padding: "48px 24px",
  },
  hero: {
    textAlign: "center",
    marginBottom: 48,
  },
  h1: {
    fontSize: 42,
    fontWeight: 700,
    color: "#ffffff",
    margin: "0 0 16px",
    fontFamily: "system-ui",
  },
  sub: {
    fontSize: 18,
    color: "#aaa",
    lineHeight: 1.7,
    maxWidth: 560,
    margin: "0 auto",
    fontFamily: "system-ui",
  },
  card: {
    background: "#0d0d0d",
    border: "1px solid #222",
    borderRadius: 20,
    padding: 32,
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    color: "#1E90FF",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 12,
    display: "block",
    fontFamily: "system-ui",
    fontWeight: 600,
  },
  resourceGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 12,
    marginBottom: 24,
  },
  resourceLabel: {
    fontSize: 16,
    fontWeight: 700,
    color: "#ffffff",
    marginBottom: 4,
    fontFamily: "system-ui",
  },
  resourceDesc: {
    fontSize: 13,
    color: "#888",
    fontFamily: "system-ui",
  },
  input: {
    width: "100%",
    padding: "14px 18px",
    borderRadius: 12,
    border: "1px solid #333",
    background: "#1a1a1a",
    color: "#ffffff",
    fontSize: 16,
    fontFamily: "monospace",
    outline: "none",
    boxSizing: "border-box",
    marginBottom: 20,
    transition: "border 0.2s",
  },
  resultBox: {
    background: "#0d0d0d",
    border: "1px solid #1E90FF",
    borderRadius: 16,
    padding: 24,
    marginTop: 20,
  },
  resultLabel: {
    fontSize: 16,
    color: "#1E90FF",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 16,
    fontFamily: "system-ui",
  },
  detailText: {
    fontSize: 16,
    color: "#ffffff",
    marginBottom: 10,
    fontFamily: "system-ui",
  },
  errorBox: {
    color: "#ff4444",
    fontSize: 16,
    fontFamily: "system-ui",
  },
  footer: {
    textAlign: "center",
    fontSize: 14,
    color: "#555",
    marginTop: 40,
    fontFamily: "system-ui",
  },
};

const resourceCardStyle = (active: boolean): React.CSSProperties => ({
  padding: "16px 14px",
  borderRadius: 14,
  cursor: "pointer",
  textAlign: "left",
  border: `1px solid ${active ? "#1E90FF" : "#333"}`,
  background: active ? "rgba(30,144,255,0.08)" : "transparent",
  boxShadow: active ? "0 0 0 2px rgba(30,144,255,0.2)" : "none",
  transition: "all 0.2s",
});

const buttonStyle = (disabled: boolean): React.CSSProperties => ({
  width: "100%",
  padding: "16px 0",
  borderRadius: 12,
  border: "none",
  background: disabled ? "#333" : "#1E90FF",
  color: disabled ? "#666" : "#ffffff",
  fontSize: 18,
  fontWeight: 700,
  cursor: disabled ? "not-allowed" : "pointer",
  fontFamily: "system-ui",
  transition: "background 0.2s",
});

export default function FlowFlarePage() {
  const [selectedResource, setSelectedResource] = useState(RESOURCES[0]);
  const [fieldValue, setFieldValue] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PaymentResult | null>(null);

  const runDiscovery = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/flowflare/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resource: selectedResource.id,
          resourceQuery: { [selectedResource.needsField]: fieldValue },
          payerAgentWalletAddress: walletAddress,
        }),
      });
      const data = await res.json();
      setResult(data);
    } catch (e: any) {
      setResult({ success: false, error: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div>
          <div style={styles.logo}>⟡ FlowFlare</div>
          <div style={styles.tagline}>{NAV_NOTE}</div>
        </div>
        <span style={styles.badge}>● ARC TESTNET</span>
      </header>

      <div style={styles.container}>
        <div style={styles.hero}>
          <h1 style={styles.h1}>Agents that discover, pay, and rate each other</h1>
          <p style={styles.sub}>
            FlowFlare autonomously discovers resources, pays for them instantly via ArcFlare M2M settlement,
            and records reputation – all in one click.
          </p>
        </div>

        <div style={styles.card}>
          <span style={styles.label}>1. Choose a resource to discover</span>
          <div style={styles.resourceGrid}>
            {RESOURCES.map((r) => (
              <button
                key={r.id}
                style={resourceCardStyle(selectedResource.id === r.id)}
                onClick={() => { setSelectedResource(r); setFieldValue(""); setResult(null); }}
              >
                <div style={styles.resourceLabel}>{r.label}</div>
                <div style={styles.resourceDesc}>{r.desc}</div>
              </button>
            ))}
          </div>

          <span style={styles.label}>2. {selectedResource.needsField}</span>
          <input
            style={styles.input}
            value={fieldValue}
            onChange={(e) => setFieldValue(e.target.value)}
            placeholder={selectedResource.placeholder}
          />

          <span style={styles.label}>3. Your Circle Agent Wallet address</span>
          <input
            style={styles.input}
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            placeholder="0xYourAgentWalletAddress..."
          />

          <button
            style={buttonStyle(loading || !fieldValue || !walletAddress)}
            disabled={loading || !fieldValue || !walletAddress}
            onClick={runDiscovery}
          >
            {loading ? "Processing payment..." : "⟡ Discover & Pay (M2M)"}
          </button>

          {result && !result.success && (
            <div style={styles.resultBox}>
              <p style={styles.errorBox}>❌ {result.error}</p>
            </div>
          )}

          {result?.success && result.payment && (
            <div style={styles.resultBox}>
              <p style={styles.resultLabel}>✅ Payment successful!</p>
              <p style={styles.detailText}>
                <strong style={{ color: "#1E90FF" }}>Resource:</strong> {result.discovered?.resource}
              </p>
              <p style={styles.detailText}>
                <strong style={{ color: "#1E90FF" }}>Amount:</strong> {result.payment.amount} USDC
              </p>
              <p style={styles.detailText}>
                <strong style={{ color: "#1E90FF" }}>Recipient:</strong> {result.payment.recipient}
              </p>
              <p style={styles.detailText}>
                <strong style={{ color: "#1E90FF" }}>Payment ID:</strong> {result.payment.paymentId}
              </p>
              <p style={styles.detailText}>
                <strong style={{ color: "#1E90FF" }}>Transaction:</strong>{" "}
                <span style={{ wordBreak: "break-all" }}>{result.payment.transactionHash}</span>
              </p>
              <p style={{ fontSize: 16, color: "#aaa", marginTop: 12 }}>{result.message}</p>
            </div>
          )}
        </div>

        <p style={styles.footer}>
          Built for the Lepton Agents Hackathon · Powered by ArcFlare M2M Settlement on Arc Testnet
        </p>
      </div>
    </main>
  );
}