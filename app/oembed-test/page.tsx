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

  // Load Instagram embed script on mount for the static demo
  useEffect(() => {
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
  }, []);

  // Reprocess embeds when dynamic embedHtml changes
  useEffect(() => {
    if (!embedHtml) return;
    window.instgrm?.Embeds?.process?.();
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
      <h1 style={styles.h1}>Trainichi - Instagram oEmbed Integration</h1>

      {/* REVIEWER INSTRUCTIONS BOX */}
      <div style={styles.reviewerBox}>
        <div style={styles.reviewerTitle}>For Meta Reviewers</div>
        <div style={styles.reviewerContent}>
          <p><strong>Section 1 below</strong> shows a <span style={styles.highlight}>WORKING Instagram embed</span> using client-side embedding.</p>
          <p><strong>Section 2</strong> shows our oEmbed API integration (needs approval to function).</p>
          <p style={styles.reviewerNote}>
            <strong>Why we need oEmbed API:</strong> Our fitness app lets users import workout videos by pasting any Instagram URL.
            We need the oEmbed API to programmatically fetch embed HTML for user-submitted URLs (client-side embeds only work with hardcoded URLs).
          </p>
        </div>
      </div>

      {/* SECTION 1: WORKING DEMO */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <span style={styles.checkmark}>✓</span>
          <h2 style={styles.h2}>Section 1: Working Instagram Embed Demo</h2>
        </div>
        <p style={styles.sectionDesc}>
          This demonstrates our ability to display Instagram content. The embed below renders successfully using Instagram&apos;s embed.js:
        </p>
        <div style={styles.embedContainer}>
          <blockquote
            className="instagram-media"
            data-instgrm-permalink="https://www.instagram.com/reel/DM6ogB5R7xG/"
            data-instgrm-version="14"
            style={{
              background: "#FFF",
              border: 0,
              borderRadius: "3px",
              boxShadow: "0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15)",
              margin: "1px",
              maxWidth: "540px",
              minWidth: "326px",
              padding: 0,
              width: "calc(100% - 2px)",
            }}
          >
            <a
              href="https://www.instagram.com/reel/DM6ogB5R7xG/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#3b82f6", textDecoration: "none" }}
            >
              View this post on Instagram
            </a>
          </blockquote>
        </div>
      </section>

      <hr style={styles.hr} />

      {/* SECTION 2: API DEMO */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <span style={styles.pendingIcon}>⏳</span>
          <h2 style={styles.h2}>Section 2: oEmbed API Integration (Pending Approval)</h2>
        </div>
        <p style={styles.sectionDesc}>
          Once approved, this API allows us to fetch embed data for any Instagram URL that users submit in our app.
          Currently returns an error until the oEmbed permission is granted.
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

        <div style={styles.label}>API Response Embed</div>
        <div
          ref={embedRef}
          style={styles.box}
          dangerouslySetInnerHTML={{ __html: embedHtml || "<em>Embed will appear here after API approval</em>" }}
        />

        <div style={styles.label}>Raw API Response</div>
        <pre style={styles.pre}>{raw || "// API response will appear here"}</pre>
      </section>

      <hr style={styles.hr} />

      {/* USE CASE EXPLANATION */}
      <section style={styles.useCaseSection}>
        <h3 style={styles.h3}>Our Use Case: Trainichi Fitness App</h3>
        <div style={styles.useCaseGrid}>
          <div style={styles.useCaseCard}>
            <div style={styles.useCaseIcon}>📱</div>
            <div style={styles.useCaseTitle}>User Imports Workout</div>
            <div style={styles.useCaseDesc}>User finds a workout reel on Instagram and copies the URL</div>
          </div>
          <div style={styles.useCaseCard}>
            <div style={styles.useCaseIcon}>🔗</div>
            <div style={styles.useCaseTitle}>Paste URL in App</div>
            <div style={styles.useCaseDesc}>User pastes the Instagram URL into Trainichi&apos;s import feature</div>
          </div>
          <div style={styles.useCaseCard}>
            <div style={styles.useCaseIcon}>📊</div>
            <div style={styles.useCaseTitle}>Fetch Metadata</div>
            <div style={styles.useCaseDesc}>We use oEmbed API to get title, thumbnail, and embed HTML</div>
          </div>
          <div style={styles.useCaseCard}>
            <div style={styles.useCaseIcon}>💪</div>
            <div style={styles.useCaseTitle}>Save to Library</div>
            <div style={styles.useCaseDesc}>Workout is saved to user&apos;s personal training library</div>
          </div>
        </div>
        <p style={styles.useCaseNote}>
          This is <strong>read-only embedding</strong> — we do not post, modify, or access private content.
        </p>
      </section>
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
    fontSize: 28,
    fontWeight: 700,
    margin: "0 0 24px",
    color: "#1e293b",
    textAlign: "center",
  },
  h2: {
    fontSize: 20,
    fontWeight: 600,
    margin: 0,
    color: "#1e293b",
  },
  h3: {
    fontSize: 18,
    fontWeight: 600,
    margin: "0 0 20px",
    color: "#1e293b",
    textAlign: "center",
  },
  reviewerBox: {
    backgroundColor: "#dbeafe",
    border: "2px solid #3b82f6",
    borderRadius: 12,
    padding: "20px 24px",
    marginBottom: 32,
  },
  reviewerTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "#1e40af",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  reviewerContent: {
    fontSize: 15,
    lineHeight: 1.6,
    color: "#1e3a5f",
  },
  reviewerNote: {
    marginTop: 12,
    padding: "12px 16px",
    backgroundColor: "#eff6ff",
    borderRadius: 8,
    fontSize: 14,
  },
  highlight: {
    backgroundColor: "#bbf7d0",
    padding: "2px 6px",
    borderRadius: 4,
    fontWeight: 600,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  checkmark: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 28,
    height: 28,
    backgroundColor: "#22c55e",
    color: "#fff",
    borderRadius: "50%",
    fontSize: 16,
    fontWeight: 700,
  },
  pendingIcon: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 28,
    height: 28,
    fontSize: 18,
  },
  sectionDesc: {
    fontSize: 15,
    color: "#475569",
    lineHeight: 1.6,
    marginBottom: 20,
  },
  embedContainer: {
    display: "flex",
    justifyContent: "center",
    padding: "20px 0",
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
    transition:
      "background-color 0.2s ease, box-shadow 0.2s ease, transform 0.1s ease",
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
    backgroundColor: "#ffffff",
    color: "#1e293b",
    padding: 20,
    borderRadius: 12,
    overflow: "auto",
    fontSize: 14,
    lineHeight: 1.5,
    border: "1px solid #e2e8f0",
    maxWidth: 700,
    marginLeft: "auto",
    marginRight: "auto",
  },
  label: {
    fontWeight: 600,
    margin: "32px 0 12px",
    color: "#1e293b",
    fontSize: 16,
    textAlign: "center",
  },
  hr: {
    margin: "40px 0",
    opacity: 0.3,
    border: "none",
    borderTop: "1px solid #cbd5e1",
  },
  useCaseSection: {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    padding: 24,
  },
  useCaseGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 16,
    marginBottom: 20,
  },
  useCaseCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 16,
    textAlign: "center",
  },
  useCaseIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  useCaseTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: "#1e293b",
    marginBottom: 4,
  },
  useCaseDesc: {
    fontSize: 13,
    color: "#64748b",
    lineHeight: 1.4,
  },
  useCaseNote: {
    fontSize: 14,
    color: "#475569",
    textAlign: "center",
    marginTop: 16,
    padding: "12px 16px",
    backgroundColor: "#f0fdf4",
    borderRadius: 8,
    border: "1px solid #bbf7d0",
  },
};
