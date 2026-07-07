import { base64DecodeUtf8 } from '../core/text-utils.js';

/**
 * Test public repo connectivity.
 * @param {string} owner
 * @param {string} repo
 * @returns {Promise<Response>}
 */
export function testRepoConnection(owner, repo) {
    return fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: { Accept: 'application/vnd.github.v3+json' }
    });
}

/**
 * Get current SHA for a GitHub file.
 * @param {string} owner
 * @param {string} repo
 * @param {string} path
 * @param {string} branch
 * @param {string} pat
 * @returns {Promise<string|null>}
 */
export async function getFileSha(owner, repo, path, branch, pat) {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`, {
        headers: { Authorization: `Bearer ${pat}`, Accept: 'application/vnd.github.v3+json' }
    });
    if (res.ok) return (await res.json()).sha;
    if (res.status === 404) return null;
    const err = await res.json().catch(() => ({}));
    throw new Error(`GET file thất bại (${res.status}): ${err.message || 'Không xác định'}`);
}

/**
 * Commit file content using GitHub Contents API.
 * @param {object} args
 * @param {string} args.owner
 * @param {string} args.repo
 * @param {string} args.path
 * @param {string} args.branch
 * @param {string} args.pat
 * @param {string} args.content
 * @param {string} args.message
 * @param {string|null} args.sha
 * @returns {Promise<any>}
 */
export async function putFileContent({ owner, repo, path, branch, pat, content, message, sha }) {
    const body = { message, content: btoa(unescape(encodeURIComponent(content))), branch };
    if (sha) body.sha = sha;
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${pat}`, 'Content-Type': 'application/json', Accept: 'application/vnd.github.v3+json' },
        body: JSON.stringify(body)
    });
    if (res.ok) return res.json();
    const err = await res.json().catch(() => ({}));
    let msg = '';
    if (res.status === 401) msg = 'Token không hợp lệ hoặc hết hạn.';
    else if (res.status === 403) msg = 'Token không có quyền write contents.';
    else if (res.status === 404) msg = 'Repo không tìm thấy. Kiểm tra owner/repo.';
    else if (res.status === 422) msg = 'File conflict. Thử tải lại danh sách.';
    else msg = err.message || 'Không xác định';
    throw new Error(`PUT thất bại (${res.status}): ${msg}`);
}

/**
 * Get current SHA and content for a GitHub file.
 * @param {string} owner
 * @param {string} repo
 * @param {string} path
 * @param {string} branch
 * @param {string} pat
 * @returns {Promise<{sha:string,content:string}|null>}
 */
export async function getFileShaAndContent(owner, repo, path, branch, pat) {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`, {
        headers: { Authorization: `Bearer ${pat}`, Accept: 'application/vnd.github.v3+json' }
    });
    if (res.ok) {
        const data = await res.json();
        const decodedContent = base64DecodeUtf8(data.content.replace(/\s+/g, ''));
        return { sha: data.sha, content: decodedContent };
    }
    if (res.status === 404) return null;
    const err = await res.json().catch(() => ({}));
    throw new Error(`GET file thất bại (${res.status}): ${err.message || 'Không xác định'}`);
}
