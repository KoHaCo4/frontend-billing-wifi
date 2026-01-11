// lib/auth.js - Updated untuk camelCase backend

export const isAuthenticated = () => {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("access_token");
};

export const getToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
};

export const getRefreshToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("refresh_token");
};

export const getAdminInfo = () => {
  if (typeof window === "undefined") return null;
  try {
    const admin = localStorage.getItem("admin");
    return admin ? JSON.parse(admin) : null;
  } catch {
    return null;
  }
};

export const logout = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("admin");
  window.location.href = "/auth/login";
};

// Helper untuk test token
export const testToken = async () => {
  const token = getToken();
  if (!token) return { valid: false, message: "No token" };

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return { valid: true, data: data.data };
    } else {
      return { valid: false, message: "Token invalid" };
    }
  } catch (error) {
    return { valid: false, message: error.message };
  }
};
