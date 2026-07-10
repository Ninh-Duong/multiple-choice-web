import { base64DecodeUtf8, stripBOM } from './text-utils.js';

/**
 * Decode exam text when it starts with #ENCODED.
 * @param {string} text
 * @returns {string}
 */
export function decodeDeNeuCan(text) {
    const trimmed = text.replace(/^\uFEFF/, '').trimStart();
    if (!trimmed.startsWith('#ENCODED')) return text;
    const lines = trimmed.split(/\r?\n|\r/);
    const firstLine = lines[0].trim();
    if (firstLine !== '#ENCODED') return text;
    const payload = lines.slice(1).join('').replace(/\s+/g, '');
    if (!payload) return text;
    try {
        return base64DecodeUtf8(payload);
    } catch (err) {
        console.error('Failed to decode exam:', err);
        throw new Error('Invalid encoded exam file.');
    }
}

/**
 * Parse exam text into question objects.
 * @param {string} text
 * @returns {{id:number,question:string,options:{originalIndex:number,text:string,isCorrect:boolean}[]}[]}
 */
export function phanTichTextThanhCauHoi(text) {
    const danhSachCauHoi = [];
    const cleanedText = stripBOM(text);
    const cacKhoiText = cleanedText.trim().split(/\n\s*\n/);
    let realIndex = 0;
    const canhBaoThieuDapAn = [];

    cacKhoiText.forEach((khoi) => {
        const lines = khoi.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length >= 5) {
            const tenCauHoi = lines[0];
            const dapAnArray = [];

            for (let i = 1; i <= 4; i++) {
                let textDapAn = lines[i];
                let laDapAnDung = false;
                if (textDapAn.toLowerCase().endsWith('(true)')) {
                    laDapAnDung = true;
                    textDapAn = textDapAn.substring(0, textDapAn.length - 6).trim();
                }
                dapAnArray.push({ originalIndex: i - 1, text: textDapAn, isCorrect: laDapAnDung });
            }

            const soDung = dapAnArray.filter(o => o.isCorrect).length;
            if (soDung !== 1) canhBaoThieuDapAn.push(`"${tenCauHoi.slice(0, 60)}..." (${soDung} đáp án đúng)`);

            danhSachCauHoi.push({ id: realIndex++, question: tenCauHoi, options: dapAnArray });
        }
    });

    if (canhBaoThieuDapAn.length > 0) {
        console.warn('Warning: the following questions do not have exactly 1 correct answer (true):\n' + canhBaoThieuDapAn.join('\n'));
    }
    return danhSachCauHoi;
}
