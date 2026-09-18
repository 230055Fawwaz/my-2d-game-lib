# Modul Geometry (`src/geometry`)

Modul **Geometry** berisi representasi struktur data bentuk geometris 2 dimensi, algoritma spasial primitif, serta rumus kalkulasi analitik yang menjadi pondasi bagi sistem deteksi tabrakan (*collision detection*) dan partisi spasial (*spatial partitioning*).

Modul ini dirancang dengan prinsip:
- **Zero External Dependencies**: Berdiri sendiri hanya dengan bersandar pada modul `core` (`Vector2`, `MathUtils`, `types`).
- **High Performance & GC-Friendly**: Menyediakan metode mutabel (*in-place*) dan parameter penampung `out?: Vector2` untuk menghindari alokasi memori berulang di dalam *game loop*.
- **CPU Optimization**: Memanfaatkan perhitungan kuadrat jarak (`distanceSquared`, `lengthSquared`) untuk meminimalkan pemanggilan fungsi berat seperti `Math.sqrt`.
- **Ketik Kuat (Type-Safe)**: Ditulis penuh dengan TypeScript modern dan kontrak antarmuka yang presisi.

---

## Daftar Modul & Fitur

| Modul | File | Deskripsi Singkat |
| :--- | :--- | :--- |
| **Circle** | [`Circle.ts`](./Circle.ts) | Lingkaran 2D dengan titik pusat dan jari-jari; cocok untuk AOE, proyektil, dan *bounding sphere*. |
| **AABB** | [`AABB.ts`](./AABB.ts) | *Axis-Aligned Bounding Box* sejajar sumbu X/Y; pondasi utama *broadphase collision* dan *Quadtree*. |
| **LineSegment** | [`LineSegment.ts`](./LineSegment.ts) | Segmen garis berhingga antara dua titik, dilengkapi vektor normal dan uji interseksi. |
| **Ray2D** | [`Ray2D.ts`](./Ray2D.ts) | Sinar semi-tak hingga berbasis *origin* dan arah satuan; esensial untuk senjata *hitscan*, laser, dan *line-of-sight*. |
| **Polygon** | [`Polygon.ts`](./Polygon.ts) | Poligon sembarang 2D; dilengkapi kalkulasi luas (*Shoelace*), *centroid*, uji konveksitas (*isConvex*), dan normal sisi untuk SAT. |
| **Capsule** | [`Capsule.ts`](./Capsule.ts) | Kapsul 2D (*LineSegment* + *radius*); bentuk standar *collider* karakter game agar tidak tersangkut di sudut. |
| **index** | [`index.ts`](./index.ts) | Entry point untuk re-export seluruh fitur geometri agar mudah diimpor. |

---

## Rincian Modul

### 1. `Circle.ts`
Representasi lingkaran 2 dimensi:
- **Atribut**: `center: Vector2`, `radius: number`.
- **Kalkulasi**: `area()`, `circumference()`.
- **Interaksi Titik**: `containsPoint(point)`, `closestPoint(point)`, `distanceToPoint(point)`.
- **Bounding Box**: `getAABB()` menghasilkan kotak pembungkus terkecil.
- **Transformasi**: `translate()`, `translateMut()`, `scale()`, `scaleMut()`.

### 2. `AABB.ts`
Kotak pembungkus sejajar sumbu (*Axis-Aligned Bounding Box*):
- **Atribut**: `min: Vector2`, `max: Vector2`.
- **Factory**: `fromMinMax()`, `fromCenterAndSize()`, `fromPoints()`.
- **Dimensi**: `width`, `height`, `area()`, `getCenter()`, `getExtents()`.
- **Operasi Geometri**:
  - `containsPoint(point)`: Pengecekan titik di dalam kotak.
  - `containsAABB(other)`: Pengecekan kotak lain seluruhnya di dalam kotak ini.
  - `intersects(other)`: Uji tumpang tindih super cepat (*separating axis 1D*).
  - `intersection(other)`: Menghasilkan AABB hasil irisan dua kotak.
  - `expand()`, `encapsulate()`: Memperbesar batas kotak.

### 3. `LineSegment.ts`
Segmen garis terarah berhingga:
- **Atribut**: `start: Vector2`, `end: Vector2`.
- **Vektor & Orientasi**:
  - `getDirection()`: Vektor arah satuan ternormalisasi dari `start` ke `end`.
  - `getNormal()`: Vektor normal satuan tegak lurus mengarah ke kiri (untuk respon pantulan fisika).
  - `getMidpoint()`: Titik tengah segmen.
- **Jarak & Proyeksi**:
  - `projectPointFactor(point)`: Nilai proyeksi skalar $t \in [0, 1]$.
  - `closestPoint(point)`: Titik terdekat pada segmen garis.
  - `distanceToPoint(point)`: Jarak Euclidean tegak lurus terpendek.
- **Interseksi**: `intersects(other)` dan `getIntersection(other)` menggunakan 2D Perp-Dot Product.

### 4. `Ray2D.ts`
Sinar semi-tak hingga yang memancar dari titik asal:
- **Atribut**: `origin: Vector2`, `direction: Vector2` (selalu ternormalisasi).
- **Persamaan Garis**: $P(t) = \text{origin} + \text{direction} \cdot \max(0, t)$.
- **Fitur Utama**:
  - `getPoint(t)`: Mengambil titik pada jarak $t$ sepanjang sinar.
  - `projectPoint(point)`: Proyeksi titik ke parameter skalar $t \ge 0$.
  - `closestPoint(point)`: Titik terdekat pada sinar terhadap target eksternal.
  - `distanceToPoint(point)`: Jarak terpendek ke titik eksternal.
  - `rotate()` & `rotateMut()`: Memutar orientasi arah sinar.

### 5. `Polygon.ts`
Bentuk poligon 2 dimensi berbasis array simpul (*vertices*):
- **Atribut**: `vertices: Vector2[]`.
- **Factory**:
  - `Polygon.createBox(center, width, height)`: Membangun persegi panjang.
  - `Polygon.createRegular(sides, radius, center)`: Membangun segibanyak beraturan (segitiga, pentagon, heksagon, dll).
- **Analisis Bentuk**:
  - `signedArea()` & `area()`: Luas menggunakan *Shoelace Formula*.
  - `isClockwise()`: Mendeteksi *winding order* simpul.
  - `getCentroid()`: Titik pusat massa berbobot.
  - `isConvex()`: Memvalidasi apakah poligon cembung untuk algoritma SAT.
  - `containsPoint(point)`: Pengecekan titik di dalam poligon dengan *Ray-Casting Algorithm* (Jordan Curve Theorem).
  - `getEdgeNormals()`: Mengambil seluruh normal sisi untuk sumbu proyeksi SAT.

### 6. `Capsule.ts`
Kapsul 2 dimensi (segmen garis tengah dengan ketebalan radius):
- **Atribut**: `segment: LineSegment`, `radius: number`.
- **Keunggulan**: Mencegah karakter tersangkut di sudut runcing saat meluncur di sepanjang dinding atau permukaan ubin (*tilemap*).
- **Fitur Utama**:
  - `area()` & `perimeter()`: Luas dan keliling presisi (kombinasi persegi panjang dan 2 setengah lingkaran).
  - `containsPoint(point)`: Pengecekan apakah titik berada di dalam kapsul.
  - `closestPoint(point)`: Titik terdekat pada permukaan atau volume kapsul.
  - `getAABB()`: Kotak pembungkus AABB terluar dengan bantalan radius.

---

## Contoh Penggunaan Cepat

### 1. Menembak Musuh dengan Hitscan Ray2D
```typescript
import { Ray2D, Circle, Vector2 } from "./geometry/index.js";

// Posisi sniper dan arah bidikan
const sniperPos = new Vector2(50, 100);
const crosshairPos = new Vector2(300, 100);
const bulletRay = Ray2D.fromPoints(sniperPos, crosshairPos);

// Lingkaran hitbox kepala musuh
const enemyHead = new Circle(new Vector2(200, 100), 15);

// Cek apakah tembakan melintas mengenai kepala musuh
const dist = bulletRay.distanceToPoint(enemyHead.center);
if (dist <= enemyHead.radius) {
  console.log("Headshot terkonfirmasi!");
}
```

### 2. Collider Karakter Menggunakan Capsule
```typescript
import { Capsule, Vector2 } from "./geometry/index.js";

// Karakter berdiri dengan tinggi badan poros 30 unit dan ketebalan radius 10 unit
const playerFeet = new Vector2(100, 100);
const playerHead = new Vector2(100, 70);
const playerCollider = new Capsule(playerFeet, playerHead, 10);

// Pengecekan apakah titik ledakan berada dalam radius damage
const explosionPoint = new Vector2(105, 80);
if (playerCollider.containsPoint(explosionPoint)) {
  console.log("Pemain terkena ledakan!");
}
```

### 3. Membuat Arena Rintangan Berbentuk Segi Enam (Polygon)
```typescript
import { Polygon, Vector2 } from "./geometry/index.js";

// Buat arena heksagon dengan radius 50 di posisi (200, 200)
const arena = Polygon.createRegular(6, 50, new Vector2(200, 200));

console.log("Luas arena:", arena.area());
console.log("Apakah cembung?", arena.isConvex()); // true

// Cek apakah pemain berada di dalam arena
const playerPos = new Vector2(210, 195);
if (arena.containsPoint(playerPos)) {
  console.log("Pemain berada di dalam arena bertarung");
}
```
