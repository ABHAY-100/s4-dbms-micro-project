import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

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
      console.error("API Error:", error.response?.status, error.response?.data);
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
