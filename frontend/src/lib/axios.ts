import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
console.log("API URL:", API_URL);

const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to log requests
axiosInstance.interceptors.request.use(
  (config) => {
    // Don't log profile requests to reduce noise
    if (!config.url?.includes('profile')) {
      console.log(`${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for logging and error handling
axiosInstance.interceptors.response.use(
  (response) => {
    // Don't log profile responses to reduce noise
    if (!response.config.url?.includes('profile')) {
      console.log(`Response status: ${response.status}`);
    }
    return response;
  },
  (error) => {
    // Don't log profile errors to reduce noise
    if (!error.config.url?.includes('profile')) {
      console.error("API Error:", error.response?.status, error.response?.data);
    }
    
    // Disable automatic redirection on 401
    // Only redirect if explicitly requested via the manualRedirect flag
    if (error.response?.status === 401 && 
        !error.config.url.includes("login") && 
        error.config.manualRedirect) {
      console.log("Unauthorized access detected, redirecting to login");
      if (typeof window !== 'undefined') {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
