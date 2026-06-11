/** @param {string} id @returns {HTMLElement} */
export function byId(id) { return document.getElementById(id); }

/** @param {string} selector @param {ParentNode} [root] @returns {Element[]} */
export function all(selector, root = document) { return Array.from(root.querySelectorAll(selector)); }

/** @param {Element|null} el */
export function show(el) { if (el) el.classList.remove('hidden'); }

/** @param {Element|null} el */
export function hide(el) { if (el) el.classList.add('hidden'); }

/**
 * Copy textarea/input value.
 * @param {HTMLInputElement|HTMLTextAreaElement} el
 */
export function copyValue(el) {
    el.select();
    document.execCommand('copy');
}

/**
 * Download text as a file.
 * @param {string} text
 * @param {string} filename
 */
export function downloadText(text, filename) {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
