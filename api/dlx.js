import ytdl from '@distube/ytdl-core';
import btch from 'btch-downloader';
import { snapsave } from 'snapsave-media-downloader';

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
 * Handler YouTube
 */
async function getYouTubeData(url) {
    const info = await ytdl.getInfo(url);
    const title = info.videoDetails.title;
    const format = ytdl.chooseFormat(info.formats, { quality: 'highest', filter: 'audioandvideo' });
    if (!format?.url) throw new Error("Aucun format vidéo/audio combiné trouvé");
    return { title, url: format.url, platform: 'YouTube' };
}

/**
 * Fonction serverless Vercel — POST /dlx
 */
export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Méthode non autorisée' });

    const { url } = req.body || {};
    if (!url) return res.status(400).json({ success: false, error: "L'URL est requise" });

    const platform = detectPlatform(url);
    if (!platform) return res.status(400).json({ success: false, error: "Plateforme non supportée" });

    try {
        let result = { title: "Vidéo", url: null, platform };

        if (platform === 'YouTube') {
            result = await getYouTubeData(url);
        } else {
            // TikTok, Instagram, Facebook, Twitter → Snapsave + fallback btch
            try {
                const snapRes = await snapsave(url);
                if (snapRes.success && snapRes.data?.media?.length > 0) {
                    const videoMedia = snapRes.data.media.find(m => m.type === 'video') || snapRes.data.media[0];
                    result.url = videoMedia.url;
                } else throw new Error("Snapsave échec");
            } catch {
                const btchRes = await btch.snapsave(url);
                if (btchRes?.result?.length > 0) result.url = btchRes.result[0].url;
                else throw new Error("Impossible d'extraire la vidéo");
            }
        }

        if (!result.url) return res.status(404).json({ success: false, error: "Lien direct introuvable" });

        return res.status(200).json({
            success: true,
            title: result.title,
            download_url: result.url,
            platform: result.platform
        });

    } catch (error) {
        console.error('[DLX Error]', error.message);
        return res.status(500).json({ success: false, error: "Erreur extraction: " + error.message });
    }
}
