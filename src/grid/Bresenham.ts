// ==========================================
// Nama File:          Bresenham.ts
// Deskripsi File:     Algoritma garis petak Bresenham dan Grid Raycasting (DDA)
// Penulis File:       Fawwaz Yaqzhan & Google Antigravity
// Tanggal Pembuatan:  19-09-2026
// Tanggal Pembaruan:  19-09-2026
// Catatan:
//   - bresenhamLine: Rasterisasi garis integer murni
//   - gridRaycast: Algoritma Fast Voxel Traversal (Amanatides-Woo) untuk Line-of-Sight & peluru
// ==========================================


import { Vector2 } from "../core/Vector2.js";
import { IVector2 } from "../core/types.js";
import { EPSILON } from "../core/MathUtils.js";
import { GridCoord, GridRaycastHit } from "./types.js";


/**
 * Menghasilkan urutan koordinat petak antara dua titik menggunakan algoritma garis Bresenham.
 * 
 * @param x0 Kolom titik awal
 * @param y0 Baris titik awal
 * @param x1 Kolom titik akhir
 * @param y1 Baris titik akhir
 * @param out Wadah penampung array opsional (GC-Friendly)
 */
export function bresenhamLine(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    out?: GridCoord[]
): GridCoord[] {
    const points = out ?? [];
    if (out) {
        points.length = 0;
    }

    let x = Math.floor(x0);
    let y = Math.floor(y0);
    const targetX = Math.floor(x1);
    const targetY = Math.floor(y1);

    const dx = Math.abs(targetX - x);
    const dy = -Math.abs(targetY - y);
    const sx = x < targetX ? 1 : -1;
    const sy = y < targetY ? 1 : -1;
    let err = dx + dy;

    while (true) {
        points.push({ col: x, row: y });

        if (x === targetX && y === targetY) {
            break;
        }

        const e2 = 2 * err;
        if (e2 >= dy) {
            err += dy;
            x += sx;
        }
        if (e2 <= dx) {
            err += dx;
            y += sy;
        }
    }

    return points;
}


/**
 * Menembakkan sinar melintasi petak grid (Fast Voxel Traversal / DDA)
 * untuk mendeteksi rintangan pertama yang tertabrak sinar secara kontinu.
 * Sangat presisi untuk Line of Sight (LoS) pandangan musuh dan senjata peluru hitscan.
 * 
 * @param origin Titik awal sinar di dunia
 * @param direction Arah sinar (akan dinormalisasi secara otomatis)
 * @param maxDistance Jarak maksimum jangkauan sinar
 * @param isBlocked Fungsi penguji apakah petak (col, row) merupakan rintangan
 * @param cellSize Ukuran satu petak (default: 32)
 * @param gridOrigin Titik offset grid di dunia (default: (0, 0))
 */
export function gridRaycast(
    origin: IVector2,
    direction: IVector2,
    maxDistance: number,
    isBlocked: (col: number, row: number) => boolean,
    cellSize: number | IVector2 = 32,
    gridOrigin?: IVector2
): GridRaycastHit | null {
    const cellW = typeof cellSize === "number" ? cellSize : cellSize.x;
    const cellH = typeof cellSize === "number" ? cellSize : cellSize.y;
    const ox = gridOrigin ? gridOrigin.x : 0;
    const oy = gridOrigin ? gridOrigin.y : 0;

    // Arah sinar
    const dir = new Vector2(direction.x, direction.y);
    const lenSq = dir.lengthSquared();
    if (lenSq < EPSILON) {
        return null;
    }
    dir.normalizeMut();

    // Posisi awal lokal terhadap grid
    const startX = origin.x - ox;
    const startY = origin.y - oy;

    let col = Math.floor(startX / cellW);
    let row = Math.floor(startY / cellH);

    // Cek jika titik awal sudah berada di petak terhalang
    if (isBlocked(col, row)) {
        return {
            hit: true,
            point: new Vector2(origin.x, origin.y),
            normal: dir.negate(),
            cell: { col, row },
            distance: 0
        };
    }

    const stepX = dir.x > 0 ? 1 : dir.x < 0 ? -1 : 0;
    const stepY = dir.y > 0 ? 1 : dir.y < 0 ? -1 : 0;

    const deltaDistX = stepX !== 0 ? Math.abs(cellW / dir.x) : Infinity;
    const deltaDistY = stepY !== 0 ? Math.abs(cellH / dir.y) : Infinity;

    // Jarak ke perbatasan sel berikutnya
    let sideDistX: number;
    if (stepX > 0) {
        sideDistX = ((col + 1) * cellW - startX) / dir.x;
    } else if (stepX < 0) {
        sideDistX = (col * cellW - startX) / dir.x;
    } else {
        sideDistX = Infinity;
    }

    let sideDistY: number;
    if (stepY > 0) {
        sideDistY = ((row + 1) * cellH - startY) / dir.y;
    } else if (stepY < 0) {
        sideDistY = (row * cellH - startY) / dir.y;
    } else {
        sideDistY = Infinity;
    }

    let normalX = 0;
    let normalY = 0;
    let currentDist = 0;

    while (currentDist <= maxDistance) {
        if (sideDistX < sideDistY) {
            currentDist = sideDistX;
            sideDistX += deltaDistX;
            col += stepX;
            normalX = -stepX;
            normalY = 0;
        } else {
            currentDist = sideDistY;
            sideDistY += deltaDistY;
            row += stepY;
            normalX = 0;
            normalY = -stepY;
        }

        if (currentDist > maxDistance) {
            break;
        }

        if (isBlocked(col, row)) {
            const hitX = origin.x + dir.x * currentDist;
            const hitY = origin.y + dir.y * currentDist;
            return {
                hit: true,
                point: new Vector2(hitX, hitY),
                normal: new Vector2(normalX, normalY),
                cell: { col, row },
                distance: currentDist
            };
        }
    }

    return null;
}
