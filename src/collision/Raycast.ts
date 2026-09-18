// ==========================================
// Nama File:          Raycast.ts
// Deskripsi File:     Sistem penembakan sinar 2D (Raycasting) ke bentuk geometris
// Penulis File:       Fawwaz Yaqzhan & Google Antigravity
// Tanggal Pembuatan:  18-09-2026
// Tanggal Pembaruan:  18-09-2026
// Catatan:
//   - Menghitung titik kontak, jarak, dan normal pantulan permukaan
//   - Esensial untuk mekanika senjata hitscan, sensor AI, dan laser
//   - Mendukung pembatasan jarak maksimum (maxDistance) dan penampung (GC-friendly)
// ==========================================


import { EPSILON } from "../core/MathUtils.js";
import { Ray2D } from "../geometry/Ray2D.js";
import { Circle } from "../geometry/Circle.js";
import { AABB } from "../geometry/AABB.js";
import { LineSegment } from "../geometry/LineSegment.js";
import { Capsule } from "../geometry/Capsule.js";
import { Polygon } from "../geometry/Polygon.js";
import { RaycastHit } from "./types.js";


/**
 * Menembakkan sinar ke objek Lingkaran.
 */
export function raycastCircle(
    ray: Ray2D,
    circle: Circle,
    maxDistance: number = Number.POSITIVE_INFINITY,
    out?: RaycastHit
): RaycastHit | null {
    const ox = ray.origin.x;
    const oy = ray.origin.y;
    const dx = ray.direction.x;
    const dy = ray.direction.y;

    const mx = circle.center.x - ox;
    const my = circle.center.y - oy;

    // Proyeksi titik pusat lingkaran ke garis sinar
    const tProj = mx * dx + my * dy;

    // Jika pusat lingkaran di belakang sinar dan pangkal sinar di luar lingkaran
    const mDistSq = mx * mx + my * my;
    const rSq = circle.radius * circle.radius;
    if (tProj < 0 && mDistSq > rSq) {
        return null;
    }

    // Jarak kuadrat tegak lurus dari sinar ke pusat lingkaran
    const dSq = mDistSq - tProj * tProj;
    if (dSq > rSq) {
        return null; // Sinar meleset
    }

    const tOffset = Math.sqrt(Math.max(0, rSq - dSq));
    let t = tProj - tOffset;

    if (t < 0) {
        // Pangkal sinar berada di dalam lingkaran, gunakan titik tembus keluar
        t = tProj + tOffset;
    }

    if (t < 0 || t > maxDistance) {
        return null;
    }

    const hitX = ox + dx * t;
    const hitY = oy + dy * t;

    // Normal permukaan mengarah keluar dari pusat lingkaran
    let nx = 0;
    let ny = 0;
    if (circle.radius > EPSILON) {
        nx = (hitX - circle.center.x) / circle.radius;
        ny = (hitY - circle.center.y) / circle.radius;
    }

    const fraction = Number.isFinite(maxDistance) && maxDistance > 0 ? t / maxDistance : 0;
    const result = out ?? new RaycastHit();
    return result.set(true, hitX, hitY, nx, ny, t, fraction);
}


/**
 * Menembakkan sinar ke objek AABB menggunakan algoritma Slab Method.
 */
export function raycastAABB(
    ray: Ray2D,
    aabb: AABB,
    maxDistance: number = Number.POSITIVE_INFINITY,
    out?: RaycastHit
): RaycastHit | null {
    let tNear = -Number.MAX_VALUE;
    let tFar = Number.MAX_VALUE;

    let normalX = 0;
    let normalY = 0;

    // Uji Sumbu X
    if (Math.abs(ray.direction.x) < EPSILON) {
        if (ray.origin.x < aabb.min.x || ray.origin.x > aabb.max.x) {
            return null;
        }
    } else {
        const invD = 1 / ray.direction.x;
        let t1 = (aabb.min.x - ray.origin.x) * invD;
        let t2 = (aabb.max.x - ray.origin.x) * invD;
        let sign = -1;

        if (t1 > t2) {
            const temp = t1;
            t1 = t2;
            t2 = temp;
            sign = 1;
        }

        if (t1 > tNear) {
            tNear = t1;
            normalX = sign;
            normalY = 0;
        }
        if (t2 < tFar) {
            tFar = t2;
        }

        if (tNear > tFar || tFar < 0) {
            return null;
        }
    }

    // Uji Sumbu Y
    if (Math.abs(ray.direction.y) < EPSILON) {
        if (ray.origin.y < aabb.min.y || ray.origin.y > aabb.max.y) {
            return null;
        }
    } else {
        const invD = 1 / ray.direction.y;
        let t1 = (aabb.min.y - ray.origin.y) * invD;
        let t2 = (aabb.max.y - ray.origin.y) * invD;
        let sign = -1;

        if (t1 > t2) {
            const temp = t1;
            t1 = t2;
            t2 = temp;
            sign = 1;
        }

        if (t1 > tNear) {
            tNear = t1;
            normalX = 0;
            normalY = sign;
        }
        if (t2 < tFar) {
            tFar = t2;
        }

        if (tNear > tFar || tFar < 0) {
            return null;
        }
    }

    const t = tNear >= 0 ? tNear : tFar;
    if (t < 0 || t > maxDistance) {
        return null;
    }

    const hitX = ray.origin.x + ray.direction.x * t;
    const hitY = ray.origin.y + ray.direction.y * t;
    const fraction = Number.isFinite(maxDistance) && maxDistance > 0 ? t / maxDistance : 0;

    const result = out ?? new RaycastHit();
    return result.set(true, hitX, hitY, normalX, normalY, t, fraction);
}


/**
 * Menembakkan sinar ke objek Segmen Garis.
 */
export function raycastLine(
    ray: Ray2D,
    line: LineSegment,
    maxDistance: number = Number.POSITIVE_INFINITY,
    out?: RaycastHit
): RaycastHit | null {
    const rx = ray.direction.x;
    const ry = ray.direction.y;
    const sx = line.end.x - line.start.x;
    const sy = line.end.y - line.start.y;

    const rCrossS = rx * sy - ry * sx;
    if (Math.abs(rCrossS) < EPSILON) {
        return null; // Garis sejajar sinar
    }

    const qpX = line.start.x - ray.origin.x;
    const qpY = line.start.y - ray.origin.y;

    const t = (qpX * sy - qpY * sx) / rCrossS;
    const u = (qpX * ry - qpY * rx) / rCrossS;

    if (t >= 0 && t <= maxDistance && u >= 0 && u <= 1) {
        const hitX = ray.origin.x + rx * t;
        const hitY = ray.origin.y + ry * t;

        // Ambil normal garis, pastikan menghadap berlawanan arah datangnya sinar
        const lineNormal = line.getNormal();
        if (lineNormal.dot(ray.direction) > 0) {
            lineNormal.negateMut();
        }

        const fraction = Number.isFinite(maxDistance) && maxDistance > 0 ? t / maxDistance : 0;
        const result = out ?? new RaycastHit();
        return result.set(true, hitX, hitY, lineNormal.x, lineNormal.y, t, fraction);
    }

    return null;
}


/**
 * Menembakkan sinar ke objek Poligon.
 */
export function raycastPolygon(
    ray: Ray2D,
    polygon: Polygon,
    maxDistance: number = Number.POSITIVE_INFINITY,
    out?: RaycastHit
): RaycastHit | null {
    const count = polygon.vertexCount;
    if (count < 3) return null;

    let closestT = maxDistance;
    let closestHit: RaycastHit | null = null;
    const tempHit = new RaycastHit();

    for (let i = 0; i < count; i++) {
        const edge = polygon.getEdge(i);
        const hit = raycastLine(ray, edge, closestT, tempHit);
        if (hit) {
            closestT = hit.distance;
            if (!closestHit) {
                closestHit = out ?? new RaycastHit();
            }
            closestHit.copyFrom(hit);
        }
    }

    return closestHit;
}


/**
 * Menembakkan sinar ke objek Kapsul.
 */
export function raycastCapsule(
    ray: Ray2D,
    capsule: Capsule,
    maxDistance: number = Number.POSITIVE_INFINITY,
    out?: RaycastHit
): RaycastHit | null {
    let closestT = maxDistance;
    let closestHit: RaycastHit | null = null;
    const tempHit = new RaycastHit();

    // 1. Uji dua lingkaran penutup di kedua ujung kapsul
    const circleStart = new Circle(capsule.start, capsule.radius);
    const hitStart = raycastCircle(ray, circleStart, closestT, tempHit);
    if (hitStart) {
        closestT = hitStart.distance;
        if (!closestHit) closestHit = out ?? new RaycastHit();
        closestHit.copyFrom(hitStart);
    }

    const circleEnd = new Circle(capsule.end, capsule.radius);
    const hitEnd = raycastCircle(ray, circleEnd, closestT, tempHit);
    if (hitEnd) {
        closestT = hitEnd.distance;
        if (!closestHit) closestHit = out ?? new RaycastHit();
        closestHit.copyFrom(hitEnd);
    }

    // 2. Uji dua sisi garis tepi tabung silinder
    const normal = capsule.segment.getNormal();
    const offset = normal.scale(capsule.radius);

    const edge1 = new LineSegment(
        capsule.start.add(offset),
        capsule.end.add(offset)
    );
    const hitEdge1 = raycastLine(ray, edge1, closestT, tempHit);
    if (hitEdge1) {
        closestT = hitEdge1.distance;
        if (!closestHit) closestHit = out ?? new RaycastHit();
        closestHit.copyFrom(hitEdge1);
    }

    const edge2 = new LineSegment(
        capsule.start.sub(offset),
        capsule.end.sub(offset)
    );
    const hitEdge2 = raycastLine(ray, edge2, closestT, tempHit);
    if (hitEdge2) {
        closestT = hitEdge2.distance;
        if (!closestHit) closestHit = out ?? new RaycastHit();
        closestHit.copyFrom(hitEdge2);
    }

    return closestHit;
}
