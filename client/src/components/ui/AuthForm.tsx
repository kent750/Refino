import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export default function AuthForm({ onSuccess }: { onSuccess?: () => void }) {
  const { signup, login } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await signup(email, password);
      }
      if (onSuccess) onSuccess();
    } catch (e: any) {
      setError(e.message || "認証に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-2 text-center">
        {mode === "login" ? "ログイン" : "新規登録"}
      </h2>
      <Input
        type="email"
        placeholder="メールアドレス"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        autoFocus
      />
      <Input
        type="password"
        placeholder="パスワード"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
        minLength={6}
      />
      {error && <div className="text-red-500 text-sm text-center">{error}</div>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "送信中..." : mode === "login" ? "ログイン" : "新規登録"}
      </Button>
      <div className="text-center text-sm mt-2">
        {mode === "login" ? (
          <>
            アカウント未作成ですか？
            <button type="button" className="text-blue-600 ml-1 underline" onClick={() => setMode("signup")}>新規登録</button>
          </>
        ) : (
          <>
            すでにアカウントをお持ちですか？
            <button type="button" className="text-blue-600 ml-1 underline" onClick={() => setMode("login")}>ログイン</button>
          </>
        )}
      </div>
    </form>
  );
} 