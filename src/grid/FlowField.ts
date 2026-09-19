// ==========================================
// Nama File:          FlowField.ts
// Deskripsi File:     Algoritma Flow Field & Dijkstra Map untuk navigasi gerak massal
// Penulis File:       Fawwaz Yaqzhan & Google Antigravity
// Tanggal Pembuatan:  19-09-2026
// Tanggal Pembaruan:  19-09-2026
// Catatan:
//   - Menghasilkan medan vektor arah untuk seluruh petak menuju titik tujuan (target/base)
//   - Memungkinkan ribuan unit (tower defense / swarm / RTS) bergerak dengan query instan O(1)
//   - Menghindari bottleneck CPU dari algoritma A* individual
// ==========================================


import { Vector2 } from "../core/Vector2.js";
import { IVector2 } from "../core/types.js";
import { GridCoord } from "./types.js";


/**
 * Kelas FlowField 2D (Medan Vektor & Dijkstra Map).
 */
export class FlowField {
    public readonly width: number;
    public readonly height: number;

    // Peta jarak akumulatif dari target (Integration Field)
    private readonly integrationField: Float64Array;

    // Medan vektor arah gerak untuk setiap petak
    private readonly vectorField: Vector2[];

    /**
     * Konstruktor FlowField
     * @param width Jumlah kolom petak
     * @param height Jumlah baris petak
     */
    constructor(width: number, height: number) {
        if (width <= 0 || height <= 0) {
            throw new Error("Dimensi FlowField harus lebih besar dari 0");
        }
        this.width = Math.floor(width);
        this.height = Math.floor(height);
        const total = this.width * this.height;

        this.integrationField = new Float64Array(total);
        this.vectorField = new Array<Vector2>(total);
        for (let i = 0; i < total; i++) {
            this.vectorField[i] = new Vector2(0, 0);
        }
    }

    /**
     * Mengonversi (col, row) ke indeks 1D
     */
    private toIndex(col: number, row: number): number {
        return row * this.width + col;
    }

    /**
     * Memeriksa apakah (col, row) berada dalam batas grid
     */
    public inBounds(col: number, row: number): boolean {
        return col >= 0 && col < this.width && row >= 0 && row < this.height;
    }

    /**
     * Membuat integration field (Dijkstra wave) dan vektor arah aliran (Flow Field).
     * 
     * @param targets Titik tujuan tunggal atau kumpulan titik tujuan (misal: benteng/portal)
     * @param isWalkable Fungsi penentu apakah sel dapat dilalui (default: semua sel valid)
     * @param getCost Fungsi penentu bobot tambahan sel (misal: jalan lumpur / air lambat)
     */
    public generate(
        targets: GridCoord | GridCoord[],
        isWalkable?: (col: number, row: number) => boolean,
        getCost?: (col: number, row: number) => number
    ): void {
        const targetList = Array.isArray(targets) ? targets : [targets];
        const walkable = isWalkable ?? (() => true);
        const cellCost = getCost ?? (() => 1);

        // 1. Reset integration field ke nilai tak hingga
        this.integrationField.fill(Infinity);

        // 2. BFS Wavefront Expansion (Dijkstra Map)
        const queue: GridCoord[] = [];

        for (let i = 0; i < targetList.length; i++) {
            const t = targetList[i];
            if (this.inBounds(t.col, t.row) && walkable(t.col, t.row)) {
                const idx = this.toIndex(t.col, t.row);
                this.integrationField[idx] = 0;
                queue.push({ col: t.col, row: t.row });
            }
        }

        const neighborDirs = [
            { dc: 0, dr: -1, cost: 1 },
            { dc: 1, dr: 0, cost: 1 },
            { dc: 0, dr: 1, cost: 1 },
            { dc: -1, dr: 0, cost: 1 }
        ];

        let head = 0;
        while (head < queue.length) {
            const current = queue[head++];
            const currentCost = this.integrationField[this.toIndex(current.col, current.row)];

            for (let i = 0; i < neighborDirs.length; i++) {
                const dir = neighborDirs[i];
                const nc = current.col + dir.dc;
                const nr = current.row + dir.dr;

                if (!this.inBounds(nc, nr) || !walkable(nc, nr)) {
                    continue;
                }

                const nIdx = this.toIndex(nc, nr);
                const stepCost = dir.cost * cellCost(nc, nr);
                const newCost = currentCost + stepCost;

                if (newCost < this.integrationField[nIdx]) {
                    this.integrationField[nIdx] = newCost;
                    queue.push({ col: nc, row: nr });
                }
            }
        }

        // 3. Menghitung Vektor Aliran (Flow Field Vector) untuk setiap petak
        const allDirs = [
            { dc: 0, dr: -1 },
            { dc: 1, dr: -1 },
            { dc: 1, dr: 0 },
            { dc: 1, dr: 1 },
            { dc: 0, dr: 1 },
            { dc: -1, dr: 1 },
            { dc: -1, dr: 0 },
            { dc: -1, dr: -1 }
        ];

        for (let r = 0; r < this.height; r++) {
            for (let c = 0; c < this.width; c++) {
                const idx = this.toIndex(c, r);
                const myCost = this.integrationField[idx];

                // Jika tak terjangkau atau sudah di target
                if (myCost === Infinity || myCost === 0 || !walkable(c, r)) {
                    this.vectorField[idx].set(0, 0);
                    continue;
                }

                let bestCost = myCost;
                let bestDx = 0;
                let bestDy = 0;

                for (let i = 0; i < allDirs.length; i++) {
                    const dir = allDirs[i];
                    const nc = c + dir.dc;
                    const nr = r + dir.dr;

                    if (!this.inBounds(nc, nr) || !walkable(nc, nr)) {
                        continue;
                    }

                    // Jika diagonal, periksa apakah ada dinding yang dipotong
                    if (dir.dc !== 0 && dir.dr !== 0) {
                        if (!walkable(c + dir.dc, r) || !walkable(c, r + dir.dr)) {
                            continue;
                        }
                    }

                    const nCost = this.integrationField[this.toIndex(nc, nr)];
                    if (nCost < bestCost) {
                        bestCost = nCost;
                        bestDx = dir.dc;
                        bestDy = dir.dr;
                    }
                }

                const vec = this.vectorField[idx];
                vec.set(bestDx, bestDy);
                if (vec.lengthSquared() > 0) {
                    vec.normalizeMut();
                }
            }
        }
    }

    /**
     * Mengambil nilai biaya integrasi (jarak akumulatif) pada petak (col, row)
     */
    public getCost(col: number, row: number): number {
        if (!this.inBounds(col, row)) return Infinity;
        return this.integrationField[this.toIndex(col, row)];
    }

    /**
     * Mengambil vektor arah gerak ternormalisasi pada petak (col, row)
     */
    public getDirection(col: number, row: number): Vector2 {
        if (!this.inBounds(col, row)) return Vector2.zero();
        return this.vectorField[this.toIndex(col, row)];
    }

    /**
     * Mengambil vektor arah aliran langsung dari koordinat posisi dunia (piksel).
     * Sangat cepat O(1) untuk pembaruan posisi entitas dalam game loop.
     * 
     * @param worldPos Posisi entitas di dunia
     * @param cellSize Ukuran satu petak dalam piksel
     * @param origin Titik awal offset grid (default: (0, 0))
     * @param out Vektor penampung hasil opsional
     */
    public getVectorAtWorld(
        worldPos: IVector2,
        cellSize: number | IVector2,
        origin?: IVector2,
        out?: Vector2
    ): Vector2 {
        const cellW = typeof cellSize === "number" ? cellSize : cellSize.x;
        const cellH = typeof cellSize === "number" ? cellSize : cellSize.y;
        const ox = origin ? origin.x : 0;
        const oy = origin ? origin.y : 0;

        const col = Math.floor((worldPos.x - ox) / cellW);
        const row = Math.floor((worldPos.y - oy) / cellH);

        const res = out ?? new Vector2();
        if (!this.inBounds(col, row)) {
            return res.set(0, 0);
        }

        const dir = this.vectorField[this.toIndex(col, row)];
        return res.copy(dir);
    }
}
