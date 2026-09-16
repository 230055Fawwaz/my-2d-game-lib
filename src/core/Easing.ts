// ==========================================
// Nama File:          Easing.ts
// Deskripsi File:     Modul gerakan ease
// Penulis File:       Fawwaz Yaqzhan & Google Antigravity
// Tanggal Pembuatan:  16-09-2026
// Tanggal Pembaruan:  17-09-2026
// Catatan:
//   - Semua fungsi menerima nilai progres t dalam rentang [0, 1]
//   - Mengembalikan nilai posisi atau skala kurva dalam rentang [0, 1]
//   - Digunakan untuk tweening posisi kamera, UI, dan partikel
// ==========================================


/**
 * Definisi tipe fungsi easing standar
 */
export type EasingFunction = (t: number) => number;

// --- Linear ---

export function linear(t: number): number {
    return t;
}

// --- Sine ---

export function easeInSine(t: number): number {
    return 1 - Math.cos((t * Math.PI) / 2);
}

export function easeOutSine(t: number): number {
    return Math.sin((t * Math.PI) / 2);
}

export function easeInOutSine(t: number): number {
    return -(Math.cos(Math.PI * t) - 1) / 2;
}

// --- Kuadratik ---

export function easeInQuad(t: number): number {
    return t * t;
}

export function easeOutQuad(t: number): number {
    return 1 - (1 - t) * (1 - t);
}

export function easeInOutQuad(t: number): number {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

// --- Kubik ---

export function easeInCubic(t: number): number {
    return t * t * t;
}

export function easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
}

export function easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// --- Exponensial ---

export function easeInExpo(t: number): number {
    return t === 0 ? 0 : Math.pow(2, 10 * t - 10);
}

export function easeOutExpo(t: number): number {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export function easeInOutExpo(t: number): number {
    if (t === 0) return 0;
    if (t === 1) return 1;
    return t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2;
}

// --- Back (Overshoot / Menarik ke balakang dahulu) ---

export function easeInBack(t: number): number {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return c3 * t * t * t - c1 * t * t;
}

export function easeOutBack(t: number): number {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

export function easeInOutBack(t: number): number {
    const c1 = 1.70158;
    const c2 = c1 * 1.525;
    return t < 0.5
        ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
        : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
}

// --- Bounce ---

export function easeInBounce(t: number): number {
    return 1 - easeInOutBounce(1 - t);
}

export function easeOutBounce(t: number): number {
    const n1 = 7.5625;
    const d1 = 2.75;

    if (t < 1 / d1) {
        return n1 * t * t;
    } else if (t < 2 / d1) {
        return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
        return n1 * (t -= 2.25 / d1) * t - 0.9375;
    } else {
        return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
}

export function easeInOutBounce(t: number): number {
    return t < 0.5
        ? (1 - easeInOutBounce(1 - 2 * t)) / 2
        : (1 + easeInOutBounce(2 * t - 1)) / 2;
}

// --- Elastic ---

export function easeInElastic(t: number): number {
    if (t === 0) return 0;
    if (t === 1) return 1;
    return -Math.pow(2, 10 * t - 10) * Math.sin(((t * 10 - 10.75) * (2 * Math.PI)) / 3);
}

export function easeOutElastic(t: number): number {
    if (t === 0) return 0;
    if (t === 1) return 1;
    return Math.pow(2, 10 * t) * Math.sin(((t * 10 - 10.75) * (2 * Math.PI)) / 3) + 1;
}

export function easeInOutElastic(t: number): number {
    if (t === 0) return 0;
    if (t === 1) return 1;
    return t < 0.5
        ? -(Math.pow(2, 20 * t - 10) * Math.sin(((20 * t - 11.125) * (2 * Math.PI)) / 4.5)) / 2
        : (Math.pow(2, -20 * t + 10) * Math.sin(((20 * t - 11.125) * (2 * Math.PI)) / 4.5)) / 2 + 1;
}

/**
 * Objek kumpulan fungsi easing untuk memudahkan pemanggilan dinamis
 */
export const Easing = {
    linear,
    easeInSine,
    easeOutSine,
    easeInOutSine,
    easeInQuad,
    easeOutQuad,
    easeInOutQuad,
    easeInCubic,
    easeOutCubic,
    easeInOutCubic,
    easeInExpo,
    easeOutExpo,
    easeInOutExpo,
    easeInBack,
    easeOutBack,
    easeInOutBack,
    easeInBounce,
    easeOutBounce,
    easeInOutBounce,
    easeInElastic,
    easeOutElastic,
    easeInOutElastic,
} as const;
