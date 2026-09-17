import axios from 'axios';
import btch from 'btch-downloader';
import { snapsave } from 'snapsave-media-downloader';
import { resolveTikTokShortUrl } from './utils.js';

export async function getTikTokData(url, format = 'video') {
    url = await resolveTikTokShortUrl(url);
    const isAudio = format === 'audio';

    // ── Tentative 1 : tikwm.com
    try {
        const { data } = await axios.get(
            `https://tikwm.com/api/?url=${encodeURIComponent(url)}`,
            {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Origin':    'https://tikwm.com',
                    'Referer':   'https://tikwm.com/',
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
                return {
                    title, url: d.images[0], thumbnail, platform: 'TikTok',
                    media_type: 'image', format: null, quality: null,
                    all_media: d.images.map(u => ({ url: u, type: 'image' })),
                };
            }

            const videoUrl = d.play || d.wmplay || null;
            if (videoUrl) {
                return { title, url: videoUrl, thumbnail, platform: 'TikTok', media_type: 'video', format: 'mp4', quality: 'hd', all_media: null };
            }
        }
    } catch (e) {
        console.warn('[TikTok tikwm WARN]', e.message);
    }

    // ── Tentative 2 : snapsave + btch en parallèle
    const snapTask = async () => {
        const snap = await snapsave(url);
        if (snap?.success && snap.data?.media?.length > 0) {
            const m = snap.data.media[0];
            return { title: 'TikTok', url: m.url, thumbnail: snap.data.thumbnail || null, platform: 'TikTok', media_type: m.type || 'video', format: 'mp4', quality: null, all_media: snap.data.media.map(x => ({ url: x.url, type: x.type || 'video' })) };
        }
        throw new Error('Snapsave empty');
    };

    const btchTask = async () => {
        const res = await btch.snapsave(url);
        if (res?.result?.length > 0) {
            return { title: 'TikTok', url: res.result[0].url, thumbnail: null, platform: 'TikTok', media_type: 'video', format: 'mp4', quality: null, all_media: res.result.map(r => ({ url: r.url, type: 'video' })) };
        }
        throw new Error('btch empty');
    };

    return await Promise.any([snapTask(), btchTask()]);
}
