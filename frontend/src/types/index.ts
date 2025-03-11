export interface JwtPayload {
  id: string;
  exp?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  status?: string;
}

export interface ApiError {
  response?: {
    data?: {
      error?: string;
    };
  };
  message: string;
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
  token: string | boolean | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  errorMessage: string | null;

  login: (
    email: string,
    password: string,
    skipPasswordCheck?: boolean
  ) => Promise<void>;
  register: (userData: RegisterUserData) => Promise<void>;
  logout: () => Promise<void>;
}
