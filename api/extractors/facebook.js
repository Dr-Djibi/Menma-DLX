import axios from 'axios';
import * as cheerio from 'cheerio';
import { snapsave } from 'snapsave-media-downloader';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

/**
 * Méthode 1 : fdownloader.net (scraping)
 */
async function tryFdownloader(url) {
    const { data } = await axios.post(
        'https://fdownloader.net/api/ajaxSearch',
        new URLSearchParams({ q: url, vt: 'facebook' }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': UA }, timeout: 10000 }
    );
    const $ = cheerio.load(data.data || data);
    const links = [];
    $('a').each((_, el) => {
        const href = $(el).attr('href');
        if (href && href.startsWith('http') && href.includes('video')) links.push(href);
    });
    if (links.length === 0) throw new Error('fdownloader: no links');
    const hd = links[0];
    const sd = links[1] || null;
    return { hd, sd };
}

/**
 * Méthode 2 : fdown.net (scraping)
 */
async function tryFdown(url) {
    const { data } = await axios.post(
        'https://fdown.net/download.php',
        new URLSearchParams({ URLz: url }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': UA }, timeout: 10000 }
    );
    const $ = cheerio.load(data);
    const hd = $('#hdlink').attr('href') || null;
    const sd = $('#sdlink').attr('href') || null;
    if (!hd && !sd) throw new Error('fdown: no links');
    return { hd: hd || sd, sd: sd || hd };
}

/**
 * Méthode 3 : getmyfb.com (scraping)
 */
async function tryGetMyFb(url) {
    const { data } = await axios.post(
        'https://getmyfb.com/process',
        `id=${encodeURIComponent(url)}&locale=en`,
        { headers: { 'hx-request': 'true', 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': UA }, timeout: 10000 }
    );
    const $ = cheerio.load(data);
    const links = [];
    $('.results-item a, .download-link a, a.download-btn, a[href*="facebook"]').each((_, el) => {
        const href = $(el).attr('href');
        if (href && href.startsWith('http')) links.push(href);
    });
    if (links.length === 0) throw new Error('getmyfb: no links');
    return { hd: links[0], sd: links[1] || null };
}

/**
 * Méthode 4 : SaveFrom via API publique
 */
async function trySavefrom(url) {
    const { data } = await axios.get(
        `https://worker.sf-tools.com/savefrom.php?sf_url=${encodeURIComponent(url)}&lang=fr`,
        { headers: { 'User-Agent': UA, 'Referer': 'https://fr.savefrom.net/' }, timeout: 10000 }
    );
    if (!data?.url || data.url.length === 0) throw new Error('savefrom: no url');
    // data.url est un tableau [{url, quality, ...}]
    const hd = data.url.find(u => u.id?.includes('hd') || u.quality?.includes('HD'))?.url || data.url[0]?.url;
    const sd = data.url.find(u => u.id?.includes('sd') || u.quality?.includes('SD'))?.url || null;
    if (!hd) throw new Error('savefrom: empty url');
    return { hd, sd };
}

/**
 * Méthode 5 : snapsave (fallback généraliste)
 */
async function trySnapsave(url) {
    const snap = await snapsave(url);
    if (!snap?.success || !snap.data?.media?.length) throw new Error('snapsave: no media');
    const medias = snap.data.media;
    const hd = medias.find(m => m.quality === 'hd')?.url || medias[0]?.url;
    const sd = medias.find(m => m.quality === 'sd')?.url || null;
    const thumb = snap.data.thumbnail || null;
    const title = snap.data.title || 'Facebook Vidéo';
    return { hd, sd, thumb, title };
}

export async function getFacebookData(url, format = 'video') {
    const isAudio = format === 'audio';
    let lastError;

    // Tentatives en cascade
    const methods = [
        { name: 'fdownloader', fn: () => tryFdownloader(url) },
        { name: 'fdown',       fn: () => tryFdown(url) },
        { name: 'getmyfb',    fn: () => tryGetMyFb(url) },
        { name: 'savefrom',   fn: () => trySavefrom(url) },
        { name: 'snapsave',   fn: () => trySnapsave(url) },
    ];

    for (const method of methods) {
        try {
            const result = await method.fn();
            const videoUrl = result.hd || result.sd;
            if (!videoUrl) continue;

            const title     = result.title || 'Facebook Vidéo';
            const thumbnail = result.thumb || null;
            const quality   = result.hd ? 'hd' : 'sd';
            const all_media = (result.hd && result.sd)
                ? [{ url: result.hd, type: 'video', quality: 'hd' }, { url: result.sd, type: 'video', quality: 'sd' }]
                : null;

            if (isAudio) {
                return { title, url: result.sd || result.hd, thumbnail, platform: 'Facebook', media_type: 'audio', format: 'mp3', quality: null, all_media: null };
            }

            return { title, url: videoUrl, thumbnail, platform: 'Facebook', media_type: 'video', format: 'mp4', quality, all_media };
        } catch (e) {
            console.warn(`[Facebook ${method.name} WARN]`, e.message);
            lastError = e;
        }
    }

    throw new Error(`Impossible d'extraire la vidéo Facebook. Dernier erreur : ${lastError?.message}`);
}
