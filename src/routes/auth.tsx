import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({ meta: [{ title: "数独 — Sign in" }] }),
});

function AuthPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  if (user) {
    return (
      <div className="container mx-auto py-20 text-center">
        <p>Already signed in.</p>
        <Link to="/profile" className="text-vermillion underline">Go to profile</Link>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin, data: { username } },
        });
        if (error) throw error;
        if (data.session) {
          toast.success("Welcome!");
          navigate({ to: "/profile" });
        } else {
          setPendingEmail(email);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Signed in");
        navigate({ to: "/profile" });
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (pendingEmail) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-md">
        <Card className="p-8 bg-paper text-center">
          <h1 className="font-display text-3xl text-vermillion">確認</h1>
          <p className="text-sm text-muted-foreground mt-1">Confirm your email</p>
          <p className="mt-6 text-sm">
            We sent a confirmation link to <span className="font-medium">{pendingEmail}</span>.
            Click it to activate your account, then come back and sign in.
          </p>
          <Button
            type="button"
            onClick={() => {
              setPendingEmail(null);
              setMode("signin");
              setPassword("");
            }}
            className="mt-6 w-full bg-vermillion hover:bg-vermillion/90"
          >
            Back to sign in
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-md">
      <Card className="p-8 bg-paper">
        <h1 className="font-display text-3xl text-vermillion text-center">
          {mode === "signin" ? "お帰り" : "ようこそ"}
        </h1>
        <p className="text-center text-sm text-muted-foreground mt-1">
          {mode === "signin" ? "Welcome back" : "Welcome"}
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          {mode === "signup" && (
            <div>
              <Label>Username</Label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>
          )}
          <div>
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <Label>Password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-vermillion hover:bg-vermillion/90">
            {loading ? "..." : mode === "signin" ? "Sign in" : "Sign up"}
          </Button>
        </form>
        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-4 w-full cursor-pointer text-sm text-muted-foreground hover:text-vermillion"
        >
          {mode === "signin" ? "No account? Sign up" : "Have an account? Sign in"}
        </button>
      </Card>
    </div>
  );
}
