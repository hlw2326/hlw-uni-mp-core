/**
 * useFormat — 格式化工具 composable
 */
export function useFormat() {
    function date(date: Date | number | string, format = "YYYY-MM-DD HH:mm:ss"): string {
        const d = new Date(date);
        if (isNaN(d.getTime())) return "";

        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        const hours = String(d.getHours()).padStart(2, "0");
        const minutes = String(d.getMinutes()).padStart(2, "0");
        const seconds = String(d.getSeconds()).padStart(2, "0");

        return format.replace("YYYY", String(year)).replace("MM", month).replace("DD", day).replace("HH", hours).replace("mm", minutes).replace("ss", seconds);
    }

    function fileSize(bytes: number): string {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
    }

    function phone(value: string): string {
        return value.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2");
    }

    function money(amount: number, decimals = 2, decPoint = ".", thousandsSep = ","): string {
        return amount.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSep);
    }

    return { date, fileSize, phone, money };
}
