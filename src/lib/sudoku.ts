// Sudoku generator + solver. Cells: 0 = empty, 1..9 filled.
export type Board = number[][]; // 9x9
export type Difficulty = "easy" | "medium" | "hard" | "expert";

const cloneBoard = (b: Board): Board => b.map((r) => r.slice());

export function emptyBoard(): Board {
  return Array.from({ length: 9 }, () => Array(9).fill(0));
}

export const isOnDiagonal = (r: number, c: number) => r === c || r + c === 8;

function isValid(b: Board, r: number, c: number, n: number, xMode = false): boolean {
  for (let i = 0; i < 9; i++) {
    if (b[r][i] === n || b[i][c] === n) return false;
  }
  const br = Math.floor(r / 3) * 3;
  const bc = Math.floor(c / 3) * 3;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (b[br + i][bc + j] === n) return false;
    }
  }
  if (xMode) {
    if (r === c) {
      for (let i = 0; i < 9; i++) {
        if (i !== r && b[i][i] === n) return false;
      }
    }
    if (r + c === 8) {
      for (let i = 0; i < 9; i++) {
        const j = 8 - i;
        if (i !== r && b[i][j] === n) return false;
      }
    }
  }
  return true;
}

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function fillBoard(b: Board, xMode = false): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (b[r][c] === 0) {
        const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        for (const n of nums) {
          if (isValid(b, r, c, n, xMode)) {
            b[r][c] = n;
            if (fillBoard(b, xMode)) return true;
            b[r][c] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

function countSolutions(b: Board, limit = 2, xMode = false): number {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (b[r][c] === 0) {
        let count = 0;
        for (let n = 1; n <= 9; n++) {
          if (isValid(b, r, c, n, xMode)) {
            b[r][c] = n;
            count += countSolutions(b, limit - count, xMode);
            b[r][c] = 0;
            if (count >= limit) return count;
          }
        }
        return count;
      }
    }
  }
  return 1;
}

const HOLES: Record<Difficulty, number> = {
  easy: 38,
  medium: 46,
  hard: 52,
  expert: 58,
};

export function generatePuzzle(difficulty: Difficulty): { puzzle: Board; solution: Board } {
  const xMode = difficulty === "expert";
  const solution = emptyBoard();
  fillBoard(solution, xMode);
  const puzzle = cloneBoard(solution);
  const cells = shuffle(
    Array.from({ length: 81 }, (_, i) => i),
  );
  let removed = 0;
  const target = HOLES[difficulty];
  for (const idx of cells) {
    if (removed >= target) break;
    const r = Math.floor(idx / 9);
    const c = idx % 9;
    const backup = puzzle[r][c];
    if (backup === 0) continue;
    puzzle[r][c] = 0;
    const test = cloneBoard(puzzle);
    if (countSolutions(test, 2, xMode) !== 1) {
      puzzle[r][c] = backup;
    } else {
      removed++;
    }
  }
  return { puzzle, solution };
}

export function isComplete(b: Board): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (b[r][c] === 0) return false;
      const n = b[r][c];
      b[r][c] = 0;
      if (!isValid(b, r, c, n)) {
        b[r][c] = n;
        return false;
      }
      b[r][c] = n;
    }
  }
  return true;
}

export function findConflicts(b: Board, xMode = false): boolean[][] {
  const conflicts: boolean[][] = Array.from({ length: 9 }, () => Array(9).fill(false));
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const n = b[r][c];
      if (n === 0) continue;
      b[r][c] = 0;
      if (!isValid(b, r, c, n, xMode)) conflicts[r][c] = true;
      b[r][c] = n;
    }
  }
  return conflicts;
}

export function scoreFor(difficulty: Difficulty, seconds: number, mistakes: number): number {
  const base: Record<Difficulty, number> = { easy: 30, medium: 60, hard: 100, expert: 160 };
  const timeBonus = Math.max(0, 600 - seconds) / 6;
  const penalty = mistakes * 10;
  return Math.max(5, Math.round(base[difficulty] + timeBonus - penalty));
}

export const RANKS = [
  { min: 0, jp: "初心者", romaji: "Shoshinsha" },
  { min: 100, jp: "見習い", romaji: "Minarai" },
  { min: 300, jp: "中級者", romaji: "Chukyusha" },
  { min: 700, jp: "上級者", romaji: "Jokyusha" },
  { min: 1500, jp: "達人", romaji: "Tatsujin" },
  { min: 3000, jp: "名人", romaji: "Meijin" },
];

export function rankFor(points: number) {
  let r = RANKS[0];
  for (const x of RANKS) if (points >= x.min) r = x;
  return r;
}
