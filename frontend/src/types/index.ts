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

export interface AuthState {
  user: User | null;
  token: any;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (
    email: string,
    password: string,
    skipPasswordCheck?: boolean
  ) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}
