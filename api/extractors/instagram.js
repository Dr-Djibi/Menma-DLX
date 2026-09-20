import { snapsave } from 'snapsave-media-downloader';

export async function getInstagramData(url, format = 'video') {
    const isAudio = format === 'audio';
    
    // Tentative 1 : snapsave
    try {
        const snap = await snapsave(url);
        if (snap?.success && snap.data?.media?.length > 0) {
            const medias = snap.data.media;
            const chosen = isAudio 
                ? (medias.find(m => m.type === 'audio') || medias[0])
                : (medias.find(m => m.type === 'video') || medias[0]);
            return {
                title: 'Instagram Média', url: chosen.url,
                thumbnail: snap.data.thumbnail || null, platform: 'Instagram',
                media_type: isAudio ? 'audio' : (chosen.type || 'video'),
                format: isAudio ? 'mp3' : 'mp4', quality: null,
                all_media: medias.map(m => ({ url: m.url, type: m.type || 'image' })),
            };
        }
    } catch (e) {
        console.warn('[Instagram snapsave WARN]', e.message);
    }
    
    // Tentative 2 : instasupersave API
    try {
        const { default: axios } = await import('axios');
        const { data } = await axios.post('https://instasupersave.com/api/ig/post', { url }, {
            headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000
        });
        if (data && data.length > 0) {
            const media = data[0];
            const mediaUrl = media.video_url || media.display_url;
            return {
                title: 'Instagram', url: mediaUrl,
                thumbnail: media.display_url || null, platform: 'Instagram',
                media_type: media.is_video ? 'video' : 'image',
                format: media.is_video ? 'mp4' : 'jpg', quality: null,
                all_media: data.map(m => ({ url: m.video_url || m.display_url, type: m.is_video ? 'video' : 'image' }))
            };
        }
    } catch(e) {}

    throw new Error('Impossible d\'extraire le média Instagram.');
}
