import { FALLBACK_HASH, FALLBACK_USER, USER_FILE_URL } from '../config.js';
import { parseUserText } from '../core/user-parser.js';
import { fetchText } from './http.js';

/**
 * Read valid users from static user file.
 * @returns {Promise<{users:{u:string,h:string}[], hasUserFile:boolean}>}
 */
export async function docDanhSachTaiKhoan() {
    try {
        const text = await fetchText(USER_FILE_URL);
        return { users: parseUserText(text), hasUserFile: true };
    } catch (error) {
        console.warn('Không đọc được data/users/user.text.', error);
        return { users: [], hasUserFile: false };
    }
}

/**
 * Return users with fallback if file has no valid users.
 * @returns {Promise<{u:string,h:string}[]>}
 */
export async function layUsersDangNhap() {
    const authData = await docDanhSachTaiKhoan();
    if (authData.users.length > 0) return authData.users;
    console.warn('Không có tài khoản hợp lệ, dùng fallback user.');
    return [{ u: FALLBACK_USER, h: FALLBACK_HASH }];
}
