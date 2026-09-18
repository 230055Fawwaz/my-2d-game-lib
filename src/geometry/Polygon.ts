// ==========================================
// Nama File:          Polygon.ts
// Deskripsi File:     Representasi geometris poligon 2 dimensi
// Penulis File:       Fawwaz Yaqzhan & Google Antigravity
// Tanggal Pembuatan:  18-09-2026
// Tanggal Pembaruan:  18-09-2026
// Catatan:
//   - Poligon didefinisikan oleh array titik simpul (vertices) berurutan
//   - Menghitung luas (Shoelace formula), keliling, dan pusat massa (centroid)
//   - Mendukung pengecekan konveksitas (isConvex) untuk algoritma SAT
//   - Pengecekan titik di dalam poligon (Point-in-Polygon) dengan ray-casting algorithm
// ==========================================


import { Vector2 } from "../core/Vector2.js";
import { IVector2 } from "../core/types.js";
import { EPSILON } from "../core/MathUtils.js";
import { AABB } from "./AABB.js";
import { LineSegment } from "./LineSegment.js";


/**
 * Kelas representasi bentuk Geometri Poligon 2 Dimensi.
 */
export class Polygon {
    // Kumpulan titik simpul poligon berurutan
    public vertices: Vector2[];

    /**
     * Konstruktor Polygon
     * @param vertices Array titik simpul pembentuk poligon
     */
    constructor(vertices: IVector2[] = []) {
        this.vertices = vertices.map((v) => new Vector2(v.x, v.y));
    }

    /**
     * Membuat instance Polygon baru dari kumpulan titik koordinat
     */
    public static fromPoints(points: IVector2[]): Polygon {
        return new Polygon(points);
    }

    /**
     * Membuat poligon kotak (persegi panjang) dari titik pusat, lebar, dan tinggi
     */
    public static createBox(center: IVector2, width: number, height: number): Polygon {
        const hw = Math.abs(width) * 0.5;
        const hh = Math.abs(height) * 0.5;

        return new Polygon([
            new Vector2(center.x - hw, center.y - hh), // Kiri-atas
            new Vector2(center.x + hw, center.y - hh), // Kanan-atas
            new Vector2(center.x + hw, center.y + hh), // Kanan-bawah
            new Vector2(center.x - hw, center.y + hh), // Kiri-bawah
        ]);
    }

    /**
     * Membuat poligon beraturan (segitiga sama sisi, pentagon, heksagon, dsb.)
     * @param sides Jumlah sisi (minimal 3)
     * @param radius Jari-jari dari titik pusat ke simpul
     * @param center Titik pusat poligon
     */
    public static createRegular(sides: number, radius: number, center: IVector2 = Vector2.zero()): Polygon {
        const count = Math.max(3, Math.floor(sides));
        const r = Math.max(0, radius);
        const vertices: Vector2[] = [];
        const step = (Math.PI * 2) / count;

        for (let i = 0; i < count; i++) {
            const angle = i * step;
            vertices.push(
                new Vector2(
                    center.x + Math.cos(angle) * r,
                    center.y + Math.sin(angle) * r
                )
            );
        }

        return new Polygon(vertices);
    }

    /**
     * Jumlah simpul pada poligon
     */
    public get vertexCount(): number {
        return this.vertices.length;
    }

    /**
     * Mendapatkan simpul pada indeks tertentu dengan pengulangan melingkar (modulo)
     */
    public getVertex(index: number): Vector2 {
        const n = this.vertices.length;
        if (n === 0) {
            return Vector2.zero();
        }
        const safeIndex = ((index % n) + n) % n;
        return this.vertices[safeIndex];
    }

    /**
     * Mendapatkan segmen garis sisi pada indeks ke-i (menghubungkan vertex[i] ke vertex[i + 1])
     */
    public getEdge(index: number): LineSegment {
        const n = this.vertices.length;
        if (n < 2) {
            return new LineSegment();
        }
        const v1 = this.getVertex(index);
        const v2 = this.getVertex(index + 1);
        return new LineSegment(v1, v2);
    }

    /**
     * Menghitung luas bertanda (signed area) poligon menggunakan Shoelace formula.
     * Bernilai positif jika simpul berlawanan arah jarum jam (CCW),
     * bernilai negatif jika searah jarum jam (CW).
     */
    public signedArea(): number {
        const n = this.vertices.length;
        if (n < 3) return 0;

        let sum = 0;
        for (let i = 0; i < n; i++) {
            const current = this.vertices[i];
            const next = this.vertices[(i + 1) % n];
            sum += current.x * next.y - next.x * current.y;
        }
        return sum * 0.5;
    }

    /**
     * Menghitung luas mutlak poligon
     */
    public area(): number {
        return Math.abs(this.signedArea());
    }

    /**
     * Memeriksa apakah urutan simpul searah jarum jam (Clockwise)
     */
    public isClockwise(): boolean {
        return this.signedArea() < 0;
    }

    /**
     * Menghitung total keliling poligon
     */
    public perimeter(): number {
        const n = this.vertices.length;
        if (n < 2) return 0;

        let total = 0;
        for (let i = 0; i < n; i++) {
            total += this.vertices[i].distance(this.vertices[(i + 1) % n]);
        }
        return total;
    }

    /**
     * Menghitung titik pusat massa (centroid) poligon
     */
    public getCentroid(out?: Vector2): Vector2 {
        const result = out ?? new Vector2();
        const n = this.vertices.length;

        if (n === 0) {
            return result.set(0, 0);
        }
        if (n < 3) {
            let sumX = 0;
            let sumY = 0;
            for (const v of this.vertices) {
                sumX += v.x;
                sumY += v.y;
            }
            return result.set(sumX / n, sumY / n);
        }

        let cx = 0;
        let cy = 0;
        let signedArea = 0;

        for (let i = 0; i < n; i++) {
            const current = this.vertices[i];
            const next = this.vertices[(i + 1) % n];
            const cross = current.x * next.y - next.x * current.y;
            signedArea += cross;
            cx += (current.x + next.x) * cross;
            cy += (current.y + next.y) * cross;
        }

        signedArea *= 0.5;

        if (Math.abs(signedArea) <= EPSILON) {
            let sumX = 0;
            let sumY = 0;
            for (const v of this.vertices) {
                sumX += v.x;
                sumY += v.y;
            }
            return result.set(sumX / n, sumY / n);
        }

        const factor = 1 / (6 * signedArea);
        return result.set(cx * factor, cy * factor);
    }

    /**
     * Menghitung kotak pembungkus AABB terkecil yang memuat seluruh simpul poligon
     */
    public getAABB(): AABB {
        return AABB.fromPoints(this.vertices);
    }

    /**
     * Memeriksa apakah poligon bersifat cembung (convex).
     * Sangat krusial untuk validasi sebelum menggunakan algoritma SAT (Separating Axis Theorem).
     */
    public isConvex(): boolean {
        const n = this.vertices.length;
        if (n < 3) return false;

        let sign = 0;

        for (let i = 0; i < n; i++) {
            const p1 = this.vertices[i];
            const p2 = this.vertices[(i + 1) % n];
            const p3 = this.vertices[(i + 2) % n];

            const edge1X = p2.x - p1.x;
            const edge1Y = p2.y - p1.y;
            const edge2X = p3.x - p2.x;
            const edge2Y = p3.y - p2.y;

            const cross = edge1X * edge2Y - edge1Y * edge2X;

            if (Math.abs(cross) > EPSILON) {
                const currentSign = cross > 0 ? 1 : -1;
                if (sign === 0) {
                    sign = currentSign;
                } else if (sign !== currentSign) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * Memeriksa apakah sebuah titik koordinat berada di dalam poligon
     * Menggunakan algoritma Ray-Casting (Jordan Curve Theorem).
     */
    public containsPoint(point: IVector2): boolean {
        const n = this.vertices.length;
        if (n < 3) return false;

        let inside = false;
        const px = point.x;
        const py = point.y;

        for (let i = 0, j = n - 1; i < n; j = i++) {
            const xi = this.vertices[i].x;
            const yi = this.vertices[i].y;
            const xj = this.vertices[j].x;
            const yj = this.vertices[j].y;

            const intersect =
                yi > py !== yj > py &&
                px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;

            if (intersect) {
                inside = !inside;
            }
        }

        return inside;
    }

    /**
     * Mendapatkan vektor-vektor normal tegak lurus (perpendicular) untuk setiap sisi poligon.
     * Normal ini siap digunakan sebagai sumbu proyeksi untuk algoritma tabrakan SAT.
     */
    public getEdgeNormals(out?: Vector2[]): Vector2[] {
        const n = this.vertices.length;
        const result = out ?? [];
        result.length = 0;

        for (let i = 0; i < n; i++) {
            const edge = this.getEdge(i);
            result.push(edge.getNormal());
        }

        return result;
    }

    /**
     * Membuat kloning instance poligon baru
     */
    public clone(): Polygon {
        return new Polygon(this.vertices.map((v) => v.clone()));
    }

    /**
     * Menggeser seluruh simpul poligon sejauh offset
     */
    public translate(offset: IVector2): Polygon {
        return new Polygon(this.vertices.map((v) => v.add(offset)));
    }

    /**
     * Menggeser seluruh simpul poligon sejauh offset secara in-place
     */
    public translateMut(offset: IVector2): this {
        for (const v of this.vertices) {
            v.addMut(offset);
        }
        return this;
    }

    /**
     * Memutar poligon sebesar sudut tertentu terhadap titik poros (pivot)
     */
    public rotate(angleRad: number, origin: IVector2 = Vector2.zero()): Polygon {
        const cos = Math.cos(angleRad);
        const sin = Math.sin(angleRad);
        const ox = origin.x;
        const oy = origin.y;

        const newVertices = this.vertices.map((v) => {
            const dx = v.x - ox;
            const dy = v.y - oy;
            return new Vector2(
                ox + dx * cos - dy * sin,
                oy + dx * sin + dy * cos
            );
        });

        return new Polygon(newVertices);
    }

    /**
     * Memutar poligon sebesar sudut tertentu terhadap titik poros secara in-place
     */
    public rotateMut(angleRad: number, origin: IVector2 = Vector2.zero()): this {
        const cos = Math.cos(angleRad);
        const sin = Math.sin(angleRad);
        const ox = origin.x;
        const oy = origin.y;

        for (const v of this.vertices) {
            const dx = v.x - ox;
            const dy = v.y - oy;
            v.set(ox + dx * cos - dy * sin, oy + dx * sin + dy * cos);
        }

        return this;
    }

    /**
     * Memperbesar atau memperkecil poligon terhadap titik poros tertentu
     */
    public scale(factor: number, origin: IVector2 = Vector2.zero()): Polygon {
        const ox = origin.x;
        const oy = origin.y;

        const newVertices = this.vertices.map((v) => {
            return new Vector2(
                ox + (v.x - ox) * factor,
                oy + (v.y - oy) * factor
            );
        });

        return new Polygon(newVertices);
    }

    /**
     * Memperbesar atau memperkecil poligon terhadap titik poros secara in-place
     */
    public scaleMut(factor: number, origin: IVector2 = Vector2.zero()): this {
        const ox = origin.x;
        const oy = origin.y;

        for (const v of this.vertices) {
            v.set(ox + (v.x - ox) * factor, oy + (v.y - oy) * factor);
        }

        return this;
    }

    /**
     * Memeriksa kesetaraan dengan poligon lain
     */
    public equals(other: Polygon, epsilon: number = EPSILON): boolean {
        if (this.vertices.length !== other.vertices.length) {
            return false;
        }
        for (let i = 0; i < this.vertices.length; i++) {
            if (!this.vertices[i].equals(other.vertices[i], epsilon)) {
                return false;
            }
        }
        return true;
    }
}
