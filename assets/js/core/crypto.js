import { SECRET_KEY_HASH } from '../config.js';

/**
 * Convert hex string to bytes.
 * @param {string} hex
 * @returns {Uint8Array}
 */
export function hexToBytes(hex) {
    const out = new Uint8Array(hex.length / 2);
    for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
    return out;
}

/**
 * Hash message using SHA-256.
 * @param {string} message
 * @returns {Promise<string>}
 */
export async function sha256Hex(message) {
    const buf = new TextEncoder().encode(message);
    const hashBuf = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * HMAC-SHA256 with hex key.
 * @param {string} keyHex
 * @param {string} message
 * @returns {Promise<string>}
 */
export async function hmacSha256Hex(keyHex, message) {
    const cryptoKey = await crypto.subtle.importKey(
        'raw', hexToBytes(keyHex), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(message));
    return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash password using the app-wide HMAC key.
 * @param {string} plain
 * @returns {Promise<string>}
 */
export async function hashPassword(plain) {
    return hmacSha256Hex(SECRET_KEY_HASH, plain);
}
