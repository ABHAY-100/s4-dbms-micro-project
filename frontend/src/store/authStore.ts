import { create } from "zustand";
import { persist } from "zustand/middleware";
import axiosInstance from "@/lib/axios";
import { AxiosError } from "axios";
import { RegisterUserData, AuthState } from "@/types";

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      errorMessage: null,

      // Add new updateUser action
      updateUser: (userData) => {
        set((state) => ({
          ...state,
          user: { ...state.user, ...userData },
        }));
      },

      login: async (
        email: string,
        password: string,
        skipPasswordCheck = false
      ) => {
        set({ isLoading: true, errorMessage: null });
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
            errorMessage:
              axiosError.response?.data?.message || "Failed to login",
            user: null,
            token: null,
            isAuthenticated: false,
          });
          throw error;
        }
      },

      register: async (userData: RegisterUserData) => {
        set({ isLoading: true, errorMessage: null });
        try {
          const response = await axiosInstance.post(
            "/users/register",
            userData
          );
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
            errorMessage:
              axiosError.response?.data?.message || "Failed to register",
          });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true, errorMessage: null });
        try {
          try {
            await axiosInstance.post("/users/logout");
          } catch (logoutError) {
            const axiosError = logoutError as AxiosError;
            if (axiosError.response?.status !== 401) {
              throw logoutError;
            }
            console.warn(
              "Server logout failed with 401, proceeding with local logout"
            );
          }

          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        } catch (error: unknown) {
          const axiosError = error as AxiosError<{ message: string }>;
          set({
            isLoading: false,
            errorMessage:
              axiosError.response?.data?.message || "Failed to logout",
          });
          throw error;
        }
      },
    }),
    {
      name: "death_set_auth_token",
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
