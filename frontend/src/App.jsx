import React, { useState, useEffect, useRef } from "react";
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
        sources: response.sources || []
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
      <header style={{
        background: "rgba(10, 13, 20, 0.85)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border-subtle)",
        position: "sticky",
        top: 0,
        zIndex: 50,
        padding: "1rem 2rem"
      }}>
        <div style={{
          maxWidth: "1300px",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 16px rgba(99, 102, 241, 0.4)"
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                <polyline points="2 17 12 22 22 17"></polyline>
                <polyline points="2 12 12 17 22 12"></polyline>
              </svg>
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <span style={{ fontSize: "1.25rem", fontWeight: "800", letterSpacing: "-0.02em" }}>NeuraVault</span>
                <span className="badge badge-info" style={{ fontSize: "0.65rem", padding: "0.15rem 0.45rem" }}>v1.0 RAG</span>
              </div>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0 }}>Enterprise Knowledge Retrieval Engine</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: "flex", gap: "0.5rem", background: "rgba(255, 255, 255, 0.04)", padding: "0.25rem", borderRadius: "10px", border: "1px solid var(--border-subtle)" }}>
            <button
              id="tab-chat"
              onClick={() => setActiveTab("chat")}
              className="btn"
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "8px",
                background: activeTab === "chat" ? "rgba(99, 102, 241, 0.2)" : "transparent",
                color: activeTab === "chat" ? "#a5b4fc" : "var(--text-muted)",
                border: activeTab === "chat" ? "1px solid rgba(99, 102, 241, 0.4)" : "1px solid transparent"
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              RAG Intelligence
            </button>
            <button
              id="tab-vault"
              onClick={() => setActiveTab("vault")}
              className="btn"
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "8px",
                background: activeTab === "vault" ? "rgba(99, 102, 241, 0.2)" : "transparent",
                color: activeTab === "vault" ? "#a5b4fc" : "var(--text-muted)",
                border: activeTab === "vault" ? "1px solid rgba(99, 102, 241, 0.4)" : "1px solid transparent"
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
              Document Vault ({documents.length})
            </button>
            <button
              id="tab-stats"
              onClick={() => setActiveTab("stats")}
              className="btn"
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "8px",
                background: activeTab === "stats" ? "rgba(99, 102, 241, 0.2)" : "transparent",
                color: activeTab === "stats" ? "#a5b4fc" : "var(--text-muted)",
                border: activeTab === "stats" ? "1px solid rgba(99, 102, 241, 0.4)" : "1px solid transparent"
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
              Telemetry & Engine
            </button>
          </div>

          {/* Health Status */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <span className={`status-dot ${health?.status === "healthy" ? "green" : "red"}`} />
            <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
              {health?.status === "healthy"
                ? `Vector Store: ${health?.vectorstore?.points_count ?? 0} vectors`
                : "Backend Disconnected"}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* ================= TAB 1: RAG CHAT ================= */}
        {activeTab === "chat" && (
          <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 160px)" }}>
            {/* Quick Suggestions */}
            <div style={{ marginBottom: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: "0.8125rem", color: "var(--text-dim)" }}>Suggested Prompts:</span>
              {[
                "What is exploratory data analysis?",
                "What attributes exist in the data science salaries dataset?",
                "What was the conclusion and methodology of the project?"
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
            <div
              className="glass-panel"
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "1.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "1.25rem",
                marginBottom: "1rem"
              }}
            >
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                    maxWidth: msg.role === "user" ? "75%" : "85%"
                  }}
                >
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    marginBottom: "0.35rem",
                    justifyContent: msg.role === "user" ? "flex-end" : "flex-start"
                  }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: "600", color: msg.role === "user" ? "#a5b4fc" : "#67e8f9" }}>
                      {msg.role === "user" ? "You" : "NeuraVault AI"}
                    </span>
                  </div>

                  <div
                    style={{
                      padding: "1rem 1.25rem",
                      borderRadius: "14px",
                      background: msg.role === "user"
                        ? "linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(79, 70, 229, 0.35) 100%)"
                        : "rgba(16, 22, 34, 0.9)",
                      border: msg.role === "user"
                        ? "1px solid rgba(99, 102, 241, 0.4)"
                        : "1px solid var(--border-subtle)",
                      color: "var(--text-main)",
                      fontSize: "0.9375rem",
                      whiteSpace: "pre-wrap",
                      boxShadow: msg.role === "user" ? "0 4px 15px rgba(99, 102, 241, 0.2)" : "none"
                    }}
                  >
                    {msg.content}
                  </div>

                  {/* Sources Citations */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--text-dim)" }}>
                        GROUNDED SOURCES ({msg.sources.length}):
                      </span>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "0.5rem" }}>
                        {msg.sources.map((src, sIdx) => {
                          const pct = (src.score * 100).toFixed(1);
                          return (
                            <div
                              key={sIdx}
                              style={{
                                background: "rgba(255, 255, 255, 0.03)",
                                border: "1px solid rgba(255, 255, 255, 0.07)",
                                borderRadius: "8px",
                                padding: "0.625rem",
                                fontSize: "0.78125rem"
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                                <span style={{ fontWeight: "600", color: "#818cf8" }}>📄 {src.source}</span>
                                <span style={{ color: "#34d399", fontSize: "0.72rem" }}>Page {src.page} • {pct}% match</span>
                              </div>
                              <p style={{
                                color: "var(--text-muted)",
                                fontSize: "0.75rem",
                                margin: 0,
                                display: "-webkit-box",
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden"
                              }}>
                                {src.text}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {chatLoading && (
                <div style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: "0.75rem", color: "var(--text-muted)", fontSize: "0.875rem" }}>
                  <div style={{ display: "inline-block", width: "16px", height: "16px", border: "2px solid #6366f1", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                  Retrieving embeddings & synthesizing answer...
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Input Form */}
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
                  placeholder="Ask any question about your indexed documents..."
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  disabled={chatLoading}
                  style={{ paddingRight: "4rem" }}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <select
                  value={topK}
                  onChange={(e) => setTopK(Number(e.target.value))}
                  style={{
                    padding: "0.75rem 0.5rem",
                    background: "rgba(16, 22, 34, 0.8)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "8px",
                    color: "var(--text-muted)",
                    fontSize: "0.875rem",
                    outline: "none"
                  }}
                  title="Number of top chunks to retrieve"
                >
                  <option value={3}>Top 3</option>
                  <option value={5}>Top 5</option>
                  <option value={8}>Top 8</option>
                </select>

                <button
                  id="btn-send-query"
                  type="submit"
                  className="btn btn-primary"
                  disabled={!inputQuery.trim() || chatLoading}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                  Search & Ask
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ================= TAB 2: DOCUMENT VAULT ================= */}
        {activeTab === "vault" && (
          <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Upload Area */}
            <div className="glass-panel" style={{ padding: "2rem", textAlign: "center" }}>
              <div style={{ maxWidth: "500px", margin: "0 auto" }}>
                <div style={{
                  width: "56px",
                  height: "56px",
                  margin: "0 auto 1rem",
                  borderRadius: "14px",
                  background: "rgba(99, 102, 241, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid rgba(99, 102, 241, 0.3)"
                }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                </div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: "700", marginBottom: "0.5rem" }}>Upload Documents to NeuraVault</h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
                  Upload PDF, TXT, or MD documents. Text will be extracted, split into semantic chunks, vectorized, and stored in the vector database automatically.
                </p>

                <input
                  id="file-upload-input"
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt,.md,.json,.csv"
                  onChange={handleFileUpload}
                  style={{ display: "none" }}
                />

                <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
                  <button
                    id="btn-upload-file"
                    className="btn btn-primary"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploading ? "Ingesting & Indexing..." : "Select File to Upload"}
                  </button>
                  <button
                    id="btn-reindex"
                    className="btn btn-secondary"
                    onClick={handleReindex}
                  >
                    Re-Index All Documents
                  </button>
                </div>

                {uploadStatus && (
                  <div style={{
                    marginTop: "1.25rem",
                    padding: "0.75rem 1rem",
                    borderRadius: "8px",
                    fontSize: "0.875rem",
                    background: uploadStatus.type === "success" ? "rgba(16, 185, 129, 0.15)" : uploadStatus.type === "error" ? "rgba(244, 63, 94, 0.15)" : "rgba(6, 182, 212, 0.15)",
                    color: uploadStatus.type === "success" ? "#6ee7b7" : uploadStatus.type === "error" ? "#fda4af" : "#67e8f9",
                    border: "1px solid rgba(255, 255, 255, 0.1)"
                  }}>
                    {uploadStatus.text}
                  </div>
                )}
              </div>
            </div>

            {/* Document List */}
            <div className="glass-panel" style={{ padding: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                <div>
                  <h3 style={{ fontSize: "1.125rem", fontWeight: "700" }}>Stored Documents ({documents.length})</h3>
                  <p style={{ color: "var(--text-dim)", fontSize: "0.8125rem" }}>Total processed chunks: {totalChunks}</p>
                </div>
                <button className="btn btn-secondary" onClick={loadInitialData}>
                  Refresh
                </button>
              </div>

              {loadingDocs ? (
                <p style={{ color: "var(--text-muted)" }}>Loading document inventory...</p>
              ) : documents.length === 0 ? (
                <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
                  No documents in vault. Upload your first document above.
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border-subtle)", textAlign: "left", color: "var(--text-dim)" }}>
                        <th style={{ padding: "0.75rem 1rem" }}>Filename</th>
                        <th style={{ padding: "0.75rem 1rem" }}>Size</th>
                        <th style={{ padding: "0.75rem 1rem" }}>Chunks</th>
                        <th style={{ padding: "0.75rem 1rem" }}>Status</th>
                        <th style={{ padding: "0.75rem 1rem" }}>Uploaded At</th>
                        <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.map((doc, idx) => (
                        <tr
                          key={idx}
                          style={{
                            borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
                            transition: "background 0.15s"
                          }}
                        >
                          <td style={{ padding: "0.875rem 1rem", fontWeight: "600" }}>
                            {doc.is_pdf ? "📕" : "📄"} {doc.filename}
                          </td>
                          <td style={{ padding: "0.875rem 1rem", color: "var(--text-muted)" }}>
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
                          <td style={{ padding: "0.875rem 1rem", color: "var(--text-muted)", fontSize: "0.8125rem" }}>
                            {doc.modified_time}
                          </td>
                          <td style={{ padding: "0.875rem 1rem", textAlign: "right" }}>
                            <div style={{ display: "inline-flex", gap: "0.5rem" }}>
                              <button
                                className="btn btn-secondary"
                                style={{ padding: "0.35rem 0.65rem", fontSize: "0.75rem" }}
                                onClick={() => handleViewChunks(doc.filename)}
                              >
                                View Chunks
                              </button>
                              <button
                                className="btn btn-danger"
                                style={{ padding: "0.35rem 0.65rem", fontSize: "0.75rem" }}
                                onClick={() => handleDeleteDoc(doc.filename)}
                              >
                                Delete
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
          <div className="animate-fade-in" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
            {/* Vector Store Card */}
            <div className="glass-panel" style={{ padding: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(99, 102, 241, 0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></svg>
                </div>
                <div>
                  <h4 style={{ fontSize: "1.125rem", fontWeight: "700" }}>Qdrant Vector Database</h4>
                  <p style={{ color: "var(--text-dim)", fontSize: "0.75rem" }}>Embedded Collection Metrics</p>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.875rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "0.5rem" }}>
                  <span style={{ color: "var(--text-muted)" }}>Collection Name</span>
                  <span style={{ fontWeight: "600", fontFamily: "var(--font-mono)" }}>{health?.vectorstore?.collection_name || "neuravault"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "0.5rem" }}>
                  <span style={{ color: "var(--text-muted)" }}>Total Vectors Stored</span>
                  <span style={{ fontWeight: "700", color: "#67e8f9" }}>{health?.vectorstore?.points_count ?? 0}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "0.5rem" }}>
                  <span style={{ color: "var(--text-muted)" }}>Vector Dimension</span>
                  <span style={{ fontWeight: "600" }}>384 dims (Dense)</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Distance Metric</span>
                  <span style={{ fontWeight: "600" }}>Cosine Similarity</span>
                </div>
              </div>
            </div>

            {/* Embedding Model Card */}
            <div className="glass-panel" style={{ padding: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(6, 182, 212, 0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line></svg>
                </div>
                <div>
                  <h4 style={{ fontSize: "1.125rem", fontWeight: "700" }}>Embedding Engine</h4>
                  <p style={{ color: "var(--text-dim)", fontSize: "0.75rem" }}>SentenceTransformers Transformer</p>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.875rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "0.5rem" }}>
                  <span style={{ color: "var(--text-muted)" }}>Model</span>
                  <span style={{ fontWeight: "600", fontFamily: "var(--font-mono)", fontSize: "0.8125rem" }}>all-MiniLM-L6-v2</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "0.5rem" }}>
                  <span style={{ color: "var(--text-muted)" }}>Chunk Strategy</span>
                  <span style={{ fontWeight: "600" }}>Recursive (1000 char / 200 ov)</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Execution Mode</span>
                  <span className="badge badge-success">Optimized Local PyTorch</span>
                </div>
              </div>
            </div>

            {/* Architecture Card */}
            <div className="glass-panel" style={{ padding: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(16, 185, 129, 0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
                </div>
                <div>
                  <h4 style={{ fontSize: "1.125rem", fontWeight: "700" }}>System Topology</h4>
                  <p style={{ color: "var(--text-dim)", fontSize: "0.75rem" }}>NeuraVault Core Stack</p>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.875rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "0.5rem" }}>
                  <span style={{ color: "var(--text-muted)" }}>Backend Framework</span>
                  <span style={{ fontWeight: "600" }}>FastAPI 0.141</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "0.5rem" }}>
                  <span style={{ color: "var(--text-muted)" }}>Frontend Framework</span>
                  <span style={{ fontWeight: "600" }}>React 18 + Vite 5</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Vector Engine</span>
                  <span style={{ fontWeight: "600" }}>Qdrant 1.19</span>
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
          <div className="glass-panel" style={{ width: "100%", maxWidth: "800px", maxHeight: "85vh", display: "flex", flexDirection: "column", padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: "700" }}>Chunks: {selectedDocChunks.filename}</h3>
                <p style={{ fontSize: "0.8125rem", color: "var(--text-dim)" }}>Total extracted chunks: {selectedDocChunks.total}</p>
              </div>
              <button className="btn btn-secondary" onClick={() => setSelectedDocChunks(null)}>
                Close
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.75rem", paddingRight: "0.5rem" }}>
              {selectedDocChunks.chunks.map((chk, i) => (
                <div key={i} style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <span style={{ fontWeight: "600", fontSize: "0.75rem", color: "#818cf8" }}>Chunk #{i + 1} (ID: {chk.chunk_id})</span>
                    <span className="badge badge-info" style={{ fontSize: "0.65rem" }}>Page {chk.page}</span>
                  </div>
                  <p style={{ fontSize: "0.8125rem", color: "var(--text-main)", whiteSpace: "pre-wrap", lineHeight: 1.6, margin: 0 }}>
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