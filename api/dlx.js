// ── Routeur API Vercel Serverless (dlx.js) ─────────────────────

import { getYouTubeData } from './extractors/youtube.js';
import { getTikTokData } from './extractors/tiktok.js';
import { getFacebookData } from './extractors/facebook.js';
import { getInstagramData } from './extractors/instagram.js';
import { getTwitterData } from './extractors/twitter.js';
import { getPinterestData } from './extractors/pinterest.js';
import { getSpotifyData } from './extractors/spotify.js';
import { getSoundCloudData } from './extractors/soundcloud.js';
import { getRedditData } from './extractors/reddit.js';

// Tenant Keys (multi-client : bot, site, app)
const TENANT_KEYS = process.env.TENANT_KEYS
    ? process.env.TENANT_KEYS.split(',').map(k => k.trim()).filter(Boolean)
    : [];

// Codes d'erreur normalisés
const ERROR_CODES = {
    INVALID_URL:           'INVALID_URL',
    PLATFORM_UNSUPPORTED:  'PLATFORM_UNSUPPORTED',
    EXTRACTION_FAILED:     'EXTRACTION_FAILED',
    TIMEOUT:               'TIMEOUT',
    AUTH_REQUIRED:         'AUTH_REQUIRED',
};

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

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Tenant-Key, X-API-Key');
    res.setHeader('Cache-Control', 'no-store');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Méthode non autorisée', code: 'METHOD_NOT_ALLOWED' });
    }

    // Auth multi-tenant
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

    // Timeout global 25s (limite Vercel Hobby)
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
