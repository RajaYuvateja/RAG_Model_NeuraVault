import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  getDocuments,
  uploadDocument,
  deleteDocument,
  reindexDocuments,
  getDocumentChunks,
  getHealth
} from "./services/documentService";
import { queryVault } from "./services/chatService";

export default function App() {
  const [activeTab, setActiveTab] = useState("chat");
  const [health, setHealth] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [totalChunks, setTotalChunks] = useState(0);
  const [loadingDocs, setLoadingDocs] = useState(false);

  // Chat state
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! I am **NeuraVault**, your enterprise document intelligence assistant. Ask me questions about your uploaded documents or search across your indexed knowledge base.",
      sources: []
    }
  ]);
  const [inputQuery, setInputQuery] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [topK, setTopK] = useState(5);
  const [expandedSources, setExpandedSources] = useState({});
  const chatBottomRef = useRef(null);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const fileInputRef = useRef(null);

  // Chunks Modal
  const [selectedDocChunks, setSelectedDocChunks] = useState(null);
  const [loadingChunks, setLoadingChunks] = useState(false);

  // Fetch health and documents
  const loadInitialData = async () => {
    try {
      const hData = await getHealth();
      setHealth(hData);
    } catch {
      setHealth({ status: "offline" });
    }

    try {
      setLoadingDocs(true);
      const docData = await getDocuments();
      setDocuments(docData.documents || []);
      setTotalChunks(docData.total_chunks || 0);
    } catch (err) {
      console.error("Failed to load documents:", err);
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatLoading]);

  // Handle Chat Submit
  const handleSendMessage = async (queryText = inputQuery) => {
    const query = queryText.trim();
    if (!query || chatLoading) return;

    const userMessage = { role: "user", content: query };
    setMessages((prev) => [...prev, userMessage]);
    setInputQuery("");
    setChatLoading(true);

    try {
      const response = await queryVault(query, topK);
      const assistantMessage = {
        role: "assistant",
        content: response.answer,
        sources: response.sources || [],
        engine: response.engine
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ Error retrieving answer: ${err.message}. Please check if documents are uploaded and indexed.`,
          sources: []
        }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // Handle File Upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadStatus({ type: "info", text: `Uploading and indexing ${file.name}...` });

    try {
      const res = await uploadDocument(file);
      setUploadStatus({
        type: "success",
        text: `Successfully uploaded ${res.filename} (${res.chunks} chunks created, ${res.indexed} indexed).`
      });
      await loadInitialData();
    } catch (err) {
      setUploadStatus({ type: "error", text: `Upload failed: ${err.message}` });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Handle Delete Document
  const handleDeleteDoc = async (filename) => {
    if (!window.confirm(`Delete document "${filename}" and its vector embeddings?`)) return;

    try {
      await deleteDocument(filename);
      await loadInitialData();
    } catch (err) {
      alert(`Failed to delete document: ${err.message}`);
    }
  };

  // Handle Reindex
  const handleReindex = async () => {
    if (!window.confirm("Reindex all processed documents into Qdrant?")) return;
    try {
      setUploadStatus({ type: "info", text: "Reindexing all documents into Qdrant..." });
      const res = await reindexDocuments();
      setUploadStatus({ type: "success", text: res.message });
      await loadInitialData();
    } catch (err) {
      setUploadStatus({ type: "error", text: `Reindex failed: ${err.message}` });
    }
  };

  // View chunks for a doc
  const handleViewChunks = async (filename) => {
    setLoadingChunks(true);
    try {
      const data = await getDocumentChunks(filename);
      setSelectedDocChunks(data);
    } catch (err) {
      alert(`Failed to load chunks: ${err.message}`);
    } finally {
      setLoadingChunks(false);
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      {/* Header with Brushed Titanium Finish & Mechanical Rivets */}
      <header style={{
        background: "linear-gradient(180deg, #182236 0%, #101625 100%)",
        borderTop: "1px solid rgba(255, 255, 255, 0.18)",
        borderBottom: "2px solid rgba(0, 0, 0, 0.8)",
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
        position: "sticky",
        top: 0,
        zIndex: 50,
        padding: "0.85rem 2rem"
      }}>
        <div style={{
          maxWidth: "1340px",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          {/* Logo & Plaque */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
            <div style={{
              width: "42px",
              height: "42px",
              borderRadius: "10px",
              background: "linear-gradient(180deg, #6366f1 0%, #4338ca 60%, #312e81 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderTop: "1px solid rgba(255, 255, 255, 0.4)",
              borderBottom: "2px solid #1e1b4b",
              boxShadow: "0 4px 14px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.35)"
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.5))" }}>
                <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                <polyline points="2 17 12 22 22 17"></polyline>
                <polyline points="2 12 12 17 22 12"></polyline>
              </svg>
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <span style={{ fontSize: "1.25rem", fontWeight: "800", letterSpacing: "-0.02em", textShadow: "0 2px 4px rgba(0,0,0,0.8)" }}>NeuraVault</span>
                <span className="badge badge-info" style={{ fontSize: "0.65rem", padding: "0.15rem 0.5rem" }}>v1.0 RAG</span>
              </div>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0, textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}>Enterprise Knowledge Retrieval Engine</p>
            </div>
          </div>

          {/* Mechanical Tab Rack */}
          <div className="skeuo-tab-rack">
            <button
              id="tab-chat"
              onClick={() => setActiveTab("chat")}
              className={`skeuo-tab-item ${activeTab === "chat" ? "active" : "inactive"}`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              RAG Intelligence
            </button>
            <button
              id="tab-vault"
              onClick={() => setActiveTab("vault")}
              className={`skeuo-tab-item ${activeTab === "vault" ? "active" : "inactive"}`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
              Document Vault ({documents.length})
            </button>
            <button
              id="tab-stats"
              onClick={() => setActiveTab("stats")}
              className={`skeuo-tab-item ${activeTab === "stats" ? "active" : "inactive"}`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
              Telemetry & Engine
            </button>
          </div>

          {/* Hardware Diode Indicator */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            background: "linear-gradient(180deg, #090d15 0%, #111724 100%)",
            padding: "0.45rem 0.85rem",
            borderRadius: "8px",
            borderTop: "1px solid rgba(0, 0, 0, 0.8)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
            boxShadow: "inset 0 2px 4px rgba(0,0,0,0.6)"
          }}>
            <div className="skeuo-led-socket">
              <span className={`status-dot ${health?.status === "healthy" ? "green" : "red"}`} />
            </div>
            <span style={{ fontSize: "0.8rem", color: "#cbd5e1", fontFamily: "var(--font-mono)", fontWeight: "600" }}>
              {health?.status === "healthy"
                ? `Vector Store: ${health?.vectorstore?.points_count ?? 0} pts`
                : "Backend Offline"}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* ================= TAB 1: RAG CHAT ================= */}
        {activeTab === "chat" && (
          <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 160px)" }}>
            {/* Empty Vault Notification Banner */}
            {documents.length === 0 && (
              <div style={{
                padding: "0.85rem 1.25rem",
                background: "rgba(99, 102, 241, 0.12)",
                border: "1px solid rgba(99, 102, 241, 0.3)",
                borderRadius: "10px",
                marginBottom: "1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1rem"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <span style={{ fontSize: "1.25rem" }}>💡</span>
                  <div>
                    <strong style={{ fontSize: "0.875rem", color: "#e0e7ff" }}>No documents indexed yet</strong>
                    <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      Upload PDF, TXT, or MD documents in the Document Vault to populate your knowledge base for retrieval.
                    </p>
                  </div>
                </div>
                <button
                  className="btn btn-primary"
                  style={{ fontSize: "0.75rem", padding: "0.4rem 0.85rem", whiteSpace: "nowrap" }}
                  onClick={() => setActiveTab("vault")}
                >
                  Go to Vault
                </button>
              </div>
            )}

            {/* Quick Suggestions */}
            <div style={{ marginBottom: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: "0.8125rem", color: "var(--text-dim)" }}>Suggested Prompts:</span>
              {[
                "What is exploratory data analysis?",
                "What attributes exist in the data science salaries dataset?",
                "What was the conclusion and methodology of the project?",
                "What software requirements and R packages were used?"
              ].map((prompt, i) => (
                <button
                  key={i}
                  className="btn btn-secondary"
                  style={{ fontSize: "0.75rem", padding: "0.35rem 0.75rem", borderRadius: "20px" }}
                  onClick={() => handleSendMessage(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Messages Box */}
            {/* Messages Console Viewport */}
            <div
              className="skeuo-panel"
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                marginBottom: "1rem",
                overflow: "hidden"
              }}
            >
              {/* Console Top Bezel Strip */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.45rem 1rem",
                background: "linear-gradient(180deg, #1b2539 0%, #131a29 100%)",
                borderBottom: "1px solid rgba(0, 0, 0, 0.7)"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span className="skeuo-rivet"></span>
                  <span className="skeuo-rivet"></span>
                  <span style={{ fontSize: "0.7rem", color: "#64748b", fontFamily: "var(--font-mono)", fontWeight: "600", marginLeft: "6px" }}>
                    NEURAVAULT // ACTIVE_STREAM_FEED
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "0.68rem", color: "#67e8f9", fontFamily: "var(--font-mono)" }}>LIVE_INDEX: 384D</span>
                  <span className="skeuo-rivet"></span>
                  <span className="skeuo-rivet"></span>
                </div>
              </div>

              {/* Recessed CRT/OLED Well */}
              <div
                className="skeuo-well"
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "1.5rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.25rem",
                  margin: "0.5rem",
                  borderRadius: "8px"
                }}
              >
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                      maxWidth: msg.role === "user" ? "75%" : "90%"
                    }}
                  >
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      marginBottom: "0.4rem",
                      justifyContent: msg.role === "user" ? "flex-end" : "flex-start"
                    }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: "700", color: msg.role === "user" ? "#a5b4fc" : "#67e8f9", textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}>
                        {msg.role === "user" ? "You (Operator)" : "NeuraVault Engine"}
                      </span>
                      {msg.engine && (
                        <span className="badge badge-info" style={{ fontSize: "0.62rem", padding: "0.1rem 0.45rem" }}>
                          ⚡ {msg.engine}
                        </span>
                      )}
                    </div>

                    <div className={msg.role === "user" ? "chat-bubble-user" : "chat-bubble-assistant"}>
                      {msg.role === "assistant" ? (
                        <div className="markdown-content">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <div style={{ whiteSpace: "pre-wrap" }}>{msg.content}</div>
                      )}
                    </div>

                    {/* Grounded Source Citations */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#a5b4fc", letterSpacing: "0.06em", textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}>
                            GROUNDED CASSETTES ({msg.sources.length})
                          </span>
                          <span style={{ fontSize: "0.68rem", color: "var(--text-dim)", fontFamily: "var(--font-mono)" }}>
                            Metric: Cosine Similarity
                          </span>
                        </div>
                        
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: "0.75rem" }}>
                          {msg.sources.map((src, sIdx) => {
                            const cardKey = `${idx}_${sIdx}`;
                            const isExpanded = !!expandedSources[cardKey];
                            const score = typeof src.score === "number" ? src.score : 0.0;
                            
                            let badgeClass = "badge-score-low";
                            let label = "Borderline";
                            if (score >= 0.55) {
                              badgeClass = "badge-score-high";
                              label = "High Relevance";
                            } else if (score >= 0.35) {
                              badgeClass = "badge-score-moderate";
                              label = "Moderate";
                            }

                            const pageText = (src.page !== null && src.page !== undefined) ? `Page ${src.page}` : "Raw Document";
                            const isPdf = src.source && src.source.toLowerCase().endsWith(".pdf");

                            return (
                              <div key={sIdx} className="source-card">
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.45rem", gap: "0.5rem" }}>
                                  <span style={{ fontWeight: "700", color: "#818cf8", fontSize: "0.8rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={src.source}>
                                    {isPdf ? "📕" : "📄"} {src.source}
                                  </span>
                                  <span className={`badge ${badgeClass}`} style={{ fontSize: "0.65rem", padding: "0.15rem 0.45rem", whiteSpace: "nowrap" }} title="Cosine Similarity Score">
                                    {score.toFixed(3)} • {label}
                                  </span>
                                </div>
                                
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                                  <span style={{ fontSize: "0.72rem", color: "#94a3b8", fontFamily: "var(--font-mono)" }}>
                                    📍 {pageText}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setExpandedSources(prev => ({ ...prev, [cardKey]: !prev[cardKey] }));
                                    }}
                                    style={{
                                      background: "transparent",
                                      border: "none",
                                      color: isExpanded ? "#a5b4fc" : "#67e8f9",
                                      fontSize: "0.72rem",
                                      cursor: "pointer",
                                      fontWeight: "600",
                                      padding: 0
                                    }}
                                  >
                                    {isExpanded ? "Hide Passage ▲" : "Inspect Passage ▼"}
                                  </button>
                                </div>

                                {isExpanded ? (
                                  <div className="passage-box">
                                    {src.text}
                                  </div>
                                ) : (
                                  <p style={{
                                    color: "var(--text-muted)",
                                    fontSize: "0.75rem",
                                    margin: 0,
                                    display: "-webkit-box",
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden"
                                  }}>
                                    {src.text}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {chatLoading && (
                  <div style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: "0.75rem", color: "#67e8f9", fontSize: "0.85rem", fontFamily: "var(--font-mono)" }}>
                    <div style={{ display: "inline-block", width: "16px", height: "16px", border: "2px solid #6366f1", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                    RETRIEVING DENSE VECTORS & RUNNING GROUNDED SYNTHESIS...
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>
            </div>

            {/* Tactile Query Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}
            >
              <div style={{ position: "relative", flex: 1 }}>
                <input
                  id="query-input"
                  className="input"
                  type="text"
                  placeholder="Query knowledge base (e.g. 'What is SYNA?' or 'Summarize findings')..."
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  disabled={chatLoading}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <select
                  value={topK}
                  onChange={(e) => setTopK(Number(e.target.value))}
                  className="skeuo-select"
                  title="Number of top chunks to retrieve"
                >
                  <option value={3}>Top 3</option>
                  <option value={5}>Top 5</option>
                  <option value={8}>Top 8</option>
                  <option value={10}>Top 10</option>
                </select>

                <button
                  id="btn-send-query"
                  type="submit"
                  className="btn btn-primary"
                  disabled={!inputQuery.trim() || chatLoading}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                  Search & Synthesize
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ================= TAB 2: DOCUMENT VAULT ================= */}
        {activeTab === "vault" && (
          <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
            {/* Hydraulic Loading Hatch / Upload Bay */}
            <div className="skeuo-panel" style={{ padding: "2.25rem", textAlign: "center", position: "relative" }}>
              <div style={{ position: "absolute", top: "12px", left: "16px", display: "flex", gap: "6px" }}>
                <span className="skeuo-rivet"></span>
                <span className="skeuo-rivet"></span>
              </div>
              <div style={{ position: "absolute", top: "12px", right: "16px", display: "flex", gap: "6px" }}>
                <span className="skeuo-rivet"></span>
                <span className="skeuo-rivet"></span>
              </div>

              <div style={{ maxWidth: "560px", margin: "0 auto" }}>
                <div style={{
                  width: "60px",
                  height: "60px",
                  margin: "0 auto 1.25rem",
                  borderRadius: "14px",
                  background: "linear-gradient(180deg, #243048 0%, #151d2c 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderTop: "1px solid rgba(255, 255, 255, 0.25)",
                  borderBottom: "2px solid #090d15",
                  boxShadow: "0 6px 14px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
                }}>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.6))" }}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                </div>
                
                <h3 style={{ fontSize: "1.35rem", fontWeight: "800", marginBottom: "0.5rem", letterSpacing: "-0.01em", textShadow: "0 2px 4px rgba(0,0,0,0.8)" }}>
                  Pneumatic Knowledge Intake Hatch
                </h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "1.75rem", lineHeight: 1.6 }}>
                  Ingest PDF, TXT, or MD documents. Text is cleaned, segmented into recursive semantic chunks, and embedded directly into the Qdrant dense vector store.
                </p>

                <input
                  id="file-upload-input"
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt,.md,.json,.csv"
                  onChange={handleFileUpload}
                  style={{ display: "none" }}
                />

                <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
                  <button
                    id="btn-upload-file"
                    className="btn btn-primary"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                    {uploading ? "Extracting & Embedding..." : "Ingest Document Cartridge"}
                  </button>
                  <button
                    id="btn-reindex"
                    className="btn btn-secondary"
                    onClick={handleReindex}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
                    Re-Index All Vectors
                  </button>
                </div>

                {uploadStatus && (
                  <div style={{
                    marginTop: "1.5rem",
                    padding: "0.85rem 1.25rem",
                    borderRadius: "8px",
                    fontSize: "0.875rem",
                    background: uploadStatus.type === "success" ? "linear-gradient(180deg, #0b3d2b 0%, #06261b 100%)" : uploadStatus.type === "error" ? "linear-gradient(180deg, #5b1313 0%, #3a0d0d 100%)" : "linear-gradient(180deg, #0e3b4d 0%, #082430 100%)",
                    color: uploadStatus.type === "success" ? "#6ee7b7" : uploadStatus.type === "error" ? "#fda4af" : "#67e8f9",
                    borderTop: "1px solid rgba(255, 255, 255, 0.2)",
                    borderBottom: "2px solid rgba(0, 0, 0, 0.8)",
                    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
                    fontWeight: "600"
                  }}>
                    {uploadStatus.text}
                  </div>
                )}
              </div>
            </div>

            {/* Document Inventory Registry */}
            <div className="skeuo-panel" style={{ padding: "1.75rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <h3 style={{ fontSize: "1.15rem", fontWeight: "800", textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}>
                      Indexed Cartridge Registry ({documents.length})
                    </h3>
                    <span className="badge badge-info" style={{ fontSize: "0.65rem" }}>ENCRYPTED VAULT</span>
                  </div>
                  <p style={{ color: "var(--text-dim)", fontSize: "0.8125rem", fontFamily: "var(--font-mono)" }}>
                    Total dense chunks indexed: {totalChunks}
                  </p>
                </div>
                <button className="btn btn-secondary" onClick={loadInitialData}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
                  Sync Registry
                </button>
              </div>

              {loadingDocs ? (
                <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>Querying document catalog...</p>
              ) : documents.length === 0 ? (
                <div style={{ padding: "2.5rem", textAlign: "center", color: "var(--text-muted)" }}>
                  No cartridges detected in vault. Ingest your first document above.
                </div>
              ) : (
                <div className="skeuo-well" style={{ overflowX: "auto", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                    <thead>
                      <tr style={{
                        background: "linear-gradient(180deg, #1b2539 0%, #131a29 100%)",
                        borderBottom: "1px solid rgba(0, 0, 0, 0.8)",
                        textAlign: "left",
                        color: "#94a3b8",
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.75rem"
                      }}>
                        <th style={{ padding: "0.85rem 1rem" }}>CARTRIDGE</th>
                        <th style={{ padding: "0.85rem 1rem" }}>SIZE</th>
                        <th style={{ padding: "0.85rem 1rem" }}>CHUNKS</th>
                        <th style={{ padding: "0.85rem 1rem" }}>INDEX_STATE</th>
                        <th style={{ padding: "0.85rem 1rem" }}>TIMESTAMP</th>
                        <th style={{ padding: "0.85rem 1rem", textAlign: "right" }}>HARDWARE CONTROLS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.map((doc, idx) => (
                        <tr
                          key={idx}
                          style={{
                            borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
                            background: idx % 2 === 0 ? "rgba(0, 0, 0, 0.15)" : "transparent"
                          }}
                        >
                          <td style={{ padding: "0.875rem 1rem", fontWeight: "700", color: "#f8fafc" }}>
                            {doc.is_pdf ? "📕" : "📄"} {doc.filename}
                          </td>
                          <td style={{ padding: "0.875rem 1rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                            {(doc.size_bytes / 1024).toFixed(1)} KB
                          </td>
                          <td style={{ padding: "0.875rem 1rem" }}>
                            <span className="badge badge-info">{doc.chunks_count} chunks</span>
                          </td>
                          <td style={{ padding: "0.875rem 1rem" }}>
                            {doc.is_processed ? (
                              <span className="badge badge-success">Processed</span>
                            ) : (
                              <span className="badge badge-warning">Unprocessed</span>
                            )}
                          </td>
                          <td style={{ padding: "0.875rem 1rem", color: "var(--text-muted)", fontSize: "0.8rem", fontFamily: "var(--font-mono)" }}>
                            {doc.modified_time}
                          </td>
                          <td style={{ padding: "0.875rem 1rem", textAlign: "right" }}>
                            <div style={{ display: "inline-flex", gap: "0.5rem" }}>
                              <button
                                className="btn btn-secondary"
                                style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem" }}
                                onClick={() => handleViewChunks(doc.filename)}
                              >
                                View Chunks
                              </button>
                              <button
                                className="btn btn-danger"
                                style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem" }}
                                onClick={() => handleDeleteDoc(doc.filename)}
                              >
                                Purge
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 3: TELEMETRY & STATS ================= */}
        {activeTab === "stats" && (
          <div className="animate-fade-in" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1.75rem" }}>
            {/* Vector Store Gauge Card */}
            <div className="skeuo-panel" style={{ padding: "1.75rem", position: "relative" }}>
              <div style={{ position: "absolute", top: "12px", right: "14px", display: "flex", gap: "5px" }}>
                <span className="skeuo-rivet"></span>
                <span className="skeuo-rivet"></span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", marginBottom: "1.25rem" }}>
                <div style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  background: "linear-gradient(180deg, #2b3366 0%, #161b36 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderTop: "1px solid rgba(255, 255, 255, 0.25)",
                  boxShadow: "0 3px 6px rgba(0,0,0,0.5)"
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2.2"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></svg>
                </div>
                <div>
                  <h4 style={{ fontSize: "1.15rem", fontWeight: "800", textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}>Qdrant Vector Database</h4>
                  <p style={{ color: "var(--text-dim)", fontSize: "0.75rem", fontFamily: "var(--font-mono)" }}>EMBEDDED STORAGE TELEMETRY</p>
                </div>
              </div>

              <div className="skeuo-well" style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.85rem", fontSize: "0.875rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255, 255, 255, 0.06)", paddingBottom: "0.5rem" }}>
                  <span style={{ color: "var(--text-muted)" }}>Collection Name</span>
                  <span style={{ fontWeight: "700", fontFamily: "var(--font-mono)", color: "#e2e8f0" }}>{health?.vectorstore?.collection_name || "neuravault"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255, 255, 255, 0.06)", paddingBottom: "0.5rem" }}>
                  <span style={{ color: "var(--text-muted)" }}>Total Vectors Stored</span>
                  <span style={{ fontWeight: "800", color: "#67e8f9", fontFamily: "var(--font-mono)", fontSize: "1rem" }}>{health?.vectorstore?.points_count ?? 0}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255, 255, 255, 0.06)", paddingBottom: "0.5rem" }}>
                  <span style={{ color: "var(--text-muted)" }}>Vector Dimension</span>
                  <span style={{ fontWeight: "600", fontFamily: "var(--font-mono)" }}>384 dims (Dense)</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Distance Metric</span>
                  <span style={{ fontWeight: "600", fontFamily: "var(--font-mono)" }}>Cosine Similarity</span>
                </div>
              </div>
            </div>

            {/* Embedding Model Gauge Card */}
            <div className="skeuo-panel" style={{ padding: "1.75rem", position: "relative" }}>
              <div style={{ position: "absolute", top: "12px", right: "14px", display: "flex", gap: "5px" }}>
                <span className="skeuo-rivet"></span>
                <span className="skeuo-rivet"></span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", marginBottom: "1.25rem" }}>
                <div style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  background: "linear-gradient(180deg, #16404d 0%, #0d2229 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderTop: "1px solid rgba(6, 182, 212, 0.35)",
                  boxShadow: "0 3px 6px rgba(0,0,0,0.5)"
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2.2"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line></svg>
                </div>
                <div>
                  <h4 style={{ fontSize: "1.15rem", fontWeight: "800", textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}>Embedding Engine</h4>
                  <p style={{ color: "var(--text-dim)", fontSize: "0.75rem", fontFamily: "var(--font-mono)" }}>DENSE TRANSFORMER PIPELINE</p>
                </div>
              </div>

              <div className="skeuo-well" style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.85rem", fontSize: "0.875rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255, 255, 255, 0.06)", paddingBottom: "0.5rem" }}>
                  <span style={{ color: "var(--text-muted)" }}>Model</span>
                  <span style={{ fontWeight: "700", fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "#67e8f9" }}>all-MiniLM-L6-v2</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255, 255, 255, 0.06)", paddingBottom: "0.5rem" }}>
                  <span style={{ color: "var(--text-muted)" }}>Chunk Strategy</span>
                  <span style={{ fontWeight: "600", fontFamily: "var(--font-mono)" }}>Recursive (1000 char / 200 ov)</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Execution Mode</span>
                  <span className="badge badge-success">Optimized Local PyTorch</span>
                </div>
              </div>
            </div>

            {/* Architecture Card */}
            <div className="skeuo-panel" style={{ padding: "1.75rem", position: "relative" }}>
              <div style={{ position: "absolute", top: "12px", right: "14px", display: "flex", gap: "5px" }}>
                <span className="skeuo-rivet"></span>
                <span className="skeuo-rivet"></span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", marginBottom: "1.25rem" }}>
                <div style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  background: "linear-gradient(180deg, #193e2f 0%, #0c241b 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderTop: "1px solid rgba(16, 185, 129, 0.35)",
                  boxShadow: "0 3px 6px rgba(0,0,0,0.5)"
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
                </div>
                <div>
                  <h4 style={{ fontSize: "1.15rem", fontWeight: "800", textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}>System Topology</h4>
                  <p style={{ color: "var(--text-dim)", fontSize: "0.75rem", fontFamily: "var(--font-mono)" }}>TACTILE RUNTIME ARCHITECTURE</p>
                </div>
              </div>

              <div className="skeuo-well" style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.85rem", fontSize: "0.875rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255, 255, 255, 0.06)", paddingBottom: "0.5rem" }}>
                  <span style={{ color: "var(--text-muted)" }}>Backend Framework</span>
                  <span style={{ fontWeight: "600", fontFamily: "var(--font-mono)" }}>FastAPI 0.141</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255, 255, 255, 0.06)", paddingBottom: "0.5rem" }}>
                  <span style={{ color: "var(--text-muted)" }}>LLM Engine</span>
                  <span style={{ fontWeight: "700", fontFamily: "var(--font-mono)", color: "#a5b4fc" }}>GroqCloud (Active LLM)</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Vector Engine</span>
                  <span style={{ fontWeight: "600", fontFamily: "var(--font-mono)" }}>Qdrant Dense 1.19</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Chunks Inspection Modal */}
      {selectedDocChunks && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.8)",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 100,
          padding: "1.5rem"
        }}>
          <div className="skeuo-panel" style={{ width: "100%", maxWidth: "840px", maxHeight: "88vh", display: "flex", flexDirection: "column", padding: "1.75rem", position: "relative" }}>
            {/* Chassis Corner Rivets */}
            <div style={{ position: "absolute", top: "12px", left: "14px", display: "flex", gap: "6px" }}>
              <span className="skeuo-rivet"></span>
              <span className="skeuo-rivet"></span>
            </div>
            <div style={{ position: "absolute", top: "12px", right: "14px", display: "flex", gap: "6px" }}>
              <span className="skeuo-rivet"></span>
              <span className="skeuo-rivet"></span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", marginTop: "0.5rem" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <h3 style={{ fontSize: "1.3rem", fontWeight: "800", textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>CARTRIDGE CHUNKS: {selectedDocChunks.filename}</h3>
                </div>
                <p style={{ fontSize: "0.8rem", color: "var(--text-dim)", fontFamily: "var(--font-mono)", marginTop: "2px" }}>
                  TOTAL EMBEDDED UNITS: <span style={{ color: "#38bdf8", fontWeight: "700" }}>{selectedDocChunks.total}</span> | 1000 CHAR CHUNK WINDOW
                </p>
              </div>
              <button className="btn btn-secondary" onClick={() => setSelectedDocChunks(null)} style={{ padding: "0.5rem 1.25rem" }}>
                ✕ CLOSE CARTRIDGE
              </button>
            </div>

            <div className="skeuo-well" style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.85rem", padding: "1.25rem" }}>
              {selectedDocChunks.chunks.map((chk, i) => (
                <div key={i} style={{
                  background: "linear-gradient(180deg, #182236 0%, #111827 100%)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderTop: "1px solid rgba(255, 255, 255, 0.16)",
                  boxShadow: "0 3px 6px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
                  borderRadius: "10px",
                  padding: "1.1rem"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span className="skeuo-rivet" style={{ width: "6px", height: "6px" }}></span>
                      <span style={{ fontWeight: "700", fontSize: "0.8rem", color: "#818cf8", fontFamily: "var(--font-mono)" }}>CHUNK #{i + 1} // ID: {chk.chunk_id}</span>
                    </div>
                    <span className="badge badge-info" style={{ fontSize: "0.7rem", padding: "0.15rem 0.5rem" }}>Page {chk.page}</span>
                  </div>
                  <p style={{ fontSize: "0.84rem", color: "var(--text-main)", whiteSpace: "pre-wrap", lineHeight: 1.65, margin: 0, fontFamily: "var(--font-mono)", background: "rgba(0,0,0,0.25)", padding: "0.75rem", borderRadius: "6px", border: "1px solid rgba(0,0,0,0.4)" }}>
                    {chk.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}