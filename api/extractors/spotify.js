import btch from 'btch-downloader';
import { withRetry } from './utils.js';

export async function getSpotifyData(url) {
    return await withRetry(async () => {
        const res = await btch.spotify(url);
        if (res?.status && res.result?.formats?.length > 0) {
            const fmt = res.result.formats[0];
            return { title: res.result.title || 'Spotify Track', url: fmt.url, thumbnail: res.result.thumbnail || null, platform: 'Spotify', media_type: 'audio', format: 'mp3', quality: fmt.quality || '128kbps', all_media: null };
        }
        throw new Error('btch Spotify: réponse invalide');
    }, 3, 500);
}
