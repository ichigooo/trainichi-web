"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    instgrm?: any;
  }
}

export default function OEmbedTestPage() {
  const [url, setUrl] = useState(
    "https://www.instagram.com/reel/DM6ogB5R7xG/"
  );
  const [status, setStatus] = useState<string>("");
  const [raw, setRaw] = useState<string>("");
  const [embedHtml, setEmbedHtml] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const embedRef = useRef<HTMLDivElement>(null);

  // Load / reprocess Instagram embed script when embedHtml changes
  useEffect(() => {
    if (!embedHtml) return;

    const existing = document.getElementById("instagram-embed-script");

    if (!existing) {
      const s = document.createElement("script");
      s.id = "instagram-embed-script";
      s.async = true;
      s.src = "https://www.instagram.com/embed.js";
      s.onload = () => {
        window.instgrm?.Embeds?.process?.();
      };
      document.body.appendChild(s);
    } else {
      window.instgrm?.Embeds?.process?.();
    }
  }, [embedHtml]);

  async function fetchOembed() {
    if (!url) return;

    setLoading(true);
    setStatus("Fetching from Trainichi server…");
    setRaw("");
    setEmbedHtml("");

    try {
      const resp = await fetch(
        `/api/meta/oembed?url=${encodeURIComponent(url)}`,
        { cache: "no-store" }
      );

      const data = await resp.json();
      setRaw(JSON.stringify(data, null, 2));

      if (!resp.ok) {
        setStatus("Meta returned an error (likely not approved yet).");
        return;
      }

      setStatus("Success — rendering embed HTML.");
      setEmbedHtml(data.html || "<em>No html field returned.</em>");
    } catch (err: any) {
      setStatus("Request failed.");
      setRaw(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={styles.main}>
      <h1 style={styles.h1}>Meta oEmbed Test (Trainichi)</h1>

      <p style={styles.p}>
        This page calls Trainichi’s server endpoint which calls Meta oEmbed and
        returns HTML to render here. (Before approval, Meta may return an error
        like “(#10) must be reviewed”.)
      </p>

      <div style={styles.row}>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste an Instagram/Facebook URL"
          style={styles.input}
        />
        <button
          onClick={fetchOembed}
          disabled={loading}
          style={{
            ...styles.button,
            opacity: loading ? 0.6 : 1,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Loading…" : "Fetch oEmbed"}
        </button>
      </div>

      {status && <div style={styles.status}>{status}</div>}

      <div style={styles.label}>Rendered Embed</div>
      <div
        ref={embedRef}
        style={styles.box}
        dangerouslySetInnerHTML={{ __html: embedHtml }}
      />

      <div style={styles.label}>Raw Response / Error</div>
      <pre style={styles.pre}>{raw}</pre>

      <hr style={styles.hr} />

      <div style={styles.small}>
        Reviewer instructions: paste a public Instagram Reel/Post URL and click
        “Fetch oEmbed”.
      </div>
    </main>
  );
}

/* ---------------- styles ---------------- */

const styles: Record<string, React.CSSProperties> = {
  main: {
    maxWidth: 900,
    margin: "0 auto",
    padding: "40px 20px",
    fontFamily:
      "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
    backgroundColor: "#f8fafc",
    minHeight: "100vh",
  },
  h1: {
    fontSize: 32,
    fontWeight: 700,
    margin: "0 0 12px",
    color: "#1e293b",
    textAlign: "center",
  },
  p: {
    margin: "0 0 24px",
    opacity: 0.8,
    lineHeight: 1.6,
    color: "#475569",
    textAlign: "center",
    maxWidth: 600,
    marginLeft: "auto",
    marginRight: "auto",
  },
  row: {
    display: "flex",
    gap: 16,
    margin: "24px 0",
    maxWidth: 700,
    marginLeft: "auto",
    marginRight: "auto",
  },
  input: {
    flex: 1,
    padding: "14px 18px",
    borderRadius: 12,
    border: "2px solid #e2e8f0",
    fontSize: 16,
    backgroundColor: "#ffffff",
    color: "#1e293b",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
    outline: "none",
  },
  button: {
    padding: "14px 24px",
    borderRadius: 12,
    border: "none",
    backgroundColor: "#3b82f6",
    color: "#ffffff",
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 2px 4px rgba(59, 130, 246, 0.2)",
    transition: "background-color 0.2s ease, box-shadow 0.2s ease, transform 0.1s ease",
    outline: "none",
  },
  status: {
    marginTop: 16,
    padding: "12px 16px",
    borderRadius: 8,
    backgroundColor: "#fef3c7",
    border: "1px solid #f59e0b",
    color: "#92400e",
    textAlign: "center",
    maxWidth: 700,
    marginLeft: "auto",
    marginRight: "auto",
  },
  box: {
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    padding: 24,
    backgroundColor: "#ffffff",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
    minHeight: 100,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  pre: {
    whiteSpace: "pre-wrap",
    backgroundColor: "#1e293b",
    color: "#e2e8f0",
    padding: 20,
    borderRadius: 12,
    overflow: "auto",
    fontSize: 14,
    lineHeight: 1.5,
    border: "1px solid #334155",
    maxWidth: 700,
    marginLeft: "auto",
    marginRight: "auto",
  },
  label: {
    fontWeight: 600,
    margin: "32px 0 12px",
    color: "#1e293b",
    fontSize: 18,
    textAlign: "center",
  },
  small: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 32,
    color: "#64748b",
    textAlign: "center",
  },
  hr: {
    margin: "40px 0",
    opacity: 0.2,
    border: "none",
    borderTop: "1px solid #e2e8f0",
  },
};
