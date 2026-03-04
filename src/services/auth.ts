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
    // Mock API call - in production use real endpoint
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Mock validation
    if (!payload.fullName || !payload.email || !payload.password) {
      return {
        success: false,
        message: 'All fields are required',
      };
    }

    if (payload.password !== payload.confirmPassword) {
      return {
        success: false,
        message: 'Passwords do not match',
      };
    }

    if (payload.password.length < 6) {
      return {
        success: false,
        message: 'Password must be at least 6 characters',
      };
    }

    // Mock successful response
    const mockResponse: AuthResponse = {
      success: true,
      message: 'Account created successfully',
      data: {
        token: 'mock_jwt_token_' + Date.now(),
        user: {
          id: 'user_' + Date.now(),
          email: payload.email,
          fullName: payload.fullName,
        },
      },
    };

    return mockResponse;
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
