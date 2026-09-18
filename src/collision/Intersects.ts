// ==========================================
// Nama File:          Intersects.ts
// Deskripsi File:     Kumpulan fungsi uji tumpang tindih cepat boolean 2D
// Penulis File:       Fawwaz Yaqzhan & Google Antigravity
// Tanggal Pembuatan:  18-09-2026
// Tanggal Pembaruan:  18-09-2026
// Catatan:
//   - Mengembalikan nilai boolean murni (true/false) tanpa menghitung detail manifold
//   - Zero-allocation untuk performa maksimal pada loop berkecepatan tinggi
//   - Mendukung Circle, AABB, LineSegment, Capsule, dan Polygon
// ==========================================


import { Vector2 } from "../core/Vector2.js";
import { clamp } from "../core/MathUtils.js";
import { Circle } from "../geometry/Circle.js";
import { AABB } from "../geometry/AABB.js";
import { LineSegment } from "../geometry/LineSegment.js";
import { Capsule } from "../geometry/Capsule.js";
import { Polygon } from "../geometry/Polygon.js";
import { testPolygonPolygonSAT } from "./SAT.js";


/**
 * Menguji apakah dua lingkaran saling bersentuhan atau bertindih.
 */
export function circleCircle(a: Circle, b: Circle): boolean {
    const totalRadius = a.radius + b.radius;
    return a.center.distanceSquared(b.center) <= totalRadius * totalRadius;
}


/**
 * Menguji apakah dua AABB saling bertindih.
 */
export function aabbAABB(a: AABB, b: AABB): boolean {
    return a.intersects(b);
}


/**
 * Menguji apakah sebuah lingkaran bertindih dengan AABB.
 */
export function circleAABB(circle: Circle, aabb: AABB): boolean {
    const closestX = clamp(circle.center.x, aabb.min.x, aabb.max.x);
    const closestY = clamp(circle.center.y, aabb.min.y, aabb.max.y);

    const dx = circle.center.x - closestX;
    const dy = circle.center.y - closestY;

    return dx * dx + dy * dy <= circle.radius * circle.radius;
}


/**
 * Menguji apakah segmen garis menyentuh atau memotong lingkaran.
 */
export function lineCircle(line: LineSegment, circle: Circle): boolean {
    return line.distanceToPointSquared(circle.center) <= circle.radius * circle.radius;
}


/**
 * Menguji apakah dua segmen garis saling berpotongan.
 */
export function lineLine(a: LineSegment, b: LineSegment): boolean {
    return a.intersects(b);
}


/**
 * Menguji apakah segmen garis memotong atau berada di dalam AABB.
 */
export function lineAABB(line: LineSegment, aabb: AABB): boolean {
    // 1. Jika salah satu ujung garis berada di dalam AABB
    if (aabb.containsPoint(line.start) || aabb.containsPoint(line.end)) {
        return true;
    }

    // 2. Jika bounding box garis tidak tumpang tindih dengan AABB, langsung gagal
    const lineBox = line.getBoundingBox();
    if (!aabb.intersects(lineBox)) {
        return false;
    }

    // 3. Uji perpotongan garis terhadap 4 sisi batas AABB
    const minX = aabb.min.x;
    const maxX = aabb.max.x;
    const minY = aabb.min.y;
    const maxY = aabb.max.y;

    const corners = [
        new Vector2(minX, minY),
        new Vector2(maxX, minY),
        new Vector2(maxX, maxY),
        new Vector2(minX, maxY),
    ];

    for (let i = 0; i < 4; i++) {
        const edge = new LineSegment(corners[i], corners[(i + 1) % 4]);
        if (line.intersects(edge)) {
            return true;
        }
    }

    return false;
}


/**
 * Menguji apakah sebuah kapsul bertindih dengan lingkaran.
 */
export function capsuleCircle(capsule: Capsule, circle: Circle): boolean {
    const totalRadius = capsule.radius + circle.radius;
    return (
        capsule.segment.distanceToPointSquared(circle.center) <=
        totalRadius * totalRadius
    );
}


/**
 * Menghitung jarak terpendek antara dua segmen garis 2D.
 */
export function distanceBetweenSegments(s1: LineSegment, s2: LineSegment): number {
    if (s1.intersects(s2)) {
        return 0;
    }

    const d1 = s1.distanceToPoint(s2.start);
    const d2 = s1.distanceToPoint(s2.end);
    const d3 = s2.distanceToPoint(s1.start);
    const d4 = s2.distanceToPoint(s1.end);

    return Math.min(d1, d2, d3, d4);
}


/**
 * Menguji apakah dua kapsul saling bertindih.
 */
export function capsuleCapsule(a: Capsule, b: Capsule): boolean {
    const totalRadius = a.radius + b.radius;
    const dist = distanceBetweenSegments(a.segment, b.segment);
    return dist <= totalRadius;
}


/**
 * Menguji apakah kapsul bertindih dengan AABB.
 */
export function capsuleAABB(capsule: Capsule, aabb: AABB): boolean {
    // Broadphase: cek apakah AABB pembungkus kapsul bertindih dengan AABB target
    if (!capsule.getAABB().intersects(aabb)) {
        return false;
    }

    // Jika segmen tengah memotong AABB
    if (lineAABB(capsule.segment, aabb)) {
        return true;
    }

    // Cek apakah ada sudut AABB yang berada di dalam radius kapsul
    const minX = aabb.min.x;
    const maxX = aabb.max.x;
    const minY = aabb.min.y;
    const maxY = aabb.max.y;

    const corners = [
        { x: minX, y: minY },
        { x: maxX, y: minY },
        { x: maxX, y: maxY },
        { x: minX, y: maxY },
    ];

    const rSq = capsule.radius * capsule.radius;
    for (const corner of corners) {
        if (capsule.segment.distanceToPointSquared(corner) <= rSq) {
            return true;
        }
    }

    return false;
}


/**
 * Menguji apakah poligon bertindih dengan lingkaran.
 */
export function polygonCircle(polygon: Polygon, circle: Circle): boolean {
    // 1. Jika titik pusat lingkaran berada di dalam poligon
    if (polygon.containsPoint(circle.center)) {
        return true;
    }

    // 2. Jika lingkaran menyentuh salah satu sisi poligon
    const rSq = circle.radius * circle.radius;
    const count = polygon.vertexCount;
    for (let i = 0; i < count; i++) {
        const edge = polygon.getEdge(i);
        if (edge.distanceToPointSquared(circle.center) <= rSq) {
            return true;
        }
    }

    return false;
}


/**
 * Menguji apakah poligon cembung bertindih dengan AABB.
 */
export function polygonAABB(polygon: Polygon, aabb: AABB): boolean {
    // Bangun poligon segiempat dari AABB
    const aabbPoly = Polygon.createBox(
        aabb.getCenter(),
        aabb.width,
        aabb.height
    );
    return testPolygonPolygonSAT(polygon, aabbPoly);
}


/**
 * Menguji apakah dua poligon cembung saling bertindih (menggunakan SAT).
 */
export function polygonPolygon(polyA: Polygon, polyB: Polygon): boolean {
    return testPolygonPolygonSAT(polyA, polyB);
}
