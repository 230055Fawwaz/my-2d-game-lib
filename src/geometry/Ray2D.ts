// ==========================================
// Nama File:          Ray2D.ts
// Deskripsi File:     Representasi geometris sinar 2 dimensi (Ray 2D)
// Penulis File:       Fawwaz Yaqzhan & Google Antigravity
// Tanggal Pembuatan:  18-09-2026
// Tanggal Pembaruan:  18-09-2026
// Catatan:
//   - Sinar didefinisikan oleh titik asal (origin) dan arah (direction) yang selalu ternormalisasi
//   - Parameter t >= 0 merepresentasikan jarak di sepanjang sinar: P(t) = origin + direction * t
//   - Mendukung pencarian titik terdekat dan jarak ke titik eksternal
//   - Sangat penting untuk mekanika hitscan tembakan, laser, dan line-of-sight
// ==========================================


import { Vector2 } from "../core/Vector2.js";
import { IVector2 } from "../core/types.js";
import { EPSILON } from "../core/MathUtils.js";


/**
 * Kelas representasi bentuk Sinar 2 Dimensi (Ray 2D).
 */
export class Ray2D {
    // Titik asal sinar
    public origin: Vector2;

    // Arah sinar (selalu berupa vektor satuan ternormalisasi)
    public direction: Vector2;

    /**
     * Konstruktor Ray2D
     * @param origin Titik asal sinar (default: (0, 0))
     * @param direction Vektor arah sinar (default: (1, 0)). Otomatis dinormalisasi.
     */
    constructor(origin: IVector2 = Vector2.zero(), direction: IVector2 = Vector2.right()) {
        this.origin = new Vector2(origin.x, origin.y);
        this.direction = new Vector2(direction.x, direction.y);

        if (this.direction.lengthSquared() <= EPSILON * EPSILON) {
            this.direction.set(1, 0);
        } else {
            this.direction.normalizeMut();
        }
    }

    /**
     * Membuat instance Ray2D baru langsung dari 4 komponen skalar
     */
    public static fromValues(ox: number, oy: number, dx: number, dy: number): Ray2D {
        return new Ray2D(new Vector2(ox, oy), new Vector2(dx, dy));
    }

    /**
     * Membuat instance Ray2D baru yang berpangkal di `start` dan mengarah menembus `through`
     */
    public static fromPoints(start: IVector2, through: IVector2): Ray2D {
        const dir = new Vector2(through.x - start.x, through.y - start.y);
        return new Ray2D(start, dir);
    }

    /**
     * Mengatur nilai titik asal dan arah sinar in-place
     */
    public set(ox: number, oy: number, dx: number, dy: number): this {
        this.origin.set(ox, oy);
        this.direction.set(dx, dy);

        if (this.direction.lengthSquared() <= EPSILON * EPSILON) {
            this.direction.set(1, 0);
        } else {
            this.direction.normalizeMut();
        }
        return this;
    }

    /**
     * Mengatur arah sinar secara spesifik dan menormalisasikannya in-place
     */
    public setDirection(direction: IVector2): this {
        this.direction.set(direction.x, direction.y);
        if (this.direction.lengthSquared() <= EPSILON * EPSILON) {
            this.direction.set(1, 0);
        } else {
            this.direction.normalizeMut();
        }
        return this;
    }

    /**
     * Menyalin nilai titik asal dan arah dari Ray2D lain
     */
    public copyFrom(other: Ray2D): this {
        this.origin.copy(other.origin);
        this.direction.copy(other.direction);
        return this;
    }

    /**
     * Membuat kloning instance Ray2D baru
     */
    public clone(): Ray2D {
        return new Ray2D(this.origin, this.direction);
    }

    /**
     * Menghitung posisi titik pada jarak parameter `t` di sepanjang sinar:
     * P(t) = origin + direction * max(0, t)
     * @param t Jarak dari origin (harus >= 0)
     * @param out Instance Vector2 opsional untuk menampung hasil (menghindari GC)
     */
    public getPoint(t: number, out?: Vector2): Vector2 {
        const validT = Math.max(0, t);
        const result = out ?? new Vector2();
        result.set(
            this.origin.x + this.direction.x * validT,
            this.origin.y + this.direction.y * validT
        );
        return result;
    }

    /**
     * Melakukan proyeksi skalar sebuah titik ke sepanjang sinar.
     * Mengembalikan nilai skalar parameter `t` terdekat (t >= 0).
     */
    public projectPoint(point: IVector2): number {
        const toPointX = point.x - this.origin.x;
        const toPointY = point.y - this.origin.y;

        const t = toPointX * this.direction.x + toPointY * this.direction.y;
        return Math.max(0, t);
    }

    /**
     * Mencari titik terdekat pada sinar terhadap titik target yang diberikan.
     * @param point Titik target
     * @param out Instance Vector2 opsional untuk menampung hasil
     */
    public closestPoint(point: IVector2, out?: Vector2): Vector2 {
        const t = this.projectPoint(point);
        return this.getPoint(t, out);
    }

    /**
     * Menghitung jarak terpendek dari sinar ke sebuah titik
     */
    public distanceToPoint(point: IVector2): number {
        return Math.sqrt(this.distanceSquaredToPoint(point));
    }

    /**
     * Menghitung kuadrat jarak terpendek dari sinar ke sebuah titik (lebih cepat tanpa Math.sqrt)
     */
    public distanceSquaredToPoint(point: IVector2): number {
        const closest = this.closestPoint(point);
        const dx = point.x - closest.x;
        const dy = point.y - closest.y;
        return dx * dx + dy * dy;
    }

    /**
     * Menggeser titik asal sinar sejauh offset
     */
    public translate(offset: IVector2): Ray2D {
        return new Ray2D(this.origin.add(offset), this.direction);
    }

    /**
     * Menggeser titik asal sinar secara in-place
     */
    public translateMut(offset: IVector2): this {
        this.origin.addMut(offset);
        return this;
    }

    /**
     * Memutar arah sinar sebesar sudut radian tertentu
     */
    public rotate(angleRad: number): Ray2D {
        const rotatedDir = this.direction.rotate(angleRad);
        return new Ray2D(this.origin, rotatedDir);
    }

    /**
     * Memutar arah sinar sebesar sudut radian tertentu secara in-place
     */
    public rotateMut(angleRad: number): this {
        this.direction.rotateMut(angleRad);
        return this;
    }

    /**
     * Memeriksa kesetaraan dengan Ray2D lain dalam toleransi epsilon
     */
    public equals(other: Ray2D, epsilon: number = EPSILON): boolean {
        return (
            this.origin.equals(other.origin, epsilon) &&
            this.direction.equals(other.direction, epsilon)
        );
    }
}
