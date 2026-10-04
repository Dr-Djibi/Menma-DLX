import { Innertube } from 'youtubei.js';
import btch from 'btch-downloader';
import { extractYouTubeId } from './utils.js';

/**
 * Tentative 1 : Innertube (youtubei.js)
 */
async function tryInnertube(videoId, format, quality) {
    const isAudio = format === 'audio';
    const clients = ['IOS', 'ANDROID', 'MWEB', 'WEB'];
    let info = null;
    let lastError = null;

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
        throw new Error(lastError?.message || 'Aucun client Innertube n\'a retourné de flux lisible');
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

/**
 * Tentative 2 : btch-downloader
 */
async function tryBtchDownloader(inputUrl, videoId, format, quality) {
    const isAudio = format === 'audio';
    const urlsToTest = [
        `https://youtu.be/${videoId}`,
        inputUrl
    ];

    let lastErr = null;
    for (const targetUrl of urlsToTest) {
        try {
            const res = await btch.youtube(targetUrl);
            if (res && res.status && (res.mp4 || res.mp3)) {
                const title = res.title || 'YouTube Video';
                const thumbnail = res.thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

                if (isAudio) {
                    const audioUrl = res.mp3 || res.mp4;
                    if (!audioUrl) continue;
                    return {
                        title,
                        url: audioUrl,
                        thumbnail,
                        platform: 'YouTube',
                        media_type: 'audio',
                        format: 'mp3',
                        quality: '128k',
                        all_media: [{ url: audioUrl, type: 'audio', quality: 'audio' }]
                    };
                } else {
                    const videoUrl = res.mp4 || res.mp3;
                    if (!videoUrl) continue;
                    return {
                        title,
                        url: videoUrl,
                        thumbnail,
                        platform: 'YouTube',
                        media_type: 'video',
                        format: 'mp4',
                        quality: quality || 'hd',
                        all_media: [{ url: videoUrl, type: 'video', quality: quality || 'hd' }]
                    };
                }
            }
        } catch (err) {
            lastErr = err;
        }
    }

    throw new Error(lastErr?.message || 'btch-downloader n\'a pas pu récupérer la vidéo.');
}

/**
 * Extraction principale pour YouTube.
 */
export async function getYouTubeData(url, format = 'video', quality = 'hd') {
    const videoId = extractYouTubeId(url);
    if (!videoId) throw new Error('Impossible d\'extraire l\'ID YouTube depuis l\'URL fournie.');

    let lastError = null;

    // Tentative 1 : Innertube
    try {
        return await tryInnertube(videoId, format, quality);
    } catch (err) {
        console.warn('[YouTube Innertube WARN]', err.message);
        lastError = err;
    }

    // Tentative 2 : btch-downloader
    try {
        return await tryBtchDownloader(url, videoId, format, quality);
    } catch (err) {
        console.warn('[YouTube btch-downloader WARN]', err.message);
        lastError = err;
    }

    throw new Error(`Impossible d'extraire la vidéo YouTube (Peut-être soumise à restriction d'âge ou bloquée). Dernière erreur : ${lastError?.message}`);
}
