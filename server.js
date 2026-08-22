import express from 'express';
import cors from 'cors';
import ytdl from '@distube/ytdl-core';
import btch from 'btch-downloader';
import { snapsave } from 'snapsave-media-downloader';
import axios from 'axios';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve the GUI files

const PORT = process.env.PORT || 3000;

/**
 * Fonction utilitaire pour détecter la plateforme
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
 * Logique de téléchargement YouTube
 */
async function getYouTubeData(url) {
    const info = await ytdl.getInfo(url);
    const title = info.videoDetails.title;
    
    // Filtrer pour obtenir un format avec audio et vidéo (mp4)
    const format = ytdl.chooseFormat(info.formats, { quality: 'highest', filter: 'audioandvideo' });
    
    if (!format || !format.url) throw new Error("Aucun format vidéo/audio combiné trouvé");
    
    return { title, url: format.url, platform: 'YouTube' };
}

/**
 * Route Principale de téléchargement
 */
app.post('/api/download', async (req, res) => {
    const { url } = req.body;
    
    if (!url) {
        return res.status(400).json({ error: "L'URL est requise" });
    }

    try {
        const platform = detectPlatform(url);
        let result = { title: "Vidéo Téléchargée", url: null, platform };

        switch (platform) {
            case 'YouTube':
                result = await getYouTubeData(url);
                break;
            
            case 'Instagram':
            case 'Facebook':
            case 'Twitter':
            case 'TikTok':
                // Utilisation de Snapsave (qui est très polyvalent pour IG, FB, TT)
                try {
                    const snapRes = await snapsave(url);
                    if (snapRes.success && snapRes.data && snapRes.data.media) {
                        const medias = snapRes.data.media;
                        const videoMedia = medias.find(m => m.type === 'video') || medias[0];
                        result.url = videoMedia.url;
                        
                        // Pour Instagram, s'assurer que c'est une vidéo en faisant un HEAD si nécessaire
                        // Mais l'API backend renvoie juste le lien pour que le bot s'en charge.
                    } else {
                        throw new Error("Snapsave a échoué");
                    }
                } catch (snapErr) {
                    // Fallback sur BTCH Downloader
                    const btchRes = await btch.snapsave(url);
                    if (btchRes && btchRes.result && btchRes.result.length > 0) {
                        result.url = btchRes.result[0].url;
                    } else {
                        throw new Error("Impossible d'extraire la vidéo");
                    }
                }
                break;

            default:
                return res.status(400).json({ error: "Plateforme non supportée" });
        }

        if (!result.url) {
            return res.status(404).json({ error: "Lien direct introuvable pour cette vidéo" });
        }

        res.json({
            success: true,
            title: result.title,
            download_url: result.url,
            platform: result.platform
        });

    } catch (error) {
        console.error("Erreur téléchargement:", error.message);
        res.status(500).json({ success: false, error: "Erreur lors de l'extraction de la vidéo: " + error.message });
    }
});

// Route de base de vérification de santé (requise par Render/Vercel)
app.get('/', (req, res) => {
    res.json({ status: "En ligne", message: "API de téléchargement vidéo prête", version: "1.0.0" });
});

// Important pour Vercel : on exporte l'app au lieu d'utiliser app.listen en production serverless
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`✅ Serveur Démarré. En écoute sur le port ${PORT}`);
    });
}
export default app;
