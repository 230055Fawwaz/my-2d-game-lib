// ==========================================
// Nama File:          Vector2.ts
// Deskripsi File:     Modul Vector2
// Penulis File:       Fawwaz Yaqzhan & Google Antigravity
// Tanggal Pembuatan:  15-09-2026
// Tanggal Pembaruan:  16-09-2026
// Catatan:
//   - Vector2 adalah class yang berisi koordinat x dan y
//   - Normalisasi vektor adalah proses mengubah panjang vektor menjadi 1 tanpa mengubah arah
//   - Dot product adalah perkalian dua vektor yang menghasilkan skalar
//   - 2D cross product (perp-dot) adalah perkalian silang yang menghasilkan skalar untuk menentukan orientasi arah putar / belokan
//   - Sudut bertanda adalah sudut dengan tanda + dan - untuk menentukan arah putar
//   - Interpolasi linear digunakan untuk mencari nilai di antara dua titik dalam garis lurus
//   - Bagi komputer, titik pusat (0, 0) berada di kiri atas bukan kiri bawah
// ==========================================


import { approxEqual, EPSILON, lerp } from "./MathUtils.js";


/**
 * Interface merepresentasikan objek apapun dalam koordinat 2 dimensi (x dan y)
 * Memungkinkan interoperabilitas dengan object mentah seperti { x: 10, y: 20 }
 */
export interface IVector2 {
  x: number;
  y: number;
}

/**
 * Class vector 2D dengan operasi aljabar linear komprehensif
 * Mendukung dua metode yaitu immutable (mengembalikan instance baru) dan
 * mutable/in-place (berakhiran 'Mut' atau mengembalikan 'this')
 * Digunakan untuk game loop performance-critical
 */
export class Vector2 implements IVector2 {
  public x: number;
  public y: number;

  constructor(x: number = 0, y: number = 0) {
    this.x = x;
    this.y = y;
  }

  // --- Nilai konstan dan Factory statis ---

  /** Mengembalikan Vector2(0, 0) yang baru (titik pusat) */
  static zero(): Vector2 {
    return new Vector2(0, 0);
  }

  /** Mengembalikan Vector2(1, 1) yang baru (diagonal atas-kanan) */
  static one(): Vector2 {
    return new Vector2(1, 1);
  }

  /** 
   * Mengembalikan Vector2(0, -1) dengan arah menunjuk ke atas 
   * (Y berkurang ke atas pada sistem layar) 
   */
  static up(): Vector2 {
    return new Vector2(0, -1);
  }

  /** 
   * Mengembalikan Vector2(0, 1) dengan arah menunjuk ke bawah 
   * (Y bertambah ke bawah pada sistem layar)
   */
  static down(): Vector2 {
    return new Vector2(0, 1);
  }

  /** Mengembalikan Vector2(-1, 0) dengan arah menunjuk ke kiri */
  static left(): Vector2 {
    return new Vector2(-1, 0);
  }

  /** Mengembalikan Vector2(1, 0) dengan arah menunjuk ke kanan */
  static right(): Vector2 {
    return new Vector2(1, 0);
  }

  /**
   * Membuat sebuah unit vektor yang mengarah pada sudut radian yang diberikan
   * @param radians Sudut dalam radian dari sumbu X positif
   * @param length Panjang vektor (magnitudo) opsional (default = 1)
   * @returns Vektor baru yang mengarah ke sudut yang diberikan
   */
  static fromAngle(radians: number, length: number = 1): Vector2 {
    return new Vector2(Math.cos(radians) * length, Math.sin(radians) * length);
  }

  /** 
   * Menghitung jarak Euclidean antara 2 vektor 
   * @param a Vektor 1
   * @param b Vektor 2
   * @returns Jarak euclidean
   */
  static distance(a: IVector2, b: IVector2): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /** 
   * Menghitung jarak kuadrat Euclidean antara dua vektor (lebih cepat daripada distance biasa) 
   * @param a Vektor 1
   * @param b Vektor 2
   * @returns Jarak euclidean
   */
  static distanceSquared(a: IVector2, b: IVector2): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return dx * dx + dy * dy;
  }

  /** 
   * Menghitung dot product 2 vektor 
   * @param a Vektor 1
   * @param b Vektor 2
   * @returns Dot product
   */
  static dot(a: IVector2, b: IVector2): number {
    return a.x * b.x + a.y * b.y;
  }

  /** 
   * Menghitung 2D cross product (perp-dot product) 2 vektor 
   * @param a Vektor 1
   * @param b Vektor 2
   * @returns Cross product
   */
  static cross(a: IVector2, b: IVector2): number {
    return a.x * b.y - a.y * b.x;
  }

  /** 
   * Interpolasi linear antara vektor 'a' dan 'b' dengan faktor 't' 
   * @param a Vektor 1
   * @param b Vektor 2
   * @param t Faktor
   * @returns Interpolasi linear
   */
  static lerp(a: IVector2, b: IVector2, t: number): Vector2 {
    return new Vector2(lerp(a.x, b.x, t), lerp(a.y, b.y, t));
  }

  // --- Metode instance ---

  /** Membuat duplikat sama persis dari vektor ini */
  clone(): Vector2 {
    return new Vector2(this.x, this.y);
  }

  /** 
   * Menyalin koordinat dari vektor lain tanpa membuat objek baru 
   * @param other Suatu vektor
   * @returns Salinan vektor
   */
  copy(other: IVector2): this {
    this.x = other.x;
    this.y = other.y;
    return this;
  }

  /** 
   * Menetapkan koordinat x dan y baru in-place 
   * @param x Koordinat x baru
   * @param y Koordinat y baru
   * @returns Vektor dengan koordinat baru
   */
  set(x: number, y: number): this {
    this.x = x;
    this.y = y;
    return this;
  }

  /** 
   * Mengembalikan hasil penjumlahan vektor ini dengan vektor lain sebagai Vector2 baru 
   * @param v Suatu vektor
   * @returns Vektor baru
   */
  add(v: IVector2): Vector2 {
    return new Vector2(this.x + v.x, this.y + v.y);
  }

  /** 
   * Menambahkan vektor lain ke vektor ini in-place 
   * @param v Suatu vektor
   * @returns Vektor dengan koordinat baru
   */
  addMut(v: IVector2): this {
    this.x += v.x;
    this.y += v.y;
    return this;
  }

  /** 
   * Mengembalikan selisih vektor ini dengan vektor lain sebagai Vector2 baru 
   * @param v Suatu vektor
   * @returns Vektor baru
   */
  sub(v: IVector2): Vector2 {
    return new Vector2(this.x - v.x, this.y - v.y);
  }

  /** 
   * Mengurangkan vektor lain dari vektor ini in-place 
   * @param v Suatu vektor
   * @returns Vektor dengan koordinat baru
   */
  subMut(v: IVector2): this {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }

  /** 
   * Mengalikan vektor ini dengan nilai skalar, mengembalikan Vector2 baru 
   * @param scalar Suatu nilai skalar/nilai dengan angka saja
   * @returns Vektor baru
   */
  scale(scalar: number): Vector2 {
    return new Vector2(this.x * scalar, this.y * scalar);
  }

  /** 
   * Mengalikan vektor ini dengan nilai skalar in-place 
   * @param scalar Suatu nilai skalar/nilai dengan angka saja
   * @returns Vektor dengan koordinat baru
   */
  scaleMut(scalar: number): this {
    this.x *= scalar;
    this.y *= scalar;
    return this;
  }

  /** 
   * Membagi vektor ini dengan nilai skalar, mengembalikan Vector2 baru 
   * @param scalar Suatu nilai skalar/nilai dengan angka saja
   * @returns Vektor baru
   */
  divide(scalar: number): Vector2 {
    if (scalar === 0) {
      throw new Error("Cannot divide Vector2 by zero");
    }
    return new Vector2(this.x / scalar, this.y / scalar);
  }

  /** 
   * Membagi vektor ini dengan nilai skalar in-place 
   * @param scalar Suatu nilai skalar/nilai dengan angka saja
   * @returns Vektor dengan koordinat baru
   */
  divideMut(scalar: number): this {
    if (scalar === 0) {
      throw new Error("Cannot divide Vector2 by zero");
    }
    this.x /= scalar;
    this.y /= scalar;
    return this;
  }

  /** Mengembalikan vektor negasi (-x, -y) */
  negate(): Vector2 {
    return new Vector2(-this.x, -this.y);
  }

  /** Negasikan vektor ini in-place */
  negateMut(): this {
    this.x = -this.x || 0;
    this.y = -this.y || 0;
    return this;
  }

  /** Menghitung panjang Euclidean (magnitudo) dari vektor ini */
  length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  /**
   * Menghitung panjang kuadrat (magnitudo kuadrat) dari vektor ini
   * Lebih cepat daripada length() karena menghindari operasi akar kuadrat
   */
  lengthSquared(): number {
    return this.x * this.x + this.y * this.y;
  }

  /**
   * Mengembalikan unit vektor hasil normalisasi dengan arah yang sama
   * Jika panjang (magnitudo) = 0, kembalikan vektor nol tanpa melempar error
   */
  normalize(): Vector2 {
    const len = this.length();
    if (len <= EPSILON) {
      return new Vector2(0, 0);
    }
    return new Vector2(this.x / len, this.y / len);
  }

  /**
   * Melakukan normalisasi vektor ini secara in-place.
   * Jika panjang (magnitudo) = 0, diubah menjadi vektor nol.
   */
  normalizeMut(): this {
    const len = this.length();
    if (len <= EPSILON) {
      this.x = 0;
      this.y = 0;
    } else {
      this.x /= len;
      this.y /= len;
    }
    return this;
  }

  /**
   * Menghitung dot product antara vektor ini dengan vektor lain.
   * - Positif: kedua vektor mengarah ke arah yang hampir sama.
   * - Nol: kedua vektor saling tegak lurus (perpendicular).
   * - Negatif: kedua vektor mengarah ke arah yang berlawanan.
   * @param v Suatu vektor
   * @returns Dot product
   */
  dot(v: IVector2): number {
    return this.x * v.x + this.y * v.y;
  }

  /**
   * Menghitung 2D cross product (perp-dot product) `(x * v.y - y * v.x)`.
   * Bernilai positif jika arah `v` berlawanan arah jarum jam (counter-clockwise) relatif terhadap vektor ini.
   * @param v Suatu vektor
   * @returns Cross product
   */
  cross(v: IVector2): number {
    return this.x * v.y - this.y * v.x;
  }

  /**
   * Mengembalikan vektor yang tegak lurus (perpendicular) terhadap vektor ini (-y, x).
   */
  perpendicular(): Vector2 {
    return new Vector2(-this.y, this.x);
  }

  /**
   * Mengubah vektor ini menjadi tegak lurus (perpendicular) (-y, x) secara in-place.
   */
  perpendicularMut(): this {
    const temp = this.x;
    this.x = -this.y;
    this.y = temp;
    return this;
  }

  /**
   * Mengembalikan sudut arah vektor ini dalam satuan radian (dari -PI sampai PI).
   */
  angle(): number {
    return Math.atan2(this.y, this.x);
  }

  /**
   * Mengembalikan sudut bertanda (signed angle) dalam radian antara vektor ini dan vektor lain.
   * @param v Suatu vektor
   * @returns Sudut bertanda dalam radian
   */
  angleTo(v: IVector2): number {
    return Math.atan2(this.cross(v), this.dot(v));
  }

  /**
   * Memutar vektor ini sebesar sudut radian tertentu mengitari titik pusat (origin), mengembalikan Vector2 baru.
   * @param radians Sudut dalam satuan radian
   * @returns Vektor baru
   */
  rotate(radians: number): Vector2 {
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    return new Vector2(this.x * cos - this.y * sin, this.x * sin + this.y * cos);
  }

  /**
   * Memutar vektor ini secara in-place sebesar sudut radian tertentu mengitari titik pusat (origin).
   * @param radians Sudut dalam satuan radian
   * @returns Vektor ini sendiri
   */
  rotateMut(radians: number): this {
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    const newX = this.x * cos - this.y * sin;
    const newY = this.x * sin + this.y * cos;
    this.x = newX;
    this.y = newY;
    return this;
  }

  /** 
   * Menghitung jarak Euclidean ke vektor lain 
   * @param v Suatu vektor
   * @returns Jarak euclidean
   */
  distance(v: IVector2): number {
    return Vector2.distance(this, v);
  }

  /** 
   * Menghitung jarak kuadrat Euclidean ke vektor lain 
   * @param v Suatu vektor
   * @returns Jarak euclidean
   */
  distanceSquared(v: IVector2): number {
    return Vector2.distanceSquared(this, v);
  }

  /**
   * Interpolasi linear menuju vektor target dengan faktor `t`.
   * @param target Vektor target
   * @param t Faktor t
   * @returns Interpolasi linear
   */
  lerp(target: IVector2, t: number): Vector2 {
    return Vector2.lerp(this, target, t);
  }

  /**
   * Interpolasi linear menuju vektor target dengan faktor `t` secara in-place.
   * @param target Vektor target
   * @param t Faktor t
   * @returns Interpolasi linear
   */
  lerpMut(target: IVector2, t: number): this {
    this.x = lerp(this.x, target.x, t);
    this.y = lerp(this.y, target.y, t);
    return this;
  }

  /**
   * Mengecek apakah vektor ini bernilai hampir sama dengan vektor lain dalam toleransi epsilon.
   * @param v Suatu vektor
   * @param [epsilon=EPSILON] Nilai toleransi epsilon
   * @returns True jika kedua vektor bernilai hampir sama dalam batas toleransi epsilon
   */
  equals(v: IVector2, epsilon: number = EPSILON): boolean {
    return approxEqual(this.x, v.x, epsilon) && approxEqual(this.y, v.y, epsilon);
  }

  /** Mengonversi koordinat vektor ini menjadi tuple array [x, y] */
  toArray(): [number, number] {
    return [this.x, this.y];
  }

  /** Mengembalikan representasi teks, contoh: "Vector2(3, 4)" */
  toString(): string {
    return `Vector2(${this.x}, ${this.y})`;
  }
}
