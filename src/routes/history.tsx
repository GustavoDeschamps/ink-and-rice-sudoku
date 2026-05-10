import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { Difficulty } from "@/lib/sudoku";
import { useGame } from "@/store/game";

export const Route = createFileRoute("/history")({
  component: HistoryPage,
  head: () => ({ meta: [{ title: "数独 — History" }] }),
});

interface CompletedGame {
  id: string;
  difficulty: Difficulty;
  seconds: number;
  mistakes: number;
  failed_submits: number;
  points: number;
  created_at: string;
}

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard", "expert"];

function fmtDuration(s: number) {
  const m = Math.floor(s / 60);
  const ss = (s % 60).toString().padStart(2, "0");
  return `${m}m ${ss}s`;
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function HistoryPage() {
  const { user, loading } = useAuth();
  const lastDifficulty = useGame((s) => s.difficulty);
  const [active, setActive] = useState<Difficulty>(lastDifficulty ?? "easy");
  const [games, setGames] = useState<CompletedGame[]>([]);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (!user) return;
    setFetching(true);
    supabase
      .from("completed_games")
      .select("*")
      .eq("user_id", user.id)
      .eq("difficulty", active)
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setGames((data as CompletedGame[]) ?? []);
        setFetching(false);
      });
  }, [user, active]);

  if (loading) return <div className="container py-20 text-center">…</div>;
  if (!user)
    return (
      <div className="container mx-auto py-20 text-center">
        <p>Sign in to view your history.</p>
        <Link to="/auth" className="text-vermillion underline">Sign in</Link>
      </div>
    );

  const totalGames = games.length;
  const totalPoints = games.reduce((s, g) => s + g.points, 0);
  const bestSeconds = totalGames > 0 ? Math.min(...games.map((g) => g.seconds)) : 0;
  const avgSeconds =
    totalGames > 0 ? Math.round(games.reduce((s, g) => s + g.seconds, 0) / totalGames) : 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="text-center mb-6">
        <h1 className="font-display text-4xl text-vermillion">履歴</h1>
        <p className="text-sm text-muted-foreground mt-1">History</p>
      </div>

      <Tabs value={active} onValueChange={(v) => setActive(v as Difficulty)}>
        <TabsList className="grid w-full grid-cols-4">
          {DIFFICULTIES.map((d) => (
            <TabsTrigger key={d} value={d} className="capitalize">
              {d}
            </TabsTrigger>
          ))}
        </TabsList>

        {DIFFICULTIES.map((d) => (
          <TabsContent key={d} value={d}>
            {fetching && active === d ? (
              <p className="text-sm text-muted-foreground text-center py-8">…</p>
            ) : games.length === 0 ? (
              <Card className="p-8 bg-paper text-center">
                <p className="text-sm text-muted-foreground">
                  No {d} games yet — go play one.
                </p>
                <Link to="/" className="text-vermillion underline text-sm mt-2 inline-block">
                  Start a game
                </Link>
              </Card>
            ) : (
              <>
                <Card className="p-4 bg-paper grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-sm mb-3">
                  <div>
                    <div className="text-muted-foreground text-xs">Games</div>
                    <div className="font-mono">{totalGames}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">Best time</div>
                    <div className="font-mono">{fmtDuration(bestSeconds)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">Avg time</div>
                    <div className="font-mono">{fmtDuration(avgSeconds)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">Points</div>
                    <div className="font-mono text-gold">{totalPoints}</div>
                  </div>
                </Card>
                <div className="space-y-2">
                  {games.map((g) => (
                    <Card
                      key={g.id}
                      className="px-4 py-3 flex justify-between items-center bg-paper"
                    >
                      <div>
                        <div className="text-xs text-muted-foreground">
                          {fmtDate(g.created_at)}
                        </div>
                        <div className="text-sm mt-0.5">
                          <span className="font-mono">{fmtDuration(g.seconds)}</span>
                          <span className="text-muted-foreground"> · </span>
                          <span className="font-mono">{g.mistakes}</span>
                          <span className="text-muted-foreground"> wrong</span>
                          {g.failed_submits > 0 && (
                            <>
                              <span className="text-muted-foreground"> · </span>
                              <span className="font-mono">{g.failed_submits}</span>
                              <span className="text-muted-foreground">
                                {" "}
                                failed submit{g.failed_submits === 1 ? "" : "s"}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="font-mono text-gold">+{g.points}</div>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
