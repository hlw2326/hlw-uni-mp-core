/**
 * useValidate - 校验工具 composable
 */
export function useValidate() {
    /** 中国大陆手机号格式校验。 */
    function phone(value: string): boolean {
        return /^1[3-9]\d{9}$/.test(value);
    }

    /** 校验邮箱地址格式。 */
    function email(value: string): boolean {
        return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value);
    }

    /** 校验是否为合法 URL。 */
    function url(value: string): boolean {
        try {
            new URL(value);
            return true;
        } catch {
            return false;
        }
    }

    /** 18 位身份证号格式校验。 */
    function idCard(value: string): boolean {
        return /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/.test(value);
    }

    /** 普通民用车牌号格式校验。 */
    function carNumber(value: string): boolean {
        return /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z][A-Z0-9]{5}$/.test(value);
    }

    /** 至少 8 位且同时包含字母和数字的密码校验。 */
    function password(value: string): boolean {
        return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(value);
    }

    /** 判断值是否为空字符串、空数组、空对象或 null/undefined。 */
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
