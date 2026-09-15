// ==========================================
// Nama File:          types.ts
// Deskripsi File:     Modul tipe data umum
// Penulis File:       Fawwaz Yaqzhan & Google Antigravity
// Tanggal Pembuatan:  16-09-2026
// Tanggal Pembaruan:  16-09-2026
// Catatan:
//   - Berisi interface dan tipe data umum yang digunakan lintas modul
//   - Menjadi kontrak standar struktur data pada library
// ==========================================


import type { IVector2 } from "./Vector2";


// Re-export IVector2 agar terpusat dari types.ts
export type { IVector2 };

/**
 * Interface untuk vektor2 read-only
 */
export interface ReadonlyVector2 {
    readonly x: number;
    readonly y: number;
}

/**
 * Interface untuk ukuran 2 dimensi (lebar dan tinggi)
 */
export interface ISize2D {
    width: number;
    length: number;
}

/**
 * Interface untuk ukuran 2 dimensi read-only
 */
export interface ReadonlySize2D {
    readonly width: number;
    readonly length: number;
}

/**
 * Interface untuk transformasi 2 dimensi (posisi, rotasi, skala)
 */
export interface ITransform2D {
    position: IVector2;
    rotation: number;
    scale: IVector2;
}

/**
 * Interface untuk obejk yang dapat dimasukkan ke dalam pool objek
 * Menyediakan method reset() untuk membersihkan state sebelum digunakan kembali
 */
export interface IPoolable {
    reset(): void;
}

/**
 * Tipe konstruktor generic (digunakan oleh pool untuk unstansiasi class baru)
 */
export type Constructor<T> = new (...args: any[]) => T;

/**
 * Tipe pembantu untuk nilai yang mungkin bernilai null
 */
export type Nullable<T> = T | null;
