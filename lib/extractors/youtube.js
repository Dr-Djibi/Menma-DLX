import { Innertube } from 'youtubei.js';
import { extractYouTubeId } from './utils.js';

/**
 * Extraction des données et URLs de téléchargement pour YouTube.
 * Utilise un mécanisme de repli multi-clients (IOS, ANDROID, MWEB, WEB)
 * pour contourner les restrictions et récupérer les flux directs.
 */
export async function getYouTubeData(url, format = 'video', quality = 'hd') {
    const videoId = extractYouTubeId(url);
    if (!videoId) throw new Error('Impossible d\'extraire l\'ID YouTube depuis l\'URL fournie.');

    const isAudio = format === 'audio';
    const clients = ['IOS', 'ANDROID', 'MWEB', 'WEB'];

    let info = null;
    let lastError = null;

    // Création unique de l'instance Innertube pour de meilleures performances sur Vercel
    const yt = await Innertube.create({ cache: null, generate_session_locally: true });

    for (const client of clients) {
        try {
            const res = await yt.getBasicInfo(videoId, { client });
            if (res?.streaming_data) {
                const formats = [
                    ...(res.streaming_data.formats || []),
                    ...(res.streaming_data.adaptive_formats || [])
                ].filter(f => f.url);

                if (formats.length > 0) {
                    info = res;
                    break;
                }
            }
        } catch (err) {
            lastError = err;
        }
    }

    if (!info || !info.streaming_data) {
        console.error('[YouTube Innertube ERR]', lastError?.message || 'Aucun client n\'a retourné de flux lisible');
        throw new Error("Impossible d'extraire la vidéo YouTube (Peut-être soumise à restriction d'âge ou bloquée).");
    }

    const title = info.basic_info?.title || 'YouTube Video';
    const thumbnail = info.basic_info?.thumbnail?.[0]?.url || null;
    const streamingData = info.streaming_data;

    const allFormats = [
        ...(streamingData.formats || []),
        ...(streamingData.adaptive_formats || [])
    ].filter(f => f.url);

    if (isAudio) {
        let audioFormats = allFormats.filter(f => f.has_audio && !f.has_video);
        if (audioFormats.length === 0) {
            audioFormats = allFormats.filter(f => f.has_audio);
        }
        audioFormats.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));

        const selectedFormat = audioFormats[0];
        if (!selectedFormat?.url) throw new Error('Aucune URL de téléchargement audio extraite.');

        return {
            title,
            url:        selectedFormat.url,
            thumbnail,
            platform:   'YouTube',
            media_type: 'audio',
            format:     'mp3',
            quality:    selectedFormat.audio_quality || '128k',
            all_media:  audioFormats.map(f => ({
                url: f.url,
                type: 'audio',
                quality: f.audio_quality || 'audio'
            }))
        };
    } else {
        let videoFormats = allFormats.filter(f => f.has_video);
        if (videoFormats.length === 0) throw new Error('Aucune URL de téléchargement vidéo extraite.');

        if (quality === 'sd') {
            videoFormats.sort((a, b) => {
                const qA = parseInt(a.quality_label, 10) || 0;
                const qB = parseInt(b.quality_label, 10) || 0;
                return qA - qB;
            });
        } else {
            videoFormats.sort((a, b) => {
                const qA = parseInt(a.quality_label, 10) || 0;
                const qB = parseInt(b.quality_label, 10) || 0;
                return qB - qA;
            });
        }

        const selectedFormat = videoFormats[0];

        // Construire la liste all_media avec des qualités uniques
        const qualityMap = new Map();
        for (const f of videoFormats) {
            const qLabel = f.quality_label || 'SD';
            if (!qualityMap.has(qLabel)) {
                qualityMap.set(qLabel, {
                    url: f.url,
                    type: 'video',
                    quality: qLabel
                });
            }
        }

        return {
            title,
            url:        selectedFormat.url,
            thumbnail,
            platform:   'YouTube',
            media_type: 'video',
            format:     'mp4',
            quality:    selectedFormat.quality_label || quality,
            all_media:  Array.from(qualityMap.values()),
        };
    }
}
