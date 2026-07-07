import { getFileShaAndContent, putFileContent } from '../services/github-api.js';
import { getGithubConfig } from './github-config.js';
import { hashPassword } from '../core/crypto.js';
import { byId, show, hide } from '../ui/dom.js';
import { showToast } from '../ui/toast.js';

let manifestState = {
    sha: null,
    content: '',
    list: [],
    isDirty: false
};

export async function taiManifestTuGithub() {
    const { owner, repo, branch } = getGithubConfig();
    const pat = byId('manifest-pat').value.trim() || byId('commit-pat').value.trim();

    if (!owner || !repo) {
        showToast('Nhập Owner và Repo trong phần Cấu hình GitHub.', 'error');
        return;
    }
    if (!pat) {
        showToast('Nhập GitHub PAT.', 'error');
        return;
    }

    const btn = byId('btn-load-manifest');
    const statusEl = byId('manifest-status');
    btn.disabled = true;
    statusEl.textContent = '⏳ Đang tải...';

    try {
        const manifestData = await getFileShaAndContent(owner, repo, 'data/manifest.txt', branch, pat);
        manifestState.sha = manifestData ? manifestData.sha : null;
        manifestState.content = manifestData ? manifestData.content : '';
        manifestState.isDirty = false;

        const lines = manifestState.content.split('\n').map(l => l.trim()).filter(l => l.length > 0 && !l.startsWith('#'));
        manifestState.list = [];

        for (const line of lines) {
            const parts = line.split('|');
            const file = parts[0].trim();
            if (!file.endsWith('.txt')) continue;
            const title = parts.length > 1 ? parts[1].trim() : file.replace('.txt', '');
            const passHash = parts.length > 2 ? parts[2].trim() : null;
            manifestState.list.push({ file, title, passHash });
        }

        statusEl.textContent = '✅ Đã tải thành công';
        show(byId('manifest-table-area'));
        byId('btn-save-manifest').disabled = false;
        
        renderManifestTable();
        updateManifestPreview();
        showToast('Đã nạp danh sách đề thi từ manifest.', 'success');
    } catch (e) {
        statusEl.textContent = '❌ Lỗi tải';
        showToast('Không đọc được manifest: ' + e.message, 'error');
    } finally {
        btn.disabled = false;
    }
}

function renderManifestTable() {
    const tbody = byId('manifest-table-body');
    tbody.innerHTML = '';

    if (manifestState.list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-gray-400">Danh mục rỗng hoặc không có đề thi hợp lệ.</td></tr>`;
        return;
    }

    manifestState.list.forEach((item, index) => {
        const tr = document.createElement('tr');
        tr.className = 'border-b hover:bg-gray-50';

        const passStatus = item.passHash 
            ? `<span class="px-2 py-0.5 bg-red-50 text-red-700 font-semibold rounded text-xs">🔒 Đã khóa (${item.passHash.substring(0, 8)}...)</span>`
            : `<span class="px-2 py-0.5 bg-green-50 text-green-700 font-semibold rounded text-xs">🔓 Không có</span>`;

        tr.innerHTML = `
            <td class="px-3 py-3 text-gray-500 font-mono text-xs">${index + 1}</td>
            <td class="px-3 py-3 font-mono text-gray-600 text-xs">${item.file}</td>
            <td class="px-3 py-3 text-gray-800 font-semibold">${item.title}</td>
            <td class="px-3 py-3">${passStatus}</td>
            <td class="px-3 py-3 text-right space-x-2 whitespace-nowrap">
                <button data-action="set-pass" data-index="${index}" class="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold py-1 px-3 rounded text-xs">🔑 Đặt Pass</button>
                <button data-action="clear-pass" data-index="${index}" class="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-1 px-3 rounded text-xs ${item.passHash ? '' : 'opacity-40 pointer-events-none'}">🔓 Gỡ</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Bind row actions
    tbody.querySelectorAll('[data-action="set-pass"]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const idx = parseInt(btn.dataset.index);
            const item = manifestState.list[idx];
            const pass = prompt(`Nhập mật khẩu mới cho đề "${item.title}":`);
            if (pass === null) return; // Cancel
            if (pass.trim() === '') {
                showToast('Mật khẩu không được rỗng.', 'warning');
                return;
            }
            item.passHash = await hashPassword(pass.trim());
            markDirty();
            renderManifestTable();
            updateManifestPreview();
            showToast(`Đã đổi mật khẩu cho đề "${item.title}".`, 'success');
        });
    });

    tbody.querySelectorAll('[data-action="clear-pass"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = parseInt(btn.dataset.index);
            const item = manifestState.list[idx];
            item.passHash = null;
            markDirty();
            renderManifestTable();
            updateManifestPreview();
            showToast(`Đã gỡ mật khẩu cho đề "${item.title}".`, 'success');
        });
    });
}

function markDirty() {
    manifestState.isDirty = true;
    show(byId('manifest-dirty-badge'));
}

function updateManifestPreview() {
    const lines = manifestState.list.map(item => {
        if (item.passHash) {
            return `${item.file}|${item.title}|${item.passHash}`;
        }
        return `${item.file}|${item.title}`;
    });
    byId('manifest-preview').textContent = lines.join('\n');
}

export async function luuManifestLenGithub() {
    const { owner, repo, branch } = getGithubConfig();
    const pat = byId('manifest-pat').value.trim() || byId('commit-pat').value.trim();

    if (!owner || !repo) {
        showToast('Nhập Owner và Repo trong phần Cấu hình GitHub.', 'error');
        return;
    }
    if (!pat) {
        showToast('Nhập GitHub PAT.', 'error');
        return;
    }

    const lines = manifestState.list.map(item => {
        if (item.passHash) {
            return `${item.file}|${item.title}|${item.passHash}`;
        }
        return `${item.file}|${item.title}`;
    });
    const finalContent = lines.join('\n');

    const btn = byId('btn-save-manifest');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = '⏳ Đang lưu...';

    try {
        // Fetch fresh SHA first to minimize conflict chances
        const freshData = await getFileShaAndContent(owner, repo, 'data/manifest.txt', branch, pat);
        const freshSha = freshData ? freshData.sha : manifestState.sha;

        await putFileContent({
            owner,
            repo,
            path: 'data/manifest.txt',
            branch,
            pat,
            content: finalContent,
            sha: freshSha,
            message: 'admin: cap nhat mat khau de thi trong manifest'
        });

        manifestState.content = finalContent;
        manifestState.sha = freshSha; // note: after write, it changes but we will refetch on next save anyway
        manifestState.isDirty = false;
        hide(byId('manifest-dirty-badge'));

        showToast('Đã lưu manifest thành công lên GitHub!', 'success');
    } catch (e) {
        showToast('Lưu manifest thất bại: ' + e.message, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
}
