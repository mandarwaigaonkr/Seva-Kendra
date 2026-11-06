import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
} from "react";
import { authAPI } from "../services/api";
import { runWithoutErrorToasts } from "../lib/api";

// Create Auth Context
const AuthContext = createContext();

// Auth action types
const AUTH_ACTIONS = {
  LOGIN_START: "LOGIN_START",
  LOGIN_SUCCESS: "LOGIN_SUCCESS",
  LOGIN_FAILURE: "LOGIN_FAILURE",
  LOGOUT: "LOGOUT",
  SET_USER: "SET_USER",
  CLEAR_ERROR: "CLEAR_ERROR",
  INIT_COMPLETE: "INIT_COMPLETE",
};

// Initial state
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true, // Start with loading true to check for existing auth
  error: null,
};

// Auth reducer
function authReducer(state, action) {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...initialState,
        isLoading: false,
      };
    case AUTH_ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload,
      };
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };
    case AUTH_ACTIONS.INIT_COMPLETE:
      return {
        ...state,
        isLoading: false,
      };
    default:
      return state;
  }
}

// Auth Provider Component
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing auth data on app start
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const user = localStorage.getItem("user");

    if (token && user) {
      try {
        const parsedUser = JSON.parse(user);
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: { user: parsedUser, token },
        });
      } catch (error) {
        console.error("Error parsing stored user data:", error);
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
        dispatch({ type: AUTH_ACTIONS.INIT_COMPLETE });
      }
    } else {
      dispatch({ type: AUTH_ACTIONS.INIT_COMPLETE });
    }
  }, []);

  // Role and permissions can change after sign-in (an admin edits them, or suspends the
  // account). Re-read them from the server when the app opens; a 401/403 signs out.
  useEffect(() => {
    if (!localStorage.getItem("authToken")) return;
    let cancelled = false;
    runWithoutErrorToasts(() => authAPI.verifyToken())
      .then((result) => {
        const fresh = result?.data?.user;
        if (cancelled || !fresh) return;
        localStorage.setItem("user", JSON.stringify(fresh));
        dispatch({ type: AUTH_ACTIONS.SET_USER, payload: fresh });
      })
      .catch((error) => {
        if (cancelled) return;
        if (error?.status === 401 || error?.status === 403) {
          localStorage.removeItem("authToken");
          localStorage.removeItem("user");
          dispatch({ type: AUTH_ACTIONS.LOGOUT });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Login function with real JWT token from backend
  const login = async (credentials) => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });

      // Make API call to backend
      const result = await authAPI.login(credentials);

      const { user, token } = result.data;

      // Store in localStorage
      localStorage.setItem("authToken", token);
      localStorage.setItem("user", JSON.stringify(user));

      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user, token },
      });

      return { success: true, user };
    } catch (error) {
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: error.message,
      });
      return { success: false, error: error.message };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear localStorage
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");

      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  // Clear error function
  const clearError = useCallback(() => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  }, []);

  // Update user function
  const updateUser = useCallback(
    (userData) => {
      const updatedUser = { ...state.user, ...userData };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      dispatch({ type: AUTH_ACTIONS.SET_USER, payload: updatedUser });
    },
    [state.user]
  );

  // Check if user has permission
  const hasPermission = useCallback(
    (module, action) => {
      if (!state.user) return false;
      if (state.user.role === "admin") return true;
      
      const permission = `${module}:${action}`;
      return state.user.permissions?.includes(permission) || false;
    },
    [state.user]
  );

  // Check if user has any of the provided permissions
  const hasAnyPermission = useCallback(
    (permissionPairs) => {
      if (!state.user) return false;
      if (state.user.role === "admin") return true;
      
      return permissionPairs.some(([module, action]) => 
        hasPermission(module, action)
      );
    },
    [state.user, hasPermission]
  );

  const value = {
    user: state.user,
    token: state.token,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    login,
    logout,
    clearError,
    updateUser,
    hasPermission,
    hasAnyPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// HOC for protected routes
export function withAuth(Component) {
  return function AuthenticatedComponent(props) {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
      return <div>Loading...</div>;
    }

    if (!isAuthenticated) {
      window.location.href = "/signin";
      return null;
    }

    return <Component {...props} />;
  };
}
