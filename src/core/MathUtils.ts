// ==========================================
// Nama File:          MathUtils.ts
// Deskripsi File:     Bantuan matematika
// Penulis File:       Fawwaz Yaqzhan & Google Antigravity
// Tanggal Pembuatan:  15-09-2026
// Tanggal Pembaruan:  16-09-2026
// Catatan:
//   - Berisi nilai-nilai dasar matematika yang konstan
//   - Perhitungan matematika dasar
//   - Derajat digunakan manusia, satu lingkaran adalah 360 derajat
//   - Radian digunakan komputer, satu lingkaran adalah 2 PI radian
//   - Interpolasi linear digunakan untuk mencari nilai di antara dua titik dalam garis lurus
//   - Interpolasi hermite digunakan untuk menghasilkan kurva yang mulus untuk pergerakan benda
// ==========================================


/**
 * Standar toleransi bagi nilai float (bilangan desimal)
 * Toleransi digunakan agar saat membandingkan nilai float, tidak error
 * Nilai float dapat error saat dibandingkan karena hitungan tidak sempurna
 * Nilai ini bernama epsilon
 */
export const EPSILON = 1e-6;

/**
 * Nilai konstan untuk rumus konversi derajat ke radian
 */
export const DEG_TO_RAD = Math.PI / 180;

/**
 * Nilai konstan untuk rumus konversi radian ke derajat
 */
export const RAD_TO_DEG = 180 / Math.PI;

/**
 * Fungsi konversi derajat ke radian
 * @param degrees Besaran sudut dalam satuan derajat
 * @returns Nilai sudut dalam satuan radian
 */
export function degToRad(degrees: number): number {
  return degrees * DEG_TO_RAD;
}

/**
 * Fungsi konversi radian ke derajat
 * @param radians Besaran sudut dalam satuan radian
 * @returns Nilai sudut dalam satuan derajat
 */
export function radToDeg(radians: number): number {
  return radians * RAD_TO_DEG;
}

/**
 * Membatasi nilai di antara jangkauan minimum dan maksimum
 * @param val Nilai untuk dibatasi
 * @param min Batas minimum
 * @param max Batas maksimum
 * @returns Nilai yang dibatasi
 */
export function clamp(val: number, min: number, max: number): number {
  return val < min ? min : val > max ? max : val;
}

/**
 * Interpolasi antara dua buah nilai skalar
 * @param start Nilai mulai
 * @param end Nilai akhir
 * @param t Faktor interpolasi (biasanya [0, 1])
 * @returns Nilai interpolasi
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * Mengecek apakah dua angka bernilai hampir sama dalam toleransi epsilon
 * @param a Angka pertama
 * @param b Angka kedua
 * @param epsilon Margin epsilon (default = EPSILON)
 * @returns True jika perbedaannya di dalam toleransi epsilon
 */
export function approxEqual(a: number, b: number, epsilon: number = EPSILON): boolean {
  return Math.abs(a - b) <= epsilon;
}

/**
 * Membungkus nilai ke dalam rentang [min, max)
 * Berguna untuk looping sudut, batas grid, maupun animasi melingkar
 * @param val Nilai input
 * @param min Jangkauan minimum
 * @param max Jangkauan maksimum
 * @returns Nilai yang dibungkus
 */
export function wrap(val: number, min: number, max: number): number {
  const range = max - min;
  if (range <= 0) return min;
  let result = (val - min) % range;
  if (result < 0) {
    result += range;
  }
  return result + min;
}

/**
 * Melakukan interpolasi Hermite secara halus antara 0 dan 1 saat min < val < max
 * Biasanya digunakan untuk transisi halus, peredaman kamera dan kurva peluruhan
 * @param min Batas bawah
 * @param max Batas atas
 * @param val Nilai saat ini
 * @returns Nilai smoothstep antara 0 dan 1
 */
export function smoothStep(min: number, max: number, val: number): number {
  const x = clamp((val - min) / (max - min), 0, 1);
  return x * x * (3 - 2 * x);
}
