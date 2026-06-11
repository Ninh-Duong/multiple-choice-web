/**
 * Show toast message.
 * @param {string} msg
 * @param {'success'|'error'|'info'|'warning'} [type]
 */
export function showToast(msg, type = 'info') {
    const el = document.getElementById('toast');
    if (!el) return;
    const colorMap = {
        success: 'bg-green-50 text-green-800 border-green-300',
        error: 'bg-red-50 text-red-800 border-red-300',
        info: 'bg-blue-50 text-blue-800 border-blue-300',
        warning: 'bg-amber-50 text-amber-800 border-amber-300'
    };
    el.className = `toast fixed top-4 right-4 z-50 max-w-md p-4 rounded-lg shadow-lg border text-sm font-medium ${colorMap[type] || colorMap.info}`;
    el.innerHTML = msg;
    el.classList.remove('hidden');
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.add('hidden'), 5000);
}
