# Modul Core (`src/core`)

Modul **Core** berisi kumpulan logika, algoritma, rumus matematika, dan struktur data fundamental yang menjadi fondasi bagi modul-modul lain di dalam library game ini.

Modul ini dirancang dengan prinsip:
- **Zero External Dependencies**: Berdiri sendiri tanpa ketergantungan pustaka luar.
- **High Performance & GC-Friendly**: Menyediakan operasi in-place (`...Mut`) dan *Object Pooling* untuk meminimalkan beban *Garbage Collector* di dalam *game loop*.
- **Deterministik**: Menyediakan generator bilangan acak berbasis *seed* (*PRNG*) untuk kebutuhan *procedural generation* dan *replay*.
- **Ketik Kuat (Type-Safe)**: Ditulis menggunakan TypeScript dengan kontrak antarmuka (*interfaces*) yang jelas.

---

## Daftar Modul & Fitur

| Modul | File | Deskripsi Singkat |
| :--- | :--- | :--- |
| **types** | [`types.ts`](./types.ts) | Kontrak tipe data umum (`IVector2`, `ISize2D`, `ITransform2D`, `IPoolable`, dll.). |
| **MathUtils** | [`MathUtils.ts`](./MathUtils.ts) | Konstanta (`EPSILON`, `DEG_TO_RAD`) & fungsi matematika pembantu (`clamp`, `lerp`, `wrap`, `smoothStep`). |
| **Vector2** | [`Vector2.ts`](./Vector2.ts) | Vektor 2D lengkap dengan operasi aljabar linier, baik mutabel maupun imutabel. |
| **Transform2D** | [`Transform2D.ts`](./Transform2D.ts) | Representasi posisi, rotasi, dan skala serta konversi ruang koordinat (*Local vs World*). |
| **Pool** | [`Pool.ts`](./Pool.ts) | *Object Pool* generik untuk mendaur ulang objek dan mencegah lag alokasi memori. |
| **PRNG** | [`PRNG.ts`](./PRNG.ts) | Generator angka acak semu deterministik berbasis algoritma Mulberry32. |
| **Easing** | [`Easing.ts`](./Easing.ts) | Fungsi kurva gerak/transisi (Sine, Quad, Cubic, Elastic, Bounce, dll.) untuk tweening dan animasi. |
| **Color** | [`Color.ts`](./Color.ts) | Representasi warna RGBA ternormalisasi `[0.0 - 1.0]`, manipulasi warna, serta konversi Hex/CSS. |
| **index** | [`index.ts`](./index.ts) | Entry point untuk re-export seluruh fitur Core agar mudah diimpor. |

---

## Rincian Modul

### 1. `types.ts`
Menyediakan kontrak standar struktur data agar interoperabel dengan objek JavaScript biasa (misal `{ x: 10, y: 20 }`) dan lintas modul.
- `IVector2`, `ReadonlyVector2`: Kontrak koordinat `x` dan `y`.
- `ISize2D`, `ReadonlySize2D`: Kontrak ukuran `width` dan `height`.
- `ITransform2D`: Kontrak transformasi yang memuat `position`, `rotation`, dan `scale`.
- `IPoolable`: Kontrak objek yang memiliki fungsi `.reset()` saat didaur ulang oleh `Pool`.
- `Constructor<T>`, `Nullable<T>`: Tipe utilitas generik TypeScript.

### 2. `MathUtils.ts`
Kumpulan konstanta dan rumus matematika esensial:
- **Konstanta**: `EPSILON` (toleransi angka float), `DEG_TO_RAD`, `RAD_TO_DEG`.
- **Sudut**: `degToRad(deg)`, `radToDeg(rad)`.
- **Pembatasan & Interpolasi**:
  - `clamp(val, min, max)`: Membatasi nilai di antara rentang tertentu.
  - `lerp(start, end, t)`: Interpolasi linier antara dua nilai.
  - `smoothStep(min, max, val)`: Interpolasi Hermite halus untuk kurva peredam/kamera.
  - `wrap(val, min, max)`: Membungkus nilai melingkar (berguna untuk sudut atau batas layar wrap-around).
  - `approxEqual(a, b, epsilon)`: Pengecekan kesetaraan dua bilangan desimal dengan toleransi epsilon.

### 3. `Vector2.ts`
Struktur data vektor 2 dimensi yang mendukung dua pola kerja:
- **Imutabel**: Mengembalikan instance `Vector2` baru (contoh: `v1.add(v2)`).
- **Mutabel / In-Place (`...Mut`)**: Mengubah nilai instance saat ini untuk menghindari alokasi memori berlebih di dalam loop (contoh: `v1.addMut(v2)`).
- **Fitur Utama**:
  - Arah & Nilai Bawaan: `Vector2.zero()`, `one()`, `up()`, `down()`, `left()`, `right()`.
  - Operasi Aritmatika: `add`, `sub`, `mul`, `div`, `negate`.
  - Geometri & Aljabar: `length()`, `lengthSq()`, `normalize()`, `dot()`, `cross()` (2D perp-dot), `distanceTo()`, `angle()`, `rotate()`, `lerp()`, `reflect()`.

### 4. `Transform2D.ts`
Mengatur transformasi objek di dalam ruang 2 dimensi (posisi, rotasi dalam radian, dan skala):
- `position`: Vektor posisi (`Vector2`).
- `rotation`: Orientasi sudut dalam radian.
- `scale`: Skala perbesaran objek (`Vector2`).
- **Transformasi Koordinat**:
  - `transformPoint(localPoint)`: Mengubah titik dari koordinat lokal objek ke koordinat dunia (*Local to World*).
  - `inverseTransformPoint(worldPoint)`: Mengubah titik dari koordinat dunia ke koordinat lokal objek (*World to Local*).
  - `translate()`, `rotate()`, `scaleBy()`: Manipulasi transformasi secara berantai.

### 5. `Pool.ts`
Implementasi *Object Pool* generik berkinerja tinggi untuk mengontrol *Garbage Collection*:
- Memiliki pra-alokasi awal (`initialCapacity`) dan batas maksimum penampungan (`maxCapacity`).
- `acquire()`: Mengambil objek yang siap pakai dari antrean (atau membuat baru jika kosong).
- `release(item)`: Mengembalikan objek ke pool dan memanggil `.reset()` (jika mengimplementasikan `IPoolable` atau opsi `resetFn`).
- `clear()`: Mengosongkan pool.

### 6. `PRNG.ts`
*Pseudorandom Number Generator* deterministik menggunakan algoritma **Mulberry32**:
- Menghasilkan hasil acak yang identik untuk seed yang sama (sangat cocok untuk *seed-based procedural generation* atau fitur *replay*).
- `next()`: Menghasilkan angka desimal `[0, 1)`.
- `range(min, max)` & `rangeInt(min, max)`: Mengambil angka acak dalam rentang nilai tertentu.
- `chance(probability)`: Menghasilkan nilai boolean berdasarkan persentase probabilitas `[0, 1]`.
- `pick(array)` & `shuffle(array)`: Memilih elemen acak atau mengocok array.
- `pointInCircle(radius)`: Menghasilkan titik acak `Vector2` di dalam radius lingkaran.

### 7. `Easing.ts`
Kumpulan fungsi animasi dan transisi kurva matematika (menerima `t` dari `0` sampai `1`):
- **Kategori**: `Linear`, `Sine`, `Quad`, `Cubic`, `Quart`, `Quint`, `Expo`, `Circ`, `Back`, `Elastic`, `Bounce`.
- **Mode Variasi**: Setiap kategori memiliki varian `easeIn*`, `easeOut*`, dan `easeInOut*`.
- Cocok digunakan untuk interpolasi kamera, pergerakan UI, efek partikel, dan animasi *tweening*.

### 8. `Color.ts`
Representasi warna berbasis komponen Red, Green, Blue, dan Alpha (RGBA) dalam rentang ternormalisasi `0.0` sampai `1.0`:
- **Preset Statis**: `Color.white()`, `black()`, `red()`, `green()`, `blue()`, `yellow()`, `cyan()`, `magenta()`, `transparent()`.
- **Operasi Warna**: `lerp()`, `tint()`, `darken()`, `lighten()`.
- **Konversi Format**:
  - `toRgbaString()`: Format string CSS (contoh: `rgba(255, 0, 0, 1)`).
  - `toHex()` & `Color.fromHex(hex)`: Konversi bolak-balik dari dan ke kode heksadesimal warna.
  - `Color.fromRgb255(r, g, b, a)`: Membangun warna dari rentang tradisional `0-255`.

---

## Contoh Penggunaan Cepat

### 1. Menggerakkan Karakter ke Target
```typescript
import { Vector2 } from "./core/index.js";

const playerPos = new Vector2(100, 100);
const targetPos = new Vector2(300, 200);

// Hitung arah menuju target
const direction = targetPos.sub(playerPos).normalize();

// Update posisi player (in-place tanpa alokasi baru)
const speed = 5;
playerPos.addScaledMut(direction, speed);
```

### 2. Menggunakan Object Pool untuk Peluru
```typescript
import { Pool, Vector2, IPoolable } from "./core/index.js";

class Bullet implements IPoolable {
  public pos = new Vector2();
  public active = false;

  reset(): void {
    this.pos.set(0, 0);
    this.active = false;
  }
}

// Buat pool peluru dengan 20 objek cadangan di awal
const bulletPool = new Pool<Bullet>(() => new Bullet(), 20);

// Ambil peluru saat menembak
const bullet = bulletPool.acquire();
bullet.active = true;

// Kembalikan ke pool saat peluru hancur/keluar layar
bulletPool.release(bullet);
```

### 3. Peta Prosedural dengan Seed PRNG
```typescript
import { PRNG } from "./core/index.js";

const rng = new PRNG(12345); // Seed tetap agar output selalu sama

// Tentukan tipe bioma acak
const biome = rng.pick(["Grassland", "Desert", "Snow", "Swamp"]);

// Tentukan jumlah musuh dalam dungeon
const enemyCount = rng.rangeInt(5, 15);
```

### 4. Transisi Animasi UI / Kamera
```typescript
import { easeOutBounce, lerp } from "./core/index.js";

// t bernilai antara 0.0 (mulai) sampai 1.0 (selesai)
function getAnimatedScale(progress: number): number {
  const eased = easeOutBounce(progress);
  return lerp(0, 1, eased);
}
```
