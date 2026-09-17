// ==========================================
// Nama File:          AABB.ts
// Deskripsi File:     Representasi geometris AABB 2 dimensi
// Penulis File:       Fawwaz Yaqzhan & Google Antigravity
// Tanggal Pembuatan:  17-09-2026
// Tanggal Pembaruan:  17-09-2026
// Catatan:
//   - AABB adalah kotak pembungkus yang sejajar dengan sumbu X dan Y (tanpa rotasi)
//   - Didefinisikan oleh titik minimum (kiri-atas) dan maksimum (kanan-bawah)
//   - Deteksi tumpang tindih sangat cepat (hanya perbandingan skalar sederhana)
//   - Menjadi fondasi bagi broadphase collision dan partisi spasial (Quadtree)
// ==========================================


import { Vector2 } from "../core/Vector2.js";
import { IVector2 } from "../core/types.js";
import { clamp, EPSILON } from "../core/MathUtils.js";


/**
 * Kelas representasi bentuk AABB 2 dimensi
 */
export class AABB {
    // Titik sudut minimum (kiri atas)
    public min: Vector2;

    // Titik sudut maksimum (kanan bawah)
    public max: Vector2;

    /**
     * Kontruktor
     * Otomatis nilai min <= max
     */
    constructor(min: Vector2 = Vector2.zero(), max: Vector2 = Vector2.zero()) {
        this.min = new Vector2(Math.min(min.x, max.x), Math.min(min.y, max.y));
        this.max = new Vector2(Math.max(min.x, max.x), Math.max(min.y, max.y));
    }

    /**
     * Membuat AABB baru langsung dari 4 komponen koordinat skalar
     */
    public static fromMinMax(minX: number, minY: number, maxX: number, maxY: number): AABB {
        return new AABB(new Vector2(minX, minY), new Vector2(maxX, maxY));
    }

    /**
     * Membuat AABB baru dari titik pusat dan ukuran kotak
     */
    public static fromCenterAndSize(center: IVector2, size: IVector2): AABB {
        const halfWidth = Math.abs(size.x) * 0.5;
        const halfHeight = Math.abs(size.y) * 0.5;

        return new AABB(
            new Vector2(center.x - halfWidth, center.y - halfHeight),
            new Vector2(center.x + halfWidth, center.y + halfHeight)
        );
    }

    /**
     * Membuat AABB pembungkus terkecil yang memuat sekumpulan titik
     */
    public static fromPoints(points: IVector2[]): AABB {
        if (points.length === 0) {
            return new AABB();
        }

        let minX = points[0].x;
        let minY = points[0].y;
        let maxX = points[0].x;
        let maxY = points[0].y;

        for (let i = 1; i < points.length; i++) {
            const p = points[i];
            if (p.x < minX) minX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.x > maxX) maxX = p.x;
            if (p.y > maxY) maxY = p.y;
        }
        return AABB.fromMinMax(minX, minY, maxX, maxY);
    }

    /**
     * Lebar kotak (panjang pada sumbu x)
     */
    public get width(): number {
        return this.max.x - this.min.x;
    }

    /**
     * Tinggi kotak (panjang pada sumbu y)
     */
    public get height(): number {
        return this.max.y - this.min.y;
    }

    /**
     * Luas kotak
     */
    public area(): number {
        return this.width - this.height;
    }

    /**
     * Keliling kotak
     */
    public perimeter(): number {
        return 2 * (this.width + this.height);
    }

    /**
     * Menghitung titik pusat kotak
     */
    public getCenter(out?: Vector2): Vector2 {
        const result = out ?? new Vector2();
        return result.set(
            (this.min.x + this.max.x) * 0.5,
            (this.min.y + this.max.y) * 0.5
        );
    }

    /**
     * Menghitung setengah ukuran kotak
     */
    public getHalfSize(out?: Vector2): Vector2 {
        const result = out ?? new Vector2();
        return result.set(this.width * 0.5, this.height * 0.5);
    }

    /**
     * Mengatur batas koordinat kotak in-place
     */
    public set(minX: number, minY: number, maxX: number, maxY: number): this {
        this.min.set(Math.min(minX, maxX), Math.min(minY, maxY));
        this.max.set(Math.max(minX, maxX), Math.max(minY, maxY));
        return this;
    }

    /**
     * Menyalin nilai batas dari AABB lain
     */
    public copyFrom(other: AABB): this {
        this.min.copy(other.min);
        this.max.copy(other.max);
        return this;
    }

    /**
     * Membuat kloning dari AABB ini
     */
    public clone(): AABB {
        return new AABB(this.min, this.max);
    }

    /**
     * Menggeser posisi kotak sejauh offset tertentu
     */
    public translate(offset: IVector2): AABB {
        return new AABB(this.min.add(offset), this.max.add(offset));
    }

    /**
     * Menggeser posisi kotak saat ini in-place
     */
    public translateMut(offset: IVector2): this {
        this.min.addMut(offset);
        this.max.addMut(offset);
        return this;
    }

    /**
     * Memperbesar atau memperkecil kotak ke segala sisi sebesar amount
     */
    public expandMut(amount: number): this {
        this.min.x -= amount;
        this.min.y -= amount;
        this.max.x += amount;
        this.max.y += amount;

        // Jaga agar batas min tidak melewati max jika dikurangi terlalu banyak
        if (this.min.x > this.max.x) {
            const mid = (this.min.x + this.max.x) * 0.5;
            this.min.x = mid;
            this.max.x = mid;
        }
        if (this.min.y > this.max.y) {
            const mid = (this.min.y + this.max.y) * 0.5;
            this.min.y = mid;
            this.max.x = mid;
        }
        return this;
    }

    /**
     * Memperluas kotak ini sehingga mencakup titik tertentu
     */
    public encapsulatePoint(point: IVector2): this {
        if (point.x < this.min.x) this.min.x = point.x;
        if (point.y < this.min.y) this.min.y = point.y;
        if (point.x > this.max.x) this.max.x = point.x;
        if (point.y > this.max.y) this.max.y = point.y;
        return this;
    }

    /**
     * Memperluas kotak ini sehingga mencakup kotak AABB lain
     */
    public encapsulateAABB(other: AABB): this {
        if (other.min.x < this.min.x) this.min.x = other.min.x;
        if (other.min.y < this.min.y) this.min.y = other.min.y;
        if (other.max.x > this.max.x) this.max.x = other.max.x;
        if (other.max.y > this.max.y) this.max.y = other.max.y;
        return this;
    }

    /**
     * Memeriksa apakah sebua titik berada di dalam batas AABB
     */
    public containsPoint(point: IVector2): boolean {
        return (
            point.x >= this.min.x - EPSILON &&
            point.x <= this.max.x + EPSILON &&
            point.y >= this.min.y - EPSILON &&
            point.y <= this.max.y + EPSILON
        );
    }

    /**
     * Memeriksa apakah kotak lain berada sepenuhnya di dalam kotak ini
     */
    public containsAABB(other: AABB): boolean {
        return (
            other.min.x >= this.min.x - EPSILON &&
            other.max.x <= this.max.x + EPSILON &&
            other.min.y >= this.min.y - EPSILON &&
            other.max.y <= this.max.y + EPSILON
        );
    }

    /**
     * Memeriksa apakah kotak ini tumpang tindih dengan AABB lian
     */
    public intersects(other: AABB): boolean {
        // Logika pemisahan sumbu (separating axis)
        if (this.max.x < other.min.x - EPSILON || this.min.x > other.max.x + EPSILON) return false;
        if (this.max.y < other.min.y - EPSILON || this.min.y > other.max.y + EPSILON) return false;

        return true;
    }

    /**
     * Mencari titik di dalam/pada batas AABB yang paling dekat dengan titik target
     * Menggunakan konsep clamping nilai terhadap batas min dan max
     * 
     * @param point Titik target
     * @param out Vektor penampung hasil opsional (zero-allocation)
     */
    public closestPoint(point: IVector2, out?: Vector2): Vector2 {
        const result = out ?? new Vector2();
        return result.set(
            clamp(point.x, this.min.x, this.max.x),
            clamp(point.y, this.min.y, this.max.y)
        );
    }

    /**
     * Memeriksa kesetaraan nilai antara dua AABB dengan toleransi floating point
     */
    public equals(other: AABB, epsilon: number = EPSILON): boolean {
        return (
            this.min.equals(other.min, epsilon) &&
            this.max.equals(other.max, epsilon)
        );
    }
}
