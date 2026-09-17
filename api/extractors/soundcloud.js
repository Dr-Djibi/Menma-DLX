import btch from 'btch-downloader';
import { withRetry } from './utils.js';

export async function getSoundCloudData(url) {
    return await withRetry(async () => {
        const res = await btch.soundcloud(url);
        if (res?.status && res.result?.url) {
            return { title: res.result.title || 'SoundCloud Track', url: res.result.url, thumbnail: res.result.thumbnail || null, platform: 'SoundCloud', media_type: 'audio', format: 'mp3', quality: null, all_media: null };
        }
        throw new Error('btch SoundCloud: réponse invalide');
    }, 3, 500);
}
