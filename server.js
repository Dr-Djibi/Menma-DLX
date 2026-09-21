import express from 'express';
import cors from 'cors';
import { createReadStream } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// On importe le handler Vercel (qui gère déjà tout)
import apiHandler from './api/download.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// ─────────────────────────────────────────────────────────────
// Route API principale ( Déléguée à download.js)
// ─────────────────────────────────────────────────────────────
app.post('/api/download', async (req, res) => {
    // Le handler Vercel s'attend à recevoir req et res
    return await apiHandler(req, res);
});

// ─────────────────────────────────────────────────────────────
// Fichiers statiques
// ─────────────────────────────────────────────────────────────
const staticFiles = {
    '/style.css':     { path: 'public/style.css',     mime: 'text/css' },
    '/app.js':        { path: 'public/app.js',         mime: 'application/javascript' },
    '/sw.js':         { path: 'public/sw.js',          mime: 'application/javascript' },
    '/manifest.json': { path: 'public/manifest.json',  mime: 'application/json' },
};

for (const [route, { path: filePath, mime }] of Object.entries(staticFiles)) {
    app.get(route, (req, res) => {
        res.setHeader('Content-Type', mime);
        createReadStream(join(__dirname, filePath)).pipe(res);
    });
}

app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    createReadStream(join(__dirname, 'public/index.html')).pipe(res);
});

// ─────────────────────────────────────────────────────────────
// Démarrage local uniquement (pas Vercel serverless)
// ─────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`✅ Serveur MENMA DLX sur http://localhost:${PORT}`));
}

export default app;
