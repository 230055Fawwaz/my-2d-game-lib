// ==========================================
// Nama File:          AStar.ts
// Deskripsi File:     Implementasi algoritma pencarian rute terpendek A* (A-Star) 2D
// Penulis File:       Fawwaz Yaqzhan & Google Antigravity
// Tanggal Pembuatan:  19-09-2026
// Tanggal Pembaruan:  19-09-2026
// Catatan:
//   - Menggunakan Min-Heap Binary Priority Queue untuk performa O(E log V)
//   - Mendukung 4-arah dan 8-arah (dengan opsi pencegahan corner cutting)
//   - Beragam heuristik: Manhattan, Euclidean, Chebyshev, Octile
// ==========================================


import { GridCoord, AStarOptions, PathResult, HeuristicType } from "./types.js";
import { Grid2D } from "./Grid2D.js";


interface Node {
    col: number;
    row: number;
    g: number;
    h: number;
    f: number;
    parent?: Node;
}


/**
 * Antrian prioritas Min-Heap biner internal untuk performa optimal A*.
 */
class MinHeap {
    private heap: Node[] = [];

    public get size(): number {
        return this.heap.length;
    }

    public push(node: Node): void {
        this.heap.push(node);
        this.bubbleUp(this.heap.length - 1);
    }

    public pop(): Node | undefined {
        if (this.heap.length === 0) return undefined;
        const top = this.heap[0];
        const bottom = this.heap.pop()!;
        if (this.heap.length > 0) {
            this.heap[0] = bottom;
            this.sinkDown(0);
        }
        return top;
    }

    private bubbleUp(idx: number): void {
        const element = this.heap[idx];
        while (idx > 0) {
            const parentIdx = (idx - 1) >> 1;
            const parent = this.heap[parentIdx];
            if (element.f >= parent.f) break;
            this.heap[idx] = parent;
            idx = parentIdx;
        }
        this.heap[idx] = element;
    }

    private sinkDown(idx: number): void {
        const length = this.heap.length;
        const element = this.heap[idx];

        while (true) {
            const leftChildIdx = (idx << 1) + 1;
            const rightChildIdx = leftChildIdx + 1;
            let swapIdx: number | null = null;

            if (leftChildIdx < length) {
                if (this.heap[leftChildIdx].f < element.f) {
                    swapIdx = leftChildIdx;
                }
            }

            if (rightChildIdx < length) {
                const compareTarget = swapIdx === null ? element : this.heap[leftChildIdx];
                if (this.heap[rightChildIdx].f < compareTarget.f) {
                    swapIdx = rightChildIdx;
                }
            }

            if (swapIdx === null) break;
            this.heap[idx] = this.heap[swapIdx];
            idx = swapIdx;
        }
        this.heap[idx] = element;
    }
}


/**
 * Menghitung estimasi jarak heuristik antara dua koordinat petak
 */
export function calculateHeuristic(
    a: GridCoord,
    b: GridCoord,
    type: HeuristicType
): number {
    const dx = Math.abs(a.col - b.col);
    const dy = Math.abs(a.row - b.row);

    switch (type) {
        case "manhattan":
            return dx + dy;
        case "euclidean":
            return Math.sqrt(dx * dx + dy * dy);
        case "chebyshev":
            return Math.max(dx, dy);
        case "octile":
            // (√2 - 1) * min(dx, dy) + max(dx, dy)
            return 0.41421356237 * Math.min(dx, dy) + Math.max(dx, dy);
        default:
            return dx + dy;
    }
}


/**
 * Mencari rute jalan terpendek menggunakan algoritma A* pada grid.
 * 
 * @param grid Instance Grid2D penentu batas dunia petak
 * @param start Koordinat petak awal
 * @param target Koordinat petak tujuan
 * @param options Opsi pathfinding (diagonal, heuristik, cost, walkable)
 */
export function findPath<T>(
    grid: Grid2D<T>,
    start: GridCoord,
    target: GridCoord,
    options?: AStarOptions
): PathResult {
    // Validasi titik awal dan target
    if (!grid.inBounds(start.col, start.row) || !grid.inBounds(target.col, target.row)) {
        return { found: false, path: [], cost: 0 };
    }

    const allowDiagonal = options?.allowDiagonal ?? false;
    const preventCornerCutting = options?.preventCornerCutting ?? true;
    const heuristicType: HeuristicType = options?.heuristic ?? (allowDiagonal ? "octile" : "manhattan");
    const isWalkable = options?.isWalkable ?? (() => true);
    const getCost = options?.getCost ?? (() => 1);

    // Jika target tidak bisa dilalui atau start sama dengan target
    if (!isWalkable(target)) {
        return { found: false, path: [], cost: 0 };
    }
    if (start.col === target.col && start.row === target.row) {
        return { found: true, path: [{ col: start.col, row: start.row }], cost: 0 };
    }

    const openSet = new MinHeap();
    const closedSet = new Uint8Array(grid.totalCells);
    const gScore = new Float64Array(grid.totalCells);
    gScore.fill(Infinity);

    const startIndex = grid.toIndex(start.col, start.row);
    gScore[startIndex] = 0;

    const startNode: Node = {
        col: start.col,
        row: start.row,
        g: 0,
        h: calculateHeuristic(start, target, heuristicType),
        f: calculateHeuristic(start, target, heuristicType)
    };
    openSet.push(startNode);

    // Offset arah tetangga
    const orthogonalDirs = [
        { dc: 0, dr: -1, cost: 1 },
        { dc: 1, dr: 0, cost: 1 },
        { dc: 0, dr: 1, cost: 1 },
        { dc: -1, dr: 0, cost: 1 }
    ];

    const diagonalDirs = [
        { dc: -1, dr: -1, cost: 1.41421356237 },
        { dc: 1, dr: -1, cost: 1.41421356237 },
        { dc: 1, dr: 1, cost: 1.41421356237 },
        { dc: -1, dr: 1, cost: 1.41421356237 }
    ];

    while (openSet.size > 0) {
        const current = openSet.pop()!;
        const currentIdx = grid.toIndex(current.col, current.row);

        // Jika sudah mencapai target
        if (current.col === target.col && current.row === target.row) {
            const path: GridCoord[] = [];
            let curr: Node | undefined = current;
            while (curr) {
                path.push({ col: curr.col, row: curr.row });
                curr = curr.parent;
            }
            path.reverse();
            return {
                found: true,
                path,
                cost: current.g
            };
        }

        if (closedSet[currentIdx] === 1) {
            continue;
        }
        closedSet[currentIdx] = 1;

        // Jelajahi tetangga ortogonal
        for (let i = 0; i < orthogonalDirs.length; i++) {
            const dir = orthogonalDirs[i];
            const nextCol = current.col + dir.dc;
            const nextRow = current.row + dir.dr;

            if (!grid.inBounds(nextCol, nextRow)) continue;
            const nextCoord = { col: nextCol, row: nextRow };
            if (!isWalkable(nextCoord)) continue;

            const nextIdx = grid.toIndex(nextCol, nextRow);
            if (closedSet[nextIdx] === 1) continue;

            const stepCost = dir.cost * getCost({ col: current.col, row: current.row }, nextCoord);
            const tentativeG = current.g + stepCost;

            if (tentativeG < gScore[nextIdx]) {
                gScore[nextIdx] = tentativeG;
                const h = calculateHeuristic(nextCoord, target, heuristicType);
                const neighborNode: Node = {
                    col: nextCol,
                    row: nextRow,
                    g: tentativeG,
                    h,
                    f: tentativeG + h,
                    parent: current
                };
                openSet.push(neighborNode);
            }
        }

        // Jelajahi tetangga diagonal jika diaktifkan
        if (allowDiagonal) {
            for (let i = 0; i < diagonalDirs.length; i++) {
                const dir = diagonalDirs[i];
                const nextCol = current.col + dir.dc;
                const nextRow = current.row + dir.dr;

                if (!grid.inBounds(nextCol, nextRow)) continue;
                const nextCoord = { col: nextCol, row: nextRow };
                if (!isWalkable(nextCoord)) continue;

                // Pencegahan corner cutting
                if (preventCornerCutting) {
                    const side1Walkable = isWalkable({ col: current.col + dir.dc, row: current.row });
                    const side2Walkable = isWalkable({ col: current.col, row: current.row + dir.dr });
                    if (!side1Walkable || !side2Walkable) {
                        continue;
                    }
                }

                const nextIdx = grid.toIndex(nextCol, nextRow);
                if (closedSet[nextIdx] === 1) continue;

                const stepCost = dir.cost * getCost({ col: current.col, row: current.row }, nextCoord);
                const tentativeG = current.g + stepCost;

                if (tentativeG < gScore[nextIdx]) {
                    gScore[nextIdx] = tentativeG;
                    const h = calculateHeuristic(nextCoord, target, heuristicType);
                    const neighborNode: Node = {
                        col: nextCol,
                        row: nextRow,
                        g: tentativeG,
                        h,
                        f: tentativeG + h,
                        parent: current
                    };
                    openSet.push(neighborNode);
                }
            }
        }
    }

    // Tidak ada rute yang dapat menghubungkan titik awal ke tujuan
    return { found: false, path: [], cost: 0 };
}
