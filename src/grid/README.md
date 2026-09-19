# Modul Grid (`src/grid`)

Modul **Grid** menyediakan struktur data petak/tilemap 2 dimensi, algoritma rasterisasi garis, *Line-of-Sight* raycast petak, serta sistem navigasi jalur (*Pathfinding*) menggunakan algoritma A* dan Flow Field (Dijkstra Map).

Modul ini dirancang dengan prinsip:
- **Zero External Dependencies**: Berdiri kokoh di atas modul `core` (`Vector2`, `MathUtils`) dan tipe geometris.
- **High Performance & Cache Locality**: Menggunakan array datar 1 dimensi (*Flat 1D Buffer*) untuk penyimpanan petak, menjamin akses memori yang sekuensial dan sangat ramah CPU cache line.
- **Dukungan Multi-Genre**:
  - **Top-Down Shooter**: Algoritma Fast Voxel Traversal (`gridRaycast`) untuk deteksi tabrakan peluru menembus tembok dan *Line of Sight* pandangan musuh.
  - **Base Defense / Tower Defense**: Algoritma `FlowField` (medan vektor arah) yang memungkinkan ratusan hingga ribuan monster mengepung benteng tanpa lonjakan lag CPU.
  - **Factory Builder / Tactical RPG**: Struktur `Grid2D` dengan transformasi koordinat cepat (Ortogonal dan Isometrik 2:1) serta algoritma `AStar` dengan pencegahan potong sudut (*corner cutting prevention*).

---

## Daftar Modul & Fitur

| Modul | File | Deskripsi Singkat |
| :--- | :--- | :--- |
| **types** | [`types.ts`](./types.ts) | Kontrak koordinat `GridCoord`, mode tetangga (`GridNeighborMode`), heuristik, dan struktur `PathResult`. |
| **Grid2D** | [`Grid2D.ts`](./Grid2D.ts) | Struktur data grid/tilemap 2D berbasis Flat Array 1D; dilengkapi konversi Grid $\leftrightarrow$ World dan Flood Fill. |
| **GridCoordTransform** | [`GridCoordTransform.ts`](./GridCoordTransform.ts) | Utilitas transformasi proyeksi petak isometrik berlian (*diamond*) 2:1. |
| **Bresenham** | [`Bresenham.ts`](./Bresenham.ts) | Algoritma garis integer Bresenham dan Fast Voxel Traversal DDA (`gridRaycast`) untuk Line of Sight. |
| **AStar** | [`AStar.ts`](./AStar.ts) | Algoritma pathfinding A* dengan Min-Heap biner $O(E \log V)$, mendukung 4/8 arah, cost terrain, dan cegah potong sudut. |
| **FlowField** | [`FlowField.ts`](./FlowField.ts) | Medan vektor gerak massal & Dijkstra Map untuk ratusan/ribuan entitas dengan query instan $O(1)$ per unit. |
| **index** | [`index.ts`](./index.ts) | Entry point untuk re-export seluruh fitur modul grid. |

---

## Rincian Modul

### 1. `Grid2D.ts`
Struktur data petak 2 dimensi berkinerja tinggi:
- **Penyimpanan**: Menggunakan flat 1D array (`row * width + col`) untuk meminimalkan beban memori objek array bersarang (*array of arrays*).
- **Operasi Utama**:
  - `get(col, row)` & `set(col, row, val)`: Akses petak aman dengan validasi batas.
  - `inBounds(col, row)`: Pengecekan batas grid.
  - `fill(value)` & `forEach(cb)`: Manipulasi seluruh petak.
  - `worldToGrid(worldPos, cellSize, origin?)`: Mengonversi posisi piksel dunia ke koordinat petak.
  - `gridToWorld(col, row, cellSize, origin?, centered?)`: Mengonversi koordinat petak ke posisi dunia (sudut atau titik pusat).
  - `getNeighbors(col, row, mode)`: Mengambil tetangga valid (4-arah, diagonal, atau 8-arah).
  - `floodFill(startCol, startRow, fillVal, predicate?)`: Pengisian warna/region terhubung secara otomatis.

### 2. `GridCoordTransform.ts`
Transformasi proyeksi koordinat layar:
- `isoToWorld(col, row, tileWidth, tileHeight, origin?, centered?)`: Mengonversi petak isometrik ke layar dunia.
- `worldToIso(worldPos, tileWidth, tileHeight, origin?)`: Mengonversi posisi klik mouse/dunia ke petak isometrik.

### 3. `Bresenham.ts`
- **`bresenhamLine(x0, y0, x1, y1)`**: Menghasilkan urutan petak integer yang membentuk garis lurus tanpa kalkulasi pecahan floating-point.
- **`gridRaycast(origin, direction, maxDistance, isBlocked, cellSize?, gridOrigin?)`**: Algoritma penembakan sinar kontinu menembus petak (Fast Voxel Traversal / Supercover DDA). Mengembalikan titik benturan tepat, normal permukaan, jarak, dan petak yang terkena.

### 4. `AStar.ts`
Algoritma pencarian rute terpendek yang dioptimasi:
- **Min-Heap Binary Priority Queue**: Mempercepat ekstraksi simpul biaya terendah.
- **Opsi Konfigurasi**:
  - `allowDiagonal`: Mengaktifkan gerakan 8 arah.
  - `preventCornerCutting`: Melarang gerak diagonal jika sudut dinding di sampingnya terhalang (mencegah karakter menembus sudut balok).
  - `heuristic`: Formula heuristik jarak (`manhattan`, `euclidean`, `chebyshev`, `octile`).
  - `isWalkable`: Penentu petak jalan vs dinding.
  - `getCost`: Bobot biaya permukaan (misal: jalan berbatu 1.0, rawa/air 2.5).

### 5. `FlowField.ts`
Sistem navigasi gerak kerumunan (*crowd navigation*):
- Menghitung peta jarak Dijkstra dari satu atau banyak target (Integration Field).
- Menghasilkan vektor arah gerak ternormalisasi untuk setiap petak (Vector Field).
- Unit game dapat langsung membaca arah gerak dengan memanggil `getVectorAtWorld(unitPosition, cellSize)` secara instan $O(1)$.

---

## Contoh Penggunaan Singkat

### Pathfinding A* Mengitari Dinding
```typescript
import { Grid2D, findPath } from "my-2d-game-lib";

const map = new Grid2D<number>(20, 20, 0); // 0 = Jalan, 1 = Dinding

// Buat dinding vertikal
for (let r = 5; r <= 15; r++) {
    map.set(10, r, 1);
}

const result = findPath(
    map,
    { col: 2, row: 10 },
    { col: 18, row: 10 },
    {
        allowDiagonal: true,
        preventCornerCutting: true,
        isWalkable: (coord) => map.get(coord.col, coord.row) === 0
    }
);

if (result.found) {
    console.log(`Jalur ditemukan dengan panjang ${result.path.length} petak`);
}
```

### Tower Defense Swarm dengan FlowField
```typescript
import { FlowField, Vector2 } from "my-2d-game-lib";

const field = new FlowField(50, 50);
const baseTarget = { col: 25, row: 25 };

// Hitung medan aliran menuju benteng
field.generate(baseTarget);

// Dalam loop pergerakan musuh:
const enemyWorldPos = new Vector2(100, 200);
const moveDir = field.getVectorAtWorld(enemyWorldPos, 32);

// Gerakkan musuh
enemyWorldPos.addMut(moveDir.scale(speed * deltaTime));
```
