import { Route, Switch } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import Collections from "@/pages/collections";
import Settings from "@/pages/settings";
import LoginPage from "@/pages/login";
import NotFound from "@/pages/not-found";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import RequireAuth from "@/components/ui/RequireAuth";

export default function App() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <div>
          {/* 共通ヘッダー */}
          <header className="w-full bg-white border-b border-border py-2 px-4 flex justify-end items-center">
            {user ? (
              <>
                <span className="mr-4 text-sm text-muted-foreground">{user.email}</span>
                <Button size="sm" variant="outline" onClick={handleLogout}>ログアウト</Button>
              </>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setLocation("/login")}>ログイン</Button>
            )}
          </header>
          <main>
            <Switch>
              <Route path="/" component={() => <RequireAuth><Home /></RequireAuth>} />
              <Route path="/dashboard" component={() => <RequireAuth><Dashboard /></RequireAuth>} />
              <Route path="/collections" component={() => <RequireAuth><Collections /></RequireAuth>} />
              <Route path="/settings" component={() => <RequireAuth><Settings /></RequireAuth>} />
              <Route path="/login" component={LoginPage} />
              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
