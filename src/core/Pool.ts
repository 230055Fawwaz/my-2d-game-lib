// ==========================================
// Nama File:          Pool.ts
// Deskripsi File:     Modul pool objek
// Penulis File:       Fawwaz Yaqzhan & Google Antigravity
// Tanggal Pembuatan:  16-09-2026
// Tanggal Pembaruan:  16-09-2026
// Catatan:
//   - Pool objek mendaur ulang objek agar tidak memicu lonjakan Garbage Collection (GC)
//   - Sangat penting untuk game loop dengan alokasi tinggi (vektor, partikel, peluru)
//   - Mendukung antarmuka IPoolable untuk pembersihan otomatis
// ==========================================


import type { IPoolable } from "./types.js";


/**
 * Pilihan konfigurasi saat inisialisasi awal
 */
export interface PoolOption<T> {
    /**Kapasitas maksimum objek yang ditampung dalam pool (mencegah memory leak) */
    maxCapacity?: number;
    /**Fungsi pembersih manual (opsional, jika objek bukan implementasi IPoolable) */
    resetFn?: (item: T) => void;
}

/**
 * Class generic penyedia objek pool untuk mendaur ulang objek
 */
export class Pool<T> {
    private readonly items: T[] = [];
    private readonly factory: () => T;
    private readonly resetFn?: (item: T) => void;
    private readonly maxCapacity: number;

    /**
     * Membuat instance pool baru
     * @param factory Fungsi pembuat objek baru ketika pool kosong
     * @param initialCapacity Jumlah objek yang langsung disiapkan di awal
     * @param options Opsi tambahan seperti maxCapacity dan fungsi reset manual
     */
    constructor(
        factory: () => T,
        initialCapacity: number = 0,
        options: PoolOption<T> = {}
    ) {
        this.factory = factory;
        this.maxCapacity = options.maxCapacity ?? 1000;
        this.resetFn = options.resetFn;

        if (initialCapacity > 0) {
            this.preallocate(initialCapacity);
        }
    }

    /**
     * Jumlah objek yang sedang menganggur di dalam pool
     */
    get freeCount(): number {
        return this.items.length;
    }

    /**
     * Menyiapkan sejumlah objek sekaligus ke dalam pool di awal
     * @param count Jumlah objek yang ingin dibuat terlebih dahulu
     */
    preallocate(count: number): void {
        const spaceLeft = this.maxCapacity - this.items.length;
        const toCreate = Math.min(count, spaceLeft);

        for (let i = 0; i < toCreate; i++) {
            this.items.push(this.factory());
        }
    }

    /**
     * Mengambil satu objek dari pool
     * Jika pool kosong, otomatis membuat objek baru lewat factory
     * @returns Objek instance T
     */
    acquire(): T {
        return this.items.length > 0 ? this.items.pop()! : this.factory();
    }

    /**
     * Mengembalikan objek ke dalam pool untuk digunakan kembali
     * @param item Objek yang ingin dikembalikan
     */
    release(item: T): void {
        // Jalankan reset jika disediakan custom resetFn
        if (this.resetFn) {
            this.resetFn(item);
        } else if (this.isPoolable(item)) {
            // Jika objek mengimplementasikan IPoolable, panggil reset bawaannya
            item.reset();
        }

        // Hanya tampung kembali jika belum melebihi batas maksimum kapasitas
        if (this.items.length < this.maxCapacity) {
            this.items.push(item);
        }
    }

    /**
     * Mengembalikan beberapa objek sekaligus ke dalam pool
     * @param items Kumpulan objek yang ingin dikembalikan
     */
    releaseAll(items: T[]): void {
        for (const item of items) {
            this.release(item);
        }
    }

    /**
     * Mengosongkan seluruh objek yang ada di dalam pool
     */
    clear(): void {
        this.items.length = 0;
    }

    /**
     * Type guard untuk mengecek apakah objek memiliki method reset()
     */
    private isPoolable(obj: unknown): obj is IPoolable {
        return (
            typeof obj === "object" &&
            obj !== null &&
            "reset" in obj &&
            typeof (obj as IPoolable).reset === "function"
        );
    }
}
