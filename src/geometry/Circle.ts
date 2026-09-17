// ==========================================
// Nama File:          Circle.ts
// Deskripsi File:     Representasi geometris berbentuk lingkaran 2 dimensi
// Penulis File:       Fawwaz Yaqzhan & Google Antigravity
// Tanggal Pembuatan:  17-09-2026
// Tanggal Pembaruan:  17-09-2026
// Catatan:
//   - Lingkaran didefinisikan oleh titik pusat (center) dan jari-jari (radius)
//   - Menggunakan jarak kuadrat (distanceSquared) untuk efisiensi CPU (menghindari Math.sqrt)
//   - Mendukung metode mutabel (in-place) dan imutabel
//   - Digunakan untuk hitbox, AOE, FOV, jangkauan aggro, dan bounding sphere
// ==========================================


import { Vector2 } from "../core/Vector2.js";
import { IVector2 } from "../core/types.js";
import { approxEqual, EPSILON } from "../core/MathUtils.js";


/**
 * Class representasi bentuk lingkaran 2 dimensi
 */
export class Circle {
    // Titik pusat lingkaran
    public center: Vector2;

    // Jari-jari lingkaran
    public radius: number;

    /**
     * Konstruktor
     * @param center Titik pusat lingkaran (default: (0, 0))
     * @param radius Jari-jari lingkaran (default: 0)
     */
    constructor(center: IVector2 = Vector2.zero(), radius: number = 0) {
        this.center = new Vector2(center.x, center.y);
        this.radius = Math.max(0, radius);
    }

    /**
     * Membuat lingkaran baru dari nilai koordinat dan radius
     */
    public static fromValues(x: number, y: number, radius: number): Circle {
        return new Circle(new Vector2(x, y), radius);
    }

    /**
     * Menghitung luas lingkaran
     */
    public area(): number {
        return Math.PI * this.radius * this.radius;
    }

    /**
     * Menghitung keliling ligkaran
     */
    public circumference(): number {
        return 2 * Math.PI * this.radius;
    }

    /**
     * Mengatur posisi pusat dan radius lingkaran saat ini
     */
    public set(x: number, y: number, radius: number): this {
        this.center.set(x, y);
        this.radius = Math.max(0, radius);
        return this;
    }

    /**
     * Menyalin nilai dari lingkaran lain ke lingkaran ini
     */
    public copyFrom(other: Circle): this {
        this.center.copy(other.center);
        this.radius = other.radius;
        return this;
    }

    /**
     * Membuat kloning dari lingkaran ini
     */
    public clone(): Circle {
        return new Circle(this.center, this.radius);
    }

    /**
     * Menggeser posisi lingkaran sejauh offset tertentu
     */
    public translate(offset: IVector2): Circle {
        return new Circle(this.center.add(offset), this.radius);
    }

    /**
     * Menggeser posisi lingkaran saat ini in-place
     */
    public translateMut(offset: IVector2): this {
        this.center.addMut(offset);
        return this;
    }

    /**
     * Mengubah ukuran radius berdasarkan skala
     */
    public scale(factor: number): Circle {
        return new Circle(this.center, this.radius * factor);
    }

    /**
     * Mengubah ukuran radius saat ini in-place
     */
    public scaleMut(factor: number): this {
        this.radius = Math.max(0, this.radius * factor);
        return this;
    }

    /**
     * Memeriksa apakah sebuah titik berada di dalam atau tepat pada batas lingkaran
     * Menggunakan perbandingan jarak kuadrat untuk efisiensi CPU
     */
    public containsPoint(point: IVector2): boolean {
        const dx = point.x - this.center.x;
        const dy = point.y - this.center.y;
        const distSq = dx * dx + dy * dy;
        return distSq <= this.radius * this.radius + EPSILON;
    }

    /**
     * Mencari titik pada batas permukaan lingkaran yang paling dekat dengan titik target
     * Jika titik target berada di pusat lingkaran, titik terdakat diarahkan ke kanan secara default
     */
    public closestPoint(point: IVector2, out?: Vector2): Vector2 {
        const result = out ?? new Vector2();
        const dx = point.x - this.center.x;
        const dy = point.y - this.center.y;
        const distSq = dx * dx + dy * dy;

        // Jika titik arget tepat berada di pusat lingkaran
        if (distSq < EPSILON) {
            return result.set(this.center.x + this.radius, this.center.y);
        }

        const dist = Math.sqrt(distSq);
        const factor = this.radius / dist;

        return result.set(
            this.center.x + dx * factor,
            this.center.y + dy * factor
        );
    }

    /**
     * Memeriksa apakah lingkaran ini tumpang tindih dengan lingkaran lain
     */
    public overlaps(other: Circle): boolean {
        const dx = other.center.x - this.center.x;
        const dy = other.center.y - this.center.y;
        const distSq = dx * dx + dy * dy;
        const radiusSum = this.radius + other.radius;

        return distSq <= radiusSum * radiusSum + EPSILON;
    }

    /**
     * Mengambil posisi titik pada keliling lingkaran berdasarkan sudut (satuan radian)
     * Berguna untuk menembakkan peluru memutar atau memunculkan partikel melingkar
     */
    public getPointAtAngle(angleInRadians: number, out?: Vector2): Vector2 {
        const result = out ?? new Vector2();
        return result.set(
            this.center.x + Math.cos(angleInRadians) * this.radius,
            this.center.y + Math.sin(angleInRadians) * this.radius
        );
    }

    /**
     * Memeriksa kesetaraan nilai antara dua lingkaran dengan toleransi floating point
     */
    public equals(other: Circle, epsilon: number = EPSILON): boolean {
        return (
            this.center.equals(other.center, epsilon) &&
            approxEqual(this.radius, other.radius, epsilon)
        );
    }
}
