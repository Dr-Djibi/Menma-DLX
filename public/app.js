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
const thumbImg = document.getElementById('thumbImg');
const allMediaList = document.getElementById('allMediaList');

// ── Détection live de plateforme dans le champ ──────────────────────
const PLATFORM_ICONS = {
    youtube: '▶️ YouTube',
    youtu: '▶️ YouTube',
    tiktok: '🎵 TikTok',
    instagram: '📸 Instagram',
    facebook: '👤 Facebook',
    'fb.watch': '👤 Facebook',
    'twitter': '🐦 X (Twitter)',
    'x.com': '🐦 X (Twitter)',
    'pinterest.com': '📌 Pinterest',
    'pin.it': '📌 Pinterest',
};

const platformHint = document.getElementById('platformHint');

urlInput.addEventListener('input', () => {
    const val = urlInput.value.toLowerCase();
    let detected = null;
    for (const [key, label] of Object.entries(PLATFORM_ICONS)) {
        if (val.includes(key)) { detected = label; break; }
    }
    if (platformHint) {
        platformHint.textContent = detected ? `✓ ${detected} détecté` : '';
        platformHint.className = detected ? 'platform-hint visible' : 'platform-hint';
    }
    // Reset results when input changes
    resultCard.classList.add('hidden');
    errorMsg.classList.add('hidden');

    // Show quality options only for YouTube
    const qualityWrap = document.getElementById('qualityWrap');
    if (detected === '▶️ YouTube') {
        qualityWrap.style.display = 'flex';
    } else {
        qualityWrap.style.display = 'none';
    }
});

// ── Bouton coller ────────────────────────────────────────────────────
pasteBtn.addEventListener('click', async () => {
    try {
        const text = await navigator.clipboard.readText();
        urlInput.value = text;
        urlInput.dispatchEvent(new Event('input'));
        urlInput.focus();
    } catch { urlInput.focus(); }
});

// ── Qualité — gestion des boutons ────────────────────────────────────
const formatToggle = document.getElementById('formatToggle');
const qualityVideo = document.getElementById('qualityVideo');
const qualityAudio = document.getElementById('qualityAudio');
let selectedQuality = 'sd';

// Chaque groupe de qualité
document.querySelectorAll('.quality-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const group = btn.closest('.quality-group');
        group.querySelectorAll('.quality-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedQuality = btn.dataset.q;
    });
});

// Switcher Vidéo ↔ Audio — change les boutons de qualité
formatToggle.addEventListener('change', () => {
    const isAudio = formatToggle.checked;
    qualityVideo.classList.toggle('hidden', isAudio);
    qualityAudio.classList.toggle('hidden', !isAudio);
    // Reset sélection active
    selectedQuality = isAudio ? '128k' : 'sd';
    document.querySelectorAll('.quality-btn').forEach(b => {
        b.classList.remove('active');
        if (b.dataset.q === selectedQuality) b.classList.add('active');
    });
});

// ── Barre de progression simulée ─────────────────────────────────────
let progressInterval = null;

function startProgress() {
    const wrap = document.getElementById('progressWrap');
    const bar = document.getElementById('progressBar');
    const label = document.getElementById('progressLabel');

    wrap.classList.remove('hidden');
    bar.style.width = '0%';

    const steps = [
        { pct: 15, msg: 'Connexion au serveur…', delay: 300 },
        { pct: 35, msg: 'Extraction du lien…',   delay: 1200 },
        { pct: 60, msg: 'Analyse du média…',      delay: 2500 },
        { pct: 80, msg: 'Préparation…',           delay: 4000 },
        { pct: 92, msg: 'Presque prêt…',          delay: 6000 },
    ];

    steps.forEach(({ pct, msg, delay }) => {
        setTimeout(() => {
            bar.style.width = pct + '%';
            label.textContent = msg;
        }, delay);
    });
}

function finishProgress(success = true) {
    const bar = document.getElementById('progressBar');
    const label = document.getElementById('progressLabel');
    const wrap = document.getElementById('progressWrap');

    bar.style.width = '100%';
    label.textContent = success ? '✅ Prêt !' : '❌ Erreur';
    setTimeout(() => {
        wrap.classList.add('hidden');
        bar.style.width = '0%';
    }, 1200);
}

// ── Soumission du formulaire ─────────────────────────────────────
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    resultCard.classList.add('hidden');
    errorMsg.classList.add('hidden');
    allMediaList.innerHTML = '';
    thumbImg.classList.add('hidden');

    submitBtn.querySelector('.btn-text').textContent = '⬇️ Télécharger';
    submitBtn.querySelector('.loader').classList.remove('hidden');
    submitBtn.querySelector('.btn-text').classList.add('hidden');
    submitBtn.disabled = true;

    startProgress();

    try {
        const isAudio = formatToggle?.checked;
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url: urlInput.value.trim(),
                format: isAudio ? 'audio' : 'video',
                quality: selectedQuality
            })
        });

        const data = await res.json();

        if (data.success) {
            finishProgress(true);
            // Badge plateforme
            const icons = { YouTube: '▶️', TikTok: '🎵', Instagram: '📸', Facebook: '👤', Twitter: '🐦', Spotify: '🎵', SoundCloud: '🎧' };
            platformBadge.textContent = (icons[data.platform] || '🌐') + ' ' + data.platform;

            // Titre
            videoTitle.textContent = data.title || 'Prêt !';

            // Thumbnail si disponible
            if (data.thumbnail || data.download_url) {
                thumbImg.src = data.thumbnail || data.download_url;
                thumbImg.classList.remove('hidden');
            }

            // Lien de téléchargement
            downloadLink.href = data.download_url;
            downloadLink.removeAttribute('target');
            if (data.media_type === 'audio') {
                downloadLink.textContent = '🎵 Télécharger l\'audio';
            } else if (data.media_type === 'image') {
                downloadLink.textContent = '🖼️ Télécharger l\'image';
            } else {
                downloadLink.textContent = '💾 Télécharger la vidéo';
            }

            // Carrousel Instagram (all_media)
            if (data.all_media && data.all_media.length > 1) {
                data.all_media.forEach((m, i) => {
                    const a = document.createElement('a');
                    a.href = m.url;
                    a.target = '_blank';
                    a.download = '';
                    a.className = 'media-item-btn';
                    a.textContent = m.type === 'image' ? `🖼️ Image ${i + 1}` : `🎬 Vidéo ${i + 1}`;
                    a.addEventListener('click', function() {
                        const originalText = this.textContent;
                        this.textContent = '⏳ Ouverture...';
                        setTimeout(() => this.textContent = originalText, 3000);
                    });
                    allMediaList.appendChild(a);
                });
            }

            resultCard.classList.remove('hidden');
            if (navigator.vibrate) navigator.vibrate(50);
            urlInput.value = '';
            if (platformHint) platformHint.textContent = '';
        } else {
            finishProgress(false);
            showError(data.error || 'Erreur lors du téléchargement');
        }
    } catch {
        finishProgress(false);
        showError('Impossible de contacter le serveur. Vérifie ta connexion.');
    } finally {
        submitBtn.querySelector('.btn-text').textContent = '⬇️ Obtenir le média';
        submitBtn.querySelector('.btn-text').classList.remove('hidden');
        submitBtn.querySelector('.loader').classList.add('hidden');
        submitBtn.disabled = false;
    }
});

function showError(msg) {
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]); // Haptic Error
    errorMsg.textContent = '⚠️ ' + msg;
    errorMsg.classList.remove('hidden');
}

downloadLink.addEventListener('click', async function(e) {
    e.preventDefault();
    const originalText = this.textContent;
    this.textContent = '⏳ Préparation du fichier...';
    const url = this.href;
    
    try {
        // 1. Tente un fetch invisible
        const res = await fetch(url);
        if (!res.ok) throw new Error('CORS block');
        const blob = await res.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = blobUrl;
        
        let ext = '.mp4';
        if (this.textContent.includes('Audio')) ext = '.mp3';
        if (this.textContent.includes('Image')) ext = '.jpg';
        
        a.download = (videoTitle.textContent || 'media') + ext;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
        // 2. Fallback via le Proxy Vercel (force le téléchargement sans quitter la page)
        window.location.href = '/api/proxy?url=' + encodeURIComponent(url);
    }
    
    this.textContent = originalText;
});

// ── Fonctionnalité 1 : Share Target (Venant d'une autre application) ──
window.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const sharedUrl = params.get('url') || params.get('text');
    
    if (sharedUrl && /https?:\/\//.test(sharedUrl)) {
        // Extraire l'URL si elle est noyée dans du texte
        const urlMatch = sharedUrl.match(/(https?:\/\/[^\s]+)/);
        if (urlMatch) {
            urlInput.value = urlMatch[0];
            urlInput.dispatchEvent(new Event('input'));
            // Lancer le téléchargement automatiquement !
            setTimeout(() => form.dispatchEvent(new Event('submit')), 500);
        }
    }
});

// ── Fonctionnalité 3 : Collage Automatique (Auto-Paste) au retour sur l'app ──
document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible' && !urlInput.value) {
        try {
            const text = await navigator.clipboard.readText();
            if (/https?:\/\/[^\s]+/.test(text)) {
                urlInput.value = text;
                urlInput.dispatchEvent(new Event('input'));
            }
        } catch (e) {
            // Ignorer silencieusement si le navigateur bloque l'accès automatique
        }
    }
});
