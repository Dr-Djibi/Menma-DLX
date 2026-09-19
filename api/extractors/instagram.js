import { snapsave } from 'snapsave-media-downloader';

export async function getInstagramData(url) {
    const snap = await snapsave(url);
    if (snap?.success && snap.data?.media?.length > 0) {
        const medias = snap.data.media;
        const chosen = medias.find(m => m.type === 'video') || medias[0];
        return {
            title: 'Instagram Média', url: chosen.url,
            thumbnail: snap.data.thumbnail || null, platform: 'Instagram',
            media_type: chosen.type || 'video', format: 'mp4', quality: null,
            all_media: medias.map(m => ({ url: m.url, type: m.type || 'image' })),
        };
    }
    throw new Error('Impossible d\'extraire le média Instagram.');
}
