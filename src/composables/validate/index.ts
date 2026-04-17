/**
 * useValidate — 校验工具 composable
 */
export function useValidate() {

    /** 中国大陆手机号，1开头 + 3~9 + 9位数字 */
    function phone(value: string): boolean {
        return /^1[3-9]\d{9}$/.test(value);
    }

    function email(value: string): boolean {
        return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value);
    }

    function url(value: string): boolean {
        try {
            new URL(value);
            return true;
        } catch {
            return false;
        }
    }

    /** 18位身份证号（支持末位 X） */
    function idCard(value: string): boolean {
        return /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/.test(value);
    }

    /** 普通燃油车牌（省份简称 + 字母 + 5位字母数字） */
    function carNumber(value: string): boolean {
        return /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z][A-Z0-9]{5}$/.test(value);
    }

    /** 至少 1 个字母 + 1 个数字，最少 8 位 */
    function password(value: string): boolean {
        return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(value);
    }

    function empty(value: unknown): boolean {
        if (value == null) return true;
        if (typeof value === "string") return value.trim() === "";
        if (Array.isArray(value)) return value.length === 0;
        if (typeof value === "object") return Object.keys(value).length === 0;
        return false;
    }

    return {
        phone,
        email,
        url,
        idCard,
        carNumber,
        password,
        empty,
    };
}
