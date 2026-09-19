// ==========================================
// Nama File:          Grid2D.ts
// Deskripsi File:     Struktur data Grid 2 Dimensi berbasis Flat Array (1D buffer)
// Penulis File:       Fawwaz Yaqzhan & Google Antigravity
// Tanggal Pembuatan:  19-09-2026
// Tanggal Pembaruan:  19-09-2026
// Catatan:
//   - Menggunakan Flat Array 1D untuk performa maksimal dan CPU cache locality
//   - Mendukung konversi koordinat Grid <-> World
//   - Menyediakan pencarian tetangga (4-arah, 8-arah) dan algoritma Flood Fill
// ==========================================


import { Vector2 } from "../core/Vector2.js";
import { IVector2 } from "../core/types.js";
import { GridCoord, GridNeighborMode } from "./types.js";


/**
 * Kelas generik Grid 2D berbasis array datar (Flat 1D Array).
 */
export class Grid2D<T = any> {
    // Jumlah kolom (lebar grid dalam petak)
    public readonly width: number;

    // Jumlah baris (tinggi grid dalam petak)
    public readonly height: number;

    // Buffer 1D penyimpan data seluruh petak
    private readonly buffer: T[];

    /**
     * Konstruktor Grid2D
     * @param width Jumlah kolom (harus > 0)
     * @param height Jumlah baris (harus > 0)
     * @param initialValue Nilai awal untuk mengisi petak (atau fungsi generator)
     */
    constructor(
        width: number,
        height: number,
        initialValue?: T | ((col: number, row: number) => T)
    ) {
        if (width <= 0 || height <= 0) {
            throw new Error(`Dimensi Grid2D harus lebih besar dari 0. Diterima: (${width}, ${height})`);
        }

        this.width = Math.floor(width);
        this.height = Math.floor(height);
        const totalCells = this.width * this.height;
        this.buffer = new Array<T>(totalCells);

        if (typeof initialValue === "function") {
            const generator = initialValue as (col: number, row: number) => T;
            for (let r = 0; r < this.height; r++) {
                for (let c = 0; c < this.width; c++) {
                    this.buffer[r * this.width + c] = generator(c, r);
                }
            }
        } else if (initialValue !== undefined) {
            this.buffer.fill(initialValue);
        }
    }

    /**
     * Mengembalikan total petak dalam grid (width * height)
     */
    public get totalCells(): number {
        return this.buffer.length;
    }

    /**
     * Memeriksa apakah koordinat (col, row) berada di dalam batas grid
     */
    public inBounds(col: number, row: number): boolean {
        return col >= 0 && col < this.width && row >= 0 && row < this.height;
    }

    /**
     * Mengonversi koordinat 2D (col, row) menjadi indeks flat 1D
     */
    public toIndex(col: number, row: number): number {
        return row * this.width + col;
    }

    /**
     * Mengonversi indeks flat 1D kembali menjadi koordinat 2D (col, row)
     */
    public toCoord(index: number, out?: GridCoord): GridCoord {
        const res = out ?? { col: 0, row: 0 };
        res.col = index % this.width;
        res.row = Math.floor(index / this.width);
        return res;
    }

    /**
     * Mengambil nilai data pada petak (col, row).
     * Mengembalikan undefined jika berada di luar batas grid.
     */
    public get(col: number, row: number): T | undefined {
        if (!this.inBounds(col, row)) {
            return undefined;
        }
        return this.buffer[row * this.width + col];
    }

    /**
     * Mengatur nilai data pada petak (col, row).
     * Mengembalikan true jika berhasil, atau false jika di luar batas.
     */
    public set(col: number, row: number, value: T): boolean {
        if (!this.inBounds(col, row)) {
            return false;
        }
        this.buffer[row * this.width + col] = value;
        return true;
    }

    /**
     * Mengisi seluruh petak grid dengan nilai baru
     */
    public fill(value: T): this {
        this.buffer.fill(value);
        return this;
    }

    /**
     * Menjalankan fungsi callback untuk setiap petak dalam grid
     */
    public forEach(callback: (value: T, col: number, row: number, grid: Grid2D<T>) => void): void {
        for (let r = 0; r < this.height; r++) {
            for (let c = 0; c < this.width; c++) {
                const idx = r * this.width + c;
                callback(this.buffer[idx], c, r, this);
            }
        }
    }

    /**
     * Membuat salinan independen dari Grid2D ini
     */
    public clone(): Grid2D<T> {
        const copy = new Grid2D<T>(this.width, this.height);
        for (let i = 0; i < this.buffer.length; i++) {
            copy.buffer[i] = this.buffer[i];
        }
        return copy;
    }

    /**
     * Mengonversi koordinat dunia (pixel) ke koordinat petak grid
     * 
     * @param worldPos Posisi dalam koordinat dunia
     * @param cellSize Ukuran satu petak (angka atau vektor {x, y})
     * @param origin Titik awal offset grid di dunia (default: (0, 0))
     * @param out Wadah penampung hasil opsional
     */
    public worldToGrid(
        worldPos: IVector2,
        cellSize: number | IVector2,
        origin?: IVector2,
        out?: GridCoord
    ): GridCoord {
        const res = out ?? { col: 0, row: 0 };
        const cellW = typeof cellSize === "number" ? cellSize : cellSize.x;
        const cellH = typeof cellSize === "number" ? cellSize : cellSize.y;
        const ox = origin ? origin.x : 0;
        const oy = origin ? origin.y : 0;

        res.col = Math.floor((worldPos.x - ox) / cellW);
        res.row = Math.floor((worldPos.y - oy) / cellH);
        return res;
    }

    /**
     * Mengonversi koordinat petak grid ke posisi dunia (pixel)
     * 
     * @param col Indeks kolom
     * @param row Indeks baris
     * @param cellSize Ukuran satu petak
     * @param origin Titik awal offset grid (default: (0, 0))
     * @param centered Jika true, menghasilkan titik pusat petak. Jika false, menghasilkan sudut kiri-atas.
     * @param out Vektor penampung hasil opsional (GC-Friendly)
     */
    public gridToWorld(
        col: number,
        row: number,
        cellSize: number | IVector2,
        origin?: IVector2,
        centered: boolean = false,
        out?: Vector2
    ): Vector2 {
        const res = out ?? new Vector2();
        const cellW = typeof cellSize === "number" ? cellSize : cellSize.x;
        const cellH = typeof cellSize === "number" ? cellSize : cellSize.y;
        const ox = origin ? origin.x : 0;
        const oy = origin ? origin.y : 0;

        const wx = ox + col * cellW + (centered ? cellW * 0.5 : 0);
        const wy = oy + row * cellH + (centered ? cellH * 0.5 : 0);
        return res.set(wx, wy);
    }

    /**
     * Mendapatkan daftar koordinat tetangga dari petak tertentu yang valid dalam batas grid.
     * 
     * @param col Kolom petak
     * @param row Baris petak
     * @param mode Mode tetangga ("orthogonal" = 4 arah, "diagonal" = 4 diagonal, "all" = 8 arah)
     * @param out Wadah penampung array opsional (GC-Friendly)
     */
    public getNeighbors(
        col: number,
        row: number,
        mode: GridNeighborMode = "orthogonal",
        out?: GridCoord[]
    ): GridCoord[] {
        const neighbors = out ?? [];
        if (out) {
            neighbors.length = 0;
        }

        // Tetangga ortogonal (4 arah)
        if (mode === "orthogonal" || mode === "all") {
            // Atas
            if (this.inBounds(col, row - 1)) neighbors.push({ col, row: row - 1 });
            // Kanan
            if (this.inBounds(col + 1, row)) neighbors.push({ col: col + 1, row });
            // Bawah
            if (this.inBounds(col, row + 1)) neighbors.push({ col, row: row + 1 });
            // Kiri
            if (this.inBounds(col - 1, row)) neighbors.push({ col: col - 1, row });
        }

        // Tetangga diagonal (4 arah)
        if (mode === "diagonal" || mode === "all") {
            // Atas-Kiri
            if (this.inBounds(col - 1, row - 1)) neighbors.push({ col: col - 1, row: row - 1 });
            // Atas-Kanan
            if (this.inBounds(col + 1, row - 1)) neighbors.push({ col: col + 1, row: row - 1 });
            // Bawah-Kanan
            if (this.inBounds(col + 1, row + 1)) neighbors.push({ col: col + 1, row: row + 1 });
            // Bawah-Kiri
            if (this.inBounds(col - 1, row + 1)) neighbors.push({ col: col - 1, row: row + 1 });
        }

        return neighbors;
    }

    /**
     * Algoritma pengisian area berdekatan (Flood Fill).
     * Berguna untuk alat kuas pewarnaan editor map, pembagian region, atau kalkulasi jangkauan terhubung.
     * 
     * @param startCol Kolom awal
     * @param startRow Baris awal
     * @param fillVal Nilai baru yang akan diisi
     * @param predicate Fungsi penentu apakah sel boleh diisi (default: memeriksa kesetaraan nilai sel awal)
     * @returns Jumlah total petak yang berhasil diisi
     */
    public floodFill(
        startCol: number,
        startRow: number,
        fillVal: T,
        predicate?: (currentVal: T, col: number, row: number) => boolean
    ): number {
        if (!this.inBounds(startCol, startRow)) {
            return 0;
        }

        const initialVal = this.get(startCol, startRow);
        if (initialVal === fillVal) {
            return 0;
        }

        const canFill = predicate ?? ((val: T) => val === initialVal);

        let filledCount = 0;
        const queue: GridCoord[] = [{ col: startCol, row: startRow }];
        const visited = new Uint8Array(this.totalCells);

        visited[this.toIndex(startCol, startRow)] = 1;

        while (queue.length > 0) {
            const current = queue.shift()!;
            const currentVal = this.get(current.col, current.row)!;

            if (canFill(currentVal, current.col, current.row)) {
                this.set(current.col, current.row, fillVal);
                filledCount++;

                const neighbors = this.getNeighbors(current.col, current.row, "orthogonal");
                for (let i = 0; i < neighbors.length; i++) {
                    const n = neighbors[i];
                    const nIdx = this.toIndex(n.col, n.row);
                    if (visited[nIdx] === 0) {
                        visited[nIdx] = 1;
                        queue.push(n);
                    }
                }
            }
        }

        return filledCount;
    }

    /**
     * Mengembalikan data array mentah (internal buffer)
     */
    public getRawBuffer(): readonly T[] {
        return this.buffer;
    }
}
