import { escapeHtml } from '../core/text-utils.js';
import { shuffleArray } from '../core/shuffle.js';
import { byId } from '../ui/dom.js';
import { appState } from './app-state.js';

export function toggleShuffle() {
    appState.isShuffle = !appState.isShuffle;
    const btn = byId('btn-shuffle');
    if (appState.isShuffle) {
        btn.classList.add('active');
        btn.innerHTML = '🔄 Đảo Đáp Án (Bật)';
    } else {
        btn.classList.remove('active');
        btn.innerHTML = '🔄 Đảo Đáp Án (Tắt)';
    }
    if (!byId('quiz-area').classList.contains('hidden') && appState.currentDeInfo) hienThiCauHoi(appState.currentDeInfo.title);
}

export function toggleShuffleQuestions() {
    appState.isShuffleQuestions = !appState.isShuffleQuestions;
    const btn = byId('btn-shuffle-questions');
    if (appState.isShuffleQuestions) {
        btn.classList.add('active');
        btn.innerHTML = '🔀 Đảo Câu (Bật)';
    } else {
        btn.classList.remove('active');
        btn.innerHTML = '🔀 Đảo Câu (Tắt)';
    }
    if (!byId('quiz-area').classList.contains('hidden') && appState.currentDeInfo) hienThiCauHoi(appState.currentDeInfo.title);
}

/** @param {string} title */
export function hienThiCauHoi(title) {
    byId('quiz-title').innerText = title;
    const container = byId('questions-container');
    container.innerHTML = '';
    let displayQuestions = appState.duLieuHienTai;
    if (appState.isShuffleQuestions) displayQuestions = shuffleArray(appState.duLieuHienTai);
    appState.currentDisplayQuestions = displayQuestions;
    appState.uiState = 'quiz';
    const navigator = byId('question-navigator-grid');
    navigator.innerHTML = '';

    displayQuestions.forEach((cau, displayIndex) => {
        const originalQIndex = cau.id;
        const questionDiv = document.createElement('div');
        questionDiv.className = 'bg-gray-50 p-5 rounded-lg border transition-all duration-500';
        questionDiv.id = `question_div_${originalQIndex}`;
        questionDiv.dataset.questionId = originalQIndex;

        const titleEl = document.createElement('h3');
        titleEl.className = 'text-lg font-semibold text-gray-800 mb-3';
        const textKhongCoTienTo = cau.question.replace(/^Câu\s+\d+:\s*/i, '');
        titleEl.innerText = `Câu ${displayIndex + 1}: ${textKhongCoTienTo}`;
        questionDiv.appendChild(titleEl);

        const optionsGrid = document.createElement('div');
        optionsGrid.className = 'grid grid-cols-1 md:grid-cols-2 gap-3';

        let displayOptions = cau.options;
        if (appState.isShuffle) displayOptions = shuffleArray(cau.options);

        displayOptions.forEach((opt, renderIndex) => {
            const optionId = `q${originalQIndex}_opt${opt.originalIndex}`;
            const letter = String.fromCharCode(65 + renderIndex);
            const optionDiv = document.createElement('div');
            optionDiv.className = 'relative';
            const input = document.createElement('input');
            input.type = 'radio';
            input.name = `question_${originalQIndex}`;
            input.id = optionId;
            input.value = opt.originalIndex;
            input.className = 'radio-custom hidden';
            input.setAttribute('aria-label', `Câu ${displayIndex + 1}, đáp án ${letter}`);
            const label = document.createElement('label');
            label.htmlFor = optionId;
            label.className = 'block p-3 border rounded-lg cursor-pointer transition-colors text-gray-700 bg-white hover:bg-gray-100 flex items-center';
            const cleanText = opt.text.replace(/^[A-D]\.\s*/, '');
            label.innerHTML = `<span class="font-bold mr-2 text-blue-600">${letter}.</span> ${escapeHtml(cleanText)}`;
            label.id = `label_${originalQIndex}_${opt.originalIndex}`;
            label.tabIndex = 0;
            optionDiv.appendChild(input);
            optionDiv.appendChild(label);
            optionsGrid.appendChild(optionDiv);
        });
        questionDiv.appendChild(optionsGrid);

        const feedback = document.createElement('div');
        feedback.id = `feedback_${originalQIndex}`;
        feedback.className = 'quiz-feedback hidden mt-4 rounded-lg border p-3 text-sm font-semibold';
        feedback.setAttribute('aria-live', 'polite');
        questionDiv.appendChild(feedback);

        const note = typeof cau.note === 'string' ? cau.note.trim() : '';
        if (note) {
            const noteDiv = document.createElement('div');
            noteDiv.id = `note_${originalQIndex}`;
            noteDiv.className = 'quiz-note hidden mt-4 rounded-lg border p-4 text-sm';
            noteDiv.setAttribute('role', 'note');
            noteDiv.setAttribute('aria-live', 'polite');

            const noteTitle = document.createElement('div');
            noteTitle.className = 'quiz-note-title font-bold mb-1.5';
            noteTitle.textContent = '💡 Giải thích';

            const noteContent = document.createElement('div');
            noteContent.className = 'quiz-note-content text-gray-700';
            noteContent.textContent = note;

            noteDiv.appendChild(noteTitle);
            noteDiv.appendChild(noteContent);
            questionDiv.appendChild(noteDiv);
        }
        container.appendChild(questionDiv);

        const navButton = document.createElement('button');
        navButton.type = 'button';
        navButton.className = 'question-nav-button rounded-lg border border-gray-300 bg-white py-2 text-sm font-bold text-gray-600 transition-colors hover:border-blue-400 hover:text-blue-600';
        navButton.textContent = String(displayIndex + 1).padStart(2, '0');
        navButton.dataset.questionId = originalQIndex;
        navButton.setAttribute('aria-label', `Đi tới câu ${displayIndex + 1}`);
        navButton.addEventListener('click', () => document.getElementById(`question_div_${originalQIndex}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
        navigator.appendChild(navButton);
    });
    capNhatTienDo();
}

export function capNhatTienDo() {
    const total = appState.currentDisplayQuestions.length;
    let answered = 0;
    appState.currentDisplayQuestions.forEach(question => {
        const selected = document.querySelector(`input[name="question_${question.id}"]:checked`);
        const nav = document.querySelector(`.question-nav-button[data-question-id="${question.id}"]`);
        if (selected) {
            answered++;
            nav?.classList.add('question-nav-answered');
        } else nav?.classList.remove('question-nav-answered');
    });
    const unanswered = Math.max(0, total - answered);
    const percent = total ? Math.round((answered / total) * 100) : 0;
    const label = byId('quiz-progress-label');
    const percentEl = byId('quiz-progress-percent');
    const bar = byId('quiz-progress-bar');
    const answeredEl = byId('answered-count');
    const unansweredEl = byId('unanswered-count');
    const hint = byId('submit-hint');
    if (label) label.textContent = `Đã làm ${answered} / ${total} câu`;
    if (percentEl) percentEl.textContent = `${percent}%`;
    if (bar) bar.style.width = `${percent}%`;
    if (bar?.parentElement) bar.parentElement.setAttribute('aria-valuenow', percent);
    if (answeredEl) answeredEl.textContent = answered;
    if (unansweredEl) unansweredEl.textContent = unanswered;
    if (hint) hint.textContent = unanswered ? `Còn ${unanswered} câu chưa trả lời` : 'Bạn đã trả lời toàn bộ câu hỏi';
}
