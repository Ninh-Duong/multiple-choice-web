import { hashPassword } from '../core/crypto.js';
import { byId, copyValue, downloadText } from '../ui/dom.js';
import { showToast } from '../ui/toast.js';

export async function hashUsers() {
    const input = byId('hash-input').value;
    const lines = input.split('\n');
    const out = [];
    let valid = 0;
    let skipped = 0;
    for (const line of lines) {
        const t = line.trim();
        if (!t) { out.push(''); continue; }
        if (t.startsWith('#')) { out.push(t); continue; }
        const idx = t.indexOf(',');
        if (idx < 0) { skipped++; continue; }
        const u = t.slice(0, idx).trim();
        const p = t.slice(idx + 1).trim();
        if (!u || !p) { skipped++; continue; }
        out.push(`${u},${await hashPassword(p)}`);
        valid++;
    }
    byId('hash-output').value = out.join('\n');
    showToast(`Hash xong ${valid} tài khoản (bỏ qua ${skipped} dòng).`, 'success');
}

export function copyHashOutput() {
    copyValue(byId('hash-output'));
    showToast('📋 Đã copy.', 'success');
}

export function downloadHashOutput() {
    const text = byId('hash-output').value;
    if (!text.trim()) { showToast('Không có dữ liệu để tải.', 'warning'); return; }
    downloadText(text, 'user.text');
    showToast('⬇ Đã tải user.text', 'success');
}
