import { byId } from '../ui/dom.js';
import { togglePass } from '../ui/password-toggle.js';
import { kiemTraAuth, xacNhanLoginAdmin, dangXuatAdmin } from './admin-auth.js';
import { testKetNoiGithub } from './github-config.js';
import { commitUserText } from './github-commit.js';
import { doiMatKhau, taiDanhSachUser, themUser, xoaUser } from './user-manager.js';
import { huyThayDoi, taiFileUserText } from './user-render.js';
import { copyHashOutput, downloadHashOutput, hashUsers } from './hash-tool.js';
import { copyDeOutput, decodeDe, downloadDeOutput, encodeDe, loadFileToDeInput } from './encode-tool.js';

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
}

document.addEventListener('DOMContentLoaded', () => {
    bindEvents();
    kiemTraAuth();
});
