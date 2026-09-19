// ==========================================
// Nama File:          types.ts
// Deskripsi File:     Tipe dan kontrak antarmuka untuk partisi spasial 2D
// Penulis File:       Fawwaz Yaqzhan & Google Antigravity
// Tanggal Pembuatan:  19-09-2026
// Tanggal Pembaruan:  19-09-2026
// Catatan:
//   - Mendefinisikan kontrak item spasial (ISpatialItem) dengan bounds AABB
//   - Opsi konfigurasi untuk SpatialHash dan Quadtree
// ==========================================


import { AABB } from "../geometry/AABB.js";


/**
 * Kontrak elemen/objek yang dapat dimasukkan ke dalam struktur data partisi spasial.
 */
export interface ISpatialItem<T = any> {
    /**
     * Pengenal unik item (string atau number) untuk mencegah duplikasi hasil query.
     */
    id: string | number;

    /**
     * Kotak pembungkus (AABB) dari item dalam koordinat dunia.
     */
    bounds: AABB;

    /**
     * Data muatan (payload) yang terkait dengan item ini (misal: Entity, GameObject, dll.).
     */
    data?: T;
}


/**
 * Pasangan item yang berpotensi saling bertabrakan (broadphase pair).
 */
export interface SpatialPair<T = any> {
    a: ISpatialItem<T>;
    b: ISpatialItem<T>;
}


/**
 * Opsi konfigurasi untuk SpatialHash.
 */
export interface SpatialHashOptions {
    /**
     * Lebar dan tinggi tiap petak/sel grid spasial dalam piksel/unit dunia.
     * Disarankan seukuran 1x - 2x rata-rata ukuran objek dalam game.
     * Default: 64
     */
    cellSize?: number;
}


/**
 * Opsi konfigurasi untuk Quadtree.
 */
export interface QuadtreeOptions {
    /**
     * Kapasitas maksimum objek per node sebelum dipecah menjadi 4 sub-node.
     * Default: 8
     */
    maxObjects?: number;

    /**
     * Kedalaman maksimum pohon Quadtree.
     * Default: 6
     */
    maxDepth?: number;
}
