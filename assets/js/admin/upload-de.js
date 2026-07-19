import { getFileSha, getFileShaAndContent, putFileContent } from '../services/github-api.js';
import { getGithubConfig } from './github-config.js';
import { decodeDeNeuCan, validateExamText } from '../core/de-parser.js';
import { base64EncodeUtf8 } from '../core/text-utils.js';
import { byId } from '../ui/dom.js';
import { showToast } from '../ui/toast.js';

let loadedFileContent = '';

/**
 * Handle quiz file selection and reading.
 * @param {File} file 
 */
export function handleDeFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        loadedFileContent = reader.result;
        byId('upload-de-preview').value = loadedFileContent;
        showToast(`📂 Đã nạp file: ${file.name}`, 'success');

        // Suggest a title based on the first line if it's formatted like "Câu X: [Title]" or similar
        const firstLine = loadedFileContent.split('\n')[0].trim();
        if (firstLine && !firstLine.startsWith('Câu') && firstLine.length < 100) {
            byId('upload-de-title').value = firstLine;
        }

        // Try to suggest a filename from the file name
        const baseName = file.name.replace(/\.[^/.]+$/, ""); // strip extension
        const cleanName = baseName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
        
        // Auto prepend 'de_' if not present
        const suggestedName = cleanName.startsWith('de_') ? cleanName : `de_${cleanName}`;
        byId('upload-de-filename').value = suggestedName;
    };
    reader.readAsText(file, 'utf-8');
}

/**
 * Fetch manifest from GitHub and suggest the next available index de_X.txt.
 */
export async function suggestDeFilename() {
    const { owner, repo, branch } = getGithubConfig();
    const pat = byId('upload-de-pat').value.trim() || byId('commit-pat').value.trim();
    
    if (!owner || !repo) {
        showToast('Vui lòng nhập Owner và Repo trong phần Cấu hình GitHub trước.', 'warning');
        return;
    }
    if (!pat) {
        showToast('Vui lòng nhập GitHub PAT ở khung bên dưới để đọc manifest từ GitHub.', 'warning');
        return;
    }

    const btn = byId('btn-suggest-filename');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = '⏳ Đang quét...';

    try {
        const manifestData = await getFileShaAndContent(owner, repo, 'data/manifest.txt', branch, pat);
        if (!manifestData || !manifestData.content.trim()) {
            byId('upload-de-filename').value = 'de_1';
            showToast('Chưa có đề thi nào trong manifest. Gợi ý: de_1', 'info');
            return;
        }

        const lines = manifestData.content.split('\n').map(l => l.trim()).filter(l => l.length > 0 && !l.startsWith('#'));
        let maxIndex = 0;
        
        for (const line of lines) {
            const parts = line.split('|');
            const file = parts[0].trim();
            const match = file.match(/^de_(\d+)\.txt$/);
            if (match) {
                const idx = parseInt(match[1]);
                if (idx > maxIndex) maxIndex = idx;
            }
        }

        const nextName = `de_${maxIndex + 1}`;
        byId('upload-de-filename').value = nextName;
        showToast(`💡 Đã quét manifest. Gợi ý tên tiếp theo: ${nextName}`, 'success');
    } catch (e) {
        showToast('Không đọc được manifest trên GitHub: ' + e.message, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
}

/**
 * Validate and upload the exam paper to GitHub, then update manifest.txt.
 */
export async function uploadDeThi() {
    const { owner, repo, branch } = getGithubConfig();
    let filename = byId('upload-de-filename').value.trim();
    const title = byId('upload-de-title').value.trim();
    const pat = byId('upload-de-pat').value.trim() || byId('commit-pat').value.trim();
    const doEncode = byId('upload-de-encode').checked;
    const content = byId('upload-de-preview').value;

    if (!owner || !repo) {
        showToast('Nhập Owner và Repo trong phần Cấu hình GitHub.', 'error');
        return;
    }
    if (!pat) {
        showToast('Nhập GitHub PAT.', 'error');
        return;
    }
    if (!filename) {
        showToast('Nhập tên file đề thi lưu trên GitHub.', 'error');
        return;
    }
    if (!title) {
        showToast('Nhập tên đề thi hiển thị trên UI.', 'error');
        return;
    }
    if (!content.trim()) {
        showToast('Nội dung đề thi trống. Hãy kéo thả hoặc chọn file trước.', 'error');
        return;
    }

    // Normalize filename: ensure starts with 'de_' and ends with '.txt'
    let cleanFile = filename.toLowerCase().replace(/\s+/g, '_');
    if (!cleanFile.endsWith('.txt')) cleanFile += '.txt';
    if (!cleanFile.startsWith('de_')) cleanFile = 'de_' + cleanFile;

    // Decode first if the uploaded content is already encoded
    let plainText = content;
    if (content.trim().startsWith('#ENCODED')) {
        try {
            plainText = decodeDeNeuCan(content);
        } catch (e) {
            showToast('Lỗi giải mã đề đã mã hoá: ' + e.message, 'error');
            return;
        }
    }

    // Validate format using de-parser
    try {
        const validation = validateExamText(plainText);
        if (validation.questions.length === 0) {
            showToast('Lỗi: File đề thi rỗng hoặc sai cấu trúc (Phải có ít nhất 1 câu và mỗi câu 4 đáp án).', 'error');
            return;
        }
        if (validation.errors.length > 0) {
            showToast(`Lỗi cấu trúc đề:<br>${validation.errors.slice(0, 5).join('<br>')}`, 'error');
            return;
        }
        if (validation.warnings.length > 0) {
            showToast(`Cảnh báo: ${validation.warnings.slice(0, 3).join(' ')}`, 'warning');
        }
    } catch (e) {
        showToast('Lỗi cấu trúc đề: ' + e.message, 'error');
        return;
    }

    const btn = byId('btn-upload-de');
    btn.disabled = true;
    btn.textContent = '⏳ Đang đăng đề...';

    try {
        // Step 1: Check manifest first to see if filename already exists
        const manifestData = await getFileShaAndContent(owner, repo, 'data/manifest.txt', branch, pat);
        let manifestContent = manifestData ? manifestData.content : '';
        const manifestSha = manifestData ? manifestData.sha : null;

        const lines = manifestContent.split('\n').map(l => l.trim());
        const fileExistsInManifest = lines.some(line => line.split('|')[0].trim() === cleanFile);

        if (fileExistsInManifest) {
            if (!confirm(`⚠️ Tên file "${cleanFile}" đã tồn tại trong manifest. Bạn có chắc chắn muốn ghi đè đề thi này?`)) {
                btn.disabled = false;
                btn.textContent = '🚀 Đăng đề thi lên GitHub';
                return;
            }
        }

        // Step 2: Prepare content (encode base64 if checked)
        let finalContent = plainText;
        if (doEncode) {
            const b64 = base64EncodeUtf8(plainText);
            const chunked = b64.replace(/(.{76})/g, '$1\n');
            finalContent = `#ENCODED\n${chunked}\n`;
        }

        // Step 3: Get existing file SHA on GitHub (if any) to overwrite
        const fileSha = await getFileSha(owner, repo, `data/${cleanFile}`, branch, pat);

        // Step 4: Upload the exam file
        await putFileContent({
            owner,
            repo,
            path: `data/${cleanFile}`,
            branch,
            pat,
            content: finalContent,
            message: `Upload exam paper: ${cleanFile} (${title})`,
            sha: fileSha
        });

        showToast(`📤 Đã upload file đề ${cleanFile} lên GitHub.`, 'success');

        // Step 5: Update manifest.txt
        let updatedLines = [];
        let found = false;

        for (const line of lines) {
            if (!line) continue;
            const parts = line.split('|');
            const f = parts[0].trim();
            if (f === cleanFile) {
                updatedLines.push(`${cleanFile}|${title}`);
                found = true;
            } else {
                updatedLines.push(line);
            }
        }

        if (!found) {
            updatedLines.push(`${cleanFile}|${title}`);
        }

        const finalManifestContent = updatedLines.join('\n') + '\n';

        // Step 6: Commit manifest.txt back to GitHub
        await putFileContent({
            owner,
            repo,
            path: 'data/manifest.txt',
            branch,
            pat,
            content: finalManifestContent,
            message: `Update manifest: add/update ${cleanFile} (${title})`,
            sha: manifestSha
        });

        showToast(`✨ Đăng đề thi thành công và đã cập nhật danh mục!`, 'success');
        
        // Clear inputs except PAT
        byId('upload-de-title').value = '';
        byId('upload-de-filename').value = '';
        byId('upload-de-preview').value = '';
        byId('upload-de-file').value = '';
        loadedFileContent = '';
    } catch (e) {
        showToast(`❌ Thất bại: ${e.message}`, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = '🚀 Đăng đề thi lên GitHub';
    }
}
