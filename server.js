import express from 'express';
import cors from 'cors';
import { createReadStream } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// On importe les handlers Vercel
import apiHandler from './api/download.js';
import proxyHandler from './api/proxy.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

// Configuration CORS globale
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'HEAD', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Range', 'Authorization', 'X-Requested-With', 'X-Tenant-Key', 'X-API-Key'],
    exposedHeaders: ['Content-Disposition', 'Content-Length', 'Content-Range', 'Accept-Ranges', 'Content-Type']
}));
app.use(express.json());

const PORT = process.env.PORT || 3000;

// ─────────────────────────────────────────────────────────────
// Routes API
// ─────────────────────────────────────────────────────────────
app.all(['/api/download', '/download'], async (req, res) => {
    return await apiHandler(req, res);
});

app.all(['/api/proxy', '/proxy'], async (req, res) => {
    return await proxyHandler(req, res);
});

// ─────────────────────────────────────────────────────────────
// Fichiers statiques
// ─────────────────────────────────────────────────────────────
app.use(express.static(join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    createReadStream(join(__dirname, 'public/index.html')).pipe(res);
});

// ─────────────────────────────────────────────────────────────
// Démarrage local uniquement (pas Vercel serverless ni environnement de test)
// ─────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => console.log(`✅ Serveur MENMA DLX sur http://localhost:${PORT}`));
}

export default app;
