const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

export async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    ...options.headers,
  };

  // Don't set Content-Type if sending FormData (browser auto sets boundary)
  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = "API Error";
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errJson.message || response.statusText;
    } catch {
      errorDetail = response.statusText;
    }
    throw new Error(errorDetail);
  }

  return response.json();
}
