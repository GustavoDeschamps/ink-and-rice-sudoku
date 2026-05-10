import { useEffect, useMemo } from "react";
import { useGame } from "@/store/game";
import { cn } from "@/lib/utils";

export function SudokuBoard() {
  const { current, puzzle, notes, selected, select, getConflicts } = useGame();
  const conflicts = useMemo(() => getConflicts(), [current, getConflicts]);
  const selVal = selected ? current[selected.r][selected.c] : 0;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!selected) return;
      if (e.key >= "1" && e.key <= "9") useGame.getState().setValue(parseInt(e.key, 10));
      if (e.key === "Backspace" || e.key === "0" || e.key === "Delete")
        useGame.getState().setValue(0);
      const { r, c } = selected;
      if (e.key === "ArrowUp" && r > 0) select(r - 1, c);
      if (e.key === "ArrowDown" && r < 8) select(r + 1, c);
      if (e.key === "ArrowLeft" && c > 0) select(r, c - 1);
      if (e.key === "ArrowRight" && c < 8) select(r, c + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, select]);

  return (
    <div className="inline-block bg-paper p-2 shadow-[0_4px_24px_-8px_rgba(26,26,46,0.18)] rounded-sm border border-ink/20">
      <div className="grid grid-cols-9 gap-0">
        {current.map((row, r) =>
          row.map((val, c) => {
            const given = puzzle[r][c] !== 0;
            const isSel = selected?.r === r && selected?.c === c;
            const sameRowCol =
              selected && (selected.r === r || selected.c === c ||
                (Math.floor(selected.r / 3) === Math.floor(r / 3) &&
                  Math.floor(selected.c / 3) === Math.floor(c / 3)));
            const sameVal = val !== 0 && val === selVal && !isSel;
            const conflict = conflicts[r][c];
            return (
              <button
                key={`${r}-${c}`}
                onClick={() => select(r, c)}
                className={cn(
                  "relative w-10 h-10 sm:w-12 sm:h-12 text-lg sm:text-xl flex items-center justify-center transition-colors",
                  "border border-ink/15",
                  c % 3 === 0 && "border-l-ink/70 border-l-2",
                  r % 3 === 0 && "border-t-ink/70 border-t-2",
                  c === 8 && "border-r-ink/70 border-r-2",
                  r === 8 && "border-b-ink/70 border-b-2",
                  sameRowCol && "bg-gold/10",
                  sameVal && "bg-gold/25",
                  isSel && "bg-vermillion/20 ring-2 ring-vermillion ring-inset z-10",
                  given ? "font-semibold text-ink" : "text-vermillion",
                  conflict && "text-destructive bg-destructive/10",
                )}
              >
                {val !== 0 ? (
                  <span>{val}</span>
                ) : notes[r][c].length > 0 ? (
                  <div className="grid grid-cols-3 gap-0 text-[8px] leading-none text-muted-foreground">
                    {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => (
                      <span key={n} className="w-3 h-3 flex items-center justify-center">
                        {notes[r][c].includes(n) ? n : ""}
                      </span>
                    ))}
                  </div>
                ) : null}
              </button>
            );
          }),
        )}
      </div>
    </div>
  );
}
