// ==========================================
// Nama File:          Color.ts
// Deskripsi File:     Modul warna
// Penulis File:       Fawwaz Yaqzhan & Google Antigravity
// Tanggal Pembuatan:  16-09-2026
// Tanggal Pembaruan:  17-09-2026
// Catatan:
//   - Komponen warna r, g, b, a disimpan dalam rentang ternormalisasi [0.0 - 1.0]
//   - Mendukung manipulasi warna seperti lerp dan tinting
//   - Menyediakan konversi ke format string CSS dan HEX
// ==========================================


import { clamp, lerp } from "./MathUtils.js";


/**
 * Class yang merepresentasikan warna RGBA
 * Komponen r, g, b, a berada pada rentang [0.0 - 1.0]
 */
export class Color {
    public r: number;
    public g: number;
    public b: number;
    public a: number;

    /**
     * Membuat instance color baru
     * @param r Nilai merah [0.0 - 1.0] (default: 1.0)
     * @param g Nilai hijau [0.0 - 1.0] (default: 1.0)
     * @param b Nilai biru [0.0 - 1.0] (default: 1.0)
     * @param a Nilai transparansi [0.0 - 1.0] (default: 1.0)
     */
    constructor(r: number = 1, g: number = 1, b: number = 1, a: number = 1) {
        this.r = clamp(r, 0, 1);
        this.g = clamp(g, 0, 1);
        this.b = clamp(b, 0, 1);
        this.a = clamp(a, 0, 1);
    }

    // --- Konstanta Warna Umum ---

    static white(): Color {
        return new Color(1, 1, 1, 1);
    }
    static black(): Color {
        return new Color(0, 0, 0, 1);
    }
    static red(): Color {
        return new Color(1, 0, 0, 1);
    }
    static green(): Color {
        return new Color(0, 1, 0, 1);
    }
    static blue(): Color {
        return new Color(0, 0, 1, 1);
    }
    static yellow(): Color {
        return new Color(1, 1, 0, 1);
    }
    static cyan(): Color {
        return new Color(0, 1, 1, 1);
    }
    static magenta(): Color {
        return new Color(1, 0, 1, 1);
    }
    static transparent(): Color {
        return new Color(0, 0, 0, 0);
    }

    // --- Factory Statis ---

    /**
     * Membuat Color dari nilai byte integer (0 - 255)
     * @param r Merah 0 - 255
     * @param g Hijau 0 - 255
     * @param b Biru 0 - 255
     * @param a Transparansi 0.0 - 1.0 (default: 1.0)
     */
    static fromBytes(r: number, g: number, b: number, a: number = 1): Color {
        return new Color(r / 255, g / 255, b / 255, a);
    }

    /**
     * Membuat color dari kode HEX
     * @param hex Strings HEX warna
     */
    static fromHex(hex: string): Color {
        let cleanHex = hex.startsWith("#") ? hex.slice(1) : hex;

        // Validasi apakah format hex valid (hanya boleh A-F, a-f, dan 0-9 dengan panjang 3, 6, atau 8)
        const isValidHex = /^[0-9A-Fa-f]{3}\$|^[0-9A-Fa-f]{6}\(\vert{}^[0-9A-Fa-f]{8}\)/.test(cleanHex);

        if (!isValidHex) {
            // Memberikan peringatan jelas di konsol untuk debugging
            console.warn(`Color.fromHex: Format hex "${hex}" tidak valid. Mengembalikan Color.white() sebagai fallback.`);
            return Color.white();
        }

        // Format pendek #rgb -> #rrggbb
        if (cleanHex.length === 3) {
            cleanHex = cleanHex.split("").map((c) => c + c).join("");
        }

        const intVal = parseInt(cleanHex, 16);

        if (cleanHex.length === 6) {
            const r = (intVal >> 16) & 255;
            const g = (intVal >> 8) & 255;
            const b = intVal & 255;
            return Color.fromBytes(r, g, b, 1);
        } else if (cleanHex.length === 8) {
            const r = (intVal >> 24) & 255;
            const g = (intVal >> 16) & 255;
            const b = (intVal >> 8) & 255;
            const a = (intVal & 255) / 255;
            return Color.fromBytes(r, g, b, a);
        }

        return Color.white();
    }

    // --- Salin & Kloning ---

    clone(): Color {
        return new Color(this.r, this.g, this.b, this.a);
    }

    copy(other: Color): this {
        this.r = other.r;
        this.g = other.g;
        this.b = other.b;
        this.a = other.a;
        return this;
    }

    set(r: number, g: number, b: number, a: number = 1): this {
        this.r = clamp(r, 0, 1);
        this.g = clamp(g, 0, 1);
        this.b = clamp(b, 0, 1);
        this.a = clamp(a, 0, 1);
        return this;
    }

    // --- Manipulasi Warna ---

    /**
     * Melakukan interpolasi linear antara warna ini ke warna target
     * @param target Warna tujuan
     * @param t Faktor interpolasi [0.0 - 1.0]
     */
    lerp(target: Color, t: number): Color {
        return new Color(
            lerp(this.r, target.r, t),
            lerp(this.g, target.g, t),
            lerp(this.b, target.b, t),
            lerp(this.a, target.a, t)
        );
    }

    /**
     * Mengalikan warna ini dengan warna lain
     */
    multiply(other: Color): Color {
        return new Color(
            this.r * other.r,
            this.g * other.g,
            this.b * other.b,
            this.a * other.a
        );
    }

    // --- Konversi Format Output ---

    /**
     * Mengubah warna menjadi string CSS rgba
     */
    toRgbaString(): string {
        const r = Math.round(this.r * 255);
        const g = Math.round(this.g * 255);
        const b = Math.round(this.b * 255);
        return `rgba(${r}, ${g}, ${b}, ${this.a})`
    }

    /**
     * Mengubah warna menjadi format string HEX
     */
    toHexString(): string {
        const r = Math.round(this.r * 255).toString(16).padStart(2, "0");
        const g = Math.round(this.g * 255).toString(16).padStart(2, "0");
        const b = Math.round(this.b * 255).toString(16).padStart(2, "0");
        return `#${r}${g}${b}`;
    }
}
