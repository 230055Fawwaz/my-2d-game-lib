// ==========================================
// Nama File:          Narrowphase.ts
// Deskripsi File:     Penyelesaian detail kontak dan resolusi tabrakan 2D
// Penulis File:       Fawwaz Yaqzhan & Google Antigravity
// Tanggal Pembuatan:  18-09-2026
// Tanggal Pembaruan:  18-09-2026
// Catatan:
//   - Menghitung normal pemisah, kedalaman penetrasi, dan titik kontak
//   - Normal selalu mengarah dari Objek A ke Objek B (A mendorong B)
//   - Formula resolusi: posA -= normal * penetration
// ==========================================


import { clamp, EPSILON } from "../core/MathUtils.js";
import { Circle } from "../geometry/Circle.js";
import { AABB } from "../geometry/AABB.js";
import { Capsule } from "../geometry/Capsule.js";
import { Polygon } from "../geometry/Polygon.js";
import { CollisionResult } from "./types.js";
import {
    collidePolygonPolygonSAT,
    collidePolygonCircleSAT,
} from "./SAT.js";


/**
 * Mendeteksi tabrakan detail antara dua lingkaran.
 */
export function collideCircleCircle(
    a: Circle,
    b: Circle,
    out?: CollisionResult
): CollisionResult {
    const result = out ?? new CollisionResult();
    result.reset();

    const dx = b.center.x - a.center.x;
    const dy = b.center.y - a.center.y;
    const distSq = dx * dx + dy * dy;
    const totalRadius = a.radius + b.radius;

    if (distSq >= totalRadius * totalRadius) {
        return result; // Tidak bertabrakan
    }

    const dist = Math.sqrt(distSq);
    let nx = 1;
    let ny = 0;

    if (dist > EPSILON) {
        nx = dx / dist;
        ny = dy / dist;
    }

    const penetration = totalRadius - dist;
    const contactX = a.center.x + nx * (a.radius - penetration * 0.5);
    const contactY = a.center.y + ny * (a.radius - penetration * 0.5);

    return result.set(true, nx, ny, penetration, contactX, contactY);
}


/**
 * Mendeteksi tabrakan detail antara dua AABB.
 */
export function collideAABBAABB(
    a: AABB,
    b: AABB,
    out?: CollisionResult
): CollisionResult {
    const result = out ?? new CollisionResult();
    result.reset();

    const overlapX = Math.min(a.max.x, b.max.x) - Math.max(a.min.x, b.min.x);
    const overlapY = Math.min(a.max.y, b.max.y) - Math.max(a.min.y, b.min.y);

    if (overlapX <= 0 || overlapY <= 0) {
        return result; // Tidak bertabrakan
    }

    const centerA = a.getCenter();
    const centerB = b.getCenter();

    let nx = 0;
    let ny = 0;
    let penetration = 0;

    // Sumbu dengan overlap terkecil menjadi sumbu normal tabrakan
    if (overlapX < overlapY) {
        penetration = overlapX;
        nx = centerA.x < centerB.x ? 1 : -1;
    } else {
        penetration = overlapY;
        ny = centerA.y < centerB.y ? 1 : -1;
    }

    // Titik tengah daerah tumpang tindih
    const contactX = (Math.max(a.min.x, b.min.x) + Math.min(a.max.x, b.max.x)) * 0.5;
    const contactY = (Math.max(a.min.y, b.min.y) + Math.min(a.max.y, b.max.y)) * 0.5;

    return result.set(true, nx, ny, penetration, contactX, contactY);
}


/**
 * Mendeteksi tabrakan detail antara Lingkaran dan AABB.
 * Normal mengarah dari Lingkaran (Objek A) menuju AABB (Objek B).
 */
export function collideCircleAABB(
    circle: Circle,
    aabb: AABB,
    out?: CollisionResult
): CollisionResult {
    const result = out ?? new CollisionResult();
    result.reset();

    const closestX = clamp(circle.center.x, aabb.min.x, aabb.max.x);
    const closestY = clamp(circle.center.y, aabb.min.y, aabb.max.y);

    const dx = closestX - circle.center.x;
    const dy = closestY - circle.center.y;
    const distSq = dx * dx + dy * dy;

    // Kasus 1: Titik pusat lingkaran berada di luar AABB
    if (distSq > EPSILON * EPSILON) {
        if (distSq >= circle.radius * circle.radius) {
            return result; // Tidak tumpang tindih
        }

        const dist = Math.sqrt(distSq);
        const nx = dx / dist;
        const ny = dy / dist;
        const penetration = circle.radius - dist;

        return result.set(true, nx, ny, penetration, closestX, closestY);
    }

    // Kasus 2: Titik pusat lingkaran berada di dalam AABB (deep penetration)
    // Cari sisi terdekat AABB untuk mendorong keluar
    const dLeft = circle.center.x - aabb.min.x;
    const dRight = aabb.max.x - circle.center.x;
    const dTop = circle.center.y - aabb.min.y;
    const dBottom = aabb.max.y - circle.center.y;

    const min = Math.min(dLeft, dRight, dTop, dBottom);
    let nx = 0;
    let ny = 0;

    if (min === dLeft) nx = -1;
    else if (min === dRight) nx = 1;
    else if (min === dTop) ny = -1;
    else ny = 1;

    const penetration = circle.radius + min;
    return result.set(
        true,
        nx,
        ny,
        penetration,
        circle.center.x,
        circle.center.y
    );
}


/**
 * Mendeteksi tabrakan detail antara Lingkaran dan Kapsul.
 * Normal mengarah dari Lingkaran ke Kapsul.
 */
export function collideCircleCapsule(
    circle: Circle,
    capsule: Capsule,
    out?: CollisionResult
): CollisionResult {
    const result = out ?? new CollisionResult();
    result.reset();

    // Cari titik terdekat pada segmen poros kapsul ke pusat lingkaran
    const segClosest = capsule.segment.closestPoint(circle.center);
    const virtualCircle = new Circle(segClosest, capsule.radius);

    // Tabrakan lingkaran vs lingkaran imajiner di segmen kapsul
    return collideCircleCircle(circle, virtualCircle, result);
}


/**
 * Mendeteksi tabrakan detail antara dua Kapsul.
 * Normal mengarah dari Kapsul A ke Kapsul B.
 */
export function collideCapsuleCapsule(
    a: Capsule,
    b: Capsule,
    out?: CollisionResult
): CollisionResult {
    const result = out ?? new CollisionResult();
    result.reset();

    // Cari pasangan titik terdekat antara dua segmen
    const s1 = a.segment;
    const s2 = b.segment;

    const candidates = [
        { pA: s1.closestPoint(s2.start), pB: s2.start },
        { pA: s1.closestPoint(s2.end), pB: s2.end },
        { pA: s1.start, pB: s2.closestPoint(s1.start) },
        { pA: s1.end, pB: s2.closestPoint(s1.end) },
    ];

    let minDistSq = Number.POSITIVE_INFINITY;
    let bestPair = candidates[0];

    for (const pair of candidates) {
        const dSq = pair.pA.distanceSquared(pair.pB);
        if (dSq < minDistSq) {
            minDistSq = dSq;
            bestPair = pair;
        }
    }

    const circleA = new Circle(bestPair.pA, a.radius);
    const circleB = new Circle(bestPair.pB, b.radius);

    return collideCircleCircle(circleA, circleB, result);
}


/**
 * Mendeteksi tabrakan detail antara Poligon dan Lingkaran.
 * Normal mengarah dari Poligon ke Lingkaran.
 */
export function collidePolygonCircle(
    polygon: Polygon,
    circle: Circle,
    out?: CollisionResult
): CollisionResult {
    return collidePolygonCircleSAT(polygon, circle, out);
}


/**
 * Mendeteksi tabrakan detail antara dua Poligon cembung.
 * Normal mengarah dari Poligon A ke Poligon B.
 */
export function collidePolygonPolygon(
    polyA: Polygon,
    polyB: Polygon,
    out?: CollisionResult
): CollisionResult {
    return collidePolygonPolygonSAT(polyA, polyB, out);
}
