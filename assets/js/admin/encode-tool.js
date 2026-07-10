import { base64DecodeUtf8, base64EncodeUtf8 } from '../core/text-utils.js';
import { byId, copyValue, downloadText } from '../ui/dom.js';
import { showToast } from '../ui/toast.js';

export function encodeDe() {
    const src = byId('de-input').value;
    if (!src.trim()) { showToast('Plaintext rỗng.', 'error'); return; }
    const b64 = base64EncodeUtf8(src);
    const chunked = b64.replace(/(.{76})/g, '$1\n');
    byId('de-output').value = `#ENCODED\n${chunked}\n`;
    showToast(`Encode xong (${src.length} -> ${b64.length} ký tự).`, 'success');
}

export function decodeDe() {
    const src = byId('de-output').value || byId('de-input').value;
    try {
        const trimmed = src.replace(/^\uFEFF/, '').trimStart();
        let payload = trimmed;
        if (trimmed.startsWith('#ENCODED')) {
            const lines = trimmed.split(/\r?\n|\r/);
            const firstLine = lines[0].trim();
            if (firstLine === '#ENCODED') {
                payload = lines.slice(1).join('');
            }
        }
        payload = payload.replace(/\s+/g, '');
        byId('de-input').value = base64DecodeUtf8(payload);
        showToast('Decode thành công.', 'success');
    } catch (e) {
        showToast('Decode lỗi: ' + e.message, 'error');
    }
}

export function copyDeOutput() {
    copyValue(byId('de-output'));
    showToast('📋 Đã copy.', 'success');
}

export function downloadDeOutput() {
    const text = byId('de-output').value;
    if (!text.trim()) { showToast('Không có dữ liệu để tải.', 'warning'); return; }
    downloadText(text, 'de_encoded.txt');
    showToast('⬇ Đã tải de_encoded.txt', 'success');
}

/** @param {Event} event */
export function loadFileToDeInput(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        byId('de-input').value = reader.result;
        showToast(`Đã nạp ${file.name}.`, 'success');
    };
    reader.readAsText(file, 'utf-8');
}
