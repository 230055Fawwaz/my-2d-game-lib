// ==========================================
// Nama File:          Quadtree.ts
// Deskripsi File:     Struktur data Quadtree 2D untuk partisi spasial hierarkis
// Penulis File:       Fawwaz Yaqzhan & Google Antigravity
// Tanggal Pembuatan:  19-09-2026
// Tanggal Pembaruan:  19-09-2026
// Catatan:
//   - Membagi area 2D secara rekursif menjadi 4 kuadran (NW, NE, SW, SE)
//   - Cocok untuk sebaran entitas dengan kepadatan bervariasi di peta luas
//   - Mendukung query AABB, Lingkaran (AOE/Radar), Titik, dan broadphase pairs
// ==========================================


import { Vector2 } from "../core/Vector2.js";
import { AABB } from "../geometry/AABB.js";
import { Circle } from "../geometry/Circle.js";
import { circleAABB } from "../collision/Intersects.js";
import { ISpatialItem, QuadtreeOptions, SpatialPair } from "./types.js";


/**
 * Kelas Quadtree 2D untuk pengindeksan spasial hierarkis.
 */
export class Quadtree<T = any> {
    // Batas area kotak dunia yang dicakup oleh node ini
    public readonly boundary: AABB;

    // Kapasitas objek maksimum sebelum node membelah diri (subdivide)
    public readonly maxObjects: number;

    // Kedalaman pohon maksimum yang diizinkan
    public readonly maxDepth: number;

    // Tingkat kedalaman node saat ini (0 untuk root)
    public readonly depth: number;

    // Daftar item yang tersimpan di node ini
    private items: ISpatialItem<T>[];

    // Status apakah node telah membelah diri menjadi 4 kuadran
    private divided: boolean;

    // Empat sub-kuadran anak
    private northwest?: Quadtree<T>;
    private northeast?: Quadtree<T>;
    private southwest?: Quadtree<T>;
    private southeast?: Quadtree<T>;

    // Set pelacak ID seluruh item unik pada tingkatan root
    private rootItemsMap?: Map<string | number, ISpatialItem<T>>;

    /**
     * Konstruktor Quadtree
     * @param boundary Batas area 2D node
     * @param options Opsi konfigurasi (maxObjects, maxDepth)
     * @param depth Tingkat kedalaman node (default: 0)
     */
    constructor(boundary: AABB, options?: QuadtreeOptions, depth: number = 0) {
        this.boundary = boundary.clone();
        this.maxObjects = options?.maxObjects ?? 8;
        this.maxDepth = options?.maxDepth ?? 6;
        this.depth = depth;
        this.items = [];
        this.divided = false;

        if (this.depth === 0) {
            this.rootItemsMap = new Map();
        }
    }

    /**
     * Mengembalikan jumlah item unik yang ada di dalam Quadtree
     */
    public get size(): number {
        if (this.rootItemsMap) {
            return this.rootItemsMap.size;
        }
        return this.items.length;
    }

    /**
     * Membagi node ini menjadi 4 sub-kuadran anak (NW, NE, SW, SE)
     */
    private subdivide(): void {
        const min = this.boundary.min;
        const max = this.boundary.max;
        const midX = (min.x + max.x) * 0.5;
        const midY = (min.y + max.y) * 0.5;

        const options: QuadtreeOptions = {
            maxObjects: this.maxObjects,
            maxDepth: this.maxDepth
        };
        const nextDepth = this.depth + 1;

        // North-West (Kiri Atas)
        this.northwest = new Quadtree(
            AABB.fromMinMax(min.x, min.y, midX, midY),
            options,
            nextDepth
        );

        // North-East (Kanan Atas)
        this.northeast = new Quadtree(
            AABB.fromMinMax(midX, min.y, max.x, midY),
            options,
            nextDepth
        );

        // South-West (Kiri Bawah)
        this.southwest = new Quadtree(
            AABB.fromMinMax(min.x, midY, midX, max.y),
            options,
            nextDepth
        );

        // South-East (Kanan Bawah)
        this.southeast = new Quadtree(
            AABB.fromMinMax(midX, midY, max.x, max.y),
            options,
            nextDepth
        );

        this.divided = true;

        // Distribusikan item yang sudah ada ke kuadran anak yang bersinggungan
        const existing = this.items;
        this.items = [];

        for (let i = 0; i < existing.length; i++) {
            this.insertToChildren(existing[i]);
        }
    }

    /**
     * Memasukkan item ke dalam sub-kuadran yang bersinggungan
     */
    private insertToChildren(item: ISpatialItem<T>): void {
        if (!this.divided) return;

        if (this.northwest?.boundary.intersects(item.bounds)) {
            this.northwest.insertInternal(item);
        }
        if (this.northeast?.boundary.intersects(item.bounds)) {
            this.northeast.insertInternal(item);
        }
        if (this.southwest?.boundary.intersects(item.bounds)) {
            this.southwest.insertInternal(item);
        }
        if (this.southeast?.boundary.intersects(item.bounds)) {
            this.southeast.insertInternal(item);
        }
    }

    /**
     * Memasukkan item ke dalam Quadtree secara internal
     */
    private insertInternal(item: ISpatialItem<T>): boolean {
        // Jika kotak item tidak bersinggungan dengan batas node ini, abaikan
        if (!this.boundary.intersects(item.bounds)) {
            return false;
        }

        // Jika belum terbagi dan kapasitas masih mencukupi atau sudah mencapai batas kedalaman
        if (!this.divided) {
            if (this.items.length < this.maxObjects || this.depth >= this.maxDepth) {
                this.items.push(item);
                return true;
            }
            this.subdivide();
        }

        // Teruskan ke anak-anaknya
        this.insertToChildren(item);
        return true;
    }

    /**
     * Memasukkan item ke dalam Quadtree.
     * Mengembalikan true jika item berhasil dimasukkan (berada di dalam / bersinggungan dengan batas root).
     */
    public insert(item: ISpatialItem<T>): boolean {
        const inserted = this.insertInternal(item);
        if (inserted && this.rootItemsMap) {
            this.rootItemsMap.set(item.id, item);
        }
        return inserted;
    }

    /**
     * Menghapus item dari Quadtree.
     * Mengembalikan true jika item ditemukan dan dihapus.
     */
    public remove(item: ISpatialItem<T>): boolean {
        if (!this.boundary.intersects(item.bounds)) {
            return false;
        }

        let removed = false;

        // Periksa daftar lokal
        const idx = this.items.findIndex(i => i.id === item.id);
        if (idx !== -1) {
            this.items.splice(idx, 1);
            removed = true;
        }

        // Periksa anak-anak jika sudah terbagi
        if (this.divided) {
            if (this.northwest?.boundary.intersects(item.bounds)) {
                if (this.northwest.remove(item)) removed = true;
            }
            if (this.northeast?.boundary.intersects(item.bounds)) {
                if (this.northeast.remove(item)) removed = true;
            }
            if (this.southwest?.boundary.intersects(item.bounds)) {
                if (this.southwest.remove(item)) removed = true;
            }
            if (this.southeast?.boundary.intersects(item.bounds)) {
                if (this.southeast.remove(item)) removed = true;
            }
        }

        if (removed && this.rootItemsMap) {
            this.rootItemsMap.delete(item.id);
        }

        return removed;
    }

    /**
     * Mengosongkan seluruh isi Quadtree
     */
    public clear(): void {
        this.items = [];
        this.divided = false;
        this.northwest = undefined;
        this.northeast = undefined;
        this.southwest = undefined;
        this.southeast = undefined;

        if (this.rootItemsMap) {
            this.rootItemsMap.clear();
        }
    }

    /**
     * Mencari seluruh item yang bersinggungan dengan area AABB target.
     * 
     * @param aabb Area kotak pencarian
     * @param out Wadah penampung array opsional (GC-Friendly)
     */
    public queryAABB(aabb: AABB, out?: ISpatialItem<T>[]): ISpatialItem<T>[] {
        const result = out ?? [];
        if (out) {
            result.length = 0;
        }

        const visited = new Set<string | number>();
        this.queryAABBInternal(aabb, result, visited);
        return result;
    }

    private queryAABBInternal(
        aabb: AABB,
        result: ISpatialItem<T>[],
        visited: Set<string | number>
    ): void {
        if (!this.boundary.intersects(aabb)) {
            return;
        }

        for (let i = 0; i < this.items.length; i++) {
            const item = this.items[i];
            if (visited.has(item.id)) continue;
            visited.add(item.id);

            if (item.bounds.intersects(aabb)) {
                result.push(item);
            }
        }

        if (this.divided) {
            this.northwest?.queryAABBInternal(aabb, result, visited);
            this.northeast?.queryAABBInternal(aabb, result, visited);
            this.southwest?.queryAABBInternal(aabb, result, visited);
            this.southeast?.queryAABBInternal(aabb, result, visited);
        }
    }

    /**
     * Mencari seluruh item yang bersinggungan dengan lingkaran target (AOE/Radar).
     * 
     * @param circle Area lingkaran pencarian
     * @param out Wadah penampung array opsional (GC-Friendly)
     */
    public queryCircle(circle: Circle, out?: ISpatialItem<T>[]): ISpatialItem<T>[] {
        const result = out ?? [];
        if (out) {
            result.length = 0;
        }

        const visited = new Set<string | number>();
        this.queryCircleInternal(circle, result, visited);
        return result;
    }

    private queryCircleInternal(
        circle: Circle,
        result: ISpatialItem<T>[],
        visited: Set<string | number>
    ): void {
        if (!circleAABB(circle, this.boundary)) {
            return;
        }

        for (let i = 0; i < this.items.length; i++) {
            const item = this.items[i];
            if (visited.has(item.id)) continue;
            visited.add(item.id);

            if (circleAABB(circle, item.bounds)) {
                result.push(item);
            }
        }

        if (this.divided) {
            this.northwest?.queryCircleInternal(circle, result, visited);
            this.northeast?.queryCircleInternal(circle, result, visited);
            this.southwest?.queryCircleInternal(circle, result, visited);
            this.southeast?.queryCircleInternal(circle, result, visited);
        }
    }

    /**
     * Mencari seluruh item yang memuat titik target.
     * 
     * @param point Titik koordinat dunia yang diuji
     * @param out Wadah penampung array opsional (GC-Friendly)
     */
    public queryPoint(point: Vector2, out?: ISpatialItem<T>[]): ISpatialItem<T>[] {
        const result = out ?? [];
        if (out) {
            result.length = 0;
        }

        const visited = new Set<string | number>();
        this.queryPointInternal(point, result, visited);
        return result;
    }

    private queryPointInternal(
        point: Vector2,
        result: ISpatialItem<T>[],
        visited: Set<string | number>
    ): void {
        if (!this.boundary.containsPoint(point)) {
            return;
        }

        for (let i = 0; i < this.items.length; i++) {
            const item = this.items[i];
            if (visited.has(item.id)) continue;
            visited.add(item.id);

            if (item.bounds.containsPoint(point)) {
                result.push(item);
            }
        }

        if (this.divided) {
            this.northwest?.queryPointInternal(point, result, visited);
            this.northeast?.queryPointInternal(point, result, visited);
            this.southwest?.queryPointInternal(point, result, visited);
            this.southeast?.queryPointInternal(point, result, visited);
        }
    }

    /**
     * Mendapatkan pasangan-pasangan item yang saling bertumpang tindih (broadphase collision pairs).
     * 
     * @param out Wadah penampung array pasangan opsional (GC-Friendly)
     */
    public getPotentialPairs(out?: SpatialPair<T>[]): SpatialPair<T>[] {
        const pairs = out ?? [];
        if (out) {
            pairs.length = 0;
        }

        const processedPairKeys = new Set<string>();
        this.collectPairsInternal(pairs, processedPairKeys);
        return pairs;
    }

    private collectPairsInternal(
        pairs: SpatialPair<T>[],
        processedPairKeys: Set<string>
    ): void {
        const len = this.items.length;
        for (let i = 0; i < len; i++) {
            const itemA = this.items[i];
            for (let j = i + 1; j < len; j++) {
                const itemB = this.items[j];

                const keyA = String(itemA.id);
                const keyB = String(itemB.id);
                const pairKey = keyA < keyB ? `${keyA}:${keyB}` : `${keyB}:${keyA}`;

                if (processedPairKeys.has(pairKey)) continue;
                processedPairKeys.add(pairKey);

                if (itemA.bounds.intersects(itemB.bounds)) {
                    pairs.push({ a: itemA, b: itemB });
                }
            }
        }

        if (this.divided) {
            this.northwest?.collectPairsInternal(pairs, processedPairKeys);
            this.northeast?.collectPairsInternal(pairs, processedPairKeys);
            this.southwest?.collectPairsInternal(pairs, processedPairKeys);
            this.southeast?.collectPairsInternal(pairs, processedPairKeys);
        }
    }
}
