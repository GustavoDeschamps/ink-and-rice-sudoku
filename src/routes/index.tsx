import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGame } from "@/store/game";
import type { Difficulty } from "@/lib/sudoku";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "数独 Sudoku — Home" },
      { name: "description", content: "Pick a difficulty and play a mindful sudoku." },
    ],
  }),
});

const LEVELS: { d: Difficulty; jp: string; en: string }[] = [
  { d: "easy", jp: "易しい", en: "Easy" },
  { d: "medium", jp: "普通", en: "Medium" },
  { d: "hard", jp: "難しい", en: "Hard" },
  { d: "expert", jp: "達人", en: "Expert" },
];

function Home() {
  const newGame = useGame((s) => s.newGame);
  const status = useGame((s) => s.status);
  const navigate = useNavigate();

  const start = (d: Difficulty) => {
    newGame(d);
    navigate({ to: "/game" });
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <section className="text-center max-w-2xl mx-auto">
        <h1 className="font-display text-6xl text-ink">数独</h1>
        <p className="mt-2 text-muted-foreground italic">Sūdoku — the place of single numbers</p>
        <p className="mt-6 text-foreground/80">
          A quiet puzzle, drawn with ink on rice paper. Choose a level to begin.
        </p>
      </section>

      <section className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
        {LEVELS.map((l) => (
          <Card
            key={l.d}
            className="p-6 text-center cursor-pointer hover:border-vermillion transition group bg-paper"
            onClick={() => start(l.d)}
          >
            <div className="font-display text-3xl text-vermillion group-hover:scale-105 transition">{l.jp}</div>
            <div className="mt-2 text-sm uppercase tracking-widest text-muted-foreground">{l.en}</div>
          </Card>
        ))}
      </section>

      {status === "playing" && (
        <div className="mt-8 text-center">
          <Link to="/game">
            <Button variant="outline">Resume current game →</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
