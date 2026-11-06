import axios from "axios";
import { toast } from "sonner";

// Determine default base URL based on environment
// For production, we prefer VITE_API_URL env var set in Vercel
const defaultBaseUrl = import.meta.env.PROD 
  ? "https://seva-kendra-backend.vercel.app/api/v1" // Fallback - should ideally be set in Vercel
  : "http://localhost:5000/api/v1";

// While > 0, the response interceptor does not toast errors. Callers that
// report errors themselves (bulk Excel import) wrap their requests in
// runWithoutErrorToasts so a 200-row import doesn't produce 200 toasts.
let silentErrorDepth = 0;

export const runWithoutErrorToasts = async (fn) => {
  silentErrorDepth += 1;
  try {
    return await fn();
  } finally {
    silentErrorDepth -= 1;
  }
};

// Create axios instance with default config
const api = axios.create({  
  baseURL: import.meta.env.VITE_API_URL || defaultBaseUrl,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Debug log for production connectivity issues
if (import.meta.env.PROD) {
  console.log("API Base URL:", api.defaults.baseURL);
}

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // Extract error message from response
    let errorMessage = "An error occurred";

    if (error.response) {
      // Server responded with error status
      const { data, status, config } = error.response;

      if (status === 401) {
        // Handle unauthorized access
        errorMessage = data?.message || "Session expired. Please sign in again.";
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
        const sessionError = Object.assign(new Error(errorMessage), { status });
        // During a bulk import the caller stops, shows what was saved and offers sign-in;
        // redirecting here would throw that result away.
        if (silentErrorDepth === 0) {
          toast.error(errorMessage);
          window.location.href = "/signin";
        }
        return Promise.reject(sessionError);
      }

      // Extract error message from various possible formats
      if (data?.message) {
        errorMessage = data.message;
      } else if (data?.error) {
        errorMessage =
          typeof data.error === "string" ? data.error : data.error.message;
      } else if (typeof data === "string") {
        errorMessage = data;
      } else if (status === 404) {
        errorMessage = `Route not found: ${config.method?.toUpperCase()} ${config.url}`;
      } else if (status === 500) {
        errorMessage = "Server error. Please try again later.";
      } else if (status >= 400 && status < 500) {
        errorMessage = data?.message || "Request failed. Please check your input.";
      }

      // Log error details for debugging
      console.error("API Error:", {
        status,
        url: config.url,
        method: config.method,
        message: errorMessage,
        data,
      });
    } else if (error.request) {
      // Request made but no response received
      errorMessage = "Network error. Please check your connection.";
      console.error("Full Network Error Object:", error);
      console.error("Error Code:", error.code);
      console.error("Error Message:", error.message);
      console.error("Request Config:", error.config);
    } else {
      // Error in request setup
      errorMessage = error.message || "Failed to make request";
      console.error("Request Setup Error:", error.message);
    }

    // Show error toast (suppressed while a caller handles errors itself, e.g. bulk import)
    if (silentErrorDepth === 0) {
      toast.error(errorMessage);
    }

    return Promise.reject(Object.assign(new Error(errorMessage), { status: error.response?.status }));
  }
);

export default api;
