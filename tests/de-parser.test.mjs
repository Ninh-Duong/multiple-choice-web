import assert from 'node:assert/strict';
import { phanTichTextThanhCauHoi, validateExamText } from '../assets/js/core/de-parser.js';

const withNote = `Câu 43: Nhận định nào sau đây là sai?
A. Phương án A
B. Phương án B
C. Phương án C
D. Phương án D (true)
*note: Dòng giải thích đầu tiên.
Dòng giải thích thứ hai.`;

const [question] = phanTichTextThanhCauHoi(withNote);
assert.equal(question.note, 'Dòng giải thích đầu tiên.\nDòng giải thích thứ hai.');
assert.equal(question.options.length, 4);
assert.equal(question.options[3].isCorrect, true);

const withoutNote = withNote.replace(/\n\*note:[\s\S]*$/, '');
assert.equal(phanTichTextThanhCauHoi(withoutNote)[0].note, '');

const multilineQuestion = `Câu hỏi tình huống có nội dung dài.
Nhận định nào sau đây là sai?
A. Phương án A
B. Phương án B (true)
C. Phương án C
D. Phương án D`;
assert.equal(
    phanTichTextThanhCauHoi(multilineQuestion)[0].question,
    'Câu hỏi tình huống có nội dung dài. Nhận định nào sau đây là sai?'
);

const emptyNote = validateExamText(`${withoutNote}\n*note:`);
assert.equal(emptyNote.questions[0].note, '');
assert.equal(emptyNote.errors.length, 0);
assert.equal(emptyNote.warnings.length, 1);

const invalid = validateExamText(`Câu hỏi lỗi?
A. A (true)
B. B
C. C`);
assert.equal(invalid.questions.length, 0);
assert.equal(invalid.errors.length, 1);

console.log('de-parser tests passed');
