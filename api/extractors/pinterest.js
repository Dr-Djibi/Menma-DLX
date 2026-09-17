import btch from 'btch-downloader';
import { snapsave } from 'snapsave-media-downloader';

export async function getPinterestData(url) {
    const snapTask = async () => {
        const snap = await snapsave(url);
        if (snap?.success && snap.data?.media?.length > 0) {
            const medias = snap.data.media;
            const video  = medias.find(m => m.type === 'video' || m.url?.includes('.mp4'));
            const chosen = video || medias[0];
            return { title: 'Pinterest Média', url: chosen.url, thumbnail: snap.data.thumbnail || null, platform: 'Pinterest', media_type: video ? 'video' : (chosen.type || 'image'), format: video ? 'mp4' : null, quality: null, all_media: medias.map(x => ({ url: x.url, type: x.type || 'image' })) };
        }
        throw new Error('Snapsave Pinterest empty');
    };
    const btchTask = async () => {
        const res = await btch.pinterest(url);
        if (res?.status) {
            const d = res.result?.result || res.result || res;
            const video_url = d.video_url || d.video || (d.url?.includes('.mp4') ? d.url : null);
            const image_url = d.image || d.image_url || d.url;
            const mediaUrl  = video_url || image_url;
            if (mediaUrl) return { title: d.title || 'Pinterest Média', url: mediaUrl, thumbnail: image_url || null, platform: 'Pinterest', media_type: video_url ? 'video' : 'image', format: video_url ? 'mp4' : null, quality: null, all_media: null };
        }
        throw new Error('btch Pinterest empty');
    };
    return await Promise.any([snapTask(), btchTask()]);
}
