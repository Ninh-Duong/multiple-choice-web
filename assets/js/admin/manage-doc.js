import { getFileSha, getFileShaAndContent, putFileContent, deleteFile } from '../services/github-api.js';
import { getGithubConfig } from './github-config.js';
import { byId, show, hide } from '../ui/dom.js';
import { showToast } from '../ui/toast.js';

export let docManifestState = {
    sha: null,
    content: '',
    list: [], // Array of { file, title, type }
    deletedFiles: [],
    isDirty: false
};

export async function taiDocManifestTuGithub() {
    const { owner, repo, branch } = getGithubConfig();
    const pat = byId('doc-manifest-pat').value.trim() || byId('commit-pat').value.trim();

    if (!owner || !repo) {
        showToast('Nhập Owner và Repo trong phần Cấu hình GitHub.', 'error');
        return;
    }
    if (!pat) {
        showToast('Nhập GitHub PAT.', 'error');
        return;
    }

    const btn = byId('btn-load-doc-manifest');
    const statusEl = byId('doc-manifest-status');
    btn.disabled = true;
    statusEl.textContent = '⏳ Đang tải...';

    try {
        const manifestData = await getFileShaAndContent(owner, repo, 'data/documents.txt', branch, pat);
        docManifestState.sha = manifestData ? manifestData.sha : null;
        docManifestState.content = manifestData ? manifestData.content : '';
        docManifestState.isDirty = false;
        docManifestState.deletedFiles = [];

        const lines = docManifestState.content.split('\n').map(l => l.trim()).filter(l => l.length > 0 && !l.startsWith('#'));
        docManifestState.list = [];

        for (const line of lines) {
            const parts = line.split('|');
            const file = parts[0].trim();
            const title = parts.length > 1 ? parts[1].trim() : file;
            const type = parts.length > 2 ? parts[2].trim().toLowerCase() : (file.endsWith('.pdf') ? 'pdf' : 'docx');
            docManifestState.list.push({ file, title, type });
        }

        statusEl.textContent = '✅ Đã tải thành công';
        show(byId('doc-manifest-table-area'));
        byId('btn-save-doc-manifest').disabled = false;
        
        renderDocManifestTable();
        updateDocManifestPreview();
        showToast('Đã nạp danh sách tài liệu từ documents.txt.', 'success');
    } catch (e) {
        statusEl.textContent = '❌ Lỗi tải';
        showToast('Không đọc được documents.txt: ' + e.message, 'error');
    } finally {
        btn.disabled = false;
    }
}

export function renderDocManifestTable() {
    const tbody = byId('doc-manifest-table-body');
    tbody.innerHTML = '';

    if (docManifestState.list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-gray-400">Danh mục rỗng hoặc chưa có tài liệu nào.</td></tr>`;
        return;
    }

    docManifestState.list.forEach((item, index) => {
        const tr = document.createElement('tr');
        tr.className = 'border-b hover:bg-gray-50';

        const badgeColor = item.type === 'pdf' ? 'bg-rose-50 text-rose-700 font-semibold rounded text-xs px-2 py-0.5 border border-rose-200' : 'bg-blue-50 text-blue-700 font-semibold rounded text-xs px-2 py-0.5 border border-blue-200';

        tr.innerHTML = `
            <td class="px-3 py-3 text-gray-500 font-mono text-xs">${index + 1}</td>
            <td class="px-3 py-3 font-mono text-gray-600 text-xs">${item.file}</td>
            <td class="px-3 py-3 text-gray-800 font-semibold">${item.title}</td>
            <td class="px-3 py-3"><span class="${badgeColor}">${item.type.toUpperCase()}</span></td>
            <td class="px-3 py-3 text-right whitespace-nowrap">
                <button data-action="delete-doc" data-index="${index}" class="bg-red-50 hover:bg-red-100 text-red-600 font-bold py-1 px-2 rounded text-xs">🗑 Xóa</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Bind delete action
    tbody.querySelectorAll('[data-action="delete-doc"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = parseInt(btn.dataset.index);
            const item = docManifestState.list[idx];
            if (!confirm(`⚠️ Bạn có chắc chắn muốn xóa tài liệu "${item.title}"?\nHành động này sẽ gỡ tài liệu khỏi mục lục và xóa file trên GitHub khi bạn bấm lưu.`)) {
                return;
            }
            docManifestState.deletedFiles.push(item.file);
            docManifestState.list.splice(idx, 1);
            markDocDirty();
            renderDocManifestTable();
            updateDocManifestPreview();
            showToast(`Đã xóa tài liệu "${item.title}" khỏi danh sách tạm thời.`, 'info');
        });
    });
}

export function markDocDirty() {
    docManifestState.isDirty = true;
    show(byId('doc-manifest-dirty-badge'));
}

export function updateDocManifestPreview() {
    const lines = docManifestState.list.map(item => `${item.file}|${item.title}|${item.type}`);
    byId('doc-manifest-preview').textContent = lines.join('\n');
}

export async function luuDocManifestLenGithub() {
    const { owner, repo, branch } = getGithubConfig();
    const pat = byId('doc-manifest-pat').value.trim() || byId('commit-pat').value.trim();

    if (!owner || !repo) {
        showToast('Nhập Owner và Repo trong phần Cấu hình GitHub.', 'error');
        return;
    }
    if (!pat) {
        showToast('Nhập GitHub PAT.', 'error');
        return;
    }

    const lines = docManifestState.list.map(item => `${item.file}|${item.title}|${item.type}`);
    const finalContent = lines.join('\n') + '\n';

    const btn = byId('btn-save-doc-manifest');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = '⏳ Đang lưu...';

    try {
        // Fetch fresh SHA first
        const freshData = await getFileShaAndContent(owner, repo, 'data/documents.txt', branch, pat);
        const freshSha = freshData ? freshData.sha : docManifestState.sha;

        await putFileContent({
            owner,
            repo,
            path: 'data/documents.txt',
            branch,
            pat,
            content: finalContent,
            sha: freshSha,
            message: 'admin: cap nhat muc luc documents.txt'
        });

        // Delete deleted files from GitHub if any
        if (docManifestState.deletedFiles && docManifestState.deletedFiles.length > 0) {
            for (const file of docManifestState.deletedFiles) {
                try {
                    const filePath = `data/documents/${file}`;
                    const sha = await getFileSha(owner, repo, filePath, branch, pat);
                    if (sha) {
                        await deleteFile({
                            owner,
                            repo,
                            path: filePath,
                            branch,
                            pat,
                            sha,
                            message: `admin: xoa file tai lieu ${file}`
                        });
                    }
                } catch (delErr) {
                    console.error(`Failed to delete file ${file} on GitHub:`, delErr);
                    showToast(`Cảnh báo: Không thể xóa file ${file} trên GitHub: ${delErr.message}`, 'warning');
                }
            }
            docManifestState.deletedFiles = [];
        }

        docManifestState.content = finalContent;
        docManifestState.sha = freshSha;
        docManifestState.isDirty = false;
        hide(byId('doc-manifest-dirty-badge'));

        showToast('Đã lưu mục lục tài liệu thành công lên GitHub!', 'success');
    } catch (e) {
        showToast('Lưu mục lục thất bại: ' + e.message, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
}
