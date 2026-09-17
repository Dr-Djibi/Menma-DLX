import btch from 'btch-downloader';
import { snapsave } from 'snapsave-media-downloader';

export async function getTwitterData(url) {
    const snapTask = async () => {
        const snap = await snapsave(url);
        if (snap?.success && snap.data?.media?.length > 0) {
            const m = snap.data.media[0];
            return { title: 'Twitter/X Média', url: m.url, thumbnail: snap.data.thumbnail || null, platform: 'Twitter', media_type: m.type || 'video', format: 'mp4', quality: null, all_media: snap.data.media.map(x => ({ url: x.url, type: x.type || 'video' })) };
        }
        throw new Error('Snapsave Twitter empty');
    };
    const btchTask = async () => {
        const res = await btch.snapsave(url);
        if (res?.result?.length > 0) return { title: 'Twitter/X Média', url: res.result[0].url, thumbnail: null, platform: 'Twitter', media_type: 'video', format: 'mp4', quality: null, all_media: res.result.map(r => ({ url: r.url, type: 'video' })) };
        throw new Error('btch Twitter empty');
    };
    return await Promise.any([snapTask(), btchTask()]);
}
