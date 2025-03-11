import axios from "axios";
import { useAuthStore } from '@/store/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
console.log("API URL:", API_URL);

const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to log requests and add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    // Get token from the auth store
    const token = useAuthStore.getState().token;
    
    // If token exists, add it to the request headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

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

// Add response interceptor for logging, error handling, and token expiration
axiosInstance.interceptors.response.use(
  (response) => {
    // Don't log profile responses to reduce noise
    if (!response.config.url?.includes('profile')) {
      console.log(`Response status: ${response.status}`);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

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

    // If error is 401 (Unauthorized) and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Either attempt to refresh the token here or logout the user
      try {
        // Option 1: Logout the user when token is invalid
        useAuthStore.getState().logout();
        
        // Option 2: Alternatively, you could implement token refresh logic
        // const refreshed = await refreshToken();
        // if (refreshed) {
        //   originalRequest.headers.Authorization = `Bearer ${useAuthStore.getState().token}`;
        //   return axios(originalRequest);
        // }
      } catch (refreshError) {
        // If refresh fails, logout the user
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
