const HEX_RE = /^#[0-9a-fA-F]{6}$/;

function parseHex(hex: string): [number, number, number] {
    if (!HEX_RE.test(hex)) throw new Error(`Invalid hex color: ${hex}`);
    return [
        parseInt(hex.slice(1, 3), 16),
        parseInt(hex.slice(3, 5), 16),
        parseInt(hex.slice(5, 7), 16),
    ];
}

export function useColor() {
    function varsToStyle(vars: Record<string, string>): string {
        return Object.entries(vars).map(([k, v]) => `${k}:${v}`).join(";") + ";";
    }

    function hexToRgba(hex: string, alpha: number): string {
        const [r, g, b] = parseHex(hex);
        return `rgba(${r},${g},${b},${alpha})`;
    }

    function darkenHex(hex: string, amount = 0.15): string {
        const [r, g, b] = parseHex(hex);
        const d = (c: number) => Math.max(0, Math.round(c * (1 - amount)));
        return `#${d(r).toString(16).padStart(2, "0")}${d(g).toString(16).padStart(2, "0")}${d(b).toString(16).padStart(2, "0")}`;
    }

    return { varsToStyle, hexToRgba, darkenHex };
}
