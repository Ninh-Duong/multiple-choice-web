/**
 * Toggle password input visibility.
 * @param {string} inputId
 * @param {HTMLElement} btn
 */
export function togglePass(inputId, btn) {
    const inp = document.getElementById(inputId);
    if (!inp) return;
    if (inp.type === 'password') {
        inp.type = 'text';
        btn.textContent = '🙈';
    } else {
        inp.type = 'password';
        btn.textContent = '👁';
    }
}
