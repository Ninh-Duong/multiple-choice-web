import { DU_LIEU_DEMO, MANIFEST_URL } from '../config.js';
import { decodeDeNeuCan, phanTichTextThanhCauHoi } from '../core/de-parser.js';
import { fetchText } from './http.js';

/**
 * Read exam manifest.
 * @returns {Promise<{id:string,title:string,fileUrl:string}[]>}
 */
export async function taiDanhSachDeTuManifest() {
    try {
        const text = await fetchText(MANIFEST_URL);
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0 && !l.startsWith('#'));
        const danhSachDe = [];
        for (const line of lines) {
            const parts = line.split('|');
            const file = parts[0].trim();
            if (!file.endsWith('.txt')) continue;
            const name = file.replace('.txt', '');
            const title = parts.length > 1 ? parts[1].trim() : `Đề ${name}`;
            const passHash = parts.length > 2 ? parts[2].trim() : null;
            danhSachDe.push({ id: name, title, fileUrl: `data/${file}`, passHash });
        }
        return danhSachDe;
    } catch (err) {
        console.warn('Không đọc được manifest, dùng fallback.', err);
        return [{ id: 'de_1', title: 'Đề kiểm tra số 1', fileUrl: 'data/de_1.txt' }];
    }
}

/**
 * Load and parse an exam.
 * @param {{title:string,fileUrl:string}} de
 * @returns {Promise<{title:string,questions:ReturnType<typeof phanTichTextThanhCauHoi>}>}
 */
export async function taiNoiDungDe(de) {
    let rawText;
    let displayTitle = de.title;
    try {
        rawText = decodeDeNeuCan(await fetchText(de.fileUrl));
    } catch (err) {
        rawText = DU_LIEU_DEMO;
        if (!displayTitle.includes('Offline')) displayTitle += ' (Bản Demo Offline)';
    }
    const questions = phanTichTextThanhCauHoi(rawText);
    if (questions.length === 0) throw new Error('File đề bị trống hoặc sai định dạng.');
    return { title: displayTitle, questions };
}
