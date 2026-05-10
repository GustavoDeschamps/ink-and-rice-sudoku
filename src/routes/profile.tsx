import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { rankFor } from "@/lib/sudoku";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
  head: () => ({ meta: [{ title: "数独 — Profile" }] }),
});

interface CompletedGame {
  id: string;
  difficulty: string;
  seconds: number;
  mistakes: number;
  failed_submits: number;
  points: number;
  created_at: string;
}

interface Profile {
  id: string;
  username: string | null;
}

function ProfilePage() {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [games, setGames] = useState<CompletedGame[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => {
      setProfile(data as Profile | null);
    });
    supabase
      .from("completed_games")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => setGames((data as CompletedGame[]) ?? []));
  }, [user]);

  if (loading) return <div className="container py-20 text-center">…</div>;
  if (!user)
    return (
      <div className="container mx-auto py-20 text-center">
        <p>Sign in to view your profile.</p>
        <Link to="/auth" className="text-vermillion underline">Sign in</Link>
      </div>
    );

  const totalPoints = games.reduce((s, g) => s + (g.points ?? 0), 0);
  const rank = rankFor(totalPoints);

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Card className="p-8 bg-paper text-center">
        <div className="font-display text-5xl text-vermillion">{rank.jp}</div>
        <div className="mt-1 text-muted-foreground">{rank.romaji}</div>
        <div className="mt-4 text-2xl font-display">{profile?.username ?? user.email}</div>
        <div className="mt-2 text-sm text-muted-foreground">
          {totalPoints} points · {games.length} games
        </div>
      </Card>

      <h2 className="font-display text-xl mt-8 mb-3">Recent games</h2>
      <div className="space-y-2">
        {games.length === 0 && <p className="text-sm text-muted-foreground">No completed games yet.</p>}
        {games.map((g) => (
          <Card key={g.id} className="px-4 py-3 flex justify-between items-center bg-paper">
            <div>
              <div className="font-display text-vermillion capitalize">{g.difficulty}</div>
              <div className="text-xs text-muted-foreground">
                {Math.floor(g.seconds / 60)}m {g.seconds % 60}s · {g.mistakes} mistakes
                {g.failed_submits > 0 && ` · ${g.failed_submits} failed submit${g.failed_submits === 1 ? "" : "s"}`}
              </div>
            </div>
            <div className="font-mono text-gold">+{g.points}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}
