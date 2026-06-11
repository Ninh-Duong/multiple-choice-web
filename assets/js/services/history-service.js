const HISTORY_KEY = 'quizHistory';

/** @returns {any[]} */
export function layLichSu() {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; }
    catch { return []; }
}

/** @param {any} sessionData */
export function luuVaoLichSu(sessionData) {
    const history = layLichSu();
    history.unshift(sessionData);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export function xoaToanBoLichSu() {
    localStorage.removeItem(HISTORY_KEY);
}
