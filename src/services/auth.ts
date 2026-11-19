export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  /** Bare 10-digit Indian mobile; the API re-validates and normalises it. */
  mobile: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  /**
   * How many guest orders the register route attached to the new account by
   * matching the signup email. Lets the signup page route someone with
   * existing orders straight to /my-orders. Absent on login.
   */
  attachedOrders?: number;
  /**
   * Where the API says this account must sign in instead. Set when an ADMIN
   * account tries the customer login: /api/auth/login refuses it with 403 and
   * `redirect: "/admin/login"`. The UI shows a link; it does not auto-redirect.
   */
  redirectTo?: string;
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
        // Only a same-site path is passed on; the link is built from it.
        redirectTo:
          typeof data.redirect === 'string' && data.redirect.startsWith('/') && !data.redirect.startsWith('//')
            ? data.redirect
            : undefined,
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
  } catch {
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
        phone: payload.mobile,
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
      attachedOrders: typeof data.attachedOrders === 'number' ? data.attachedOrders : 0,
      data: {
        token: data.token,
        user: {
          id: data.user.id,
          email: data.user.email,
          fullName: data.user.name,
        },
      },
    };
  } catch {
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
  } catch {
    // Silently fail
  }
};

/**
 * Get stored auth token
 */
export const getAuthToken = (): string | null => {
  try {
    return localStorage.getItem('authToken');
  } catch {
    return null;
  }
};

/**
 * Store auth token
 */
export const setAuthToken = (token: string): void => {
  try {
    localStorage.setItem('authToken', token);
  } catch {
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
