import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useGame } from "@/store/game";
import { SudokuBoard } from "@/components/sudoku-board";
import { NumberPad } from "@/components/number-pad";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { scoreFor } from "@/lib/sudoku";
import { toast } from "sonner";

const TIMER_PREF_KEY = "sudoku.showTimer";

export const Route = createFileRoute("/game")({
  component: GamePage,
  head: () => ({
    meta: [{ title: "数独 — Play" }, { name: "description", content: "Play sudoku." }],
  }),
});

function fmt(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const ss = (s % 60).toString().padStart(2, "0");
  return `${m}:${ss}`;
}

function GamePage() {
  const {
    status,
    elapsed,
    mistakes,
    failedSubmits,
    hintsUsed,
    difficulty,
    tick,
    newGame,
    submit,
    requestHint,
  } = useGame();
  const { user } = useAuth();
  const submitted = useRef(false);
  const [showTimer, setShowTimer] = useState(true);

  const onSubmit = () => {
    const result = submit();
    if (result === "incomplete") {
      toast("Fill in all cells first.");
    } else if (result === "wrong") {
      toast.error("Something is wrong.");
    }
  };

  const onHint = () => {
    if (hintsUsed >= 3) return;
    const ok = requestHint();
    if (!ok) toast("Nothing wrong on the board.");
  };

  useEffect(() => {
    const stored = localStorage.getItem(TIMER_PREF_KEY);
    if (stored !== null) setShowTimer(stored === "true");
  }, []);

  const toggleTimer = () => {
    setShowTimer((prev) => {
      const next = !prev;
      localStorage.setItem(TIMER_PREF_KEY, String(next));
      return next;
    });
  };

  useEffect(() => {
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [tick]);

  useEffect(() => {
    if (status === "won" && !submitted.current) {
      submitted.current = true;
      const points = scoreFor(difficulty, elapsed, mistakes);
      const desc =
        failedSubmits > 0
          ? `${fmt(elapsed)} · ${mistakes} mistakes · ${failedSubmits} failed submit${failedSubmits === 1 ? "" : "s"}`
          : `${fmt(elapsed)} · ${mistakes} mistakes`;
      toast.success(`完成 — ${points} points`, { description: desc });
      if (user) {
        supabase
          .from("completed_games")
          .insert({
            user_id: user.id,
            difficulty,
            seconds: elapsed,
            mistakes,
            failed_submits: failedSubmits,
            points,
          })
          .then(({ error }) => {
            if (error) console.error("save failed", error);
          });
      }
    }
    if (status === "playing") submitted.current = false;
  }, [status, elapsed, mistakes, failedSubmits, difficulty, user]);

  if (status === "idle") {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">No game in progress.</p>
        <Link to="/" className="mt-4 inline-block">
          <Button>Start a game</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8 items-start justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-6 text-sm items-center">
            <div><span className="text-muted-foreground">Level</span> <span className="font-display text-vermillion ml-1">{difficulty}</span></div>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Time</span>
              <span className="font-mono">{showTimer ? fmt(elapsed) : "—:—"}</span>
              <button
                type="button"
                onClick={toggleTimer}
                aria-label={showTimer ? "Hide timer" : "Show timer"}
                title={showTimer ? "Hide timer" : "Show timer"}
                className="cursor-pointer text-muted-foreground hover:text-vermillion transition-colors"
              >
                {showTimer ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
              </button>
            </div>
            {(difficulty === "easy" || status === "won") && (
              <div><span className="text-muted-foreground">Mistakes</span> <span className="ml-1 font-mono">{mistakes}</span></div>
            )}
          </div>
          <SudokuBoard />
          <NumberPad />
        </div>
        <Card className="p-6 bg-paper min-w-[200px]">
          <h2 className="font-display text-xl text-ink mb-3">Controls</h2>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>1–9 to enter a number</li>
            <li>0 / Del to erase</li>
            <li>Arrow keys to move</li>
          </ul>
          <div className="mt-6 flex flex-col gap-2">
            {status === "playing" && (
              <Button
                size="sm"
                onClick={onSubmit}
                className="bg-vermillion hover:bg-vermillion/90"
              >
                Submit
              </Button>
            )}
            {status === "playing" && difficulty === "medium" && (
              <Button
                variant="outline"
                size="sm"
                onClick={onHint}
                disabled={hintsUsed >= 3}
              >
                Hint ({hintsUsed} / 3)
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => newGame(difficulty)}>New {difficulty}</Button>
            <Link to="/"><Button variant="ghost" size="sm" className="w-full">Change level</Button></Link>
          </div>
          {status === "won" && (
            <div className="mt-6 text-center">
              <div className="font-display text-2xl text-vermillion">完成</div>
              <div className="text-xs text-muted-foreground mt-1">Complete!</div>
              <div className="mt-3 text-sm">
                <span className="text-muted-foreground">Mistakes</span>{" "}
                <span className="font-mono">{mistakes}</span>
                {failedSubmits > 0 && (
                  <>
                    {" · "}
                    <span className="text-muted-foreground">Failed submits</span>{" "}
                    <span className="font-mono">{failedSubmits}</span>
                  </>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
