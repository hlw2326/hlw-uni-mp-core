const HEX_RE = /^#[0-9a-fA-F]{6}$/;

/**
 * 解析 6 位十六进制颜色值，返回 RGB 数组。
 */
function parseHex(hex: string): [number, number, number] {
    if (!HEX_RE.test(hex)) throw new Error(`Invalid hex color: ${hex}`);
    return [
        parseInt(hex.slice(1, 3), 16),
        parseInt(hex.slice(3, 5), 16),
        parseInt(hex.slice(5, 7), 16),
    ];
}

/**
 * 颜色处理工具。
 */
export function useColor() {
    /**
     * 将 CSS 变量对象拼接成内联 style 字符串。
     */
    function varsToStyle(vars: Record<string, string>): string {
        return Object.entries(vars).map(([k, v]) => `${k}:${v}`).join(";") + ";";
    }

    /**
     * 将十六进制颜色转为 rgba 字符串。
     */
    function hexToRgba(hex: string, alpha: number): string {
        const [r, g, b] = parseHex(hex);
        return `rgba(${r},${g},${b},${alpha})`;
    }

    /**
     * 将十六进制颜色按比例压暗。
     */
    function darkenHex(hex: string, amount = 0.15): string {
        const [r, g, b] = parseHex(hex);
        const d = (c: number) => Math.max(0, Math.round(c * (1 - amount)));
        return `#${d(r).toString(16).padStart(2, "0")}${d(g).toString(16).padStart(2, "0")}${d(b).toString(16).padStart(2, "0")}`;
    }

    return { varsToStyle, hexToRgba, darkenHex };
}
