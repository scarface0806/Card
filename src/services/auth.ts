import axios from 'axios';

// Mock API base URL (in production, this would be your actual API)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.tapvyo-nfc.com';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    token: string;
    user: {
      id: string;
      email: string;
      fullName?: string;
    };
  };
}

/**
 * Login user with email and password
 */
export const loginUser = async (payload: LoginPayload): Promise<AuthResponse> => {
  try {
    // Call real API endpoint
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.error || 'Login failed',
      };
    }

    return {
      success: true,
      message: data.message || 'Login successful',
      data: {
        token: data.token,
        user: {
          id: data.user.id,
          email: data.user.email,
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      message: 'An error occurred during login. Please try again.',
    };
  }
};

/**
 * Register new user
 */
export const registerUser = async (payload: RegisterPayload): Promise<AuthResponse> => {
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: payload.email,
        password: payload.password,
        name: payload.fullName,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.error || 'Registration failed',
      };
    }

    return {
      success: true,
      message: data.message || 'Account created successfully',
      data: {
        token: data.token,
        user: {
          id: data.user.id,
          email: data.user.email,
          fullName: data.user.name,
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      message: 'An error occurred during registration. Please try again.',
    };
  }
};

/**
 * Logout user (clear token from localStorage)
 */
export const logoutUser = (): void => {
  try {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  } catch (error) {
    // Silently fail
  }
};

/**
 * Get stored auth token
 */
export const getAuthToken = (): string | null => {
  try {
    return localStorage.getItem('authToken');
  } catch (error) {
    return null;
  }
};

/**
 * Store auth token
 */
export const setAuthToken = (token: string): void => {
  try {
    localStorage.setItem('authToken', token);
  } catch (error) {
    // Silently fail
  }
};

export default {
  loginUser,
  registerUser,
  logoutUser,
  getAuthToken,
  setAuthToken,
};
