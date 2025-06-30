import { useEffect } from "react";
import { useLocation } from "wouter";
import AuthForm from "@/components/ui/AuthForm";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user) setLocation("/");
  }, [user, setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted">
      <AuthForm onSuccess={() => setLocation("/")} />
    </div>
  );
} 