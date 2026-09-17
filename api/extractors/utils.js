import axios from 'axios';

/**
 * Retry avec backoff exponentiel.
 * @param {Function} fn       - Async function à tenter
 * @param {number}   retries  - Nombre de tentatives
 * @param {number}   delay    - Délai initial en ms
 */
export async function withRetry(fn, retries = 3, delay = 400) {
    let lastError;
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (err) {
            lastError = err;
            if (i < retries - 1) await new Promise(r => setTimeout(r, delay * Math.pow(2, i)));
        }
    }
    throw lastError;
}

/**
 * Résolution des URL courtes TikTok.
 */
export async function resolveTikTokShortUrl(url) {
    if (!url.includes('vm.tiktok.com') && !url.includes('vt.tiktok.com')) return url;
    try {
        const res = await axios.get(url, {
            maxRedirects: 5,
            timeout: 8000,
            validateStatus: s => s >= 200 && s < 400,
        });
        return res.request?.res?.responseUrl || res.headers?.location || url;
    } catch (e) {
        return e.response?.headers?.location?.split('?')[0] || url;
    }
}

/**
 * Extrait un video_id YouTube depuis une URL standard ou courte.
 */
export function extractYouTubeId(url) {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    ];
    for (const p of patterns) {
        const m = url.match(p);
        if (m) return m[1];
    }
    return null;
}
