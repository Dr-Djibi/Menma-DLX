import btch from 'btch-downloader';
import { snapsave } from 'snapsave-media-downloader';

// ── Multi-tenant API keys (optionnel) ──────────────────────────
// Chaque clé identifie un tenant (bot, site, app tierce)
// Défini dans .env : TENANT_KEYS=key1,key2,key3
// Si vide, l'API est publique
const TENANT_KEYS = process.env.TENANT_KEYS
    ? process.env.TENANT_KEYS.split(',').map(k => k.trim()).filter(Boolean)
    : [];

// ── Qualités disponibles ───────────────────────────────────────
const QUALITY_MAP = {
    sd:  { ytFilter: 'audioandvideo', ytQuality: 'lowest'  },
    hd:  { ytFilter: 'audioandvideo', ytQuality: 'highest' },
    '4k':{ ytFilter: 'audioandvideo', ytQuality: 'highest' },
};

/**
 * Détecte la plateforme depuis l'URL
 */
function detectPlatform(url) {
    if (/youtube\.com|youtu\.be/.test(url))        return 'YouTube';
    if (/tiktok\.com/.test(url))                   return 'TikTok';
    if (/instagram\.com/.test(url))                return 'Instagram';
    if (/facebook\.com|fb\.watch/.test(url))       return 'Facebook';
    if (/twitter\.com|x\.com/.test(url))           return 'Twitter';
    if (/pinterest\.com|pin\.it/.test(url))        return 'Pinterest';
    if (/open\.spotify\.com/.test(url))            return 'Spotify';
    if (/soundcloud\.com/.test(url))               return 'SoundCloud';
    if (/reddit\.com|redd\.it/.test(url))          return 'Reddit';
    return null;
}

// ── Extracteurs ────────────────────────────────────────────────

async function getYouTubeData(url, format = 'video', quality = 'hd') {
    const res = await btch.youtube(url);
    if (res?.status) {
        const isAudio = format === 'audio';
        const mediaUrl = isAudio ? res.mp3 : res.mp4;
        if (mediaUrl) {
            return {
                title: res.title || 'Vidéo YouTube',
                url: mediaUrl,
                thumbnail: res.thumbnail || null,
                platform: 'YouTube',
                media_type: isAudio ? 'audio' : 'video',
                quality: quality,
                all_media: null
            };
        }
    }
    throw new Error("YouTube indisponible. Vérifie le lien ou réessaie.");
}

async function getTikTokData(url, format = 'video') {
    const res = await btch.ttdl(url);
    if (res?.status) {
        // Audio demandé
        if (format === 'audio' && res.audio?.length > 0) {
            return {
                title: res.title || 'TikTok Audio',
                url: res.audio[0],
                thumbnail: res.cover || null,
                platform: 'TikTok',
                media_type: 'audio',
                all_media: null
            };
        }
        // Slides / images
        if (res.images?.length > 0) {
            return {
                title: res.title || 'TikTok Photos',
                url: res.images[0],
                thumbnail: res.cover || null,
                platform: 'TikTok',
                media_type: 'image',
                all_media: res.images.map(u => ({ url: u, type: 'image' }))
            };
        }
        // Vidéo par défaut
        const videoUrl = res.video?.[0] || null;
        if (videoUrl) {
            return {
                title: res.title || 'TikTok Vidéo',
                url: videoUrl,
                thumbnail: res.cover || null,
                platform: 'TikTok',
                media_type: 'video',
                all_media: null
            };
        }
    }
    throw new Error("Impossible d'extraire la vidéo TikTok.");
}

async function getSpotifyData(url) {
    const res = await btch.spotify(url);
    if (res?.status && res.result?.formats?.length > 0) {
        const fmt = res.result.formats[0];
        return {
            title: res.result.title || 'Spotify Track',
            url: fmt.url,
            thumbnail: res.result.thumbnail || null,
            platform: 'Spotify',
            media_type: 'audio',
            quality: fmt.quality || '320kbps',
            all_media: null
        };
    }
    throw new Error("Impossible d'extraire le track Spotify.");
}

async function getSoundCloudData(url) {
    const res = await btch.soundcloud(url);
    if (res?.status && res.result?.url) {
        return {
            title: res.result.title || 'SoundCloud Track',
            url: res.result.url,
            thumbnail: res.result.thumbnail || null,
            platform: 'SoundCloud',
            media_type: 'audio',
            all_media: null
        };
    }
    throw new Error("Impossible d'extraire le track SoundCloud.");
}

async function getPinterestData(url) {
    // Tentative via snapsave
    try {
        const snap = await snapsave(url);
        if (snap?.success && snap.data?.media?.length > 0) {
            const m = snap.data.media[0];
            return {
                title: 'Pinterest Media',
                url: m.url,
                thumbnail: snap.data.thumbnail || null,
                platform: 'Pinterest',
                media_type: m.type || 'image',
                all_media: snap.data.media.map(x => ({ url: x.url, type: x.type || 'image' }))
            };
        }
    } catch {}
    // Fallback btch
    const res = await btch.pinterest(url);
    if (res?.status && res.result?.url) {
        const mt = res.result.url.match(/\.mp4/) ? 'video' : 'image';
        return {
            title: 'Pinterest Media',
            url: res.result.url,
            thumbnail: res.result.thumbnail || null,
            platform: 'Pinterest',
            media_type: mt,
            all_media: null
        };
    }
    throw new Error("Impossible d'extraire le contenu Pinterest.");
}

async function getRedditData(url) {
    // Reddit supporte snapsave
    const snap = await snapsave(url);
    if (snap?.success && snap.data?.media?.length > 0) {
        const m = snap.data.media[0];
        return {
            title: snap.data.title || 'Reddit Media',
            url: m.url,
            thumbnail: snap.data.thumbnail || null,
            platform: 'Reddit',
            media_type: m.type || 'video',
            all_media: snap.data.media.map(x => ({ url: x.url, type: x.type || 'video' }))
        };
    }
    throw new Error("Impossible d'extraire le contenu Reddit.");
}

async function getSocialData(url, platform, format = 'video') {
    // 1. Snapsave
    try {
        const snapRes = await snapsave(url);
        if (snapRes.success && snapRes.data?.media?.length > 0) {
            const medias = snapRes.data.media;
            const videoMedia = medias.find(m => m.type === 'video');
            const chosen = videoMedia || medias[0];
            return {
                title: `${platform} Média`,
                url: chosen.url,
                thumbnail: snapRes.data.thumbnail || null,
                platform,
                media_type: videoMedia ? 'video' : 'image',
                all_media: medias.map(m => ({ url: m.url, type: m.type || 'video' }))
            };
        }
    } catch {}

    // 2. Fallback btch
    const btchRes = await btch.snapsave(url);
    if (btchRes?.result?.length > 0) {
        const item = btchRes.result[0];
        return {
            title: `${platform} Média`,
            url: item.url,
            thumbnail: item.thumbnail || null,
            platform,
            media_type: 'video',
            all_media: btchRes.result.map(r => ({ url: r.url, type: 'video' }))
        };
    }

    throw new Error(`Impossible d'extraire le contenu ${platform}.`);
}

// ── Handler Vercel ─────────────────────────────────────────────

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Tenant-Key');
    res.setHeader('Cache-Control', 'no-store');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Méthode non autorisée' });
    }

    // ── Vérification multi-tenant ──────────────────────────────
    if (TENANT_KEYS.length > 0) {
        const tenantKey = req.headers['x-tenant-key'] || req.body?.tenant_key;
        if (!tenantKey || !TENANT_KEYS.includes(tenantKey)) {
            return res.status(401).json({ success: false, error: 'Clé API invalide ou manquante.' });
        }
    }

    const { url, format = 'video', quality = 'hd' } = req.body || {};
    if (!url) return res.status(400).json({ success: false, error: "L'URL est requise" });

    const platform = detectPlatform(url);
    if (!platform) {
        return res.status(400).json({
            success: false,
            error: "Plateforme non supportée. Supportés : YouTube, TikTok, Instagram, Facebook, X, Pinterest, Spotify, SoundCloud, Reddit"
        });
    }

    // ── Timeout global de 25 secondes ─────────────────────────
    const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Extraction trop longue (>25s). Réessaie.')), 25000)
    );

    try {
        const extractionPromise = (async () => {
            switch (platform) {
                case 'YouTube':    return await getYouTubeData(url, format, quality);
                case 'TikTok':     return await getTikTokData(url, format);
                case 'Spotify':    return await getSpotifyData(url);
                case 'SoundCloud': return await getSoundCloudData(url);
                case 'Pinterest':  return await getPinterestData(url);
                case 'Reddit':     return await getRedditData(url);
                default:           return await getSocialData(url, platform, format);
            }
        })();

        const result = await Promise.race([extractionPromise, timeoutPromise]);

        return res.status(200).json({
            success: true,
            title:         result.title,
            download_url:  result.url,
            thumbnail:     result.thumbnail || null,
            platform:      result.platform,
            media_type:    result.media_type || 'video',
            quality:       result.quality || quality,
            all_media:     result.all_media || null
        });

    } catch (error) {
        console.error('[DLX Error]', error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
}
