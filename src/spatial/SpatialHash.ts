// ==========================================
// Nama File:          SpatialHash.ts
// Deskripsi File:     Struktur data 2D Spatial Hash Grid untuk akselerasi query
// Penulis File:       Fawwaz Yaqzhan & Google Antigravity
// Tanggal Pembuatan:  19-09-2026
// Tanggal Pembaruan:  19-09-2026
// Catatan:
//   - Membagi ruang 2D menjadi sel berukuran seragam (cellSize)
//   - Sangat cepat O(1) untuk insert, update, remove, dan query objek dinamis
//   - Ideal untuk top-down shooter (banyak peluru/musuh) dan simulasi entitas
// ==========================================


import { Vector2 } from "../core/Vector2.js";
import { AABB } from "../geometry/AABB.js";
import { Circle } from "../geometry/Circle.js";
import { circleAABB } from "../collision/Intersects.js";
import { ISpatialItem, SpatialHashOptions, SpatialPair } from "./types.js";


/**
 * Kelas 2D Spatial Hash Grid.
 * 
 * Mengelompokkan entitas ke dalam sel-sel kisi berukuran tetap untuk
 * memangkas kompleksitas pencarian dari O(N) atau O(N^2) menjadi mendekati O(1).
 */
export class SpatialHash<T = any> {
    // Ukuran satu sel grid (lebar dan tinggi)
    private readonly cellSize: number;

    // Map dari hash key "cellX:cellY" ke Set berisi item yang menduduki sel tersebut
    private readonly grid: Map<string, Set<ISpatialItem<T>>>;

    // Map untuk mencatat sel-sel yang dihuni oleh setiap item (berdasarkan id) untuk pembaruan/penghapusan cepat
    private readonly itemCells: Map<string | number, string[]>;

    // Map referensi item berdasarkan ID uniknya
    private readonly items: Map<string | number, ISpatialItem<T>>;

    /**
     * Konstruktor SpatialHash
     * @param options Konfigurasi SpatialHash (cellSize default: 64)
     */
    constructor(options?: SpatialHashOptions) {
        this.cellSize = options?.cellSize ?? 64;
        if (this.cellSize <= 0) {
            throw new Error("SpatialHash cellSize harus bernilai lebih besar dari 0");
        }
        this.grid = new Map();
        this.itemCells = new Map();
        this.items = new Map();
    }

    /**
     * Mengembalikan ukuran sel grid
     */
    public getCellSize(): number {
        return this.cellSize;
    }

    /**
     * Mengembalikan jumlah item unik yang terdaftar di dalam hash grid
     */
    public get size(): number {
        return this.items.size;
    }

    /**
     * Menghasilkan string kunci hash dari koordinat sel
     */
    private cellKey(cx: number, cy: number): string {
        return `${cx}:${cy}`;
    }

    /**
     * Mengonversi koordinat titik dunia ke indeks sel grid
     */
    public worldToCell(val: number): number {
        return Math.floor(val / this.cellSize);
    }

    /**
     * Memeriksa apakah sebuah item sudah terdaftar di dalam hash grid
     */
    public has(item: ISpatialItem<T>): boolean {
        return this.items.has(item.id);
    }

    /**
     * Memasukkan item ke dalam hash grid.
     * Item akan didaftarkan ke semua sel yang bersinggungan dengan `item.bounds`.
     */
    public insert(item: ISpatialItem<T>): void {
        if (this.items.has(item.id)) {
            this.remove(item);
        }

        const minCx = this.worldToCell(item.bounds.min.x);
        const maxCx = this.worldToCell(item.bounds.max.x);
        const minCy = this.worldToCell(item.bounds.min.y);
        const maxCy = this.worldToCell(item.bounds.max.y);

        const keys: string[] = [];

        for (let cy = minCy; cy <= maxCy; cy++) {
            for (let cx = minCx; cx <= maxCx; cx++) {
                const key = this.cellKey(cx, cy);
                keys.push(key);

                let cell = this.grid.get(key);
                if (!cell) {
                    cell = new Set();
                    this.grid.set(key, cell);
                }
                cell.add(item);
            }
        }

        this.itemCells.set(item.id, keys);
        this.items.set(item.id, item);
    }

    /**
     * Menghapus item dari hash grid.
     * Mengembalikan true jika item ditemukan dan berhasil dihapus.
     */
    public remove(item: ISpatialItem<T>): boolean {
        const keys = this.itemCells.get(item.id);
        if (!keys) {
            return false;
        }

        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const cell = this.grid.get(key);
            if (cell) {
                cell.delete(item);
                if (cell.size === 0) {
                    this.grid.delete(key);
                }
            }
        }

        this.itemCells.delete(item.id);
        this.items.delete(item.id);
        return true;
    }

    /**
     * Memperbarui posisi/ukuran item di dalam hash grid setelah `item.bounds` berubah.
     */
    public update(item: ISpatialItem<T>): void {
        this.remove(item);
        this.insert(item);
    }

    /**
     * Mengosongkan seluruh isi hash grid.
     */
    public clear(): void {
        this.grid.clear();
        this.itemCells.clear();
        this.items.clear();
    }

    /**
     * Mencari seluruh item yang kotak batasnya bersinggungan dengan AABB target.
     * 
     * @param aabb Kotak area pencarian
     * @param out Wadah penampung array opsional (GC-Friendly)
     */
    public queryAABB(aabb: AABB, out?: ISpatialItem<T>[]): ISpatialItem<T>[] {
        const result = out ?? [];
        if (out) {
            result.length = 0;
        }

        const minCx = this.worldToCell(aabb.min.x);
        const maxCx = this.worldToCell(aabb.max.x);
        const minCy = this.worldToCell(aabb.min.y);
        const maxCy = this.worldToCell(aabb.max.y);

        const visited = new Set<string | number>();

        for (let cy = minCy; cy <= maxCy; cy++) {
            for (let cx = minCx; cx <= maxCx; cx++) {
                const cell = this.grid.get(this.cellKey(cx, cy));
                if (!cell) continue;

                for (const item of cell) {
                    if (visited.has(item.id)) continue;
                    visited.add(item.id);

                    if (item.bounds.intersects(aabb)) {
                        result.push(item);
                    }
                }
            }
        }

        return result;
    }

    /**
     * Mencari seluruh item yang bersinggungan dengan lingkaran target (misal: ledakan AOE / radius radar).
     * 
     * @param circle Lingkaran area pencarian
     * @param out Wadah penampung array opsional (GC-Friendly)
     */
    public queryCircle(circle: Circle, out?: ISpatialItem<T>[]): ISpatialItem<T>[] {
        const result = out ?? [];
        if (out) {
            result.length = 0;
        }

        const minCx = this.worldToCell(circle.center.x - circle.radius);
        const maxCx = this.worldToCell(circle.center.x + circle.radius);
        const minCy = this.worldToCell(circle.center.y - circle.radius);
        const maxCy = this.worldToCell(circle.center.y + circle.radius);

        const visited = new Set<string | number>();

        for (let cy = minCy; cy <= maxCy; cy++) {
            for (let cx = minCx; cx <= maxCx; cx++) {
                const cell = this.grid.get(this.cellKey(cx, cy));
                if (!cell) continue;

                for (const item of cell) {
                    if (visited.has(item.id)) continue;
                    visited.add(item.id);

                    if (circleAABB(circle, item.bounds)) {
                        result.push(item);
                    }
                }
            }
        }

        return result;
    }

    /**
     * Mencari seluruh item yang memuat titik tertentu.
     * 
     * @param point Titik koordinat dunia yang diuji
     * @param out Wadah penampung array opsional (GC-Friendly)
     */
    public queryPoint(point: Vector2, out?: ISpatialItem<T>[]): ISpatialItem<T>[] {
        const result = out ?? [];
        if (out) {
            result.length = 0;
        }

        const cx = this.worldToCell(point.x);
        const cy = this.worldToCell(point.y);
        const cell = this.grid.get(this.cellKey(cx, cy));

        if (!cell) {
            return result;
        }

        for (const item of cell) {
            if (item.bounds.containsPoint(point)) {
                result.push(item);
            }
        }

        return result;
    }

    /**
     * Mendapatkan pasangan-pasangan item yang saling bertumpang tindih (broadphase collision pairs).
     * Sangat efisien untuk collision pipeline karena memangkas pengujian N*(N-1)/2 menjadi hanya antar tetangga sel.
     * 
     * @param out Wadah penampung array pasangan opsional (GC-Friendly)
     */
    public getPotentialPairs(out?: SpatialPair<T>[]): SpatialPair<T>[] {
        const pairs = out ?? [];
        if (out) {
            pairs.length = 0;
        }

        const processedPairKeys = new Set<string>();

        for (const [, cell] of this.grid) {
            if (cell.size < 2) continue;

            const itemsArray = Array.from(cell);
            const len = itemsArray.length;

            for (let i = 0; i < len; i++) {
                const itemA = itemsArray[i];
                for (let j = i + 1; j < len; j++) {
                    const itemB = itemsArray[j];

                    // Kunci berurut untuk menghindari duplikasi antar sel
                    const keyA = String(itemA.id);
                    const keyB = String(itemB.id);
                    const pairKey = keyA < keyB ? `${keyA}:${keyB}` : `${keyB}:${keyA}`;

                    if (processedPairKeys.has(pairKey)) {
                        continue;
                    }
                    processedPairKeys.add(pairKey);

                    if (itemA.bounds.intersects(itemB.bounds)) {
                        pairs.push({ a: itemA, b: itemB });
                    }
                }
            }
        }

        return pairs;
    }

    /**
     * Mengembalikan array seluruh item unik yang terdaftar
     */
    public getAllItems(): ISpatialItem<T>[] {
        return Array.from(this.items.values());
    }
}
