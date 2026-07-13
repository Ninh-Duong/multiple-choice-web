import { byId } from '../ui/dom.js';
import { togglePass } from '../ui/password-toggle.js';
import { kiemTraAuth, xacNhanLoginAdmin, dangXuatAdmin } from './admin-auth.js';
import { testKetNoiGithub } from './github-config.js';
import { commitUserText } from './github-commit.js';
import { doiMatKhau, taiDanhSachUser, themUser, xoaUser } from './user-manager.js';
import { huyThayDoi, taiFileUserText } from './user-render.js';
import { copyHashOutput, downloadHashOutput, hashUsers } from './hash-tool.js';
import { copyDeOutput, decodeDe, downloadDeOutput, encodeDe, loadFileToDeInput } from './encode-tool.js';
import { handleDeFile, suggestDeFilename, uploadDeThi } from './upload-de.js';
import { taiManifestTuGithub, luuManifestLenGithub } from './manage-de.js';
import { taiDocManifestTuGithub, luuDocManifestLenGithub } from './manage-doc.js';
import { handleDocFile, uploadDocTaiLieu } from './upload-doc.js';

function bindEvents() {
    byId('admin-login-form').addEventListener('submit', xacNhanLoginAdmin);
    byId('admin-password-toggle').addEventListener('click', e => togglePass('admin-password', e.currentTarget));
    byId('admin-logout-btn').addEventListener('click', dangXuatAdmin);
    byId('btn-test-github').addEventListener('click', testKetNoiGithub);
    byId('btn-load-users').addEventListener('click', taiDanhSachUser);
    byId('btn-add-user').addEventListener('click', themUser);
    byId('new-password-toggle').addEventListener('click', e => togglePass('new-password', e.currentTarget));
    byId('change-pass-toggle').addEventListener('click', e => togglePass('change-pass-new', e.currentTarget));
    byId('btn-change-pass').addEventListener('click', doiMatKhau);
    byId('btn-commit').addEventListener('click', commitUserText);
    byId('commit-pat-toggle').addEventListener('click', e => togglePass('commit-pat', e.currentTarget));
    byId('huy-btn').addEventListener('click', huyThayDoi);
    byId('backup-btn').addEventListener('click', taiFileUserText);
    byId('user-table-body').addEventListener('click', e => {
        const btn = e.target.closest('[data-delete-user]');
        if (btn) xoaUser(btn.dataset.deleteUser);
    });

    byId('btn-hash-users').addEventListener('click', hashUsers);
    byId('btn-copy-hash').addEventListener('click', copyHashOutput);
    byId('btn-download-hash').addEventListener('click', downloadHashOutput);

    byId('btn-encode-de').addEventListener('click', encodeDe);
    byId('btn-decode-de').addEventListener('click', decodeDe);
    byId('btn-copy-de').addEventListener('click', copyDeOutput);
    byId('btn-download-de').addEventListener('click', downloadDeOutput);
    byId('de-file-input').addEventListener('change', loadFileToDeInput);

    // Section 3: Upload đề thi lên GitHub
    const dropzone = byId('upload-de-dropzone');
    const fileInput = byId('upload-de-file');

    dropzone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', e => {
        if (e.target.files.length > 0) handleDeFile(e.target.files[0]);
    });

    dropzone.addEventListener('dragover', e => {
        e.preventDefault();
        dropzone.classList.add('border-purple-500', 'bg-purple-100/50');
    });

    const removeDragStyles = () => dropzone.classList.remove('border-purple-500', 'bg-purple-100/50');
    dropzone.addEventListener('dragleave', removeDragStyles);
    dropzone.addEventListener('dragend', removeDragStyles);

    dropzone.addEventListener('drop', e => {
        e.preventDefault();
        removeDragStyles();
        if (e.dataTransfer.files.length > 0) handleDeFile(e.dataTransfer.files[0]);
    });

    byId('btn-suggest-filename').addEventListener('click', suggestDeFilename);
    byId('btn-upload-de').addEventListener('click', uploadDeThi);
    byId('upload-de-pat-toggle').addEventListener('click', e => togglePass('upload-de-pat', e.currentTarget));

    // Section 4: Quản lý Đề thi & Mật khẩu phòng thi
    byId('btn-load-manifest').addEventListener('click', taiManifestTuGithub);
    byId('btn-save-manifest').addEventListener('click', luuManifestLenGithub);
    byId('manifest-pat-toggle').addEventListener('click', e => togglePass('manifest-pat', e.currentTarget));

    // Section 5: Quản lý & Đăng tải Tài liệu (Word & PDF)
    const docDropzone = byId('upload-doc-dropzone');
    const docFileInput = byId('upload-doc-file');

    docDropzone.addEventListener('click', () => docFileInput.click());
    docFileInput.addEventListener('change', e => {
        if (e.target.files.length > 0) handleDocFile(e.target.files[0]);
    });

    docDropzone.addEventListener('dragover', e => {
        e.preventDefault();
        docDropzone.classList.add('border-emerald-500', 'bg-emerald-100/50');
    });

    const removeDocDragStyles = () => docDropzone.classList.remove('border-emerald-500', 'bg-emerald-100/50');
    docDropzone.addEventListener('dragleave', removeDocDragStyles);
    docDropzone.addEventListener('dragend', removeDocDragStyles);

    docDropzone.addEventListener('drop', e => {
        e.preventDefault();
        removeDocDragStyles();
        if (e.dataTransfer.files.length > 0) handleDocFile(e.dataTransfer.files[0]);
    });

    byId('btn-upload-doc').addEventListener('click', uploadDocTaiLieu);
    byId('upload-doc-pat-toggle').addEventListener('click', e => togglePass('upload-doc-pat', e.currentTarget));

    byId('btn-load-doc-manifest').addEventListener('click', taiDocManifestTuGithub);
    byId('btn-save-doc-manifest').addEventListener('click', luuDocManifestLenGithub);
    byId('doc-manifest-pat-toggle').addEventListener('click', e => togglePass('doc-manifest-pat', e.currentTarget));
}

document.addEventListener('DOMContentLoaded', () => {
    bindEvents();
    kiemTraAuth();
});
