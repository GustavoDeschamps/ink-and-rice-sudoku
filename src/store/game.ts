import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  type Board,
  type Difficulty,
  emptyBoard,
  findConflicts,
  generatePuzzle,
} from "@/lib/sudoku";

export type SubmitResult = "win" | "incomplete" | "wrong";

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
  failedSubmits: number;
  hintsUsed: number;
  hintedCells: { r: number; c: number }[];
  noteMode: boolean;
  status: "idle" | "playing" | "won";
  newGame: (d: Difficulty) => void;
  select: (r: number, c: number) => void;
  setValue: (n: number) => void;
  toggleNoteMode: () => void;
  tick: () => void;
  reset: () => void;
  submit: () => SubmitResult;
  requestHint: () => boolean;
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
      failedSubmits: 0,
      hintsUsed: 0,
      hintedCells: [],
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
          failedSubmits: 0,
          hintsUsed: 0,
          hintedCells: [],
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
        set({
          current: nb,
          notes: nn,
          mistakes: m,
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
          failedSubmits: 0,
          hintsUsed: 0,
          hintedCells: [],
          status: "idle",
        }),
      submit: () => {
        const { current, solution, failedSubmits } = get();
        for (let r = 0; r < 9; r++) {
          for (let c = 0; c < 9; c++) {
            if (current[r][c] === 0) return "incomplete";
          }
        }
        for (let r = 0; r < 9; r++) {
          for (let c = 0; c < 9; c++) {
            if (current[r][c] !== solution[r][c]) {
              set({ failedSubmits: failedSubmits + 1 });
              return "wrong";
            }
          }
        }
        set({ status: "won" });
        return "win";
      },
      requestHint: () => {
        const { current, solution, hintedCells, hintsUsed } = get();
        if (hintsUsed >= 3) return false;
        for (let r = 0; r < 9; r++) {
          for (let c = 0; c < 9; c++) {
            if (
              current[r][c] !== 0 &&
              current[r][c] !== solution[r][c] &&
              !hintedCells.some((h) => h.r === r && h.c === c)
            ) {
              set({
                hintedCells: [...hintedCells, { r, c }],
                hintsUsed: hintsUsed + 1,
              });
              return true;
            }
          }
        }
        return false;
      },
      getConflicts: () => findConflicts(get().current),
    }),
    { name: "sudoku-game" },
  ),
);
