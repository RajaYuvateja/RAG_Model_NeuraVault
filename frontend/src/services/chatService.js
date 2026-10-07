import { request } from "./api";

export async function queryVault(query, top_k = 5) {
  return request("/chat", {
    method: "POST",
    body: JSON.stringify({
      query,
      top_k,
    }),
  });
}
