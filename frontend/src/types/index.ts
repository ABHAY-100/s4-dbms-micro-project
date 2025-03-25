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
  updateUser: (user: User) => void;
  login: (
    email: string,
    password: string,
    skipPasswordCheck?: boolean
  ) => Promise<void>;
  register: (userData: RegisterUserData) => Promise<void>;
  logout: () => Promise<void>;
}

export interface Chamber {
  id: string;
  name: string;
  capacity: number;
  currentOccupancy: number;
  status: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE" | "OUT_OF_ORDER";
  deceased: DeceasedRecord[];
}

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
