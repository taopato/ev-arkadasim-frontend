// User entity model
export interface User {
  id: number;
  fullName: string;
  email: string;
  createdAt?: string;
  updatedAt?: string;
}

// Auth response model
export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
  expiresAt?: string;
}

// Login request model
export interface LoginRequest {
  email: string;
  password: string;
}

// Register request model
export interface RegisterRequest {
  email: string;
  code: string;
  fullName: string;
  password: string;
}

// Password reset request model
export interface PasswordResetRequest {
  email: string;
  code: string;
  newPassword: string;
}
