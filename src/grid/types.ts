// ==========================================
// Nama File:          types.ts
// Deskripsi File:     Tipe data dan kontrak untuk sistem petak (grid/tilemap) 2D
// Penulis File:       Fawwaz Yaqzhan & Google Antigravity
// Tanggal Pembuatan:  19-09-2026
// Tanggal Pembaruan:  19-09-2026
// Catatan:
//   - Koordinat petak (GridCoord)
//   - Tipe arah tetangga petak dan heuristik pathfinding
//   - Kontrak hasil pencarian jalur (PathResult) dan opsi A*
// ==========================================


import { Vector2 } from "../core/Vector2.js";


/**
 * Representasi koordinat petak (kolom dan baris).
 */
export interface GridCoord {
    col: number;
    row: number;
}


/**
 * Mode pencarian tetangga petak pada grid 2D:
 * - `orthogonal`: 4 arah (atas, kanan, bawah, kiri)
 * - `diagonal`: 4 arah diagonal saja
 * - `all`: 8 arah penuh (ortogonal + diagonal)
 */
export type GridNeighborMode = "orthogonal" | "diagonal" | "all";


/**
 * Tipe rumus heuristik jarak untuk kalkulasi pathfinding A*:
 * - `manhattan`: Cocok untuk grid 4-arah (ortogonal)
 * - `euclidean`: Jarak garis lurus Euclidean
 * - `chebyshev`: Cocok untuk grid 8-arah di mana biaya gerak diagonal sama dengan ortogonal
 * - `octile`: Cocok untuk grid 8-arah standar (biaya diagonal = √2 ≈ 1.414)
 */
export type HeuristicType = "manhattan" | "euclidean" | "chebyshev" | "octile";


/**
 * Hasil dari pencarian jalur (pathfinding).
 */
export interface PathResult {
    /**
     * Menandakan apakah jalur berhasil ditemukan dari start ke target.
     */
    found: boolean;

    /**
     * Urutan koordinat petak dari titik awal hingga tujuan.
     */
    path: GridCoord[];

    /**
     * Total akumulasi biaya perjalanan rute.
     */
    cost: number;
}


/**
 * Opsi konfigurasi untuk algoritma pathfinding A*.
 */
export interface AStarOptions {
    /**
     * Mengizinkan pergerakan diagonal 8-arah (default: false).
     */
    allowDiagonal?: boolean;

    /**
     * Mencegah pemotongan sudut dinding diagonal jika salah satu sisi ortogonal terhalang (default: true).
     */
    preventCornerCutting?: boolean;

    /**
     * Jenis fungsi heuristik perkiraan jarak (default: 'manhattan' untuk 4-arah, 'octile' untuk 8-arah).
     */
    heuristic?: HeuristicType;

    /**
     * Fungsi opsional untuk menentukan apakah petak dapat dilalui.
     * Default: menganggap semua petak dalam batas grid dapat dilalui kecuali diberi rintangan.
     */
    isWalkable?: (coord: GridCoord) => boolean;

    /**
     * Fungsi opsional untuk menghitung bobot/biaya tambahan perpindahan antar petak (misal: jalan vs rawa).
     */
    getCost?: (from: GridCoord, to: GridCoord) => number;
}


/**
 * Hasil raycasting menembus grid (Line of Sight / peluru).
 */
export interface GridRaycastHit {
    hit: boolean;
    point: Vector2;
    normal: Vector2;
    cell: GridCoord;
    distance: number;
}
