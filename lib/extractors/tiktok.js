import { snapsave } from 'snapsave-media-downloader';

export async function getTikTokData(url, format = 'video') {
    const isAudio = format === 'audio';

    // ── Tentative 1 : snapsave (le plus stable)
    try {
        const snap = await snapsave(url);
        if (snap?.success && snap.data?.media?.length > 0) {
            const medias = snap.data.media;
            const audioMedia = medias.find(m => m.type === 'audio');
            const videoMedia = medias.find(m => m.type === 'video') || medias[0];
            const chosen = isAudio ? (audioMedia || videoMedia) : videoMedia;
            return {
                title:      snap.data.title || 'TikTok',
                url:        chosen.url,
                thumbnail:  snap.data.thumbnail || null,
                platform:   'TikTok',
                media_type: isAudio ? 'audio' : (chosen.type || 'video'),
                format:     isAudio ? 'mp3' : 'mp4',
                quality:    null,
                all_media:  medias.map(m => ({ url: m.url, type: m.type || 'video' })),
            };
        }
    } catch (e) {
        console.warn('[TikTok snapsave WARN]', e.message);
    }

    // ── Tentative 2 : tikwm.com (GET)
    try {
        const { default: axios } = await import('axios');
        const { data } = await axios.get(
            `https://tikwm.com/api/?url=${encodeURIComponent(url)}`,
            {
                headers: {
                    'User-Agent':   'TikTok 26.2.0 rv:262018 (iPhone; iOS 14.4.2; en_US) Cronet',
                    'Accept':       'application/json',
                    'Accept-Language': 'en-US,en;q=0.5',
                },
                timeout: 15000,
            }
        );
        if (data?.code === 0 && data?.data) {
            const d = data.data;
            const thumbnail = d.cover || d.origin_cover || null;
            const title     = d.title || 'TikTok';

            if (isAudio && d.music) {
                return { title, url: d.music, thumbnail, platform: 'TikTok', media_type: 'audio', format: 'mp3', quality: null, all_media: null };
            }
            if (d.images?.length > 0) {
                return { title, url: d.images[0], thumbnail, platform: 'TikTok', media_type: 'image', format: null, quality: null, all_media: d.images.map(u => ({ url: u, type: 'image' })) };
            }
            const videoUrl = d.play || d.wmplay || null;
            if (videoUrl) {
                return { title, url: videoUrl, thumbnail, platform: 'TikTok', media_type: 'video', format: 'mp4', quality: 'hd', all_media: null };
            }
        }
    } catch (e) {
        console.warn('[TikTok tikwm WARN]', e.message);
    }

    throw new Error("Impossible d'extraire la vidéo TikTok.");
}
