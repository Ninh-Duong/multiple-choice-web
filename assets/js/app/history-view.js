import { escapeHtml } from '../core/text-utils.js';
import { layLichSu, xoaToanBoLichSu } from '../services/history-service.js';
import { byId, hide, show } from '../ui/dom.js';
import { appState } from './app-state.js';

export function moLichSu() {
    if (appState.uiState !== 'history') appState.prevUiState = appState.uiState;
    hide(byId('quiz-area'));
    hide(byId('result-area'));
    hide(byId('message-box'));
    hide(byId('chon-de-text'));
    show(byId('history-area'));
    appState.uiState = 'history';
    renderLichSu();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function dongLichSu() {
    hide(byId('history-area'));
    show(byId('chon-de-text'));
    if (appState.prevUiState === 'quiz') {
        show(byId('quiz-area'));
        appState.uiState = 'quiz';
    } else if (appState.prevUiState === 'result') {
        show(byId('quiz-area'));
        show(byId('result-area'));
        appState.uiState = 'result';
    } else appState.uiState = 'idle';
}

export function xoaLichSu() {
    if (confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử làm bài? Dữ liệu không thể khôi phục.')) {
        xoaToanBoLichSu();
        renderLichSu();
    }
}

export function renderLichSu() {
    const container = byId('history-container');
    container.innerHTML = '';
    const history = layLichSu();
    if (history.length === 0) {
        container.innerHTML = `<div class="text-center py-10 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <p class="text-3xl mb-3">📭</p>
            <p class="font-medium">Chưa có dữ liệu lịch sử làm bài nào.</p>
            <p class="text-sm mt-1">Hãy làm thử một đề thi để xem thống kê nhé!</p>
        </div>`;
        return;
    }

    history.forEach((session) => {
        const percent = Math.round((session.correctCount / session.total) * 100);
        let statusColor = 'border-gray-200 bg-white';
        let scoreColor = 'text-gray-800';
        if (percent >= 80) { statusColor = 'border-green-300 bg-green-50/40'; scoreColor = 'text-green-600'; }
        else if (percent < 50) { statusColor = 'border-red-300 bg-red-50/40'; scoreColor = 'text-red-600'; }
        else { statusColor = 'border-amber-300 bg-amber-50/40'; scoreColor = 'text-amber-600'; }
        const card = document.createElement('div');
        card.className = `p-5 rounded-xl border-2 ${statusColor} shadow-sm`;
        const safeTitle = escapeHtml(session.quizTitle);
        const safeDate = escapeHtml(session.date);
        const safeUser = session.user ? `<p class="text-xs text-gray-400 mt-0.5">👤 ${escapeHtml(session.user)}</p>` : '';
        let html = `<div class="flex flex-col md:flex-row justify-between md:items-center mb-4 border-b pb-3 border-gray-200/60">
            <div><h3 class="font-bold text-lg text-gray-800">${safeTitle}</h3><p class="text-sm text-gray-500 font-medium">🗓️ ${safeDate}</p>${safeUser}</div>
            <div class="mt-2 md:mt-0 text-left md:text-right"><div class="text-2xl font-black ${scoreColor}">${session.correctCount} / ${session.total}</div><div class="text-xs font-bold uppercase tracking-wider text-gray-500">Đạt ${percent}%</div></div>
        </div><div class="space-y-3 text-sm">`;
        if (session.correctList.length > 0) html += `<div class="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3"><span class="inline-block min-w-24 font-bold text-green-700">✅ Câu Đúng:</span><span class="text-gray-700 flex flex-wrap gap-1">${session.correctList.map(c => `<span class="bg-green-100 text-green-700 px-2 py-0.5 rounded border border-green-200">${escapeHtml(c)}</span>`).join('')}</span></div>`;
        if (session.wrongList.length > 0) html += `<div class="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3 mt-2"><span class="inline-block min-w-24 font-bold text-red-700">❌ Câu Sai:</span><span class="text-gray-700 flex flex-wrap gap-1">${session.wrongList.map(c => `<span class="bg-red-100 text-red-700 px-2 py-0.5 rounded border border-red-200">${escapeHtml(c)}</span>`).join('')}</span></div>`;
        html += '</div>';
        card.innerHTML = html;
        container.appendChild(card);
    });
}
