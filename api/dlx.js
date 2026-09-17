import btch from 'btch-downloader';
import { snapsave } from 'snapsave-media-downloader';
import axios from 'axios';
import { Innertube } from 'youtubei.js';

// ─────────────────────────────────────────────────────────────
// Tenant Keys (multi-client : bot, site, app)
// Définis dans .env : TENANT_KEYS=key1,key2,key3
// Si vide → API publique
// ─────────────────────────────────────────────────────────────
const TENANT_KEYS = process.env.TENANT_KEYS
    ? process.env.TENANT_KEYS.split(',').map(k => k.trim()).filter(Boolean)
    : [];

// ─────────────────────────────────────────────────────────────
// Codes d'erreur normalisés (pour React Native / Web / Bot)
// ─────────────────────────────────────────────────────────────
const ERROR_CODES = {
    INVALID_URL:           'INVALID_URL',
    PLATFORM_UNSUPPORTED:  'PLATFORM_UNSUPPORTED',
    EXTRACTION_FAILED:     'EXTRACTION_FAILED',
    TIMEOUT:               'TIMEOUT',
    AUTH_REQUIRED:         'AUTH_REQUIRED',
};

// ─────────────────────────────────────────────────────────────
// Utilitaires
// ─────────────────────────────────────────────────────────────

/**
 * Retry avec backoff exponentiel.
 * @param {Function} fn       - Async function à tenter
 * @param {number}   retries  - Nombre de tentatives
 * @param {number}   delay    - Délai initial en ms
 */
async function withRetry(fn, retries = 3, delay = 400) {
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
 * Extrait un video_id YouTube depuis une URL standard ou courte.
 */
function extractYouTubeId(url) {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    ];
    for (const p of patterns) {
        const m = url.match(p);
        if (m) return m[1];
    }
    return null;
}

/**
 * Détecte la plateforme depuis l'URL.
 */
function detectPlatform(url) {
    if (!url || typeof url !== 'string') return null;
    const u = url.toLowerCase();
    if (/youtube\.com|youtu\.be/.test(u))       return 'YouTube';
    if (/tiktok\.com/.test(u))                   return 'TikTok';
    if (/instagram\.com/.test(u))                return 'Instagram';
    if (/facebook\.com|fb\.watch/.test(u))       return 'Facebook';
    if (/twitter\.com|x\.com/.test(u))           return 'Twitter';
    if (/pinterest\.com|pin\.it/.test(u))        return 'Pinterest';
    if (/open\.spotify\.com/.test(u))            return 'Spotify';
    if (/soundcloud\.com/.test(u))               return 'SoundCloud';
    if (/reddit\.com|redd\.it/.test(u))          return 'Reddit';
    return null;
}

/**
 * Résolution des URL courtes TikTok.
 */
async function resolveTikTokShortUrl(url) {
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

// ─────────────────────────────────────────────────────────────
// Extracteurs par plateforme
// ─────────────────────────────────────────────────────────────

/**
 * YouTube — youtubei.js (Innertube) principal + btch fallback
 * Compatible Vercel serverless, 100% JS, sans binaire.
 */
async function getYouTubeData(url, format = 'video', quality = 'hd') {
    const videoId = extractYouTubeId(url);
    if (!videoId) throw new Error('Impossible d\'extraire l\'ID YouTube depuis l\'URL fournie.');

    const isAudio = format === 'audio';

    // ── Tentative 1 : youtubei.js (Innertube)
    try {
        const yt = await Innertube.create({ cache: null, generate_session_locally: true });
        const info = await yt.getBasicInfo(videoId, { client: 'ANDROID' });
        const title = info.basic_info?.title || 'YouTube Video';
        const thumbnail = info.basic_info?.thumbnail?.[0]?.url || null;

        const streamingData = info.streaming_data;
        if (!streamingData) throw new Error('Pas de streaming_data');

        let selectedFormat = null;

        if (isAudio) {
            // Cherche le meilleur format audio-only
            const audioFormats = streamingData.adaptive_formats?.filter(
                f => f.has_audio && !f.has_video
            ) || [];
            audioFormats.sort((a, b) => (b.audio_quality === 'AUDIO_QUALITY_HIGH' ? 1 : 0)
                                      - (a.audio_quality === 'AUDIO_QUALITY_HIGH' ? 1 : 0));
            selectedFormat = audioFormats[0];
        } else {
            // Cherche le format vidéo+audio combiné (plus simple pour les clients)
            const videoFormats = streamingData.formats?.filter(
                f => f.has_video && f.has_audio
            ) || [];
            if (quality === 'sd') {
                videoFormats.sort((a, b) => (a.quality_label?.includes('360') ? -1 : 1));
            } else {
                videoFormats.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
            }
            selectedFormat = videoFormats[0];

            // Fallback sur adaptive si pas de format combiné
            if (!selectedFormat) {
                const adaptive = streamingData.adaptive_formats?.filter(
                    f => f.has_video
                ) || [];
                adaptive.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
                selectedFormat = adaptive[0];
            }
        }

        if (!selectedFormat?.url) throw new Error('Aucun format URL disponible via Innertube');

        return {
            title,
            url:        selectedFormat.url,
            thumbnail,
            platform:   'YouTube',
            media_type: isAudio ? 'audio' : 'video',
            format:     isAudio ? 'mp3' : 'mp4',
            quality:    selectedFormat.quality_label || quality,
            all_media:  null,
        };
    } catch (innertubeErr) {
        console.warn('[YouTube Innertube WARN]', innertubeErr.message, '→ fallback btch');
    }

    // ── Tentative 2 : btch-downloader (fallback)
    return await withRetry(async () => {
        const res = await btch.youtube(url);
        if (res?.status) {
            const mediaUrl = isAudio ? res.mp3 : res.mp4;
            if (mediaUrl) {
                return {
                    title:      res.title || 'Vidéo YouTube',
                    url:        mediaUrl,
                    thumbnail:  res.thumbnail || null,
                    platform:   'YouTube',
                    media_type: isAudio ? 'audio' : 'video',
                    format:     isAudio ? 'mp3' : 'mp4',
                    quality,
                    all_media:  null,
                };
            }
        }
        throw new Error('btch YouTube: réponse invalide');
    }, 2, 500);
}

/**
 * TikTok — tikwm.com API principal + snapsave fallback + btch fallback
 * Supporte : vidéo, audio (music), images (slides/carrousel)
 */
async function getTikTokData(url, format = 'video') {
    url = await resolveTikTokShortUrl(url);
    const isAudio = format === 'audio';

    // ── Tentative 1 : tikwm.com
    try {
        const { data } = await axios.get(
            `https://tikwm.com/api/?url=${encodeURIComponent(url)}`,
            {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Origin':    'https://tikwm.com',
                    'Referer':   'https://tikwm.com/',
                },
                timeout: 15000,
            }
        );

        if (data?.code === 0 && data?.data) {
            const d = data.data;
            const thumbnail = d.cover || d.origin_cover || null;
            const title     = d.title || 'TikTok';

            if (isAudio && d.music) {
                return { title, url: d.music, thumbnail, platform: 'TikTok', media_type: 'audio', format: 'mp3', quality: null, all_media: null };
            }

            if (d.images?.length > 0) {
                return {
                    title, url: d.images[0], thumbnail, platform: 'TikTok',
                    media_type: 'image', format: null, quality: null,
                    all_media: d.images.map(u => ({ url: u, type: 'image' })),
                };
            }

            const videoUrl = d.play || d.wmplay || null;
            if (videoUrl) {
                return { title, url: videoUrl, thumbnail, platform: 'TikTok', media_type: 'video', format: 'mp4', quality: 'hd', all_media: null };
            }
        }
    } catch (e) {
        console.warn('[TikTok tikwm WARN]', e.message);
    }

    // ── Tentative 2 : snapsave + btch en parallèle
    const snapTask = async () => {
        const snap = await snapsave(url);
        if (snap?.success && snap.data?.media?.length > 0) {
            const m = snap.data.media[0];
            return { title: 'TikTok', url: m.url, thumbnail: snap.data.thumbnail || null, platform: 'TikTok', media_type: m.type || 'video', format: 'mp4', quality: null, all_media: snap.data.media.map(x => ({ url: x.url, type: x.type || 'video' })) };
        }
        throw new Error('Snapsave empty');
    };

    const btchTask = async () => {
        const res = await btch.snapsave(url);
        if (res?.result?.length > 0) {
            return { title: 'TikTok', url: res.result[0].url, thumbnail: null, platform: 'TikTok', media_type: 'video', format: 'mp4', quality: null, all_media: res.result.map(r => ({ url: r.url, type: 'video' })) };
        }
        throw new Error('btch empty');
    };

    return await Promise.any([snapTask(), btchTask()]);
}

/**
 * Facebook — fb-downloader-scrapper principal
 * Extrait séparément l'audio (SD stream audio-only) si format='audio'
 * Fallback snapsave → btch
 */
async function getFacebookData(url, format = 'video') {
    const isAudio = format === 'audio';

    // ── Tentative 1 : fb-downloader-scrapper
    try {
        const { facebook } = await import('fb-downloader-scrapper');
        const res = await withRetry(() => facebook(url), 3, 300);

        if (res?.success !== false && (res?.hd || res?.sd || res?.audio)) {
            const thumbnail = res.thumbnail || null;
            const title     = res.title || 'Facebook Vidéo';

            // Extraction audio séparée si disponible
            if (isAudio) {
                const audioUrl = res.audio || res.sd || res.hd;
                if (audioUrl) {
                    return { title, url: audioUrl, thumbnail, platform: 'Facebook', media_type: 'audio', format: 'mp3', quality: null, all_media: null };
                }
            }

            // Vidéo : préférer HD, fallback SD
            const videoUrl = res.hd || res.sd;
            if (videoUrl) {
                return {
                    title, url: videoUrl, thumbnail, platform: 'Facebook',
                    media_type: 'video', format: 'mp4',
                    quality: res.hd ? 'hd' : 'sd',
                    all_media: res.hd && res.sd
                        ? [{ url: res.hd, type: 'video', quality: 'hd' }, { url: res.sd, type: 'video', quality: 'sd' }]
                        : null,
                };
            }
        }
    } catch (e) {
        console.warn('[Facebook fb-scrapper WARN]', e.message);
    }

    // ── Tentative 2 : snapsave + btch
    const snapTask = async () => {
        const snap = await snapsave(url);
        if (snap?.success && snap.data?.media?.length > 0) {
            const medias = snap.data.media;
            const chosen = isAudio
                ? (medias.find(m => m.type === 'audio') || medias[0])
                : (medias.find(m => m.type === 'video') || medias[0]);
            return {
                title: 'Facebook Média', url: chosen.url,
                thumbnail: snap.data.thumbnail || null, platform: 'Facebook',
                media_type: isAudio ? 'audio' : (chosen.type || 'video'),
                format: isAudio ? 'mp3' : 'mp4', quality: null,
                all_media: medias.map(m => ({ url: m.url, type: m.type || 'video' })),
            };
        }
        throw new Error('Snapsave Facebook empty');
    };

    const btchTask = async () => {
        const res = await btch.snapsave(url);
        if (res?.result?.length > 0) {
            return { title: 'Facebook Média', url: res.result[0].url, thumbnail: null, platform: 'Facebook', media_type: 'video', format: 'mp4', quality: null, all_media: res.result.map(r => ({ url: r.url, type: 'video' })) };
        }
        throw new Error('btch Facebook empty');
    };

    return await Promise.any([snapTask(), btchTask()]);
}

/**
 * Instagram — snapsave principal + igdl + btch fallback
 */
async function getInstagramData(url, format = 'video') {
    const snapTask = async () => {
        const snap = await snapsave(url);
        if (snap?.success && snap.data?.media?.length > 0) {
            const medias = snap.data.media;
            const chosen = medias.find(m => m.type === 'video') || medias[0];
            return {
                title: 'Instagram Média', url: chosen.url,
                thumbnail: snap.data.thumbnail || null, platform: 'Instagram',
                media_type: chosen.type || 'video', format: 'mp4', quality: null,
                all_media: medias.map(m => ({ url: m.url, type: m.type || 'image' })),
            };
        }
        throw new Error('Snapsave IG empty');
    };

    const igdlTask = async () => {
        const res = await btch.igdl(url);
        if (res?.result?.length > 0) {
            const item = res.result[0];
            return {
                title: 'Instagram Média', url: item.url,
                thumbnail: item.thumbnail || null, platform: 'Instagram',
                media_type: 'video', format: 'mp4', quality: null,
                all_media: res.result.map(r => ({ url: r.url, type: 'video' })),
            };
        }
        throw new Error('btch igdl empty');
    };

    const btchTask = async () => {
        const res = await btch.snapsave(url);
        if (res?.result?.length > 0) {
            return { title: 'Instagram Média', url: res.result[0].url, thumbnail: null, platform: 'Instagram', media_type: 'video', format: 'mp4', quality: null, all_media: res.result.map(r => ({ url: r.url, type: 'video' })) };
        }
        throw new Error('btch snapsave IG empty');
    };

    return await Promise.any([snapTask(), igdlTask(), btchTask()]);
}

/**
 * Twitter/X — snapsave + btch
 */
async function getTwitterData(url) {
    const snapTask = async () => {
        const snap = await snapsave(url);
        if (snap?.success && snap.data?.media?.length > 0) {
            const m = snap.data.media[0];
            return { title: 'Twitter/X Média', url: m.url, thumbnail: snap.data.thumbnail || null, platform: 'Twitter', media_type: m.type || 'video', format: 'mp4', quality: null, all_media: snap.data.media.map(x => ({ url: x.url, type: x.type || 'video' })) };
        }
        throw new Error('Snapsave Twitter empty');
    };
    const btchTask = async () => {
        const res = await btch.snapsave(url);
        if (res?.result?.length > 0) return { title: 'Twitter/X Média', url: res.result[0].url, thumbnail: null, platform: 'Twitter', media_type: 'video', format: 'mp4', quality: null, all_media: res.result.map(r => ({ url: r.url, type: 'video' })) };
        throw new Error('btch Twitter empty');
    };
    return await Promise.any([snapTask(), btchTask()]);
}

/**
 * Pinterest — snapsave + btch.pinterest en parallèle
 */
async function getPinterestData(url) {
    const snapTask = async () => {
        const snap = await snapsave(url);
        if (snap?.success && snap.data?.media?.length > 0) {
            const medias = snap.data.media;
            const video  = medias.find(m => m.type === 'video' || m.url?.includes('.mp4'));
            const chosen = video || medias[0];
            return { title: 'Pinterest Média', url: chosen.url, thumbnail: snap.data.thumbnail || null, platform: 'Pinterest', media_type: video ? 'video' : (chosen.type || 'image'), format: video ? 'mp4' : null, quality: null, all_media: medias.map(x => ({ url: x.url, type: x.type || 'image' })) };
        }
        throw new Error('Snapsave Pinterest empty');
    };
    const btchTask = async () => {
        const res = await btch.pinterest(url);
        if (res?.status) {
            const d = res.result?.result || res.result || res;
            const video_url = d.video_url || d.video || (d.url?.includes('.mp4') ? d.url : null);
            const image_url = d.image || d.image_url || d.url;
            const mediaUrl  = video_url || image_url;
            if (mediaUrl) return { title: d.title || 'Pinterest Média', url: mediaUrl, thumbnail: image_url || null, platform: 'Pinterest', media_type: video_url ? 'video' : 'image', format: video_url ? 'mp4' : null, quality: null, all_media: null };
        }
        throw new Error('btch Pinterest empty');
    };
    return await Promise.any([snapTask(), btchTask()]);
}

/**
 * Spotify — btch.spotify avec retry
 */
async function getSpotifyData(url) {
    return await withRetry(async () => {
        const res = await btch.spotify(url);
        if (res?.status && res.result?.formats?.length > 0) {
            const fmt = res.result.formats[0];
            return { title: res.result.title || 'Spotify Track', url: fmt.url, thumbnail: res.result.thumbnail || null, platform: 'Spotify', media_type: 'audio', format: 'mp3', quality: fmt.quality || '128kbps', all_media: null };
        }
        throw new Error('btch Spotify: réponse invalide');
    }, 3, 500);
}

/**
 * SoundCloud — btch.soundcloud avec retry
 */
async function getSoundCloudData(url) {
    return await withRetry(async () => {
        const res = await btch.soundcloud(url);
        if (res?.status && res.result?.url) {
            return { title: res.result.title || 'SoundCloud Track', url: res.result.url, thumbnail: res.result.thumbnail || null, platform: 'SoundCloud', media_type: 'audio', format: 'mp3', quality: null, all_media: null };
        }
        throw new Error('btch SoundCloud: réponse invalide');
    }, 3, 500);
}

/**
 * Reddit — snapsave
 */
async function getRedditData(url) {
    const snap = await snapsave(url);
    if (snap?.success && snap.data?.media?.length > 0) {
        const m = snap.data.media[0];
        return { title: snap.data.title || 'Reddit Média', url: m.url, thumbnail: snap.data.thumbnail || null, platform: 'Reddit', media_type: m.type || 'video', format: 'mp4', quality: null, all_media: snap.data.media.map(x => ({ url: x.url, type: x.type || 'video' })) };
    }
    throw new Error('Impossible d\'extraire le contenu Reddit.');
}

// ─────────────────────────────────────────────────────────────
// Handler Vercel (export default)
// ─────────────────────────────────────────────────────────────

export default async function handler(req, res) {
    // ── CORS — compatible React Native, Web, Bot
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Tenant-Key, X-API-Key');
    res.setHeader('Cache-Control', 'no-store');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Méthode non autorisée', code: 'METHOD_NOT_ALLOWED' });
    }

    // ── Auth multi-tenant
    if (TENANT_KEYS.length > 0) {
        const key = req.headers['x-tenant-key'] || req.headers['x-api-key'] || req.body?.tenant_key;
        if (!key || !TENANT_KEYS.includes(key)) {
            return res.status(401).json({ success: false, error: 'Clé API invalide ou manquante.', code: ERROR_CODES.AUTH_REQUIRED });
        }
    }

    const { url, format = 'video', quality = 'hd' } = req.body || {};

    if (!url || typeof url !== 'string' || !url.startsWith('http')) {
        return res.status(400).json({ success: false, error: "URL invalide ou manquante.", code: ERROR_CODES.INVALID_URL });
    }

    const platform = detectPlatform(url);
    if (!platform) {
        return res.status(400).json({
            success: false,
            error: 'Plateforme non supportée. Plateformes acceptées : YouTube, TikTok, Instagram, Facebook, Twitter/X, Pinterest, Spotify, SoundCloud, Reddit.',
            code: ERROR_CODES.PLATFORM_UNSUPPORTED,
        });
    }

    // ── Timeout global 25s (limite Vercel Hobby)
    const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(Object.assign(new Error('Extraction trop longue (>25s). Réessaie.'), { code: ERROR_CODES.TIMEOUT })), 25000)
    );

    try {
        const extraction = (async () => {
            switch (platform) {
                case 'YouTube':    return await getYouTubeData(url, format, quality);
                case 'TikTok':     return await getTikTokData(url, format);
                case 'Instagram':  return await getInstagramData(url, format);
                case 'Facebook':   return await getFacebookData(url, format);
                case 'Twitter':    return await getTwitterData(url);
                case 'Pinterest':  return await getPinterestData(url);
                case 'Spotify':    return await getSpotifyData(url);
                case 'SoundCloud': return await getSoundCloudData(url);
                case 'Reddit':     return await getRedditData(url);
                default:           throw new Error(`Plateforme inconnue : ${platform}`);
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
        console.error('[DLX Error]', platform, err.message);
        const statusCode = err.code === ERROR_CODES.TIMEOUT ? 504 : 500;
        return res.status(statusCode).json({
            success: false,
            error:   err.message,
            code:    err.code || ERROR_CODES.EXTRACTION_FAILED,
        });
    }
}
