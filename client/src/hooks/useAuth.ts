import { useState, useEffect, useCallback } from "react";
import { apiRequest } from "@/lib/queryClient";

export interface AuthUser {
  id: number;
  email: string;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // トークンからユーザー情報を復元（簡易）
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    // JWTのペイロードをデコード
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUser({ id: payload.id, email: payload.email });
    } catch {
      setUser(null);
      localStorage.removeItem("authToken");
    }
    setLoading(false);
  }, []);

  // サインアップ
  const signup = useCallback(async (email: string, password: string) => {
    const res = await apiRequest("POST", "/api/signup", { email, password });
    const data = await res.json();
    localStorage.setItem("authToken", data.token);
    setUser(data.user);
  }, []);

  // ログイン
  const login = useCallback(async (email: string, password: string) => {
    const res = await apiRequest("POST", "/api/login", { email, password });
    const data = await res.json();
    localStorage.setItem("authToken", data.token);
    setUser(data.user);
  }, []);

  // ログアウト
  const logout = useCallback(() => {
    localStorage.removeItem("authToken");
    setUser(null);
  }, []);

  return { user, loading, signup, login, logout };
} 