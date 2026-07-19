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
 * @returns {{id:number,question:string,note:string,options:{originalIndex:number,text:string,isCorrect:boolean}[]}[]}
 */
export function phanTichTextThanhCauHoi(text) {
    const result = validateExamText(text);
    if (result.errors.length > 0) console.warn('Exam format errors:\n' + result.errors.join('\n'));
    if (result.warnings.length > 0) console.warn('Exam format warnings:\n' + result.warnings.join('\n'));
    return result.questions;
}

/**
 * Parse and validate exam text. Question and option text may span multiple lines.
 * Options are identified by A./B./C./D. and an optional explanation by *note:.
 * @param {string} text
 * @returns {{questions:{id:number,question:string,note:string,options:{originalIndex:number,text:string,isCorrect:boolean}[]}[],errors:string[],warnings:string[]}}
 */
export function validateExamText(text) {
    const cleanedText = stripBOM(typeof text === 'string' ? text : '').replace(/\r\n?/g, '\n').trim();
    if (!cleanedText) return { questions: [], errors: ['Đề thi không có nội dung.'], warnings: [] };

    const blocks = cleanedText.split(/\n\s*\n/);
    const questions = [];
    const errors = [];
    const warnings = [];

    blocks.forEach((block, blockIndex) => {
        const parsed = parseQuestionBlock(block, questions.length, blockIndex + 1);
        errors.push(...parsed.errors);
        warnings.push(...parsed.warnings);
        if (parsed.question) questions.push(parsed.question);
    });

    return { questions, errors, warnings };
}

function parseQuestionBlock(block, questionId, blockNumber) {
    const lines = block.split('\n').map(line => line.trim()).filter(Boolean);
    const errors = [];
    const warnings = [];
    const prefix = `Khối câu hỏi ${blockNumber}`;
    const optionMarkers = [];
    let noteIndex = -1;

    lines.forEach((line, index) => {
        if (noteIndex < 0 && /^\*note\s*:/i.test(line)) {
            noteIndex = index;
            return;
        }
        if (noteIndex >= 0) return;
        const optionMatch = line.match(/^([A-D])\.\s*(.*)$/i);
        if (optionMatch) optionMarkers.push({ index, label: optionMatch[1].toUpperCase(), firstText: optionMatch[2] });
    });

    const expectedLabels = ['A', 'B', 'C', 'D'];
    const actualLabels = optionMarkers.map(marker => marker.label);
    if (actualLabels.join('') !== expectedLabels.join('')) {
        errors.push(`${prefix}: cần đúng 4 đáp án theo thứ tự A, B, C, D (đang có: ${actualLabels.join(', ') || 'không có'}).`);
        return { question: null, errors, warnings };
    }
    if (noteIndex >= 0 && noteIndex <= optionMarkers[3].index) {
        errors.push(`${prefix}: *note: phải được đặt sau đáp án D.`);
        return { question: null, errors, warnings };
    }

    const questionLines = lines.slice(0, optionMarkers[0].index);
    if (questionLines.length === 0) {
        errors.push(`${prefix}: thiếu nội dung câu hỏi trước đáp án A.`);
        return { question: null, errors, warnings };
    }

    const options = optionMarkers.map((marker, index) => {
        const nextOptionIndex = optionMarkers[index + 1]?.index ?? (noteIndex >= 0 ? noteIndex : lines.length);
        const optionLines = [marker.firstText, ...lines.slice(marker.index + 1, nextOptionIndex)];
        let optionText = optionLines.join(' ').trim();
        const isCorrect = /\(true\)\s*$/i.test(optionText);
        if (isCorrect) optionText = optionText.replace(/\(true\)\s*$/i, '').trim();
        return { originalIndex: index, text: `${marker.label}. ${optionText}`, isCorrect };
    });

    const correctCount = options.filter(option => option.isCorrect).length;
    if (correctCount !== 1) errors.push(`${prefix}: phải có đúng 1 đáp án (true), hiện có ${correctCount}.`);

    let note = '';
    if (noteIndex >= 0) {
        const firstNoteLine = lines[noteIndex].replace(/^\*note\s*:\s*/i, '');
        note = [firstNoteLine, ...lines.slice(noteIndex + 1)].join('\n').trim();
        if (!note) warnings.push(`${prefix}: có marker *note: nhưng nội dung giải thích đang rỗng.`);
    }

    return {
        question: {
            id: questionId,
            question: questionLines.join(' ').trim(),
            options,
            note
        },
        errors,
        warnings
    };
}
