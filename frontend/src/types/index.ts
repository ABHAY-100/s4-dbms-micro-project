import { ReactNode } from "react";
import { z } from "zod";

// jwt payload type
export interface JwtPayload {
  id: string;
  exp?: number;
}

// api response type
export interface ApiError {
  response?: {
    data?: {
      error?: string;
    };
  };
  message?: string;
}

// start: zustand auth types
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  status?: string;
}

export interface RegisterUserData {
  name: string;
  email: string;
  password: string;
  role: string;
  phoneNumber: string;
}

export interface AuthState {
  user: User | null;
  token: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  errorMessage: string | null;
  updateUser: (user: User) => void;
  login: (
    email: string,
    password: string,
    skipPasswordCheck?: boolean
  ) => Promise<void>;
  register: (userData: RegisterUserData) => Promise<void>;
  logout: () => Promise<void>;
}
// end: zustand auth types

// chamber type
export interface Chamber {
  id: string;
  name: string;
  capacity: number;
  currentOccupancy: number;
  status: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE" | "OUT_OF_ORDER";
  deceased: DeceasedRecord[];
}

// deceased type
export interface DeceasedRecord {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  dateOfDeath: string;
  timeOfDeath: string;
  causeOfDeath: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  status: "IN_FACILITY" | "RELEASED" | "PROCESSED";
  chamberUnitName: string;
  chamberId?: string;
  chamber?: Chamber;
  nextOfKin?: NextOfKin[];
  personalBelongings?: string;
  identificationMarks?: string;
}

// next of kin type
export interface NextOfKin {
  id: string;
  firstName: string;
  lastName: string;
  relationship: string;
  phoneNumber: string;
  email: string;
  address: string;
  deceasedId: string;
}

// service type
export interface Service {
  id: string;
  name: string;
  description: string;
  type: "CARE" | "RITUAL" | "LOGISTICS" | "OTHER";
  cost: number;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  completedAt: string | null;
  deceasedId: string;
  deceased: {
    id: string;
    firstName: string;
    lastName: string;
    status: string;
  };
}

// reactnode type
export type PropsWithChildren = {
  children: ReactNode;
};

// login types
export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
export type LoginFormData = z.infer<typeof loginSchema>;

// register types
export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.string().min(1, "Role is required"),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
});
export type RegisterFormData = z.infer<typeof registerSchema>;
