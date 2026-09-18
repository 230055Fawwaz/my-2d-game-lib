// ==========================================
// Nama File:          types.ts
// Deskripsi File:     Tipe dan struktur data hasil deteksi tabrakan 2D
// Penulis File:       Fawwaz Yaqzhan & Google Antigravity
// Tanggal Pembuatan:  18-09-2026
// Tanggal Pembaruan:  18-09-2026
// Catatan:
//   - CollisionResult menyimpan detail kontak (manifold) tabrakan
//   - RaycastHit menyimpan detail perpotongan sinar (raycast)
//   - Mendukung metode reset() dan penggunaan ulang (GC-Friendly)
// ==========================================


import { Vector2 } from "../core/Vector2.js";
import { IVector2 } from "../core/types.js";


/**
 * Kelas representasi hasil deteksi tabrakan mendalam (Collision Manifold).
 * 
 * Konvensi Normal:
 * Vektor `normal` mengarah dari Objek A menuju Objek B (A mendorong B).
 * Untuk resolusi posisi:
 * - Objek A dapat dipisahkan dengan: posA -= normal * penetration
 * - Objek B dapat dipisahkan dengan: posB += normal * penetration
 */
export class CollisionResult {
    // Menandakan apakah tabrakan terjadi
    public collided: boolean;

    // Arah normal pemisah tabrakan (dari A ke B, ternormalisasi)
    public normal: Vector2;

    // Kedalaman tumpang tindih / penetrasi antara dua objek
    public penetration: number;

    // Titik kontak perkiraan terjadinya benturan
    public contactPoint: Vector2;

    /**
     * Konstruktor CollisionResult
     */
    constructor(
        collided: boolean = false,
        normal: IVector2 = Vector2.zero(),
        penetration: number = 0,
        contactPoint: IVector2 = Vector2.zero()
    ) {
        this.collided = collided;
        this.normal = new Vector2(normal.x, normal.y);
        this.penetration = penetration;
        this.contactPoint = new Vector2(contactPoint.x, contactPoint.y);
    }

    /**
     * Mengatur ulang hasil tabrakan menjadi kondisi bersih (tanpa tabrakan)
     */
    public reset(): this {
        this.collided = false;
        this.normal.set(0, 0);
        this.penetration = 0;
        this.contactPoint.set(0, 0);
        return this;
    }

    /**
     * Mengatur nilai seluruh atribut kontak secara in-place
     */
    public set(
        collided: boolean,
        normalX: number,
        normalY: number,
        penetration: number,
        contactX: number,
        contactY: number
    ): this {
        this.collided = collided;
        this.normal.set(normalX, normalY);
        this.penetration = penetration;
        this.contactPoint.set(contactX, contactY);
        return this;
    }

    /**
     * Menyalin nilai dari CollisionResult lain
     */
    public copyFrom(other: CollisionResult): this {
        this.collided = other.collided;
        this.normal.copy(other.normal);
        this.penetration = other.penetration;
        this.contactPoint.copy(other.contactPoint);
        return this;
    }

    /**
     * Membuat kloning instance CollisionResult baru
     */
    public clone(): CollisionResult {
        return new CollisionResult(
            this.collided,
            this.normal,
            this.penetration,
            this.contactPoint
        );
    }
}


/**
 * Kelas representasi hasil tembakan sinar (Raycast Hit).
 */
export class RaycastHit {
    // Menandakan apakah sinar mengenai objek
    public hit: boolean;

    // Titik koordinat dunia tempat sinar membentur objek
    public point: Vector2;

    // Normal permukaan yang tertabrak sinar pada titik benturan (mengarah ke luar permukaan)
    public normal: Vector2;

    // Jarak dari titik asal sinar (origin) ke titik benturan
    public distance: number;

    // Fraksi jarak dalam rentang [0, 1] relatif terhadap maxDistance (jika ditentukan)
    public fraction: number;

    /**
     * Konstruktor RaycastHit
     */
    constructor(
        hit: boolean = false,
        point: IVector2 = Vector2.zero(),
        normal: IVector2 = Vector2.zero(),
        distance: number = 0,
        fraction: number = 0
    ) {
        this.hit = hit;
        this.point = new Vector2(point.x, point.y);
        this.normal = new Vector2(normal.x, normal.y);
        this.distance = distance;
        this.fraction = fraction;
    }

    /**
     * Mengatur ulang hasil raycast ke kondisi default (tidak kena)
     */
    public reset(): this {
        this.hit = false;
        this.point.set(0, 0);
        this.normal.set(0, 0);
        this.distance = 0;
        this.fraction = 0;
        return this;
    }

    /**
     * Mengatur nilai seluruh atribut raycast in-place
     */
    public set(
        hit: boolean,
        pointX: number,
        pointY: number,
        normalX: number,
        normalY: number,
        distance: number,
        fraction: number = 0
    ): this {
        this.hit = hit;
        this.point.set(pointX, pointY);
        this.normal.set(normalX, normalY);
        this.distance = distance;
        this.fraction = fraction;
        return this;
    }

    /**
     * Menyalin nilai dari RaycastHit lain
     */
    public copyFrom(other: RaycastHit): this {
        this.hit = other.hit;
        this.point.copy(other.point);
        this.normal.copy(other.normal);
        this.distance = other.distance;
        this.fraction = other.fraction;
        return this;
    }

    /**
     * Membuat kloning instance RaycastHit baru
     */
    public clone(): RaycastHit {
        return new RaycastHit(
            this.hit,
            this.point,
            this.normal,
            this.distance,
            this.fraction
        );
    }
}
