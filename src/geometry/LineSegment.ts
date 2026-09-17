// ==========================================
// Nama File:          LineSegment.ts
// Deskripsi File:     Representasi geometris segmen garis 2 dimensi
// Penulis File:       Fawwaz Yaqzhan & Google Antigravity
// Tanggal Pembuatan:  17-09-2026
// Tanggal Pembaruan:  17-09-2026
// Catatan:
//   - Segmen garis berhingga antara titik awal (start) dan akhir (end)
//   - Menggunakan proyeksi skalar t [0, 1] untuk mencari titik terdekat
//   - Dilengkapi vektor normal tegak lurus untuk kalkulasi pantulan fisika
//   - Deteksi perpotongan dua garis menggunakan 2D cross product
// ==========================================


import { Vector2 } from "../core/Vector2.js";
import { IVector2 } from "../core/types.js";
import { clamp, EPSILON } from "../core/MathUtils.js";
import { AABB } from "./AABB.js";


/**
 * Kelas representasi bentuk Geometri Segmen Garis 2 Dimensi.
 */
export class LineSegment {
    // Titik awal segmen garis
    public start: Vector2;

    // Titik akhir segmen garis
    public end: Vector2;

    /**
     * Konstruktor
     * @param start Titik awal garis (default: (0, 0))
     * @param end Titik akhir garis (default: (0, 0))
     */
    constructor(start: IVector2 = Vector2.zero(), end: IVector2 = Vector2.zero()) {
        this.start = new Vector2(start.x, start.y);
        this.end = new Vector2(end.x, end.y);
    }

    /**
     * Membuat segmen garis baru dari 4 nilai koordinat
     */
    public static fromValues(x1: number, y1: number, x2: number, y2: number): LineSegment {
        return new LineSegment(new Vector2(x1, y1), new Vector2(x2, y2));
    }

    /**
     * Mengatur koordinat titik awal dan titik akhir in-place
     */
    public set(x1: number, y1: number, x2: number, y2: number): this {
        this.start.set(x1, y1);
        this.end.set(x2, y2);
        return this;
    }

    /**
     * Menyalin nilai dari segmen garis lain ke segmen garis ini
     */
    public copyFrom(other: LineSegment): this {
        this.start.copy(other.start);
        this.end.copy(other.end);
        return this;
    }

    /**
     * Membuat kloning instance baru dari segmen garis ini
     */
    public clone(): LineSegment {
        return new LineSegment(this.start, this.end);
    }

    /**
     * Menghitung panjang segmen garis
     */
    public length(): number {
        return this.start.distance(this.end);
    }

    /**
     * Menghitung panjang kuadrat segmen garis (lebih cepat tanpa Math.sqrt)
     */
    public lengthSquared(): number {
        return this.start.distanceSquared(this.end);
    }

    /**
     * Menghitung vektor arah yang ternormalisasi (panjang = 1) dari start ke end
     */
    public getDirection(out?: Vector2): Vector2 {
        const result = out ?? new Vector2();
        result.set(this.end.x - this.start.x, this.end.y - this.start.y);
        return result.normalizeMut();
    }

    /**
     * Menghitung vektor normal satuan yang tegak lurus terhadap garis.
     * Mengarah ke sebelah kiri dari arah garis.
     * Sangat berguna untuk respon pantulan bola atau deteksi sisi tabrakan.
     */
    public getNormal(out?: Vector2): Vector2 {
        const result = out ?? new Vector2();
        const dx = this.end.x - this.start.x;
        const dy = this.end.y - this.start.y;
        // Vektor tegak lurus 90 derajat: (-dy, dx)
        result.set(-dy, dx);
        return result.normalizeMut();
    }

    /**
     * Menghitung titik tengah dari segmen garis
     */
    public getMidpoint(out?: Vector2): Vector2 {
        const result = out ?? new Vector2();
        return result.set(
            (this.start.x + this.end.x) * 0.5,
            (this.start.y + this.end.y) * 0.5
        );
    }

    /**
     * Mengambil posisi titik pada garis berdasarkan interpolasi t di rentang [0, 1].
     * t = 0 menghasilkan start, t = 1 menghasilkan end, t = 0.5 menghasilkan midpoint.
     */
    public getPointAt(t: number, out?: Vector2): Vector2 {
        const result = out ?? new Vector2();
        return result.set(
            this.start.x + (this.end.x - this.start.x) * t,
            this.start.y + (this.end.y - this.start.y) * t
        );
    }

    /**
     * Menggeser segmen garis sejauh offset tertentu
     */
    public translate(offset: IVector2): LineSegment {
        return new LineSegment(this.start.add(offset), this.end.add(offset));
    }

    /**
     * Menggeser segmen garis saat ini secara langsung
     */
    public translateMut(offset: IVector2): this {
        this.start.addMut(offset);
        this.end.addMut(offset);
        return this;
    }

    /**
     * Menghitung faktor proyeksi skalar t [0, 1] dari suatu titik terhadap garis.
     */
    public projectPointFactor(point: IVector2): number {
        const dx = this.end.x - this.start.x;
        const dy = this.end.y - this.start.y;
        const lenSq = dx * dx + dy * dy;

        if (lenSq < EPSILON) {
            return 0; // Garis memiliki panjang 0
        }

        const dot = (point.x - this.start.x) * dx + (point.y - this.start.y) * dy;
        return clamp(dot / lenSq, 0, 1);
    }

    /**
     * Mencari titik pada segmen garis yang paling dekat dengan titik target.
     * 
     * @param point Titik target
     * @param out Vektor penampung hasil opsional
     */
    public closestPoint(point: IVector2, out?: Vector2): Vector2 {
        const t = this.projectPointFactor(point);
        return this.getPointAt(t, out);
    }

    /**
     * Menghitung jarak terdekat dari sebuah titik ke segmen garis
     */
    public distanceToPoint(point: IVector2): number {
        const closest = this.closestPoint(point);
        return closest.distance(point);
    }

    /**
     * Menghitung jarak kuadrat dari sebuah titik ke segmen garis
     */
    public distanceToPointSquared(point: IVector2): number {
        const closest = this.closestPoint(point);
        return closest.distanceSquared(point);
    }

    /**
     * Menghitung kotak pembungkus AABB terkecil yang melingkupi garis ini
     */
    public getBoundingBox(): AABB {
        return AABB.fromPoints([this.start, this.end]);
    }

    /**
     * Memeriksa apakah segmen garis ini berpotongan dengan segmen garis lain
     */
    public intersects(other: LineSegment): boolean {
        return this.getIntersection(other) !== null;
    }

    /**
     * Mencari titik perpotongan antara segmen garis ini dengan segmen garis lain.
     * Mengembalikan null jika kedua garis sejajar atau tidak berpotongan.
     * 
     * @param other Garis lain yang akan diuji
     * @param out Vektor penampung hasil jika terjadi perpotongan
     */
    public getIntersection(other: LineSegment, out?: Vector2): Vector2 | null {
        const rX = this.end.x - this.start.x;
        const rY = this.end.y - this.start.y;
        const sX = other.end.x - other.start.x;
        const sY = other.end.y - other.start.y;

        // 2D Cross Product (Perp-dot) antara r dan s: rX * sY - rY * sX
        const rCrossS = rX * sY - rY * sX;

        // Jika bernilai 0 (atau mendekati 0), kedua garis sejajar atau kolinier
        if (Math.abs(rCrossS) < EPSILON) {
            return null;
        }

        const qpX = other.start.x - this.start.x;
        const qpY = other.start.y - this.start.y;

        // Faktor rasio t untuk garis ini dan u untuk garis other
        const t = (qpX * sY - qpY * sX) / rCrossS;
        const u = (qpX * rY - qpY * rX) / rCrossS;

        // Kedua garis berpotongan jika t dan u sama-sama berada di dalam rentang [0, 1]
        if (t >= -EPSILON && t <= 1 + EPSILON && u >= -EPSILON && u <= 1 + EPSILON) {
            const result = out ?? new Vector2();
            return result.set(this.start.x + t * rX, this.start.y + t * rY);
        }

        return null;
    }

    /**
     * Memeriksa kesetaraan nilai antara dua segmen garis
     */
    public equals(other: LineSegment, epsilon: number = EPSILON): boolean {
        return (
            this.start.equals(other.start, epsilon) &&
            this.end.equals(other.end, epsilon)
        );
    }
}
