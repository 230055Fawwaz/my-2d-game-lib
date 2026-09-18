// ==========================================
// Nama File:          Capsule.ts
// Deskripsi File:     Representasi geometris kapsul 2 dimensi (Capsule 2D)
// Penulis File:       Fawwaz Yaqzhan & Google Antigravity
// Tanggal Pembuatan:  18-09-2026
// Tanggal Pembaruan:  18-09-2026
// Catatan:
//   - Kapsul didefinisikan oleh segmen garis tengah (LineSegment) dan jari-jari (radius)
//   - Bentuk standar collider karakter dalam game 2D (mencegah tersangkut di sudut tajam)
//   - Mendukung perhitungan titik terdekat, bounding box AABB, dan containsPoint
// ==========================================


import { Vector2 } from "../core/Vector2.js";
import { IVector2 } from "../core/types.js";
import { approxEqual, EPSILON } from "../core/MathUtils.js";
import { LineSegment } from "./LineSegment.js";
import { AABB } from "./AABB.js";


/**
 * Kelas representasi bentuk Kapsul 2 Dimensi (Capsule 2D).
 */
export class Capsule {
    // Segmen garis poros tengah kapsul
    public segment: LineSegment;

    // Jari-jari ketebalan kapsul
    public radius: number;

    /**
     * Konstruktor Capsule
     * @param start Titik awal poros kapsul (default: (0, 0))
     * @param end Titik akhir poros kapsul (default: (0, 0))
     * @param radius Jari-jari kapsul (default: 0)
     */
    constructor(start: IVector2 = Vector2.zero(), end: IVector2 = Vector2.zero(), radius: number = 0) {
        this.segment = new LineSegment(start, end);
        this.radius = Math.max(0, radius);
    }

    /**
     * Membuat instance Capsule dari segmen garis yang sudah ada dan radius
     */
    public static fromSegment(segment: LineSegment, radius: number): Capsule {
        return new Capsule(segment.start, segment.end, radius);
    }

    /**
     * Membuat instance Capsule langsung dari 5 nilai komponen skalar
     */
    public static fromValues(x1: number, y1: number, x2: number, y2: number, radius: number): Capsule {
        return new Capsule(new Vector2(x1, y1), new Vector2(x2, y2), radius);
    }

    /**
     * Titik awal segmen tengah kapsul
     */
    public get start(): Vector2 {
        return this.segment.start;
    }

    public set start(value: Vector2) {
        this.segment.start.copy(value);
    }

    /**
     * Titik akhir segmen tengah kapsul
     */
    public get end(): Vector2 {
        return this.segment.end;
    }

    public set end(value: Vector2) {
        this.segment.end.copy(value);
    }

    /**
     * Panjang segmen garis tengah kapsul
     */
    public get length(): number {
        return this.segment.length();
    }

    /**
     * Panjang total kapsul ujung-ke-ujung (panjang segmen + 2 * radius)
     */
    public get totalLength(): number {
        return this.segment.length() + 2 * this.radius;
    }

    /**
     * Mengatur nilai koordinat titik awal, titik akhir, dan radius in-place
     */
    public set(x1: number, y1: number, x2: number, y2: number, radius: number): this {
        this.segment.set(x1, y1, x2, y2);
        this.radius = Math.max(0, radius);
        return this;
    }

    /**
     * Menyalin nilai dari kapsul lain
     */
    public copyFrom(other: Capsule): this {
        this.segment.copyFrom(other.segment);
        this.radius = other.radius;
        return this;
    }

    /**
     * Membuat kloning instance Capsule baru
     */
    public clone(): Capsule {
        return new Capsule(this.segment.start, this.segment.end, this.radius);
    }

    /**
     * Menghitung total luas kapsul (luas persegi panjang tengah + dua setengah lingkaran)
     */
    public area(): number {
        const rectArea = this.segment.length() * (2 * this.radius);
        const circleArea = Math.PI * this.radius * this.radius;
        return rectArea + circleArea;
    }

    /**
     * Menghitung keliling perimeter kapsul
     */
    public perimeter(): number {
        return 2 * this.segment.length() + 2 * Math.PI * this.radius;
    }

    /**
     * Memeriksa apakah sebuah titik berada di dalam kapsul
     */
    public containsPoint(point: IVector2): boolean {
        const distSq = this.segment.distanceToPointSquared(point);
        const r = this.radius;
        return distSq <= r * r + EPSILON;
    }

    /**
     * Mencari titik terdekat pada kapsul (volume) terhadap titik target.
     * Jika titik berada di dalam kapsul, titik itu sendiri dikembalikan.
     * Jika di luar, titik terdekat pada batas permukaan kapsul dikembalikan.
     */
    public closestPoint(point: IVector2, out?: Vector2): Vector2 {
        const segClosest = this.segment.closestPoint(point);
        const distSq = segClosest.distanceSquared(point);
        const result = out ?? new Vector2();

        if (distSq <= this.radius * this.radius) {
            return result.set(point.x, point.y);
        }

        const dist = Math.sqrt(distSq);
        if (dist < EPSILON) {
            return result.set(segClosest.x, segClosest.y);
        }

        const nx = (point.x - segClosest.x) / dist;
        const ny = (point.y - segClosest.y) / dist;
        return result.set(
            segClosest.x + nx * this.radius,
            segClosest.y + ny * this.radius
        );
    }

    /**
     * Mencari titik terdekat pada segmen poros tengah kapsul
     */
    public closestPointOnSegment(point: IVector2, out?: Vector2): Vector2 {
        return this.segment.closestPoint(point, out);
    }

    /**
     * Menghitung jarak terpendek dari titik target ke batas luar kapsul.
     * Mengembalikan 0 jika titik berada di dalam kapsul.
     */
    public distanceToPoint(point: IVector2): number {
        const distToSegment = this.segment.distanceToPoint(point);
        return Math.max(0, distToSegment - this.radius);
    }

    /**
     * Menghitung kuadrat jarak dari titik target ke batas luar kapsul
     */
    public distanceSquaredToPoint(point: IVector2): number {
        const dist = this.distanceToPoint(point);
        return dist * dist;
    }

    /**
     * Menghitung kotak pembungkus AABB terkecil yang melingkupi kapsul ini
     */
    public getAABB(): AABB {
        const minX = Math.min(this.segment.start.x, this.segment.end.x) - this.radius;
        const minY = Math.min(this.segment.start.y, this.segment.end.y) - this.radius;
        const maxX = Math.max(this.segment.start.x, this.segment.end.x) + this.radius;
        const maxY = Math.max(this.segment.start.y, this.segment.end.y) + this.radius;
        return AABB.fromMinMax(minX, minY, maxX, maxY);
    }

    /**
     * Menggeser posisi kapsul sejauh offset tertentu
     */
    public translate(offset: IVector2): Capsule {
        return new Capsule(
            this.segment.start.add(offset),
            this.segment.end.add(offset),
            this.radius
        );
    }

    /**
     * Menggeser posisi kapsul secara in-place
     */
    public translateMut(offset: IVector2): this {
        this.segment.translateMut(offset);
        return this;
    }

    /**
     * Memutar posisi kapsul sebesar sudut radian tertentu terhadap titik poros (pivot)
     */
    public rotate(angleRad: number, origin: IVector2 = Vector2.zero()): Capsule {
        const cos = Math.cos(angleRad);
        const sin = Math.sin(angleRad);
        const ox = origin.x;
        const oy = origin.y;

        const rotatePoint = (p: Vector2): Vector2 => {
            const dx = p.x - ox;
            const dy = p.y - oy;
            return new Vector2(
                ox + dx * cos - dy * sin,
                oy + dx * sin + dy * cos
            );
        };

        return new Capsule(
            rotatePoint(this.segment.start),
            rotatePoint(this.segment.end),
            this.radius
        );
    }

    /**
     * Memutar posisi kapsul sebesar sudut radian tertentu secara in-place
     */
    public rotateMut(angleRad: number, origin: IVector2 = Vector2.zero()): this {
        const cos = Math.cos(angleRad);
        const sin = Math.sin(angleRad);
        const ox = origin.x;
        const oy = origin.y;

        const rotateInPlace = (p: Vector2) => {
            const dx = p.x - ox;
            const dy = p.y - oy;
            p.set(ox + dx * cos - dy * sin, oy + dx * sin + dy * cos);
        };

        rotateInPlace(this.segment.start);
        rotateInPlace(this.segment.end);
        return this;
    }

    /**
     * Memeriksa kesetaraan dengan Capsule lain dalam toleransi epsilon
     */
    public equals(other: Capsule, epsilon: number = EPSILON): boolean {
        return (
            this.segment.equals(other.segment, epsilon) &&
            approxEqual(this.radius, other.radius, epsilon)
        );
    }
}
