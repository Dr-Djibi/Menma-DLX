import { snapsave } from 'snapsave-media-downloader';

export async function getTwitterData(url) {
    const snap = await snapsave(url);
    if (snap?.success && snap.data?.media?.length > 0) {
        const m = snap.data.media[0];
        return { title: 'Twitter/X Média', url: m.url, thumbnail: snap.data.thumbnail || null, platform: 'Twitter', media_type: m.type || 'video', format: 'mp4', quality: null, all_media: snap.data.media.map(x => ({ url: x.url, type: x.type || 'video' })) };
    }
    throw new Error('Impossible d\'extraire le média Twitter.');
}
