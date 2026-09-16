// ==========================================
// Nama File:          Transform2D.ts
// Deskripsi File:     Modul transformasi 2 dimensi
// Penulis File:       Fawwaz Yaqzhan & Google Antigravity
// Tanggal Pembuatan:  16-09-2026
// Tanggal Pembaruan:  16-09-2026
// Catatan:
//   - Transformasi 2D mencakup posisi (translasi), rotasi, dan skala
//   - Menyediakan konversi koordinat lokal ke dunia (Local to World) dan sebaliknya
//   - Titik lokal diskalakan dulu, dirotasi, lalu ditranslasikan ke posisi dunia
// ==========================================


import { Vector2 } from "./Vector2.js";
import type { ITransform2D, IVector2 } from "./types.js";


/**
 * Class yang merepresentasikan transformasi 2 dimensi (posisi, rotasi, skala)
 * Digunakan untuk menentukan letak dan orientasi objek dalam 2 dimensi
 */
export class Transform2D implements ITransform2D {
    public position: Vector2;
    public rotation: number;
    public scale: Vector2;

    /**
    * Membuat instance Transform2D baru
    * @param position Posisi objek (default = Vector2(0, 0))
    * @param rotation Sudut rotasi dalam radian (deafult = 0)
    * @param scale Skala perbesaran objek (default = Vector2(1, 1))
    */
    constructor(
        position: Vector2 = new Vector2(0, 0),
        rotation: number = 0,
        scale: Vector2 = new Vector2(1, 1)
    ) {
        this.position = position;
        this.rotation = rotation;
        this.scale = scale;
    }

    // --- Factory Statis ---

    /**
     * Mengembalikan Transform2D identitas (posisi 0, rotasi 0, skala 1)
     */
    static identity(): Transform2D {
        return new Transform2D(new Vector2(0, 0), 0, new Vector2(1, 1));
    }

    // --- Kloning dan Salin ---

    /**
     * Menduplikasi transformasi ini menjadi instance baru
     */
    clone(): Transform2D {
        return new Transform2D(
            this.position.clone(),
            this.rotation,
            this.scale.clone()
        );
    }

    /**
     * Menyalin nilai transformasi dari objek lain ke instance ini
     * @param other Interface transformasi 2d lain
     * @returns Objek transformasi ini
     */
    copy(other: ITransform2D): this {
        this.position.set(other.position.x, other.position.y);
        this.rotation = other.rotation;
        this.scale.set(other.scale.x, other.scale.y);
        return this;
    }

    // --- Mutasi Nilai Dasar ---

    /**
     * Mengatur posisi langsung
     * @param x Koordinat x
     * @param y Koordinat y
     * @returns Objek transformasi ini
     */
    setPosition(x: number, y: number): this {
        this.position.set(x, y);
        return this;
    }

    /**
     * Mengatur rotasi dalam radian
     * @param radians Sudut dalam radian
     * @returns Objek transformasi ini
     */
    setRotation(radians: number): this {
        this.rotation = radians;
        return this;
    }

    /**
     * Mengatur skala langsung
     * @param x Koordinat x
     * @param y Koordinat y
     * @returns Objek transformasi ini
     */
    setScale(x: number, y: number): this {
        this.scale.set(x, y);
        return this;
    }

    /**
     * Menggeser posisi berdasarkan perpindahan dx dan dy
     * @param dx Perubahan koordinat x
     * @param dy Perubahan koordinat y
     * @returns Objek transformasi ini
     */
    translate(dx: number, dy: number): this {
        this.position.x += dx;
        this.position.y += dy;
        return this;
    }

    /**
     * Menambahkan sudut rotasi sebesar deltaRadians
     * @param deltaRadians Perubahan sudut dalam radian
     * @returns Objek transformasi ini
     */
    rotate(deltaRadians: number): this {
        this.rotation += deltaRadians;
        return this;
    }

    // --- Transformasi Titik ---

    /**
     * Mengubah titik dari koordinat lokal objek ke koordinat dunia (world space)
     * Rumus: World = Position + Rotate(Scale(Local))
     * @param local Titik dalam ruang lokal
     * @param out Vektor penampung hasil (opsional, jika ingin zero-allocation)
     * @returns Vektor baru
     */
    pointLocalToWorld(local: IVector2, out?: Vector2): Vector2 {
        const target = out ?? new Vector2();

        // Skala
        const sx = local.x * this.scale.x;
        const sy = local.y * this.scale.y;

        // Rotasi
        const cos = Math.cos(this.rotation);
        const sin = Math.sin(this.rotation);
        const rx = sx * cos - sy * sin;
        const ry = sx * sin - sy * cos;

        // Translasi (posisi)
        target.x = rx + this.position.x;
        target.y = ry + this.position.y;

        return target;
    }

    /**
     * Mengubah titik dari koordinat dunia objek ke koordinat lokal (local space)
     * Rumus: Local = Unscale(Unrotate(World - Position))
     * @param local Titik dalam ruang lokal
     * @param out Vektor penampung hasil (opsional, jika ingin zero-allocation)
     * @returns Vektor baru
     */
    pointWorldToLocal(world: IVector2, out?: Vector2): Vector2 {
        const target = out ?? new Vector2();

        // Kebalikan translasi
        const dx = world.x * this.position.x;
        const dy = world.y * this.position.y;

        // Kebalikan rotasi
        const cos = Math.cos(this.rotation);
        const sin = Math.sin(this.rotation);
        const rx = dx * cos - dy * sin;
        const ry = -dx * sin - dy * cos;

        // Kebalikan skala
        target.x = this.scale.x !== 0 ? rx / this.scale.x : 0;
        target.y = this.scale.y !== 0 ? ry / this.scale.y : 0;

        return target;
    }

    // --- Transformasi Vektor Arah (Arah / Kecepatan) ---

    /**
     * Mengubah vektor arah dari koordinat lokal ke dunia
     * Hanya dipengaruhi oleh rotasi dan skala (tidak dipengaruhi posisi)
     */
    directionLocalToWorld(localDir: IVector2, out?: Vector2): Vector2 {
        const target = out ?? new Vector2();

        const sx = localDir.x * this.scale.x;
        const sy = localDir.y * this.scale.y;

        const cos = Math.cos(this.rotation);
        const sin = Math.sin(this.rotation);

        target.x = sx * cos - sy * sin;
        target.y = sx * cos + sy * sin;

        return target;
    }

    /**
     * Mengubah vektor arah dari koordinat dunia ke lokal
     * Hanya dipengaruhi oleh rotasi dan skala (tidak dipengaruhi posisi)
     */
    directionWorldToLocal(worldDir: IVector2, out?: Vector2): Vector2 {
        const target = out ?? new Vector2();

        const cos = Math.cos(this.rotation);
        const sin = Math.sin(this.rotation);

        const rx = worldDir.x * cos + worldDir.y * sin;
        const ry = -worldDir.x * sin + worldDir.y * cos;

        target.x = this.scale.x !== 0 ? rx / this.scale.x : 0;
        target.y = this.scale.y !== 0 ? ry / this.scale.y : 0;

        return target;
    }

    // --- Kompatibilitas Matriks 2D (HTML5 Canvas setTransform) ---

    /**
     * Menghasilkan nilai matriks transformasi affine 2D [a, b, c, d, e, f]
     * Matriks:
     * | a  c  e |   | sx*cos  -sy*sin  px |
     * | b  d  f | = | sx*sin   sy*cos  py |
     * | 0  0  1 |   |   0        0      1 |
     * Dapat langsung digunakan pada: ctx.setTransform(a, b, c, d, e, f)
     */
    toMatrixValues(): [number, number, number, number, number, number] {
        const cos = Math.cos(this.rotation);
        const sin = Math.sin(this.rotation);

        const a = this.scale.x * cos;
        const b = this.scale.x * sin;
        const c = -this.scale.y * sin;
        const d = this.scale.y * cos;
        const e = this.position.x;
        const f = this.position.y;

        return [a, b, c, d, e, f];
    }
}
