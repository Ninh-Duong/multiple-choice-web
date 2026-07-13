import { fetchText } from './http.js';

/**
 * Read document manifest.
 * @returns {Promise<{id:string,title:string,fileUrl:string,type:string}[]>}
 */
export async function taiDanhSachTaiLieu() {
    try {
        const text = await fetchText('data/documents.txt');
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0 && !l.startsWith('#'));
        const danhSachTaiLieu = [];
        for (const line of lines) {
            const parts = line.split('|');
            const file = parts[0].trim();
            const title = parts.length > 1 ? parts[1].trim() : file;
            const type = parts.length > 2 ? parts[2].trim().toLowerCase() : (file.endsWith('.pdf') ? 'pdf' : 'docx');
            danhSachTaiLieu.push({
                id: file,
                title,
                fileUrl: `data/documents/${file}`,
                type
            });
        }
        return danhSachTaiLieu;
    } catch (err) {
        console.warn('Could not read documents manifest, using fallback.', err);
        return [
            { id: 'tai_lieu_huong_dan.pdf', title: 'Tài liệu hướng dẫn ôn tập thi THPT Quốc gia', fileUrl: 'data/documents/tai_lieu_huong_dan.pdf', type: 'pdf' },
            { id: 'de_cuong_on_tap_toan.docx', title: 'Đề cương ôn tập Toán trắc nghiệm Học kỳ 2', fileUrl: 'data/documents/de_cuong_on_tap_toan.docx', type: 'docx' }
        ];
    }
}
