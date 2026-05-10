import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  type Board,
  type Difficulty,
  emptyBoard,
  findConflicts,
  generatePuzzle,
  isComplete,
} from "@/lib/sudoku";

interface GameState {
  difficulty: Difficulty;
  puzzle: Board;
  solution: Board;
  current: Board;
  notes: number[][][]; // 9x9 list of pencil marks
  selected: { r: number; c: number } | null;
  startedAt: number | null;
  elapsed: number;
  mistakes: number;
  noteMode: boolean;
  status: "idle" | "playing" | "won";
  newGame: (d: Difficulty) => void;
  select: (r: number, c: number) => void;
  setValue: (n: number) => void;
  toggleNoteMode: () => void;
  tick: () => void;
  reset: () => void;
  getConflicts: () => boolean[][];
}

const emptyNotes = () =>
  Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => [] as number[]));

export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
      difficulty: "easy",
      puzzle: emptyBoard(),
      solution: emptyBoard(),
      current: emptyBoard(),
      notes: emptyNotes(),
      selected: null,
      startedAt: null,
      elapsed: 0,
      mistakes: 0,
      noteMode: false,
      status: "idle",
      newGame: (d) => {
        const { puzzle, solution } = generatePuzzle(d);
        set({
          difficulty: d,
          puzzle,
          solution,
          current: puzzle.map((r) => r.slice()),
          notes: emptyNotes(),
          selected: null,
          startedAt: Date.now(),
          elapsed: 0,
          mistakes: 0,
          status: "playing",
        });
      },
      select: (r, c) => set({ selected: { r, c } }),
      toggleNoteMode: () => set({ noteMode: !get().noteMode }),
      setValue: (n) => {
        const { selected, current, puzzle, notes, noteMode, solution, mistakes } = get();
        if (!selected) return;
        const { r, c } = selected;
        if (puzzle[r][c] !== 0) return;
        if (noteMode && n !== 0) {
          const cellNotes = notes[r][c];
          const idx = cellNotes.indexOf(n);
          const newNotes = idx >= 0 ? cellNotes.filter((x) => x !== n) : [...cellNotes, n];
          const nn = notes.map((row) => row.map((cell) => cell.slice()));
          nn[r][c] = newNotes;
          set({ notes: nn });
          return;
        }
        const nb = current.map((row) => row.slice());
        nb[r][c] = n;
        const nn = notes.map((row) => row.map((cell) => cell.slice()));
        nn[r][c] = [];
        let m = mistakes;
        if (n !== 0 && solution[r][c] !== n) m++;
        const won = isComplete(nb);
        set({
          current: nb,
          notes: nn,
          mistakes: m,
          status: won ? "won" : "playing",
        });
      },
      tick: () => {
        const { startedAt, status } = get();
        if (status !== "playing" || !startedAt) return;
        set({ elapsed: Math.floor((Date.now() - startedAt) / 1000) });
      },
      reset: () =>
        set({
          puzzle: emptyBoard(),
          solution: emptyBoard(),
          current: emptyBoard(),
          notes: emptyNotes(),
          selected: null,
          startedAt: null,
          elapsed: 0,
          mistakes: 0,
          status: "idle",
        }),
      getConflicts: () => findConflicts(get().current),
    }),
    { name: "sudoku-game" },
  ),
);
