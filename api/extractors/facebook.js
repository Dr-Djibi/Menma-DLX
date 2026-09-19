import { snapsave } from 'snapsave-media-downloader';
import { withRetry } from './utils.js';

export async function getFacebookData(url, format = 'video') {
    const isAudio = format === 'audio';

    // ── Tentative 1 : fb-downloader-scrapper
    try {
        const { facebook } = await import('fb-downloader-scrapper');
        const res = await withRetry(() => facebook(url), 3, 300);

        if (res?.success !== false && (res?.hd || res?.sd || res?.audio)) {
            const thumbnail = res.thumbnail || null;
            const title     = res.title || 'Facebook Vidéo';

            if (isAudio) {
                const audioUrl = res.audio || res.sd || res.hd;
                if (audioUrl) {
                    return { title, url: audioUrl, thumbnail, platform: 'Facebook', media_type: 'audio', format: 'mp3', quality: null, all_media: null };
                }
            }

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

    // ── Tentative 2 : snapsave (fallback)
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

    throw new Error("Impossible d'extraire la vidéo Facebook.");
}
