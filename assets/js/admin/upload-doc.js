import { getFileSha, getFileShaAndContent, putFileContent } from '../services/github-api.js';
import { getGithubConfig } from './github-config.js';
import { byId } from '../ui/dom.js';
import { showToast } from '../ui/toast.js';
import { taiDocManifestTuGithub } from './manage-doc.js';

let loadedDocFile = null;
let loadedDocBase64 = '';

/**
 * Handle document file selection and reading.
 * @param {File} file 
 */
export function handleDocFile(file) {
    if (!file) return;
    
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (ext !== '.docx' && ext !== '.pdf') {
        showToast('Chỉ hỗ trợ tải lên file tài liệu định dạng Word (.docx) hoặc PDF (.pdf)!', 'error');
        return;
    }

    loadedDocFile = file;
    const reader = new FileReader();
    reader.onload = () => {
        const dataUrl = reader.result;
        loadedDocBase64 = dataUrl.split(',')[1];
        showToast(`📂 Đã nạp file: ${file.name}`, 'success');

        // Suggest a title based on the file name
        const baseName = file.name.substring(0, file.name.lastIndexOf('.'));
        byId('upload-doc-title').value = baseName;

        // Clean filename for github saving
        const cleanName = baseName.toLowerCase().replace(/[^a-z0-9_]/g, '_') + ext;
        byId('upload-doc-filename').value = cleanName;
    };
    reader.readAsDataURL(file);
}

export async function uploadDocTaiLieu() {
    const { owner, repo, branch } = getGithubConfig();
    let filename = byId('upload-doc-filename').value.trim();
    const title = byId('upload-doc-title').value.trim();
    const pat = byId('upload-doc-pat').value.trim() || byId('commit-pat').value.trim();

    if (!owner || !repo) {
        showToast('Nhập Owner và Repo trong phần Cấu hình GitHub.', 'error');
        return;
    }
    if (!pat) {
        showToast('Nhập GitHub PAT.', 'error');
        return;
    }
    if (!filename) {
        showToast('Nhập tên file tài liệu lưu trên GitHub.', 'error');
        return;
    }
    if (!title) {
        showToast('Nhập tiêu đề hiển thị.', 'error');
        return;
    }
    if (!loadedDocBase64 || !loadedDocFile) {
        showToast('Nội dung file tài liệu trống. Hãy kéo thả hoặc chọn file trước.', 'error');
        return;
    }

    const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
    if (ext !== '.docx' && ext !== '.pdf') {
        showToast('Tên file lưu trên GitHub phải kết thúc bằng .docx hoặc .pdf!', 'error');
        return;
    }

    const type = ext === '.pdf' ? 'pdf' : 'docx';

    const btn = byId('btn-upload-doc');
    btn.disabled = true;
    btn.textContent = '⏳ Đang đăng tài liệu...';

    try {
        // Step 1: Check documents.txt first to see if filename already exists
        const manifestData = await getFileShaAndContent(owner, repo, 'data/documents.txt', branch, pat);
        let manifestContent = manifestData ? manifestData.content : '';
        const manifestSha = manifestData ? manifestData.sha : null;

        const lines = manifestContent.split('\n').map(l => l.trim());
        const fileExistsInManifest = lines.some(line => line.split('|')[0].trim() === filename);

        if (fileExistsInManifest) {
            if (!confirm(`⚠️ Tên file "${filename}" đã tồn tại trong mục lục tài liệu. Bạn có chắc chắn muốn ghi đè?`)) {
                btn.disabled = false;
                btn.textContent = '🚀 Đăng tài liệu lên GitHub';
                return;
            }
        }

        // Step 2: Get existing file SHA on GitHub (if any) to overwrite
        const fileSha = await getFileSha(owner, repo, `data/documents/${filename}`, branch, pat);

        // Step 3: Upload the binary document file (isBase64: true)
        await putFileContent({
            owner,
            repo,
            path: `data/documents/${filename}`,
            branch,
            pat,
            content: loadedDocBase64,
            message: `Upload document file: ${filename} (${title})`,
            sha: fileSha,
            isBase64: true
        });

        showToast(`📤 Đã upload file ${filename} lên GitHub.`, 'success');

        // Step 4: Update documents.txt lines
        let updatedLines = [];
        let found = false;

        for (const line of lines) {
            if (!line) continue;
            const parts = line.split('|');
            const f = parts[0].trim();
            if (f === filename) {
                updatedLines.push(`${filename}|${title}|${type}`);
                found = true;
            } else {
                updatedLines.push(line);
            }
        }

        if (!found) {
            updatedLines.push(`${filename}|${title}|${type}`);
        }

        const finalManifestContent = updatedLines.join('\n') + '\n';

        // Step 5: Commit documents.txt back to GitHub
        await putFileContent({
            owner,
            repo,
            path: 'data/documents.txt',
            branch,
            pat,
            content: finalManifestContent,
            message: `Update documents manifest: add/update ${filename} (${title})`,
            sha: manifestSha
        });

        showToast(`✨ Đăng tài liệu thành công và đã cập nhật mục lục!`, 'success');
        
        // Clear inputs except PAT
        byId('upload-doc-title').value = '';
        byId('upload-doc-filename').value = '';
        byId('upload-doc-file').value = '';
        loadedDocFile = null;
        loadedDocBase64 = '';

        // Reload the manifest list table to reflect the new upload
        await taiDocManifestTuGithub();
    } catch (e) {
        showToast(`❌ Thất bại: ${e.message}`, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = '🚀 Đăng tài liệu lên GitHub';
    }
}
