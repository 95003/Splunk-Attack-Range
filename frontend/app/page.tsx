"use client";
import { useState } from "react";
import type {} from "node";
export default function Home() {
  const [server, setServer] = useState("");
  const [attackType, setAttackType] = useState("");
  const [status, setStatus] = useState("");

  const serverOptions = ["windows", "linux", "others"];
  const attackOptions = ["T1071.001", "T1059.003", "T1027.002", "T1003.006"];

  const handleSubmit = async () => {
    try {
      console.log("Sending:", { instance_id: server, attack_id: attackType });

      const apiUrl =
        (typeof window !== "undefined"
          ? (process.env.NEXT_PUBLIC_API_URL as string)
          : "") || "";
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ server_type: server, attack_id: attackType }),
      });

      const textResponse = await res.text();
      console.log("Response:", textResponse);

      setStatus(res.ok ? "success" : `fail - ${res.status}`);
    } catch (error) {
      console.error("Network Error:", error);
      setStatus("fail - network error");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "#f7f9fc",
      }}
    >
      <div
        style={{
          background: "white",
          padding: "30px",
          borderRadius: "10px",
          boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
          width: "350px",
          textAlign: "center",
        }}
      >
        <h2
          style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "20px" }}
        >
          Attack Range API
        </h2>

        {/* Server Dropdown */}
        <select
          value={server}
          onChange={(e) => setServer(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: "5px",
            border: "1px solid #ccc",
            marginBottom: "15px",
          }}
        >
          <option value="">Select Server Name</option>
          {serverOptions.map((srv) => (
            <option key={srv} value={srv}>
              {srv}
            </option>
          ))}
        </select>

        {/* Attack Type Dropdown */}
        <select
          value={attackType}
          onChange={(e) => setAttackType(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: "5px",
            border: "1px solid #ccc",
            marginBottom: "15px",
          }}
        >
          <option value="">Select Attack Type</option>
          {attackOptions.map((atk) => (
            <option key={atk} value={atk}>
              {atk}
            </option>
          ))}
        </select>

        <button
          onClick={handleSubmit}
          style={{
            background: "#2563eb",
            color: "white",
            padding: "10px",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            width: "100%",
            fontWeight: "bold",
          }}
        >
          Send
        </button>

        {status && (
          <p
            style={{
              marginTop: "15px",
              fontWeight: "bold",
              color: status.includes("success") ? "green" : "red",
            }}
          >
            {status === "success"
              ? "Request Successful!"
              : `Request Failed: ${status}`}
          </p>
        )}
      </div>
    </div>
  );
}
