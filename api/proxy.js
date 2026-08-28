import axios from 'axios';

export default async function handler(req, res) {
    const { url } = req.query;
    if (!url) return res.status(400).send('URL missing');

    try {
        const response = await axios({
            method: 'GET',
            url: url,
            responseType: 'stream'
        });

        // Set attachment headers
        res.setHeader('Content-Disposition', 'attachment; filename="menma-dlx-media"');
        res.setHeader('Content-Type', response.headers['content-type'] || 'application/octet-stream');
        
        // Pipe the file to the client
        response.data.pipe(res);
    } catch (err) {
        console.error('Proxy error:', err.message);
        res.status(500).send('Error downloading file');
    }
}
