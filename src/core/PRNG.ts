// ==========================================
// Nama File:          PRNG.ts
// Deskripsi File:     Modul pseudorandom number generator
// Penulis File:       Fawwaz Yaqzhan & Google Antigravity
// Tanggal Pembuatan:  16-09-2026
// Tanggal Pembaruan:  16-09-2026
// Catatan:
//   - Menggunakan algoritma Mulberry32 yang cepat dan berkualitas untuk game
//   - Menghasilkan urutan angka acak deterministik berdasarkan seed
//   - Menyediakan fungsi bantuan game seperti rentang angka, acak array, dan koordinat
// ==========================================


import { Vector2 } from "./Vector2.js";


/**
 * Class penghasil angka acak semu (PRNG) berbasis seed
 * Menggunakan algoritma Mulberry32 (32-bit generator)
 */
export class PRNG {
    private _seed: number;

    /**
     * Membuat instance PRNG baru
     * @param seed Nilai awal seed (jika kosong, menggunakan timestamp acak)
     */
    constructor(seed: number = Date.now() ^ (Math.random() * 0x100000000)) {
        this._seed = seed >>> 0;
    }

    /**
     * Mengambil nilai seed saat ini
     */
    get seed(): number {
        return this._seed;
    }

    /**
     * Mengatur ulang seed untuk mereset urutan angka acak
     */
    set seed(value: number) {
        this._seed = value >>> 0;
    }

    // --- Generator Inti ---

    /**
     * Menghasilkan bilangan acak desimal (float) antara 0 (inklusif) dan 1 (eksklusif)
     * Setara dengan Math.random(), namun deterministik
     * @returns Nilai desimal [0, 1)
     */
    next(): number {
        return this.nextInt() / 4294967296;
    }

    /**
     * Menghasilkan interger 32-bit unsigned
     * @returns Nilai integer unsigned
     */
    nextInt(): number {
        let t = (this._seed += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return (t ^ (t >>> 14)) >>> 0;
    }

    // --- Fungsi Bantuan Game ---

    /**
     * Menghasilkan float acak di antara min (inklusif) dan max (eksklusif)
     * @param min Batas minimum
     * @param max Batas maksimum
     * @returns Nilai float
     */
    range(min: number, max: number): number {
        return min + this.next() * (max - min);
    }

    /**
     * Menghasilkan float acak di antara min (inklusif) dan max (eksklusif)
     * @param min Batas minimum bulat
     * @param max Batas maksimum bulat
     * @returns Nilai float
     */
    rangeInt(min: number, max: number): number {
        const floorMin = Math.ceil(min);
        const floorMax = Math.floor(max);
        return Math.floor(this.next() * (floorMax - floorMin + 1)) + floorMin;
    }

    /**
     * Mengembalikan nilai boolean berdasarkan peluang kejadian
     * @param chance Probabilitas nilai true (0.0 sampai 1.0, default: 0.5)
     * @returns True jika beruntung
     */
    boolean(chance: number = 0.5): boolean {
        return this.next() < chance;
    }

    /**
     * Mengembalikan angka 1 atau -1 secara acak
     * Berguna untuk menentukan arah hadap awal objek (kiri/kanan)
     * @param chance Probabilitas nilai true
     * @returns Angka 1 atau -1
     */
    sign(chance: number = 0.5): number {
        return this.boolean(chance) ? 1 : -1;
    }

    /**
     * Memilih satu elemen acak dari array
     * @param array Daftar pilihan
     * @returns Array dengan index tertentu
     */
    choice<T>(array: readonly T[]): T {
        if (array.length === 0) {
            throw new Error("Tidak dapat memilih elemen dari array kosong.");
        }
        const index = Math.floor(this.next() * array.length);
        return array[index];
    }

    /**
     * Mengacak urutan elemen dalam array secara langsung
     * Menggunakan algoritma Fisher-Yates
     * @param array Array yang akan diacak
     * @returns Array yang sama dengan urutan yang sudah diacak
     */
    shuffle<T>(array: T[]): T[] {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(this.next() * (i + 1));
            const temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
        return array;
    }

    /**
     * Menghasilkan sudut acak dalam satuan radian
     * @returns Sudut acak
     */
    angle(): number {
        return this.next() * Math.PI * 2;
    }

    /**
     * Menghasilkan titik acak di dalam lingkaran dengan radius tertentu
     * Distribusi tersebar merata menggunakan akar kuadrat
     * @param radius Jari-jari lingkaran (default: 1)
     * @param out Vektor penampung hasil (opsional)
     * @returns Vektor baru
     */
    pointInCircle(radius: number = 1, out?: Vector2): Vector2 {
        const target = out ?? new Vector2();
        const r = Math.sqrt(this.next()) * radius;
        const theta = this.angle();

        target.x = r * Math.cos(theta);
        target.y = r * Math.sin(theta);

        return target;
    }

    /**
     * Menghasilkan titik acak tepat di garis keliling lingkaran
     * @param radius Jari-jari lingkaran (default: 1)
     * @param out Vektor penampung hasil (opsional)
     * @returns Vektor baru
     */
    pointOnCircle(radius: number = 1, out?: Vector2): Vector2 {
        const target = out ?? new Vector2();
        const theta = this.angle();

        target.x = radius * Math.cos(theta);
        target.y = radius * Math.sin(theta);

        return target;
    }
}

/**
 * Instance PRNG global default siap pakai
 */
export const random = new PRNG();
