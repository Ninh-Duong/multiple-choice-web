import { USER_FILE_PATH } from '../config.js';
import { serializeUserText } from '../core/user-parser.js';
import { getFileSha, putFileContent } from '../services/github-api.js';
import { byId } from '../ui/dom.js';
import { showToast } from '../ui/toast.js';
import { adminState } from './admin-state.js';
import { getGithubConfig } from './github-config.js';
import { setDirty } from './user-render.js';
import { taiDanhSachUser } from './user-manager.js';

export async function commitUserText() {
    const { owner, repo, branch } = getGithubConfig();
    const commitMsg = byId('commit-msg').value.trim();
    const pat = byId('commit-pat').value.trim();
    if (!owner || !repo) { showToast('Nhập owner và repo trong phần Cấu hình GitHub.', 'error'); return; }
    if (!pat) { showToast('Nhập GitHub PAT. Token chỉ dùng 1 lần, không lưu lại.', 'error'); return; }
    if (!commitMsg) { showToast('Nhập commit message.', 'error'); return; }
    if (adminState.users.length === 0) { showToast('Danh sách user trống, không thể commit.', 'error'); return; }

    const btn = byId('btn-commit');
    btn.disabled = true;
    btn.textContent = '⏳ Đang commit...';
    try {
        const sha = await getFileSha(owner, repo, USER_FILE_PATH, branch, pat);
        const data = await putFileContent({ owner, repo, path: USER_FILE_PATH, branch, pat, content: serializeUserText(adminState.users), message: commitMsg, sha });
        showToast(`✅ Commit thành công!<br><span class="font-mono text-xs">${data.commit.sha.slice(0, 7)}</span> — ${commitMsg}<br><span class="text-xs text-gray-500">⏳ GitHub Pages cần ~1-2 phút để cập nhật.</span>`, 'success');
        byId('commit-pat').value = '';
        byId('gh-status').innerHTML = '✅ Đã commit.';
        adminState.originalUsers = JSON.parse(JSON.stringify(adminState.users));
        adminState.dirty = false;
        setDirty();
        setTimeout(async () => {
            await taiDanhSachUser();
            showToast('🔄 Đã tải lại danh sách từ server để xác nhận.', 'info');
        }, 3000);
    } catch (e) {
        showToast(`❌ ${e.message}`, 'error');
    } finally {
        btn.textContent = '💾 Lưu lên GitHub';
        setDirty();
    }
}
