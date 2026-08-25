import express from 'express';
import cors from 'cors';
import ytdl from '@distube/ytdl-core';
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

/**
 * Détection de la plateforme
 */
function detectPlatform(url) {
    if (/youtube\.com|youtu\.be/.test(url)) return 'YouTube';
    if (/tiktok\.com/.test(url)) return 'TikTok';
    if (/instagram\.com/.test(url)) return 'Instagram';
    if (/facebook\.com|fb\.watch/.test(url)) return 'Facebook';
    if (/twitter\.com|x\.com/.test(url)) return 'Twitter';
    return 'Inconnue';
}

/**
 * YouTube via @distube/ytdl-core
 */
async function getYouTubeData(url, formatType) {
    const info = await ytdl.getInfo(url);
    const title = info.videoDetails.title;
    
    let format;
    if (formatType === 'audio') {
        format = ytdl.chooseFormat(info.formats, { quality: 'highestaudio', filter: 'audioonly' });
    } else {
        format = ytdl.chooseFormat(info.formats, { quality: 'highest', filter: 'audioandvideo' });
    }

    if (!format || !format.url) throw new Error("Aucun format compatible trouvé");
    return { title, url: format.url, platform: 'YouTube' };
}

/**
 * Route API principale
 */
app.post('/api/download', async (req, res) => {
    const { url, format } = req.body;
    if (!url) return res.status(400).json({ success: false, error: "L'URL est requise" });

    try {
        const platform = detectPlatform(url);
        let result = { title: "Vidéo Téléchargée", url: null, platform };

        switch (platform) {
            case 'YouTube':
                result = await getYouTubeData(url, format);
                break;

            case 'Instagram':
            case 'Facebook':
            case 'Twitter':
            case 'TikTok':
                try {
                    const snapRes = await snapsave(url);
                    if (snapRes.success && snapRes.data && snapRes.data.media) {
                        const videoMedia = snapRes.data.media.find(m => m.type === 'video') || snapRes.data.media[0];
                        result.url = videoMedia.url;
                    } else throw new Error("Snapsave échoué");
                } catch {
                    const btchRes = await btch.snapsave(url);
                    if (btchRes?.result?.length > 0) result.url = btchRes.result[0].url;
                    else throw new Error("Impossible d'extraire la vidéo");
                }
                break;

            default:
                return res.status(400).json({ success: false, error: "Plateforme non supportée" });
        }

        if (!result.url) return res.status(404).json({ success: false, error: "Lien direct introuvable" });

        res.json({ success: true, title: result.title, download_url: result.url, platform: result.platform });

    } catch (error) {
        console.error("[API Error]", error.message);
        res.status(500).json({ success: false, error: "Erreur extraction: " + error.message });
    }
});

/**
 * Fichiers statiques (servis explicitement pour Vercel)
 */
const staticFiles = {
    '/style.css': { path: 'public/style.css', mime: 'text/css' },
    '/app.js': { path: 'public/app.js', mime: 'application/javascript' },
    '/sw.js': { path: 'public/sw.js', mime: 'application/javascript' },
    '/manifest.json': { path: 'public/manifest.json', mime: 'application/json' },
};

for (const [route, { path: filePath, mime }] of Object.entries(staticFiles)) {
    app.get(route, (req, res) => {
        res.setHeader('Content-Type', mime);
        createReadStream(join(__dirname, filePath)).pipe(res);
    });
}

/**
 * Interface HTML principale — doit être EN DERNIER
 */
app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    createReadStream(join(__dirname, 'public/index.html')).pipe(res);
});

// Démarrage local uniquement (pas serverless Vercel)
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`✅ Serveur sur http://localhost:${PORT}`));
}

export default app;
