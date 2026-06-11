import { byId, hide, show } from '../ui/dom.js';
import { hashPassword } from '../core/crypto.js';
import { docDanhSachTaiKhoan, layUsersDangNhap } from '../services/user-service.js';
import { currentUser, isLoggedIn, loginUser, logoutUser } from '../services/session-service.js';
import { appState } from './app-state.js';
import { khoiTaoDanhSachDe } from './quiz-loader.js';

/** Update fallback account hint visibility. */
export async function capNhatHienThiTaiKhoanTest() {
    const hintBox = byId('preview-test-hint');
    if (!hintBox) return;
    const { hasUserFile } = await docDanhSachTaiKhoan();
    if (hasUserFile) hide(hintBox); else show(hintBox);
}

/** Initialize login/main app visibility. */
export async function initAuth() {
    if (isLoggedIn()) await vaoApp(currentUser());
    else {
        show(byId('login-area'));
        hide(byId('main-app-area'));
        await capNhatHienThiTaiKhoanTest();
    }
}

/** @param {SubmitEvent} e */
export async function xacNhanDangNhap(e) {
    e.preventDefault();
    const userInp = byId('username').value.trim();
    const passInp = byId('password').value.trim();
    const errBox = byId('login-error');
    hide(errBox);

    if (!userInp || !passInp) {
        errBox.innerText = 'Vui lòng nhập đủ tài khoản và mật khẩu!';
        show(errBox);
        return;
    }

    const passHash = await hashPassword(passInp);
    const validUsers = await layUsersDangNhap();
    const isValid = validUsers.some(user => user.u === userInp && user.h === passHash);

    if (isValid) {
        loginUser(userInp);
        await vaoApp(userInp);
    } else {
        errBox.innerText = 'Tài khoản hoặc mật khẩu không chính xác!';
        show(errBox);
    }
}

/** @param {string} username */
export async function vaoApp(username) {
    hide(byId('login-area'));
    show(byId('main-app-area'));
    byId('user-greeting').innerText = username || 'Người dùng';
    byId('btn-container').innerHTML = '';
    await khoiTaoDanhSachDe();
    appState.uiState = 'idle';
}

export function dangXuat() {
    logoutUser();
    location.reload();
}
