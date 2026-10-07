import { request } from "./api";

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append("file", file);

  return request("/upload", {
    method: "POST",
    body: formData,
  });
}

export async function getDocuments() {
  return request("/documents");
}

export async function getDocumentChunks(filename) {
  return request(`/documents/${encodeURIComponent(filename)}/chunks`);
}

export async function deleteDocument(filename) {
  return request(`/documents/${encodeURIComponent(filename)}`, {
    method: "DELETE",
  });
}

export async function reindexDocuments() {
  return request("/documents/reindex", {
    method: "POST",
  });
}

export async function getHealth() {
  return request("/health");
}
