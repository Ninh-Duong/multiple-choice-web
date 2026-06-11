import { USER_FILE_PATH } from '../config.js';
import { hashPassword } from '../core/crypto.js';
import { parseUserText, validateUsername } from '../core/user-parser.js';
import { fetchText } from '../services/http.js';
import { byId, hide, show } from '../ui/dom.js';
import { showToast } from '../ui/toast.js';
import { adminState } from './admin-state.js';
import { refreshUserUI } from './user-render.js';

export async function taiDanhSachUser() {
    const statusEl = byId('user-status');
    statusEl.innerHTML = '⏳ Đang tải...';
    try {
        const users = parseUserText(await fetchText(USER_FILE_PATH));
        adminState.originalUsers = JSON.parse(JSON.stringify(users));
        adminState.users = users;
        adminState.dirty = false;
        statusEl.innerHTML = `✅ Đã tải ${users.length} user`;
        refreshUserUI();
    } catch (e) {
        statusEl.innerHTML = `❌ Lỗi: ${e.message}`;
        showToast('Không tải được danh sách user: ' + e.message, 'error');
    }
}

export async function themUser() {
    const username = byId('new-username').value.trim();
    const password = byId('new-password').value;
    const confirm = byId('new-password-confirm').value;
    const errEl = byId('add-user-error');
    hide(errEl);
    const uErr = validateUsername(username);
    if (uErr) { errEl.textContent = uErr; show(errEl); return; }
    if (password.length < 8) { errEl.textContent = 'Mật khẩu phải ≥ 8 ký tự.'; show(errEl); return; }
    if (password !== confirm) { errEl.textContent = 'Mật khẩu không khớp với xác nhận.'; show(errEl); return; }
    if (adminState.users.some(u => u.u.toLowerCase() === username.toLowerCase())) {
        errEl.textContent = `User "${username}" đã tồn tại trong danh sách.`;
        show(errEl);
        return;
    }
    adminState.users.push({ u: username, h: await hashPassword(password) });
    byId('new-username').value = '';
    byId('new-password').value = '';
    byId('new-password-confirm').value = '';
    refreshUserUI();
    showToast(`➕ Đã thêm "${username}" vào danh sách.`, 'success');
}

/** @param {string} username */
export function xoaUser(username) {
    if (!confirm(`Xoá user "${username}"? Hành động này chưa lưu lên server.`)) return;
    adminState.users = adminState.users.filter(u => u.u !== username);
    refreshUserUI();
    showToast(`🗑 Đã xoá "${username}" khỏi danh sách.`, 'info');
}

export async function doiMatKhau() {
    const username = byId('change-pass-user').value;
    const newPass = byId('change-pass-new').value;
    const errEl = byId('change-pass-error');
    hide(errEl);
    if (!username) { errEl.textContent = 'Chọn user cần đổi mật khẩu.'; show(errEl); return; }
    if (newPass.length < 8) { errEl.textContent = 'Mật khẩu mới phải ≥ 8 ký tự.'; show(errEl); return; }
    const idx = adminState.users.findIndex(u => u.u === username);
    if (idx >= 0) {
        adminState.users[idx].h = await hashPassword(newPass);
        byId('change-pass-new').value = '';
        refreshUserUI();
        showToast(`🔑 Đã đổi mật khẩu cho "${username}".`, 'success');
    }
}
