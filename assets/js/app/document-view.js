import { byId, hide, show } from '../ui/dom.js';
import { appState } from './app-state.js';
import { taiDanhSachTaiLieu } from '../services/document-service.js';
import { escapeHtml } from '../core/text-utils.js';

export async function moTaiLieu() {
    if (appState.uiState !== 'document') appState.prevUiState = appState.uiState;
    hide(byId('quiz-area'));
    hide(byId('result-area'));
    hide(byId('message-box'));
    hide(byId('history-area'));
    hide(byId('chon-de-text'));
    show(byId('document-area'));
    appState.uiState = 'document';
    await renderDanhSachTaiLieu();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function dongTaiLieu() {
    hide(byId('document-area'));
    show(byId('chon-de-text'));
    if (appState.prevUiState === 'quiz') {
        show(byId('quiz-area'));
        appState.uiState = 'quiz';
    } else if (appState.prevUiState === 'result') {
        show(byId('quiz-area'));
        show(byId('result-area'));
        appState.uiState = 'result';
    } else if (appState.prevUiState === 'history') {
        show(byId('history-area'));
        appState.uiState = 'history';
    } else {
        appState.uiState = 'idle';
    }
}

export async function renderDanhSachTaiLieu() {
    const container = byId('document-container');
    container.innerHTML = `<div class="col-span-full text-center py-6 text-gray-500 font-medium">Đang tải danh mục tài liệu...</div>`;
    
    try {
        if (appState.danhSachTaiLieu.length === 0) {
            appState.danhSachTaiLieu = await taiDanhSachTaiLieu();
        }
        
        container.innerHTML = '';
        if (appState.danhSachTaiLieu.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-10 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <p class="text-3xl mb-3">📭</p>
                    <p class="font-medium">Chưa có tài liệu học tập nào được chia sẻ.</p>
                </div>`;
            return;
        }
        
        appState.danhSachTaiLieu.forEach(doc => {
            const card = document.createElement('div');
            card.className = 'bg-gray-50 p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow duration-200';
            
            const badgeColor = doc.type === 'pdf' ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-blue-100 text-blue-700 border-blue-200';
            const icon = doc.type === 'pdf' ? '📄' : '📝';
            
            card.innerHTML = `
                <div class="mb-4">
                    <div class="flex items-center gap-2 mb-2">
                        <span class="text-xs font-bold px-2 py-0.5 rounded-full border ${badgeColor}">${doc.type.toUpperCase()}</span>
                        <span class="text-lg">${icon}</span>
                    </div>
                    <h3 class="font-bold text-gray-800 leading-snug">${doc.title}</h3>
                </div>
                <div class="flex gap-2 mt-auto">
                    <button class="btn-preview flex-1 bg-white hover:bg-gray-100 text-gray-700 font-bold py-2 px-3 rounded-lg border border-gray-300 text-xs transition-colors shadow-sm">
                        👁️ Xem trước
                    </button>
                    <a href="${doc.fileUrl}" download="${doc.id}" class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-lg text-xs text-center transition-colors shadow-sm">
                        ⬇️ Tải về
                    </a>
                </div>
            `;
            
            card.querySelector('.btn-preview').addEventListener('click', () => moXemTruoc(doc));
            container.appendChild(card);
        });
        
    } catch (err) {
        container.innerHTML = `
            <div class="col-span-full text-center py-6 text-red-600 bg-red-50 border border-red-200 rounded-lg">
                Lỗi tải danh sách tài liệu: ${err.message}
            </div>`;
    }
}

export async function moXemTruoc(doc) {
    const modal = byId('preview-modal');
    const titleEl = byId('preview-title');
    const subtitleEl = byId('preview-subtitle');
    const downloadBtn = byId('preview-download-btn');
    const loader = byId('preview-loader');
    
    const pdfContainer = byId('pdf-preview-container');
    const docxContainer = byId('docx-preview-container');
    const errorBox = byId('preview-error-box');
    const errorDownloadLink = byId('error-download-link');
    
    titleEl.innerText = doc.title;
    subtitleEl.innerText = `Loại tài liệu: ${doc.type.toUpperCase()} | Tệp: ${doc.id}`;
    downloadBtn.href = doc.fileUrl;
    downloadBtn.setAttribute('download', doc.id);
    errorDownloadLink.href = doc.fileUrl;
    errorDownloadLink.setAttribute('download', doc.id);
    
    show(modal);
    show(loader);
    hide(pdfContainer);
    hide(docxContainer);
    hide(errorBox);
    
    pdfContainer.innerHTML = '';
    docxContainer.innerHTML = '';
    
    try {
        if (doc.type === 'pdf') {
            if (typeof pdfjsLib === 'undefined') {
                throw new Error('Thư viện PDF.js chưa được tải.');
            }
            
            // Configure worker locally
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'assets/js/lib/pdf.worker.min.js';
            
            // Load and render PDF using PDF.js onto canvases
            const loadingTask = pdfjsLib.getDocument(doc.fileUrl);
            const pdf = await loadingTask.promise;
            
            pdfContainer.innerHTML = '';
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const scale = 1.5;
                const viewport = page.getViewport({ scale });
                
                const canvas = document.createElement('canvas');
                canvas.className = 'w-full max-w-3xl mx-auto shadow-md rounded border mb-4 bg-white block';
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                
                await page.render({
                    canvasContext: context,
                    viewport: viewport
                }).promise;
                
                pdfContainer.appendChild(canvas);
            }
            
            hide(loader);
            show(pdfContainer);
        } else if (doc.type === 'docx') {
            if (typeof docx === 'undefined' || typeof docx.renderAsync !== 'function') {
                throw new Error('Thư viện docx-preview chưa được tải.');
            }
            
            const response = await fetch(doc.fileUrl);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const arrayBuffer = await response.arrayBuffer();
            
            // Set docx rendering options if necessary
            await docx.renderAsync(arrayBuffer, docxContainer);
            
            hide(loader);
            show(docxContainer);
        } else {
            throw new Error(`Định dạng .${doc.type} không hỗ trợ xem trước.`);
        }
    } catch (err) {
        console.error(err);
        hide(loader);
        
        const errorDesc = errorBox.querySelector('p.text-gray-500');
        if (errorDesc) {
            errorDesc.innerHTML = `Lỗi chi tiết: <code class="bg-red-100 text-red-700 px-1 py-0.5 rounded font-mono text-xs">${escapeHtml(err.message)}</code><br><br>Trình duyệt không hỗ trợ xem trực tiếp hoặc tệp bị lỗi. Bạn vẫn có thể tải trực tiếp tệp về máy.`;
        }
        show(errorBox);
    }
}

export function dongXemTruoc() {
    const modal = byId('preview-modal');
    hide(modal);
    
    const pdfContainer = byId('pdf-preview-container');
    pdfContainer.innerHTML = '';
    
    const docxContainer = byId('docx-preview-container');
    docxContainer.innerHTML = '';
}
