import { isHtmlResponse, stripBOM } from '../core/text-utils.js';

/**
 * Fetch text with no-store, BOM strip and HTML fallback detection.
 * @param {string} url
 * @param {RequestInit} [options]
 * @returns {Promise<string>}
 */
export async function fetchText(url, options = {}) {
    const response = await fetch(url, { cache: 'no-store', ...options });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const text = stripBOM(await response.text());
    if (isHtmlResponse(text)) throw new Error('Server returned HTML instead of a text file');
    return text;
}
