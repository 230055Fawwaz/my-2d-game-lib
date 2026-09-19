# Modul Spatial (`src/spatial`)

Modul **Spatial** menyediakan struktur data partisi ruang (*spatial partitioning*) untuk akselerasi query spasial, pemfilteran benturan tahap awal (*broadphase collision*), dan pengelompokan objek dalam game 2 dimensi.

Modul ini dirancang dengan prinsip:
- **Zero External Dependencies**: Berdiri kokoh di atas modul `core` (`Vector2`) dan `geometry` (`AABB`, `Circle`).
- **High Performance & GC-Friendly**: Menyediakan parameter array penampung `out?: T[]` untuk menghindari alokasi array baru berulang kali di dalam loop 60+ FPS.
- **Skalabilitas Masif**: Memangkas perbandingan naif pasangan objek dari $O(N^2)$ menjadi mendekati $O(1)$ atau $O(\log N)$, memungkinkan ribuan proyektil atau musuh berjalan mulus.
- **Type-Safe**: Menggunakan TypeScript generik `ISpatialItem<T>` sehingga pengembang game dapat melampirkan entitas apa pun ke dalam sistem spasial.

---

## Daftar Modul & Fitur

| Modul | File | Deskripsi Singkat |
| :--- | :--- | :--- |
| **types** | [`types.ts`](./types.ts) | Kontrak antarmuka `ISpatialItem<T>`, pasangan tabrakan `SpatialPair<T>`, dan opsi konfigurasi. |
| **SpatialHash** | [`SpatialHash.ts`](./SpatialHash.ts) | Grid bucket spasial 2D berukuran sel seragam; performa operasi $O(1)$ untuk entitas dinamis dalam jumlah besar. |
| **Quadtree** | [`Quadtree.ts`](./Quadtree.ts) | Pohon partisi ruang hierarkis 4 kuadran; sangat optimal untuk peta luas dengan distribusi objek yang tidak merata. |
| **index** | [`index.ts`](./index.ts) | Entry point untuk re-export seluruh fitur modul spatial. |

---

## Rincian Modul

### 1. `types.ts`
Menyediakan kontrak dasar objek spasial:
- **`ISpatialItem<T>`**:
  - `id: string | number`: Pengenal unik untuk mencegah duplikasi hasil query.
  - `bounds: AABB`: Kotak pembungkus objek di dunia game.
  - `data?: T`: Data atau instance entitas game (GameObject, Zombie, Bullet, dsb.).
- **`SpatialPair<T>`**:
  - `a: ISpatialItem<T>` & `b: ISpatialItem<T>`: Pasangan entitas yang kotak pembungkusnya saling bertumpuk (kandidat uji benturan *narrowphase*).
- **`SpatialHashOptions`**: Opsi ukuran sel (`cellSize`, default `64`).
- **`QuadtreeOptions`**: Opsi kapasitas node (`maxObjects`, default `8`) dan kedalaman pohon (`maxDepth`, default `6`).

### 2. `SpatialHash.ts`
Struktur data kisi berbasis hash map yang membagi dunia 2D menjadi petak berukuran tetap (`cellSize`):
- **Keunggulan**: Sangat cepat untuk game top-down shooter, proyektil peluru, *bullet hell*, partikel, dan swarm musuh di mana objek berukuran relatif homogen.
- **Metode Utama**:
  - `insert(item)`: Mendaftarkan item ke semua sel grid yang dicakup oleh `item.bounds`.
  - `remove(item)`: Menghapus item dari seluruh sel yang didiaminya secara instan.
  - `update(item)`: Memperbarui posisi sel item saat bergerak.
  - `queryAABB(aabb, out?)`: Mengambil semua objek yang bertindih dengan kotak AABB.
  - `queryCircle(circle, out?)`: Mengambil semua objek dalam radius lingkaran (misal: ledakan granat/AOE).
  - `queryPoint(point, out?)`: Mengambil objek yang memuat titik tertentu (misal: klik mouse).
  - `getPotentialPairs(out?)`: Menghasilkan pasangan kandidat tabrakan (*broadphase collision*).
  - `clear()`: Mengosongkan seluruh grid.

### 3. `Quadtree.ts`
Struktur data pohon hierarkis yang membagi ruang menjadi empat kuadran (NW, NE, SW, SE) secara rekursif ketika jumlah objek melampaui `maxObjects`:
- **Keunggulan**: Sangat efisien untuk peta permainan dunia terbuka (*open-world* atau RPG) di mana kepadatan objek bervariasi (beberapa area padat kota, sementara area lain luas dan kosong).
- **Metode Utama**:
  - `insert(item)`: Memasukkan item ke kuadran anak yang sesuai.
  - `remove(item)`: Menghapus item dari pohon.
  - `queryAABB(aabb, out?)`: Pencarian objek di dalam area AABB.
  - `queryCircle(circle, out?)`: Pencarian objek di dalam radius AOE/Radar.
  - `queryPoint(point, out?)`: Pencarian objek pada titik tertentu.
  - `getPotentialPairs(out?)`: Menghasilkan pasangan benturan antar objek.
  - `clear()`: Mengosongkan seluruh pohon.

---

## Panduan Penggunaan Singkat

### Broadphase Collision dengan SpatialHash
```typescript
import { SpatialHash, ISpatialItem, AABB, Vector2 } from "my-2d-game-lib";

// Inisialisasi hash grid dengan ukuran petak 64 piksel
const spatialGrid = new SpatialHash<{ name: string }>({ cellSize: 64 });

// Masukkan entitas
const bullet: ISpatialItem = {
    id: 1,
    bounds: AABB.fromMinMax(100, 100, 108, 108),
    data: { name: "Bullet" }
};
spatialGrid.insert(bullet);

// Dapatkan kandidat tabrakan tanpa menguji ribuan objek lain secara membabi buta
const pairs = spatialGrid.getPotentialPairs();
for (const pair of pairs) {
    console.log(`Potensi tabrakan antara ${pair.a.id} dan ${pair.b.id}`);
}
```

### Query Ledakan AOE dengan Quadtree
```typescript
import { Quadtree, AABB, Circle, Vector2 } from "my-2d-game-lib";

const worldBounds = AABB.fromMinMax(0, 0, 4000, 4000);
const tree = new Quadtree(worldBounds, { maxObjects: 8, maxDepth: 6 });

// Cari semua musuh dalam radius ledakan roket
const explosion = new Circle(new Vector2(500, 500), 150);
const hitEnemies = tree.queryCircle(explosion);
console.log(`Jumlah musuh terdampak: ${hitEnemies.length}`);
```
