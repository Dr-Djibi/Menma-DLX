import axios from 'axios';

export default async function handler(req, res) {
    // CORS headers complets pour clients Web & Mobile
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition, Content-Length, Content-Range, Accept-Ranges, Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { url, filename } = req.query;
    if (!url) {
        return res.status(400).send('URL missing');
    }

    try {
        let referer = '';
        const lowerUrl = url.toLowerCase();
        if (lowerUrl.includes('tiktok.com') || lowerUrl.includes('musical.ly') || lowerUrl.includes('tiktokcdn') || lowerUrl.includes('tikwm')) {
            referer = 'https://www.tiktok.com/';
        } else if (lowerUrl.includes('instagram.com') || lowerUrl.includes('cdninstagram')) {
            referer = 'https://www.instagram.com/';
        } else if (lowerUrl.includes('facebook.com') || lowerUrl.includes('fbcdn.net')) {
            referer = 'https://www.facebook.com/';
        } else if (lowerUrl.includes('twitter.com') || lowerUrl.includes('twimg.com') || lowerUrl.includes('x.com')) {
            referer = 'https://twitter.com/';
        } else if (lowerUrl.includes('youtube.com') || lowerUrl.includes('googlevideo.com')) {
            referer = 'https://www.youtube.com/';
        }

        // Préparation des en-têtes en amont (forwarding du Range pour les players mobiles et reprise)
        const requestHeaders = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept': '*/*',
            'Accept-Encoding': 'identity',
            ...(referer ? { 'Referer': referer } : {})
        };

        if (req.headers.range) {
            requestHeaders['Range'] = req.headers.range;
        }

        const response = await axios({
            method: req.method === 'HEAD' ? 'HEAD' : 'GET',
            url: url,
            responseType: 'stream',
            headers: requestHeaders,
            timeout: 30000,
            maxRedirects: 5,
            validateStatus: (status) => (status >= 200 && status < 300) || status === 206
        });

        const contentType = response.headers['content-type'] || 'application/octet-stream';
        const contentLength = response.headers['content-length'];
        const contentRange = response.headers['content-range'];
        const acceptRanges = response.headers['accept-ranges'] || 'bytes';

        // Format clean filename
        let safeName = (filename || 'media').trim().replace(/[/\\?%*:|"<>]/g, '-').replace(/\s+/g, '_');
        if (!safeName.includes('.')) {
            if (contentType.includes('audio') || contentType.includes('mpeg')) safeName += '.mp3';
            else if (contentType.includes('image/jpeg')) safeName += '.jpg';
            else if (contentType.includes('image/png')) safeName += '.png';
            else if (contentType.includes('image/webp')) safeName += '.webp';
            else safeName += '.mp4';
        }

        res.status(response.status);
        res.setHeader('Content-Type', contentType);
        res.setHeader('Accept-Ranges', acceptRanges);

        if (contentLength) {
            res.setHeader('Content-Length', contentLength);
        }
        if (contentRange) {
            res.setHeader('Content-Range', contentRange);
        }

        res.setHeader('Content-Disposition', `attachment; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(safeName)}`);
        res.setHeader('Cache-Control', 'public, max-age=3600');

        if (req.method === 'HEAD') {
            return res.end();
        }

        response.data.pipe(res);
    } catch (err) {
        console.error('Proxy error:', err.message);
        if (!res.headersSent) {
            res.status(500).send('Erreur lors du téléchargement : ' + (err.message || 'Échec'));
        }
    }
}
