import { testRepoConnection } from '../services/github-api.js';
import { byId } from '../ui/dom.js';

export function getGithubConfig() {
    return {
        owner: byId('gh-owner').value.trim(),
        repo: byId('gh-repo').value.trim(),
        branch: byId('gh-branch').value.trim()
    };
}

export async function testKetNoiGithub() {
    const { owner, repo } = getGithubConfig();
    const statusEl = byId('gh-status');
    if (!owner || !repo) { statusEl.innerHTML = '❌ Nhập owner và repo trước.'; return; }
    statusEl.innerHTML = '⏳ Đang kết nối...';
    try {
        const res = await testRepoConnection(owner, repo);
        if (res.ok) statusEl.innerHTML = `✅ Kết nối thành công! <span class="font-mono">${owner}/${repo}</span>`;
        else if (res.status === 404) statusEl.innerHTML = '❌ Không tìm thấy repo.';
        else statusEl.innerHTML = `❌ Lỗi ${res.status}`;
    } catch (e) {
        statusEl.innerHTML = `❌ Lỗi mạng: ${e.message}`;
    }
}
