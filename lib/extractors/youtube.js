import { Innertube } from 'youtubei.js';
import { extractYouTubeId } from './utils.js';

export async function getYouTubeData(url, format = 'video', quality = 'hd') {
    const videoId = extractYouTubeId(url);
    if (!videoId) throw new Error('Impossible d\'extraire l\'ID YouTube depuis l\'URL fournie.');

    const isAudio = format === 'audio';

    try {
        const yt = await Innertube.create({ cache: null, generate_session_locally: true });
        const info = await yt.getBasicInfo(videoId, { client: 'ANDROID' });
        const title = info.basic_info?.title || 'YouTube Video';
        const thumbnail = info.basic_info?.thumbnail?.[0]?.url || null;

        const streamingData = info.streaming_data;
        if (!streamingData) throw new Error('Pas de streaming_data (vidéo peut-être bloquée ou privée).');

        let selectedFormat = null;

        if (isAudio) {
            const audioFormats = streamingData.adaptive_formats?.filter(
                f => f.has_audio && !f.has_video
            ) || [];
            audioFormats.sort((a, b) => (b.audio_quality === 'AUDIO_QUALITY_HIGH' ? 1 : 0)
                                      - (a.audio_quality === 'AUDIO_QUALITY_HIGH' ? 1 : 0));
            selectedFormat = audioFormats[0];
        } else {
            const videoFormats = streamingData.formats?.filter(
                f => f.has_video && f.has_audio
            ) || [];
            if (quality === 'sd') {
                videoFormats.sort((a, b) => (a.quality_label?.includes('360') ? -1 : 1));
            } else {
                videoFormats.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
            }
            selectedFormat = videoFormats[0];

            if (!selectedFormat) {
                const adaptive = streamingData.adaptive_formats?.filter(
                    f => f.has_video
                ) || [];
                adaptive.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
                selectedFormat = adaptive[0];
            }
        }

        if (!selectedFormat?.url) throw new Error('Aucune URL de téléchargement extraite.');

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
    } catch (err) {
        console.error('[YouTube Innertube ERR]', err.message);
        throw new Error("Impossible d'extraire la vidéo YouTube (Peut-être soumise à restriction d'âge).");
    }
}
