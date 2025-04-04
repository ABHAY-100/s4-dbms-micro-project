import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001/api';

const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    if (!config.url?.includes("profile")) {
      console.log(`${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    if (!response.config.url?.includes("profile")) {
      console.log(`Response status: ${response.status}`);
    }
    return response;
  },
  (error) => {
    if (!error.config.url?.includes("profile")) {
      const errorMessage = error.response?.data?.message || error.response?.data || error.message;
      console.error("API Error:", {
        status: error.response?.status,
        endpoint: error.config?.url,
        message: errorMessage
      });
    }

    if (error.response?.status === 404) {
      return Promise.reject(new Error(`Endpoint not found: ${error.config?.url}`));
    }

    if (
      error.response?.status === 401 &&
      !error.config.url.includes("login") &&
      error.config.manualRedirect
    ) {
      console.log("Unauthorized access detected, redirecting to login");
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
