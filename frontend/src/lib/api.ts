/**
 * API utility - handles all HTTP requests to the backend
 * Fixes the "URL_INVALID: The URL 'undefined' is not valid" error by:
 * 1. Using NEXT_PUBLIC_API_URL environment variable
 * 2. Providing a fallback to http://localhost:5000
 * 3. Adding console logging for debugging
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Debug logging for API URL
console.log("[API] Base URL configured as:", API_URL);

interface ApiOptions {
  method?: string;
  body?: unknown;
  token?: string;
}

interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
  messages?: string[];
}

export async function api<T = unknown>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<ApiResponse<T>> {
  const { method = "GET", body, token } = options;

  const url = `${API_URL}${endpoint}`;
  console.log(`[API] ${method} ${url}`);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`[API] Error ${response.status}:`, data);
      return {
        error: data.error || "Request failed",
        message: data.message || data.messages?.[0] || "Something went wrong",
        messages: data.messages,
      };
    }

    return { data };
  } catch (error) {
    console.error("[API] Network error:", error);
    return {
      error: "Network error",
      message: "Unable to connect to the server. Please check your connection.",
    };
  }
}

export { API_URL };
