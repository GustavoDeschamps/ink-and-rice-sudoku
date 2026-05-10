import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { rankFor } from "@/lib/sudoku";

export const Route = createFileRoute("/leaderboard")({
  component: Leaderboard,
  head: () => ({ meta: [{ title: "数独 — Leaderboard" }] }),
});

interface Row {
  user_id: string;
  username: string | null;
  total_points: number;
}

function Leaderboard() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: games } = await supabase
        .from("completed_games")
        .select("user_id, points");
      const totals = new Map<string, number>();
      (games ?? []).forEach((g: { user_id: string; points: number }) => {
        totals.set(g.user_id, (totals.get(g.user_id) ?? 0) + (g.points ?? 0));
      });
      const ids = Array.from(totals.keys());
      const { data: profiles } = ids.length
        ? await supabase.from("profiles").select("id, username").in("id", ids)
        : { data: [] as { id: string; username: string | null }[] };
      const map = new Map((profiles ?? []).map((p) => [p.id, p.username]));
      const list = ids
        .map((id) => ({ user_id: id, username: map.get(id) ?? null, total_points: totals.get(id) ?? 0 }))
        .sort((a, b) => b.total_points - a.total_points)
        .slice(0, 50);
      setRows(list);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="font-display text-3xl text-center text-vermillion">番付</h1>
      <p className="text-center text-muted-foreground text-sm mb-6">Banzuke — the rankings</p>
      {loading ? (
        <p className="text-center text-muted-foreground">…</p>
      ) : rows.length === 0 ? (
        <p className="text-center text-muted-foreground">No players yet.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((r, i) => {
            const rank = rankFor(r.total_points);
            return (
              <Card key={r.user_id} className="px-4 py-3 flex items-center gap-4 bg-paper">
                <div className="font-display text-2xl text-gold w-10 text-center">{i + 1}</div>
                <div className="flex-1">
                  <div className="font-medium">{r.username ?? "anonymous"}</div>
                  <div className="text-xs text-muted-foreground">
                    {rank.jp} · {rank.romaji}
                  </div>
                </div>
                <div className="font-mono text-vermillion">{r.total_points}</div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
