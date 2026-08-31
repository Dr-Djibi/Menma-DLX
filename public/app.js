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
            incrementCount();
            hideBanner();
            saveHistory(data, urlInput.value.trim());
            // Badge plateforme
            const icons = { YouTube: '▶️', TikTok: '🎵', Instagram: '📸', Facebook: '👤', Twitter: '🐦', Spotify: '🎵', SoundCloud: '🎧', Pinterest: '📌' };
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
            launchConfetti();
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

// ── Historique des téléchargements (Local Storage) ───────────
function saveHistory(data, originalUrl) {
    if (!data.thumbnail) return;
    let history = JSON.parse(localStorage.getItem('menmaHistory') || '[]');
    // Retirer si existe déjà pour le remettre au début
    history = history.filter(h => h.originalUrl !== originalUrl);
    history.unshift({
        title: data.title || 'Média',
        thumbnail: data.thumbnail,
        platform: data.platform,
        originalUrl: originalUrl
    });
    // Conserver max 8 éléments
    history = history.slice(0, 8);
    localStorage.setItem('menmaHistory', JSON.stringify(history));
    renderHistory();
}

function renderHistory() {
    const historyWrap = document.getElementById('historyWrap');
    const historyGallery = document.getElementById('historyGallery');
    if (!historyWrap || !historyGallery) return;

    const history = JSON.parse(localStorage.getItem('menmaHistory') || '[]');
    
    if (history.length === 0) {
        historyWrap.classList.add('hidden');
        return;
    }
    
    historyWrap.classList.remove('hidden');
    historyGallery.innerHTML = '';
    
    history.forEach(item => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.onclick = () => {
            urlInput.value = item.originalUrl;
            urlInput.dispatchEvent(new Event('input'));
            form.dispatchEvent(new Event('submit'));
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };
        
        let platformIcon = '🌐';
        for (const [key, label] of Object.entries(PLATFORM_ICONS)) {
            if (label.includes(item.platform)) {
                platformIcon = label.split(' ')[0];
                break;
            }
        }

        div.innerHTML = `
            <div class="history-platform">${platformIcon}</div>
            <img class="history-thumb" src="${item.thumbnail}" alt="thumb">
            <div class="history-title">${item.title}</div>
        `;
        historyGallery.appendChild(div);
    });
}

document.addEventListener('DOMContentLoaded', renderHistory);

// ── Thème Clair / Sombre ──────────────────────────────────────
const themeToggle = document.getElementById('themeToggle');
const savedTheme = localStorage.getItem('menmaTheme');
if (savedTheme === 'light') {
    document.body.classList.add('light-mode');
    themeToggle.textContent = '🌙';
}
themeToggle?.addEventListener('click', () => {
    const isLight = document.body.classList.toggle('light-mode');
    themeToggle.textContent = isLight ? '🌙' : '☀️';
    localStorage.setItem('menmaTheme', isLight ? 'light' : 'dark');
    if (navigator.vibrate) navigator.vibrate(30);
});

// ── Confettis ─────────────────────────────────────────────────
function launchConfetti() {
    const canvas = document.getElementById('confettiCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#3b82f6', '#a855f7'];
    const particles = Array.from({ length: 90 }, () => ({
        x: Math.random() * canvas.width,
        y: -10,
        r: Math.random() * 7 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        speed: Math.random() * 3 + 2,
        drift: (Math.random() - 0.5) * 2,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 6
    }));

    let frame;
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let alive = false;
        particles.forEach(p => {
            p.y += p.speed;
            p.x += p.drift;
            p.rotation += p.rotSpeed;
            if (p.y < canvas.height + 20) alive = true;
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate((p.rotation * Math.PI) / 180);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 0.5);
            ctx.restore();
        });
        if (alive) frame = requestAnimationFrame(draw);
        else ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    if (frame) cancelAnimationFrame(frame);
    draw();
}

// ── Feature 5: Compteur de téléchargements ───────────────────
function getCount() { return parseInt(localStorage.getItem('menmaCount') || '0'); }
function incrementCount() {
    const c = getCount() + 1;
    localStorage.setItem('menmaCount', c);
    updateCountDisplay(c);
}
function updateCountDisplay(c) {
    const el = document.getElementById('dlCount');
    if (el) el.textContent = c.toLocaleString('fr-FR');
}
document.addEventListener('DOMContentLoaded', () => updateCountDisplay(getCount()));

// ── Feature 2: Bannière presse-papier améliorée ──────────────
let bannerUrl = '';
const clipboardBanner = document.getElementById('clipboardBanner');
const clipboardBannerText = document.getElementById('clipboardBannerText');
const clipboardBannerBtn = document.getElementById('clipboardBannerBtn');
const clipboardBannerClose = document.getElementById('clipboardBannerClose');

async function checkClipboardForUrl() {
    if (urlInput.value.trim()) return; // ne pas afficher si champ déjà rempli
    try {
        const text = await navigator.clipboard.readText();
        const match = text.match(/(https?:\/\/[^\s]+)/);
        if (!match) return;
        const url = match[0];
        // Vérifier que c'est un lien d'une plateforme supportée
        const supported = ['tiktok.com', 'youtube.com', 'youtu.be', 'instagram.com', 'facebook.com', 'fb.watch', 'pinterest.com', 'pin.it', 'twitter.com', 'x.com', 'spotify.com', 'soundcloud.com'];
        if (!supported.some(d => url.includes(d))) return;

        // Detecter le nom de la plateforme
        let platform = '🔗 Lien';
        if (url.includes('tiktok')) platform = '🎵 TikTok';
        else if (url.includes('youtube') || url.includes('youtu.be')) platform = '▶️ YouTube';
        else if (url.includes('instagram')) platform = '📸 Instagram';
        else if (url.includes('facebook') || url.includes('fb.watch')) platform = '👤 Facebook';
        else if (url.includes('pinterest') || url.includes('pin.it')) platform = '📌 Pinterest';
        else if (url.includes('twitter') || url.includes('x.com')) platform = '🐦 X';

        bannerUrl = url;
        clipboardBannerText.textContent = `${platform} détecté`;
        clipboardBanner.classList.remove('hidden');
        setTimeout(() => clipboardBanner.classList.add('visible'), 10);

        // Auto-hide après 8s
        setTimeout(() => hideBanner(), 8000);
    } catch {}
}

function hideBanner() {
    clipboardBanner.classList.remove('visible');
    setTimeout(() => clipboardBanner.classList.add('hidden'), 400);
}

clipboardBannerBtn?.addEventListener('click', () => {
    if (bannerUrl) {
        urlInput.value = bannerUrl;
        urlInput.dispatchEvent(new Event('input'));
        form.dispatchEvent(new Event('submit'));
        hideBanner();
    }
});
clipboardBannerClose?.addEventListener('click', hideBanner);

// Vérifier au focus de la page (revient depuis une autre app)
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkClipboardForUrl();
});
// Vérifier au chargement
document.addEventListener('DOMContentLoaded', () => setTimeout(checkClipboardForUrl, 500));

// ── Feature 1: Bouton Partager l'appli ───────────────────────
document.getElementById('shareAppBtn')?.addEventListener('click', async () => {
    const title = document.getElementById('videoTitle')?.textContent || '';
    const shareData = {
        title: 'MENMA DLX',
        text: `Télécharge tes vidéos TikTok, YouTube, Instagram en 1 clic 🔥`,
        url: 'https://menma-dlx.vercel.app'
    };
    try {
        if (navigator.share) {
            await navigator.share(shareData);
        } else {
            await navigator.clipboard.writeText(shareData.url);
            const btn = document.getElementById('shareAppBtn');
            btn.textContent = '✅';
            setTimeout(() => btn.textContent = '🔗', 2000);
        }
    } catch {}
    if (navigator.vibrate) navigator.vibrate(30);
});
