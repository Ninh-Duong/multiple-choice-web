import { appState } from './app-state.js';
import { taiDanhSachDeTuManifest, taiNoiDungDe } from '../services/de-service.js';
import { byId, all, hide, show } from '../ui/dom.js';
import { hienThiCauHoi } from './quiz-render.js';

export async function khoiTaoDanhSachDe() {
    appState.danhSachDe = await taiDanhSachDeTuManifest();
    taoNutChonDe();
    if (appState.danhSachDe.length > 0) taiDeThi(appState.danhSachDe[0]);
}

export function taoNutChonDe() {
    const container = byId('btn-container');
    container.innerHTML = '';
    appState.danhSachDe.forEach(de => {
        const btn = document.createElement('button');
        btn.className = 'bg-white border-2 border-blue-500 text-blue-600 hover:bg-blue-50 font-semibold py-2 px-6 rounded-full transition-colors';
        btn.innerText = de.title;
        btn.addEventListener('click', () => taiDeThi(de));
        container.appendChild(btn);
    });
}

/** @param {{title:string,fileUrl:string,id:string}} de */
export async function taiDeThi(de) {
    if (appState.isLoading) return;
    appState.isLoading = true;
    appState.currentDeInfo = de;
    hide(byId('quiz-area'));
    hide(byId('result-area'));
    hide(byId('history-area'));
    show(byId('submit-btn'));
    all('#btn-container button').forEach(b => b.disabled = true);

    const msgBox = byId('message-box');
    show(msgBox);
    msgBox.classList.remove('text-red-600', 'bg-red-50', 'border-red-200');
    msgBox.classList.add('text-gray-600', 'bg-transparent', 'border-transparent');
    byId('message-text').innerText = `Đang tải ${de.title}...`;
    show(byId('loading-spinner'));

    try {
        const { title, questions } = await taiNoiDungDe(de);
        appState.duLieuHienTai = questions;
        hienThiCauHoi(title);
        hide(msgBox);
        show(byId('quiz-area'));
    } catch (error) {
        byId('message-text').innerText = `Lỗi: ${error.message}`;
        msgBox.classList.remove('text-gray-600', 'bg-transparent', 'border-transparent');
        msgBox.classList.add('text-red-600', 'bg-red-50', 'border-red-200');
    } finally {
        hide(byId('loading-spinner'));
        all('#btn-container button').forEach(b => b.disabled = false);
        appState.isLoading = false;
    }
}
