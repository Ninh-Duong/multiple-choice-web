import { serializeUserText } from '../core/user-parser.js';
import { escapeHtml } from '../core/text-utils.js';
import { byId, downloadText } from '../ui/dom.js';
import { showToast } from '../ui/toast.js';
import { adminState } from './admin-state.js';

export function setDirty() {
    adminState.dirty = JSON.stringify(adminState.users) !== JSON.stringify(adminState.originalUsers);
    byId('btn-commit').disabled = !adminState.dirty || adminState.users.length === 0;
    byId('huy-btn').disabled = !adminState.dirty;
    byId('backup-btn').disabled = adminState.users.length === 0;
    const badge = byId('user-dirty-badge');
    if (adminState.dirty) badge.classList.remove('hidden'); else badge.classList.add('hidden');
}

export function renderBangUser() {
    const tbody = byId('user-table-body');
    const area = byId('user-table-area');
    const sel = byId('change-pass-user');
    sel.innerHTML = '<option value="">-- Chọn --</option>';
    if (adminState.users.length === 0) { area.classList.add('hidden'); return; }
    area.classList.remove('hidden');
    tbody.innerHTML = adminState.users.map((u, i) => {
        const shortHash = u.h.slice(0, 12) + '...' + u.h.slice(-6);
        const actionHtml = u.u.toLowerCase() === 'admin' 
            ? `<span class="text-gray-400 text-xs italic font-medium px-2 py-1">Hệ thống</span>`
            : `<button data-delete-user="${escapeHtml(u.u)}" class="text-red-600 hover:bg-red-50 px-2 py-1 rounded text-xs font-semibold">🗑 Xoá</button>`;
        return `<tr class="border-b hover:bg-gray-50"><td class="px-3 py-2 text-gray-500">${i + 1}</td><td class="px-3 py-2 font-medium text-gray-800">${escapeHtml(u.u)}</td><td class="px-3 py-2 font-mono text-xs text-gray-500 hidden md:table-cell break-all max-w-xs">${shortHash}</td><td class="px-3 py-2 text-right whitespace-nowrap">${actionHtml}</td></tr>`;
    }).join('');
    adminState.users.forEach(u => {
        if (u.u.toLowerCase() === 'admin') return;
        const opt = document.createElement('option');
        opt.value = u.u;
        opt.textContent = u.u;
        sel.appendChild(opt);
    });
}

export function capNhatPreview() {
    const pre = byId('user-preview');
    pre.textContent = adminState.users.length === 0 ? 'Danh sách trống. Chưa có user nào.' : serializeUserText(adminState.users);
}

export function refreshUserUI() {
    renderBangUser();
    capNhatPreview();
    setDirty();
}

export function huyThayDoi() {
    adminState.users = JSON.parse(JSON.stringify(adminState.originalUsers));
    refreshUserUI();
    showToast('↺ Đã huỷ thay đổi, trở về trạng thái ban đầu.', 'info');
}

export function taiFileUserText() {
    downloadText(serializeUserText(adminState.users), 'user.text');
    showToast('⬇ Đã tải user.text về máy.', 'success');
}
