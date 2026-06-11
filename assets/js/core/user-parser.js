/**
 * Parse user text file.
 * @param {string} text
 * @returns {{u:string,h:string}[]}
 */
export function parseUserText(text) {
    const users = [];
    text.split('\n').forEach(line => {
        const t = line.trim();
        if (!t || t.startsWith('#')) return;
        const idx = t.indexOf(',');
        if (idx < 0) return;
        const u = t.slice(0, idx).trim();
        const h = t.slice(idx + 1).trim().toLowerCase();
        if (u && /^[a-f0-9]{64}$/.test(h)) users.push({ u, h });
    });
    return users;
}

/**
 * Serialize users to user.text format.
 * @param {{u:string,h:string}[]} users
 * @returns {string}
 */
export function serializeUserText(users) {
    return '# username,hmac_sha256\n' + users.map(u => `${u.u},${u.h}`).join('\n') + '\n';
}

/**
 * Validate username for user.text.
 * @param {string} username
 * @returns {string}
 */
export function validateUsername(username) {
    if (!username) return 'Username không được để trống.';
    if (username.length > 32) return 'Username tối đa 32 ký tự.';
    if (!/^[a-zA-Z0-9_.-]+$/.test(username)) return 'Username chỉ chứa a-z, 0-9, _ . -';
    if (username.includes(',')) return 'Username không được chứa dấu phẩy.';
    return '';
}
