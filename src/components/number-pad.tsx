import { useGame } from "@/store/game";
import { Button } from "@/components/ui/button";
import { Eraser, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

export function NumberPad() {
  const { setValue, noteMode, toggleNoteMode } = useGame();
  return (
    <div className="flex flex-col gap-2 items-center">
      <div className="grid grid-cols-9 gap-1">
        {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            onClick={() => setValue(n)}
            className="w-10 h-12 sm:w-12 sm:h-14 rounded-sm border border-ink/30 bg-paper hover:bg-gold/15 font-display text-xl text-ink transition"
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setValue(0)}
          className="gap-1"
        >
          <Eraser className="size-4" /> Erase
        </Button>
        <Button
          variant={noteMode ? "default" : "outline"}
          size="sm"
          onClick={toggleNoteMode}
          className={cn("gap-1", noteMode && "bg-vermillion hover:bg-vermillion/90")}
        >
          <Pencil className="size-4" /> Notes {noteMode ? "on" : "off"}
        </Button>
      </div>
    </div>
  );
}
