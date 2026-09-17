import express from 'express';
import cors from 'cors';
import { Innertube } from 'youtubei.js';
import btch from 'btch-downloader';
import { snapsave } from 'snapsave-media-downloader';
import { createReadStream } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// ─────────────────────────────────────────────────────────────
// Codes d'erreur normalisés
// ─────────────────────────────────────────────────────────────
const ERROR_CODES = {
    INVALID_URL:          'INVALID_URL',
    PLATFORM_UNSUPPORTED: 'PLATFORM_UNSUPPORTED',
    EXTRACTION_FAILED:    'EXTRACTION_FAILED',
    TIMEOUT:              'TIMEOUT',
};

// ─────────────────────────────────────────────────────────────
// Utilitaires
// ─────────────────────────────────────────────────────────────

async function withRetry(fn, retries = 3, delay = 400) {
    let lastError;
    for (let i = 0; i < retries; i++) {
        try { return await fn(); } catch (err) {
            lastError = err;
            if (i < retries - 1) await new Promise(r => setTimeout(r, delay * Math.pow(2, i)));
        }
    }
    throw lastError;
}

function extractYouTubeId(url) {
    const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : null;
}

/**
 * Détection de la plateforme
 */
function detectPlatform(url) {
    if (!url || typeof url !== 'string') return null;
    const u = url.toLowerCase();
    if (/youtube\.com|youtu\.be/.test(u))   return 'YouTube';
    if (/tiktok\.com/.test(u))               return 'TikTok';
    if (/instagram\.com/.test(u))            return 'Instagram';
    if (/facebook\.com|fb\.watch/.test(u))   return 'Facebook';
    if (/twitter\.com|x\.com/.test(u))       return 'Twitter';
    if (/pinterest\.com|pin\.it/.test(u))    return 'Pinterest';
    if (/open\.spotify\.com/.test(u))        return 'Spotify';
    if (/soundcloud\.com/.test(u))           return 'SoundCloud';
    if (/reddit\.com|redd\.it/.test(u))      return 'Reddit';
    return null;
}

// ─────────────────────────────────────────────────────────────
// YouTube — youtubei.js principal + btch fallback
// ─────────────────────────────────────────────────────────────
async function getYouTubeData(url, format = 'video', quality = 'hd') {
    const videoId = extractYouTubeId(url);
    if (!videoId) throw new Error("Impossible d'extraire l'ID YouTube depuis l'URL.");
    const isAudio = format === 'audio';

    // Tentative 1 : Innertube
    try {
        const yt = await Innertube.create({ cache: null, generate_session_locally: true });
        const info = await yt.getBasicInfo(videoId, { client: 'ANDROID' });
        const title     = info.basic_info?.title || 'YouTube Video';
        const thumbnail = info.basic_info?.thumbnail?.[0]?.url || null;
        const sd        = info.streaming_data;
        if (!sd) throw new Error('Pas de streaming_data');

        let selectedFormat = null;
        if (isAudio) {
            const audioFormats = (sd.adaptive_formats || []).filter(f => f.has_audio && !f.has_video);
            audioFormats.sort((a, b) => (b.audio_quality === 'AUDIO_QUALITY_HIGH' ? 1 : 0) - (a.audio_quality === 'AUDIO_QUALITY_HIGH' ? 1 : 0));
            selectedFormat = audioFormats[0];
        } else {
            const combined = (sd.formats || []).filter(f => f.has_video && f.has_audio);
            combined.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
            selectedFormat = combined[0] || (sd.adaptive_formats || []).filter(f => f.has_video).sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0];
        }

        if (!selectedFormat?.url) throw new Error('Aucune URL de stream disponible');
        return { title, url: selectedFormat.url, thumbnail, platform: 'YouTube', media_type: isAudio ? 'audio' : 'video', format: isAudio ? 'mp3' : 'mp4', quality: selectedFormat.quality_label || quality, all_media: null };
    } catch (e) {
        console.warn('[YouTube Innertube WARN]', e.message, '→ fallback btch');
    }

    // Tentative 2 : btch fallback
    return await withRetry(async () => {
        const res = await btch.youtube(url);
        if (res?.status) {
            const mediaUrl = isAudio ? res.mp3 : res.mp4;
            if (mediaUrl) return { title: res.title || 'Vidéo YouTube', url: mediaUrl, thumbnail: res.thumbnail || null, platform: 'YouTube', media_type: isAudio ? 'audio' : 'video', format: isAudio ? 'mp3' : 'mp4', quality, all_media: null };
        }
        throw new Error('btch YouTube invalide');
    }, 2, 500);
}

// ─────────────────────────────────────────────────────────────
// Facebook — fb-downloader-scrapper + snapsave + btch
// ─────────────────────────────────────────────────────────────
async function getFacebookData(url, format = 'video') {
    const isAudio = format === 'audio';

    try {
        const { facebook } = await import('fb-downloader-scrapper');
        const res = await withRetry(() => facebook(url), 3, 300);
        if (res?.hd || res?.sd || res?.audio) {
            const title     = res.title || 'Facebook Vidéo';
            const thumbnail = res.thumbnail || null;
            if (isAudio) {
                const audioUrl = res.audio || res.sd || res.hd;
                if (audioUrl) return { title, url: audioUrl, thumbnail, platform: 'Facebook', media_type: 'audio', format: 'mp3', quality: null, all_media: null };
            }
            const videoUrl = res.hd || res.sd;
            if (videoUrl) return { title, url: videoUrl, thumbnail, platform: 'Facebook', media_type: 'video', format: 'mp4', quality: res.hd ? 'hd' : 'sd', all_media: res.hd && res.sd ? [{ url: res.hd, type: 'video', quality: 'hd' }, { url: res.sd, type: 'video', quality: 'sd' }] : null };
        }
    } catch (e) { console.warn('[Facebook fb-scrapper WARN]', e.message); }

    const snapTask = async () => {
        const snap = await snapsave(url);
        if (snap?.success && snap.data?.media?.length > 0) {
            const medias = snap.data.media;
            const chosen = isAudio ? (medias.find(m => m.type === 'audio') || medias[0]) : (medias.find(m => m.type === 'video') || medias[0]);
            return { title: 'Facebook Média', url: chosen.url, thumbnail: snap.data.thumbnail || null, platform: 'Facebook', media_type: isAudio ? 'audio' : (chosen.type || 'video'), format: isAudio ? 'mp3' : 'mp4', quality: null, all_media: medias.map(m => ({ url: m.url, type: m.type || 'video' })) };
        }
        throw new Error('Snapsave empty');
    };
    const btchTask = async () => {
        const res = await btch.snapsave(url);
        if (res?.result?.length > 0) return { title: 'Facebook Média', url: res.result[0].url, thumbnail: null, platform: 'Facebook', media_type: 'video', format: 'mp4', quality: null, all_media: res.result.map(r => ({ url: r.url, type: 'video' })) };
        throw new Error('btch empty');
    };
    return await Promise.any([snapTask(), btchTask()]);
}

// ─────────────────────────────────────────────────────────────
// Social générique — snapsave + btch
// ─────────────────────────────────────────────────────────────
async function getSocialData(url, platform) {
    const snapTask = async () => {
        const snap = await snapsave(url);
        if (snap?.success && snap.data?.media?.length > 0) {
            const medias = snap.data.media;
            const chosen = medias.find(m => m.type === 'video') || medias[0];
            return { title: `${platform} Média`, url: chosen.url, thumbnail: snap.data.thumbnail || null, platform, media_type: chosen.type || 'video', format: 'mp4', quality: null, all_media: medias.map(m => ({ url: m.url, type: m.type || 'video' })) };
        }
        throw new Error('Snapsave empty');
    };
    const btchTask = async () => {
        const res = await btch.snapsave(url);
        if (res?.result?.length > 0) return { title: `${platform} Média`, url: res.result[0].url, thumbnail: null, platform, media_type: 'video', format: 'mp4', quality: null, all_media: res.result.map(r => ({ url: r.url, type: 'video' })) };
        throw new Error('btch empty');
    };
    return await Promise.any([snapTask(), btchTask()]);
}

// ─────────────────────────────────────────────────────────────
// Route API principale
// ─────────────────────────────────────────────────────────────
app.post('/api/download', async (req, res) => {
    const { url, format = 'video', quality = 'hd' } = req.body || {};

    if (!url || typeof url !== 'string' || !url.startsWith('http')) {
        return res.status(400).json({ success: false, error: "URL invalide ou manquante.", code: ERROR_CODES.INVALID_URL });
    }

    const platform = detectPlatform(url);
    if (!platform) {
        return res.status(400).json({
            success: false,
            error: 'Plateforme non supportée. Supportées : YouTube, TikTok, Instagram, Facebook, Twitter/X, Pinterest, Spotify, SoundCloud, Reddit.',
            code: ERROR_CODES.PLATFORM_UNSUPPORTED,
        });
    }

    const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(Object.assign(new Error('Extraction trop longue (>25s). Réessaie.'), { code: ERROR_CODES.TIMEOUT })), 25000)
    );

    try {
        const extraction = (async () => {
            switch (platform) {
                case 'YouTube':   return await getYouTubeData(url, format, quality);
                case 'Facebook':  return await getFacebookData(url, format);
                default:          return await getSocialData(url, platform);
            }
        })();

        const result = await Promise.race([extraction, timeout]);

        return res.status(200).json({
            success:      true,
            platform:     result.platform,
            title:        result.title,
            thumbnail:    result.thumbnail   || null,
            media_type:   result.media_type  || 'video',
            format:       result.format      || null,
            quality:      result.quality     || quality,
            download_url: result.url,
            all_media:    result.all_media   || null,
        });

    } catch (err) {
        console.error('[API Error]', platform, err.message);
        const statusCode = err.code === ERROR_CODES.TIMEOUT ? 504 : 500;
        return res.status(statusCode).json({ success: false, error: err.message, code: err.code || ERROR_CODES.EXTRACTION_FAILED });
    }
});

// ─────────────────────────────────────────────────────────────
// Fichiers statiques
// ─────────────────────────────────────────────────────────────
const staticFiles = {
    '/style.css':     { path: 'public/style.css',     mime: 'text/css' },
    '/app.js':        { path: 'public/app.js',         mime: 'application/javascript' },
    '/sw.js':         { path: 'public/sw.js',          mime: 'application/javascript' },
    '/manifest.json': { path: 'public/manifest.json',  mime: 'application/json' },
};

for (const [route, { path: filePath, mime }] of Object.entries(staticFiles)) {
    app.get(route, (req, res) => {
        res.setHeader('Content-Type', mime);
        createReadStream(join(__dirname, filePath)).pipe(res);
    });
}

app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    createReadStream(join(__dirname, 'public/index.html')).pipe(res);
});

// ─────────────────────────────────────────────────────────────
// Démarrage local uniquement (pas Vercel serverless)
// ─────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`✅ Serveur MENMA DLX sur http://localhost:${PORT}`));
}

export default app;
