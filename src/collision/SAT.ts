// ==========================================
// Nama File:          SAT.ts
// Deskripsi File:     Implementasi Teorema Sumbu Pemisah (Separating Axis Theorem / SAT)
// Penulis File:       Fawwaz Yaqzhan & Google Antigravity
// Tanggal Pembuatan:  18-09-2026
// Tanggal Pembaruan:  18-09-2026
// Catatan:
//   - SAT membuktikan bahwa dua bentuk cembung bertabrakkan jika dan hanya jika
//     tidak ada sumbu proyeksi di mana bayangan kedua bentuk tersebut terpisah.
//   - Mendukung perhitungan Minimum Translation Vector (MTV) untuk pemisahan fisik objek.
// ==========================================


import { Vector2 } from "../core/Vector2.js";
import { EPSILON } from "../core/MathUtils.js";
import { Polygon } from "../geometry/Polygon.js";
import { Circle } from "../geometry/Circle.js";
import { CollisionResult } from "./types.js";


/**
 * Antarmuka interval 1D hasil proyeksi bentuk geometris ke suatu sumbu
 */
export interface IInterval {
    min: number;
    max: number;
}


/**
 * Memproyeksikan seluruh simpul poligon ke sebuah sumbu satuan.
 */
export function projectPolygonOnAxis(
    polygon: Polygon,
    axis: Vector2,
    out?: IInterval
): IInterval {
    const result = out ?? { min: 0, max: 0 };
    const vertices = polygon.vertices;
    if (vertices.length === 0) {
        result.min = 0;
        result.max = 0;
        return result;
    }

    let min = vertices[0].dot(axis);
    let max = min;

    for (let i = 1; i < vertices.length; i++) {
        const dot = vertices[i].dot(axis);
        if (dot < min) min = dot;
        if (dot > max) max = dot;
    }

    result.min = min;
    result.max = max;
    return result;
}


/**
 * Memproyeksikan lingkaran ke sebuah sumbu satuan.
 */
export function projectCircleOnAxis(
    circle: Circle,
    axis: Vector2,
    out?: IInterval
): IInterval {
    const result = out ?? { min: 0, max: 0 };
    const centerDot = circle.center.dot(axis);
    result.min = centerDot - circle.radius;
    result.max = centerDot + circle.radius;
    return result;
}


/**
 * Menghitung besar tumpang tindih (overlap) antara dua interval 1D.
 * Mengembalikan nilai > 0 jika tumpang tindih, atau <= 0 jika terpisah.
 */
export function getIntervalOverlap(a: IInterval, b: IInterval): number {
    return Math.min(a.max, b.max) - Math.max(a.min, b.min);
}


/**
 * Menguji apakah dua poligon cembung saling tumpang tindih menggunakan SAT.
 */
export function testPolygonPolygonSAT(polyA: Polygon, polyB: Polygon): boolean {
    if (polyA.vertexCount < 3 || polyB.vertexCount < 3) return false;

    // Kumpulkan sumbu pengujian: normal dari sisi polyA dan polyB
    const axesA = polyA.getEdgeNormals();
    for (const axis of axesA) {
        const intA = projectPolygonOnAxis(polyA, axis);
        const intB = projectPolygonOnAxis(polyB, axis);
        if (getIntervalOverlap(intA, intB) <= 0) {
            return false; // Ditemukan celah pemisah
        }
    }

    const axesB = polyB.getEdgeNormals();
    for (const axis of axesB) {
        const intA = projectPolygonOnAxis(polyA, axis);
        const intB = projectPolygonOnAxis(polyB, axis);
        if (getIntervalOverlap(intA, intB) <= 0) {
            return false; // Ditemukan celah pemisah
        }
    }

    return true;
}


/**
 * Mendeteksi tabrakan mendalam antara dua poligon cembung menggunakan SAT
 * dan menghitung Minimum Translation Vector (MTV).
 * 
 * @param polyA Objek Poligon A
 * @param polyB Objek Poligon B
 * @param out CollisionResult penampung hasil opsional
 */
export function collidePolygonPolygonSAT(
    polyA: Polygon,
    polyB: Polygon,
    out?: CollisionResult
): CollisionResult {
    const result = out ?? new CollisionResult();
    result.reset();

    if (polyA.vertexCount < 3 || polyB.vertexCount < 3) {
        return result;
    }

    let minOverlap = Number.POSITIVE_INFINITY;
    let smallestAxis = new Vector2();

    const intervalA: IInterval = { min: 0, max: 0 };
    const intervalB: IInterval = { min: 0, max: 0 };

    // 1. Uji sumbu-sumbu dari polyA
    const axesA = polyA.getEdgeNormals();
    for (const axis of axesA) {
        projectPolygonOnAxis(polyA, axis, intervalA);
        projectPolygonOnAxis(polyB, axis, intervalB);
        const overlap = getIntervalOverlap(intervalA, intervalB);

        if (overlap <= 0) {
            return result; // Terpisah
        }

        if (overlap < minOverlap) {
            minOverlap = overlap;
            smallestAxis.copy(axis);
        }
    }

    // 2. Uji sumbu-sumbu dari polyB
    const axesB = polyB.getEdgeNormals();
    for (const axis of axesB) {
        projectPolygonOnAxis(polyA, axis, intervalA);
        projectPolygonOnAxis(polyB, axis, intervalB);
        const overlap = getIntervalOverlap(intervalA, intervalB);

        if (overlap <= 0) {
            return result; // Terpisah
        }

        if (overlap < minOverlap) {
            minOverlap = overlap;
            smallestAxis.copy(axis);
        }
    }

    // Pastikan arah normal mengarah dari polyA menuju polyB
    const centerA = polyA.getCentroid();
    const centerB = polyB.getCentroid();
    const dir = centerB.sub(centerA);

    if (smallestAxis.dot(dir) < 0) {
        smallestAxis.negateMut();
    }

    // Hitung titik kontak pendekatan
    const contactPoint = centerA.add(smallestAxis.scale(minOverlap * 0.5));

    result.set(
        true,
        smallestAxis.x,
        smallestAxis.y,
        minOverlap,
        contactPoint.x,
        contactPoint.y
    );

    return result;
}


/**
 * Mendeteksi tabrakan mendalam antara poligon cembung dan lingkaran menggunakan SAT.
 */
export function collidePolygonCircleSAT(
    poly: Polygon,
    circle: Circle,
    out?: CollisionResult
): CollisionResult {
    const result = out ?? new CollisionResult();
    result.reset();

    if (poly.vertexCount < 3) return result;

    let minOverlap = Number.POSITIVE_INFINITY;
    let smallestAxis = new Vector2();

    const intervalA: IInterval = { min: 0, max: 0 };
    const intervalB: IInterval = { min: 0, max: 0 };

    // 1. Sumbu dari normal sisi poligon
    const axes = poly.getEdgeNormals();

    // 2. Sumbu tambahan: dari simpul poligon terdekat ke titik pusat lingkaran
    let closestVertexDistSq = Number.POSITIVE_INFINITY;
    let closestVertex = poly.vertices[0];

    for (const v of poly.vertices) {
        const dSq = v.distanceSquared(circle.center);
        if (dSq < closestVertexDistSq) {
            closestVertexDistSq = dSq;
            closestVertex = v;
        }
    }

    const circleAxis = circle.center.sub(closestVertex);
    if (circleAxis.lengthSquared() > EPSILON * EPSILON) {
        axes.push(circleAxis.normalizeMut());
    }

    // Uji semua sumbu
    for (const axis of axes) {
        projectPolygonOnAxis(poly, axis, intervalA);
        projectCircleOnAxis(circle, axis, intervalB);
        const overlap = getIntervalOverlap(intervalA, intervalB);

        if (overlap <= 0) {
            return result; // Terpisah
        }

        if (overlap < minOverlap) {
            minOverlap = overlap;
            smallestAxis.copy(axis);
        }
    }

    // Pastikan normal mengarah dari poligon menuju lingkaran
    const polyCenter = poly.getCentroid();
    const dir = circle.center.sub(polyCenter);

    if (smallestAxis.dot(dir) < 0) {
        smallestAxis.negateMut();
    }

    // Titik kontak pada tepi lingkaran
    const contactPoint = circle.center.sub(smallestAxis.scale(circle.radius));

    result.set(
        true,
        smallestAxis.x,
        smallestAxis.y,
        minOverlap,
        contactPoint.x,
        contactPoint.y
    );

    return result;
}
