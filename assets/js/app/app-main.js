import { byId } from '../ui/dom.js';
import { initAuth, xacNhanDangNhap, dangXuat } from './auth.js';
import { toggleShuffle, toggleShuffleQuestions, capNhatTienDo } from './quiz-render.js';
import { chamDiem, lamLai } from './quiz-grade.js';
import { moLichSu, dongLichSu, xoaLichSu } from './history-view.js';
import { moTaiLieu, dongTaiLieu, dongXemTruoc } from './document-view.js';

function bindEvents() {
    byId('login-form').addEventListener('submit', xacNhanDangNhap);
    byId('logout-btn').addEventListener('click', dangXuat);
    byId('btn-history').addEventListener('click', moLichSu);
    byId('btn-shuffle-questions').addEventListener('click', toggleShuffleQuestions);
    byId('btn-shuffle').addEventListener('click', toggleShuffle);
    byId('submit-btn').addEventListener('click', chamDiem);
    byId('questions-container').addEventListener('change', capNhatTienDo);
    byId('retry-btn').addEventListener('click', lamLai);
    byId('result-history-btn').addEventListener('click', moLichSu);
    byId('history-delete-btn').addEventListener('click', xoaLichSu);
    byId('history-close-btn').addEventListener('click', dongLichSu);
    
    // Document events
    byId('btn-documents').addEventListener('click', moTaiLieu);
    byId('document-close-btn').addEventListener('click', dongTaiLieu);
    byId('preview-close-btn').addEventListener('click', dongXemTruoc);
}

document.addEventListener('DOMContentLoaded', async () => {
    bindEvents();
    await initAuth();
});
