import { ADMIN_HASH, ADMIN_USER } from '../config.js';
import { hashPassword } from '../core/crypto.js';
import { byId, hide, show } from '../ui/dom.js';
import { currentAdmin, isAdminLoggedIn, loginAdmin, logoutAdmin } from '../services/session-service.js';

export function kiemTraAuth() {
    if (isAdminLoggedIn()) {
        hide(byId('admin-login-area'));
        show(byId('admin-content-area'));
        byId('admin-greeting').innerText = currentAdmin() || 'Admin';
    }
}

/** @param {SubmitEvent} e */
export async function xacNhanLoginAdmin(e) {
    e.preventDefault();
    const u = byId('admin-username').value.trim();
    const p = byId('admin-password').value.trim();
    const errBox = byId('admin-login-error');
    hide(errBox);
    if (u === ADMIN_USER && await hashPassword(p) === ADMIN_HASH) {
        loginAdmin(u);
        hide(byId('admin-login-area'));
        show(byId('admin-content-area'));
        byId('admin-greeting').innerText = u;
        byId('admin-password').value = '';
        return;
    }
    show(errBox);
}

export function dangXuatAdmin() {
    logoutAdmin();
    location.reload();
}
