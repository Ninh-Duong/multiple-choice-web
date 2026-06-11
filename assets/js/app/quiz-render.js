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

    displayQuestions.forEach((cau, displayIndex) => {
        const originalQIndex = cau.id;
        const questionDiv = document.createElement('div');
        questionDiv.className = 'bg-gray-50 p-5 rounded-lg border transition-all duration-500';
        questionDiv.id = `question_div_${originalQIndex}`;

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
            const optionDiv = document.createElement('div');
            optionDiv.className = 'relative';
            const input = document.createElement('input');
            input.type = 'radio';
            input.name = `question_${originalQIndex}`;
            input.id = optionId;
            input.value = opt.originalIndex;
            input.className = 'radio-custom hidden';
            const label = document.createElement('label');
            label.htmlFor = optionId;
            label.className = 'block p-3 border rounded-lg cursor-pointer transition-colors text-gray-700 bg-white hover:bg-gray-100 flex items-center';
            const letter = String.fromCharCode(65 + renderIndex);
            const cleanText = opt.text.replace(/^[A-D]\.\s*/, '');
            label.innerHTML = `<span class="font-bold mr-2 text-blue-600">${letter}.</span> ${escapeHtml(cleanText)}`;
            label.id = `label_${originalQIndex}_${opt.originalIndex}`;
            optionDiv.appendChild(input);
            optionDiv.appendChild(label);
            optionsGrid.appendChild(optionDiv);
        });
        questionDiv.appendChild(optionsGrid);
        container.appendChild(questionDiv);
    });
}
