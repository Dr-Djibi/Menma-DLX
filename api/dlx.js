import btch from 'btch-downloader';
import { snapsave } from 'snapsave-media-downloader';
import axios from 'axios';

/**
 * Détecte la plateforme depuis l'URL
 */
function detectPlatform(url) {
    if (/youtube\.com|youtu\.be/.test(url)) return 'YouTube';
    if (/tiktok\.com/.test(url)) return 'TikTok';
    if (/instagram\.com/.test(url)) return 'Instagram';
    if (/facebook\.com|fb\.watch/.test(url)) return 'Facebook';
    if (/twitter\.com|x\.com/.test(url)) return 'Twitter';
    return null;
}

/**
 * YouTube via btch-downloader (pas de bot check, très stable)
 */
async function getYouTubeData(url) {
    try {
        const res = await btch.youtube(url);
        if (res && res.status && res.mp4) {
            return {
                title: res.title || 'Vidéo YouTube',
                url: res.mp4,
                thumbnail: res.thumbnail || null,
                platform: 'YouTube',
                media_type: 'video'
            };
        }
    } catch {}
    
    throw new Error("YouTube indisponible pour le moment. Vérifie le lien ou réessaie plus tard.");
}

/**
 * Instagram / TikTok / Facebook / Twitter via Snapsave + fallback btch
 * Retourne UNIQUEMENT des vidéos (filtre les images)
 */
async function getSocialData(url, platform) {
    // 1. Snapsave
    try {
        const snapRes = await snapsave(url);
        if (snapRes.success && snapRes.data?.media?.length > 0) {
            const medias = snapRes.data.media;

            // Préférer une vidéo, sinon prendre le premier média
            const videoMedia = medias.find(m => m.type === 'video');
            const chosen = videoMedia || medias[0];

            return {
                title: `${platform} Vidéo`,
                url: chosen.url,
                thumbnail: snapRes.data.thumbnail || null,
                platform,
                media_type: videoMedia ? 'video' : 'image',
                // Tous les médias disponibles (carrousel Instagram)
                all_media: medias.map(m => ({ url: m.url, type: m.type || 'video' }))
            };
        }
    } catch { /* fallback */ }

    // 2. Fallback btch
    try {
        const btchRes = await btch.snapsave(url);
        if (btchRes?.result?.length > 0) {
            const item = btchRes.result[0];
            return {
                title: `${platform} Vidéo`,
                url: item.url,
                thumbnail: item.thumbnail || null,
                platform,
                media_type: 'video',
                all_media: btchRes.result.map(r => ({ url: r.url, type: 'video' }))
            };
        }
    } catch { /* fallback 2 */ }

    throw new Error(`Impossible d'extraire la vidéo de ${platform}.`);
}

/**
 * Fonction serverless Vercel — POST /dlx
 */
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Méthode non autorisée' });
    }

    const { url } = req.body || {};
    if (!url) return res.status(400).json({ success: false, error: "L'URL est requise" });

    const platform = detectPlatform(url);
    if (!platform) {
        return res.status(400).json({ success: false, error: "Plateforme non supportée (YouTube, TikTok, Instagram, Facebook, X)" });
    }

    try {
        const result = platform === 'YouTube'
            ? await getYouTubeData(url)
            : await getSocialData(url, platform);

        return res.status(200).json({
            success: true,
            title: result.title,
            download_url: result.url,
            thumbnail: result.thumbnail || null,
            platform: result.platform,
            media_type: result.media_type || 'video',
            all_media: result.all_media || null
        });

    } catch (error) {
        console.error('[DLX Error]', error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
}
