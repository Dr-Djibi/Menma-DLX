// API endpoint — la fonction serverless Vercel est à /dlx
const API_URL = '/dlx';

const form = document.getElementById('downloadForm');
const urlInput = document.getElementById('urlInput');
const submitBtn = document.getElementById('submitBtn');
const pasteBtn = document.getElementById('pasteBtn');
const resultCard = document.getElementById('resultCard');
const errorMsg = document.getElementById('errorMsg');
const platformBadge = document.getElementById('platformBadge');
const videoTitle = document.getElementById('videoTitle');
const downloadLink = document.getElementById('downloadLink');

// Bouton coller
pasteBtn.addEventListener('click', async () => {
    try {
        const text = await navigator.clipboard.readText();
        urlInput.value = text;
        urlInput.focus();
    } catch {
        urlInput.focus();
    }
});

// Formulaire
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Reset UI
    resultCard.classList.add('hidden');
    errorMsg.classList.add('hidden');
    submitBtn.querySelector('.btn-text').classList.add('hidden');
    submitBtn.querySelector('.loader').classList.remove('hidden');
    submitBtn.disabled = true;

    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: urlInput.value.trim() })
        });

        const data = await res.json();

        if (data.success) {
            platformBadge.textContent = data.platform;
            videoTitle.textContent = data.title || 'Vidéo prête !';
            downloadLink.href = data.download_url;
            resultCard.classList.remove('hidden');
            urlInput.value = '';
        } else {
            showError(data.error || 'Erreur lors du téléchargement');
        }
    } catch (err) {
        showError('Impossible de contacter le serveur. Réessaie.');
    } finally {
        submitBtn.querySelector('.btn-text').classList.remove('hidden');
        submitBtn.querySelector('.loader').classList.add('hidden');
        submitBtn.disabled = false;
    }
});

function showError(msg) {
    errorMsg.textContent = '⚠️ ' + msg;
    errorMsg.classList.remove('hidden');
}

// ── PWA Install ──────────────────────────────────────────────
let deferredPrompt = null;
const installBanner = document.getElementById('installBanner');
const installBtn    = document.getElementById('installBtn');
const dismissBtn    = document.getElementById('dismissBtn');

// Si déjà installé en mode standalone → on cache définitivement
if (window.matchMedia('(display-mode: standalone)').matches) {
    localStorage.setItem('pwa-installed', '1');
}

if (!localStorage.getItem('pwa-dismissed') && !localStorage.getItem('pwa-installed')) {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        installBanner.classList.remove('hidden');
    });
}

installBtn?.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
        localStorage.setItem('pwa-installed', '1');
    }
    deferredPrompt = null;
    installBanner.classList.add('hidden');
});

dismissBtn?.addEventListener('click', () => {
    installBanner.classList.add('hidden');
    localStorage.setItem('pwa-dismissed', '1');
});

// ── PWA Share Target ─────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const sharedText = params.get('text') || params.get('url') || params.get('title');
    
    if (sharedText) {
        // Extraire l'URL si le texte partagé contient du texte supplémentaire
        const urlMatch = sharedText.match(/https?:\/\/[^\s]+/);
        if (urlMatch) {
            urlInput.value = urlMatch[0];
            // Nettoyer l'URL de la barre d'adresse sans recharger
            window.history.replaceState({}, document.title, '/');
            // Lancer le téléchargement automatiquement
            setTimeout(() => { submitBtn.click(); }, 300);
        }
    }
});
