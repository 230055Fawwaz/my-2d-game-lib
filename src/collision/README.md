# Modul Collision (`src/collision`)

Modul **Collision** menyediakan sistem deteksi benturan, kalkulasi kontak mendalam (*narrowphase manifold*), uji tumpang tindih cepat (*boolean intersects*), algoritma *Separating Axis Theorem* (SAT), dan penembakan sinar (*raycasting*) untuk game 2 dimensi.

Modul ini dirancang dengan prinsip:
- **Zero External Dependencies**: Berdiri sendiri di atas modul `core` dan `geometry`.
- **GC-Friendly & High Performance**: Mendukung penggunaan ulang instance objek kontak (`out?: CollisionResult`, `out?: RaycastHit`) untuk mencegah lonjakan *Garbage Collection* di dalam loop 60+ FPS.
- **Konvensi Normal Standar Fisika**: Vektor normal selalu mengarah dari **Objek A mendorong Objek B**.
  - Untuk memisahkan Objek A agar tidak menembus Objek B:
    $$\text{posisiA} \mathrel{-}= \text{normal} \times \text{penetration}$$
  - Atau memisahkan Objek B:
    $$\text{posisiB} \mathrel{+}= \text{normal} \times \text{penetration}$$

---

## Daftar Modul & Fitur

| Modul | File | Deskripsi Singkat |
| :--- | :--- | :--- |
| **types** | [`types.ts`](./types.ts) | Struktur data `CollisionResult` (detail manifold) dan `RaycastHit` (detail hitscan). |
| **Intersects** | [`Intersects.ts`](./Intersects.ts) | Uji cepat boolean overlap (`true/false`) tanpa alokasi memori untuk Circle, AABB, Line, Capsule, dan Polygon. |
| **Narrowphase** | [`Narrowphase.ts`](./Narrowphase.ts) | Kalkulasi detail kontak presisi yang menghasilkan kedalaman penetrasi, normal arah dorongan, dan titik kontak. |
| **SAT** | [`SAT.ts`](./SAT.ts) | Algoritma *Separating Axis Theorem* untuk poligon cembung sembarang dan perhitungan *Minimum Translation Vector* (MTV). |
| **Raycast** | [`Raycast.ts`](./Raycast.ts) | Sistem penembakan sinar presisi terhadap seluruh bentuk geometri 2D (Slab method, line intersection, circle hit). |
| **index** | [`index.ts`](./index.ts) | Entry point untuk re-export seluruh fitur modul collision. |

---

## Rincian Modul

### 1. `types.ts`
Menyediakan wadah hasil kalkulasi benturan:
- **`CollisionResult`**:
  - `collided: boolean`: Menandakan terjadinya tabrakan.
  - `normal: Vector2`: Arah vektor dorongan satuan (dari A ke B).
  - `penetration: number`: Kedalaman tumpang tindih dalam satuan piksel/dunia.
  - `contactPoint: Vector2`: Titik kontak perkiraan terjadinya benturan.
  - `reset()`: Mengembalikan kondisi bersih tanpa membuat instance baru.
- **`RaycastHit`**:
  - `hit: boolean`: Menandakan sinar mengenai objek.
  - `point: Vector2`: Titik benturan sinar di dunia.
  - `normal: Vector2`: Normal permukaan pada titik benturan (arah pantulan).
  - `distance: number`: Jarak dari origin sinar ke titik benturan.
  - `fraction: number`: Rasio jarak $[0, 1]$ terhadap `maxDistance`.

### 2. `Intersects.ts`
Uji cepat ya/tidak (*boolean*) berkinerja tinggi:
- `circleCircle(c1, c2)`
- `aabbAABB(b1, b2)`
- `circleAABB(circle, aabb)`
- `lineCircle(line, circle)`
- `lineAABB(line, aabb)`
- `lineLine(lineA, lineB)`
- `capsuleCircle(capsule, circle)`
- `capsuleAABB(capsule, aabb)`
- `capsuleCapsule(capA, capB)`
- `polygonCircle(poly, circle)`
- `polygonAABB(poly, aabb)`
- `polygonPolygon(polyA, polyB)`

### 3. `Narrowphase.ts`
Deteksi kontak detail (*narrowphase collision resolution*):
- `collideCircleCircle(a, b, out?)`
- `collideAABBAABB(a, b, out?)`
- `collideCircleAABB(circle, aabb, out?)`
- `collideCircleCapsule(circle, capsule, out?)`
- `collideCapsuleCapsule(a, b, out?)`
- `collidePolygonCircle(poly, circle, out?)`
- `collidePolygonPolygon(polyA, polyB, out?)`

### 4. `SAT.ts`
Mesin universal *Separating Axis Theorem*:
- `projectPolygonOnAxis(poly, axis)`: Proyeksi 1D simpul poligon.
- `projectCircleOnAxis(circle, axis)`: Proyeksi 1D lingkaran.
- `getIntervalOverlap(intA, intB)`: Mengukur celah pemisah antar interval.
- `testPolygonPolygonSAT(polyA, polyB)`: Uji tumpang tindih poligon cembung sembarang yang dapat diputar bebas.
- `collidePolygonPolygonSAT(polyA, polyB, out?)`: Menghitung MTV untuk pemisahan fisik dua poligon.
- `collidePolygonCircleSAT(poly, circle, out?)`: Menghitung MTV antara poligon dan lingkaran.

### 5. `Raycast.ts`
Penembakan sinar untuk mekanika proyektil dan kecerdasan buatan (AI):
- `raycastCircle(ray, circle, maxDistance?, out?)`
- `raycastAABB(ray, aabb, maxDistance?, out?)`: Menggunakan algoritma *Slab Method* berkecepatan tinggi.
- `raycastLine(ray, line, maxDistance?, out?)`
- `raycastCapsule(ray, capsule, maxDistance?, out?)`
- `raycastPolygon(ray, poly, maxDistance?, out?)`

---

## Contoh Penggunaan Cepat

### 1. Karakter Menabrak Dinding (Mencegah Tembus / Positional Correction)
```typescript
import { collideCircleAABB, Circle, AABB, Vector2 } from "./index.js";

// Karakter pemain berbentuk lingkaran dan dinding berbentuk AABB
const playerCollider = new Circle(new Vector2(100, 100), 16);
const wall = AABB.fromMinMax(110, 80, 150, 120);

// Hitung kontak
const contact = collideCircleAABB(playerCollider, wall);

if (contact.collided) {
  // Geser posisi karakter keluar dari dinding agar tidak tembus
  // Formula: posA -= normal * penetration
  const pushBack = contact.normal.scale(contact.penetration);
  playerCollider.center.subMut(pushBack);
  console.log("Pemain berhasil didorong keluar ke posisi aman!");
}
```

### 2. Tembakan Sniper Hitscan dengan Pantulan Permukaan (Laser Ricochet)
```typescript
import { raycastAABB, Ray2D, AABB, Vector2 } from "./index.js";

// Tembakan sniper dari senapan ke arah kanan
const bulletRay = new Ray2D(new Vector2(50, 200), new Vector2(1, 0));
const metalBox = AABB.fromMinMax(300, 150, 350, 250);

// Tembakkan sinar
const hit = raycastAABB(bulletRay, metalBox, 500);

if (hit) {
  console.log(`Kena di koordinat: (${hit.point.x}, ${hit.point.y}) pada jarak ${hit.distance}`);

  // Hitung arah pantulan sinar (Ricochet) menggunakan rumus pantulan vektor:
  // R = D - 2 * (D . N) * N
  const dot = bulletRay.direction.dot(hit.normal);
  const reflectionDir = bulletRay.direction.sub(hit.normal.scale(2 * dot));
  console.log("Arah sinar memantul:", reflectionDir);
}
```

### 3. Sensor Trigger Ledakan Bom (Uji Cepat Boolean)
```typescript
import { circleAABB, Circle, AABB, Vector2 } from "./index.js";

// Area ledakan bom (AOE) radius 100
const bombAOE = new Circle(new Vector2(250, 250), 100);
const enemyHitbox = AABB.fromMinMax(280, 280, 320, 320);

// Uji super cepat tanpa alokasi memori
if (circleAABB(bombAOE, enemyHitbox)) {
  console.log("Musuh terkena damage ledakan!");
}
```
