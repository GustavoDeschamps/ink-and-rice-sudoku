import { Link, Outlet } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

export function AppShell() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border/60 bg-paper/80 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="font-display text-2xl text-vermillion">数独</span>
            <span className="font-display text-base text-foreground/80">Sudoku</span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <Link to="/" className="px-3 py-1.5 hover:text-vermillion" activeProps={{ className: "px-3 py-1.5 text-vermillion font-medium" }}>
              Home
            </Link>
            <Link to="/leaderboard" className="px-3 py-1.5 hover:text-vermillion" activeProps={{ className: "px-3 py-1.5 text-vermillion font-medium" }}>
              Leaderboard
            </Link>
            {user ? (
              <>
                <Link to="/friends" className="px-3 py-1.5 hover:text-vermillion" activeProps={{ className: "px-3 py-1.5 text-vermillion font-medium" }}>
                  Friends
                </Link>
                <Link to="/history" className="px-3 py-1.5 hover:text-vermillion" activeProps={{ className: "px-3 py-1.5 text-vermillion font-medium" }}>
                  History
                </Link>
                <Link to="/profile" className="px-3 py-1.5 hover:text-vermillion" activeProps={{ className: "px-3 py-1.5 text-vermillion font-medium" }}>
                  Profile
                </Link>
                <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut()}>
                  Sign out
                </Button>
              </>
            ) : (
              <Link to="/auth" className="px-3 py-1.5 hover:text-vermillion">
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
        <span className="font-display">和</span> · Crafted with care
      </footer>
    </div>
  );
}
