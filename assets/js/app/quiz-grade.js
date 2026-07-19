import { currentUser } from '../services/session-service.js';
import { luuVaoLichSu } from '../services/history-service.js';
import { byId, hide, show } from '../ui/dom.js';
import { appState } from './app-state.js';
import { hienThiCauHoi } from './quiz-render.js';
import { capNhatTienDo } from './quiz-render.js';

export function chamDiem() {
    const unanswered = appState.currentDisplayQuestions.filter(cau => !document.querySelector(`input[name="question_${cau.id}"]:checked`)).length;
    if (unanswered > 0 && !confirm(`Bạn còn ${unanswered} câu chưa trả lời.\nBạn có chắc muốn nộp bài không?`)) return;
    let soCauDung = 0;
    let soCauSai = 0;
    const listCorrectEl = byId('list-correct');
    const listWrongEl = byId('list-wrong');
    listCorrectEl.innerHTML = '';
    listWrongEl.innerHTML = '';

    const sessionData = {
        id: Date.now(),
        date: new Date().toLocaleString('vi-VN'),
        quizTitle: byId('quiz-title').innerText,
        user: currentUser(),
        total: appState.currentDisplayQuestions.length,
        correctCount: 0,
        wrongCount: 0,
        correctList: [],
        wrongList: []
        ,unansweredCount: unanswered
        ,durationSeconds: appState.startedAt ? Math.max(0, Math.round((Date.now() - appState.startedAt) / 1000)) : null
    };

    appState.currentDisplayQuestions.forEach((cau, displayIndex) => {
        const originalQIndex = cau.id;
        const checkedOption = document.querySelector(`input[name="question_${originalQIndex}"]:checked`);
        const correctOpt = cau.options.find(o => o.isCorrect);
        if (correctOpt) {
            const rightLabel = byId(`label_${originalQIndex}_${correctOpt.originalIndex}`);
            if (rightLabel) rightLabel.classList.add('correct-answer');
        }
        let isCorrect = false;
        if (checkedOption && correctOpt) {
            const selectedValue = parseInt(checkedOption.value, 10);
            if (selectedValue === correctOpt.originalIndex) {
                isCorrect = true;
                soCauDung++;
            } else {
                const wrongLabel = byId(`label_${originalQIndex}_${selectedValue}`);
                if (wrongLabel) wrongLabel.classList.add('wrong-answer');
            }
        }

        const noteEl = byId(`note_${originalQIndex}`);
        if (noteEl) {
            noteEl.classList.remove('hidden', 'quiz-note-correct', 'quiz-note-attention');
            noteEl.classList.add(isCorrect ? 'quiz-note-correct' : 'quiz-note-attention');
        }
        const feedbackEl = byId(`feedback_${originalQIndex}`);
        if (feedbackEl) {
            feedbackEl.classList.remove('hidden', 'feedback-correct', 'feedback-wrong');
            feedbackEl.classList.add(isCorrect ? 'feedback-correct' : 'feedback-wrong');
            feedbackEl.textContent = isCorrect ? '✅ Bạn chọn đúng đáp án.' : (checkedOption ? '❌ Bạn chọn sai đáp án.' : '⚠️ Bạn chưa chọn đáp án.');
        }
        document.querySelectorAll(`input[name="question_${originalQIndex}"]`).forEach(radio => radio.disabled = true);
        const btn = document.createElement('button');
        const tenCauHienThi = `Câu ${displayIndex + 1}`;
        btn.className = `font-semibold py-1.5 px-3 rounded text-sm transition-colors shadow-sm focus:outline-none border ${isCorrect ? 'bg-green-100 text-green-700 hover:bg-green-200 border-green-300' : 'bg-red-100 text-red-700 hover:bg-red-200 border-red-300'}`;
        btn.innerText = tenCauHienThi;
        btn.addEventListener('click', () => cuonDenCauHoi(originalQIndex));
        if (isCorrect) {
            listCorrectEl.appendChild(btn);
            sessionData.correctList.push(tenCauHienThi);
        } else {
            soCauSai++;
            listWrongEl.appendChild(btn);
            sessionData.wrongList.push(tenCauHienThi);
        }
    });

    sessionData.correctCount = soCauDung;
    sessionData.wrongCount = soCauSai;
    luuVaoLichSu(sessionData);
    hide(byId('submit-btn'));
    show(byId('result-area'));
    byId('score-text').innerText = `Bạn đã làm đúng ${soCauDung} / ${appState.duLieuHienTai.length} câu hỏi.`;
    byId('count-correct').innerText = soCauDung;
    byId('count-wrong').innerText = soCauSai;
    byId('count-unanswered').innerText = unanswered;
    byId('result-duration').innerText = sessionData.durationSeconds === null ? '' : `⏱️ Thời gian làm bài: ${Math.floor(sessionData.durationSeconds / 60)} phút ${sessionData.durationSeconds % 60} giây`;
    appState.uiState = 'result';
    byId('result-area').scrollIntoView({ behavior: 'smooth' });
}

/** @param {number} originalQIndex */
export function cuonDenCauHoi(originalQIndex) {
    const element = byId(`question_div_${originalQIndex}`);
    if (!element) return;
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    element.classList.add('ring-highlight');
    setTimeout(() => element.classList.remove('ring-highlight'), 1500);
}

export function lamLai() {
    appState.startedAt = Date.now();
    hienThiCauHoi(byId('quiz-title').innerText);
    show(byId('submit-btn'));
    hide(byId('result-area'));
    appState.uiState = 'quiz';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    capNhatTienDo();
}
