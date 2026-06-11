/**
 * Strip UTF-8 BOM if present.
 * @param {string} text
 * @returns {string}
 */
export function stripBOM(text) {
    if (!text) return text;
    return text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text;
}

/**
 * Escape HTML entities.
 * @param {unknown} str
 * @returns {string}
 */
export function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Encode UTF-8 string as Base64.
 * @param {string} str
 * @returns {string}
 */
export function base64EncodeUtf8(str) {
    const bytes = new TextEncoder().encode(str);
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
}

/**
 * Decode Base64 as UTF-8 string.
 * @param {string} b64
 * @returns {string}
 */
export function base64DecodeUtf8(b64) {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder('utf-8').decode(bytes);
}

/**
 * Detect if server returned HTML fallback instead of text data.
 * @param {string} text
 * @returns {boolean}
 */
export function isHtmlResponse(text) {
    const lower = text.trim().toLowerCase();
    return lower.startsWith('<!doctype html>') || lower.includes('<html');
}
