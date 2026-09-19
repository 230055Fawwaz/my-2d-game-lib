// ==========================================
// Nama File:          GridCoordTransform.ts
// Deskripsi File:     Utilitas transformasi koordinat grid (Ortogonal & Isometrik)
// Penulis File:       Fawwaz Yaqzhan & Google Antigravity
// Tanggal Pembuatan:  19-09-2026
// Tanggal Pembaruan:  19-09-2026
// Catatan:
//   - Proyeksi isometrik diamond (2:1 standar game taktis/RPG/factory builder)
//   - Konversi dua arah: World Pos <-> Grid Tile
// ==========================================


import { Vector2 } from "../core/Vector2.js";
import { IVector2 } from "../core/types.js";
import { GridCoord } from "./types.js";


/**
 * Kumpulan fungsi statis untuk transformasi koordinat proyeksi grid 2 dimensi.
 */
export class GridCoordTransform {
    /**
     * Mengonversi koordinat petak isometrik (diamond) ke koordinat layar/dunia.
     * 
     * @param col Kolom petak isometrik
     * @param row Baris petak isometrik
     * @param tileWidth Lebar petak berlian (diamond)
     * @param tileHeight Tinggi petak berlian (biasanya tileWidth / 2)
     * @param origin Titik pangkal offset grid di dunia (default: (0, 0))
     * @param centered Jika true, menghasilkan titik tengah petak berlian
     * @param out Vektor penampung hasil (GC-Friendly)
     */
    public static isoToWorld(
        col: number,
        row: number,
        tileWidth: number,
        tileHeight: number,
        origin?: IVector2,
        centered: boolean = false,
        out?: Vector2
    ): Vector2 {
        const res = out ?? new Vector2();
        const halfW = tileWidth * 0.5;
        const halfH = tileHeight * 0.5;
        const ox = origin ? origin.x : 0;
        const oy = origin ? origin.y : 0;

        const wx = ox + (col - row) * halfW;
        const wy = oy + (col + row) * halfH + (centered ? halfH : 0);

        return res.set(wx, wy);
    }

    /**
     * Mengonversi posisi layar/dunia ke koordinat petak isometrik (diamond).
     * 
     * @param worldPos Posisi dunia dalam piksel
     * @param tileWidth Lebar petak berlian
     * @param tileHeight Tinggi petak berlian
     * @param origin Titik pangkal offset grid (default: (0, 0))
     * @param out Wadah penampung koordinat petak
     */
    public static worldToIso(
        worldPos: IVector2,
        tileWidth: number,
        tileHeight: number,
        origin?: IVector2,
        out?: GridCoord
    ): GridCoord {
        const res = out ?? { col: 0, row: 0 };
        const ox = origin ? origin.x : 0;
        const oy = origin ? origin.y : 0;

        const dx = worldPos.x - ox;
        const dy = worldPos.y - oy;

        const halfW = tileWidth * 0.5;
        const halfH = tileHeight * 0.5;

        // Invers transformasi linear isometrik
        const col = (dx / halfW + dy / halfH) * 0.5;
        const row = (dy / halfH - dx / halfW) * 0.5;

        res.col = Math.floor(col);
        res.row = Math.floor(row);
        return res;
    }
}
