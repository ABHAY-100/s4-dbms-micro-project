import { create } from "zustand";
import { persist } from "zustand/middleware";
import axiosInstance from "@/lib/axios";
import { AuthState } from "@/types";
import { AxiosError } from "axios";

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email, password, skipPasswordCheck = false) => {
        set({ isLoading: true, error: null });
        try {
          let userDetails;

          if (skipPasswordCheck) {
            const response = await axiosInstance.get("/users/profile");
            userDetails = response.data.user;
          } else {
            const response = await axiosInstance.post("/users/login", {
              email,
              password,
            });
            userDetails = response.data.userDetails;
          }

          if (userDetails) {
            set({
              user: userDetails,
              token: true,
              isAuthenticated: true,
              isLoading: false,
            });
            return;
          }

          throw new Error("Failed to get user details");
        } catch (error: unknown) {
          const axiosError = error as AxiosError<{ message: string }>;
          set({
            isLoading: false,
            error: axiosError.response?.data?.message || "Failed to login",
            user: null,
            token: null,
            isAuthenticated: false,
          });
          throw error;
        }
      },

      register: async (name, email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await axiosInstance.post("/users/register", {
            name,
            email,
            password,
          });
          const { user, token } = response.data;

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: unknown) {
          const axiosError = error as AxiosError<{ message: string }>;
          set({
            isLoading: false,
            error: axiosError.response?.data?.message || "Failed to register",
          });
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: "death_set_auth_storage",
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
