// ═══════════════════════════════════════════════════════════════════════════════
// OmniDL — Application Client
// ═══════════════════════════════════════════════════════════════════════════════

const API_URL = '/api/download';

// Éléments du DOM
const form = document.getElementById('downloadForm');
const urlInput = document.getElementById('urlInput');
const clearBtn = document.getElementById('clearBtn');
const submitBtn = document.getElementById('submitBtn');
const pasteBtn = document.getElementById('pasteBtn');
const platformHint = document.getElementById('platformHint');

// Contrôles de format et qualité
const btnFormatVideo = document.getElementById('btnFormatVideo');
const btnFormatAudio = document.getElementById('btnFormatAudio');
const formatToggle = document.getElementById('formatToggle');
const qualityWrap = document.getElementById('qualityWrap');
const qualityVideo = document.getElementById('qualityVideo');
const qualityAudio = document.getElementById('qualityAudio');

// Carte de résultats
const resultCard = document.getElementById('resultCard');
const platformBadge = document.getElementById('platformBadge');
const mediaTypeTag = document.getElementById('mediaTypeTag');
const videoTitle = document.getElementById('videoTitle');
const thumbWrap = document.getElementById('thumbWrap');
const downloadLink = document.getElementById('downloadLink');
const downloadBtnText = document.getElementById('downloadBtnText');
const previewLink = document.getElementById('previewLink');
const copyLinkBtn = document.getElementById('copyLinkBtn');
const allMediaContainer = document.getElementById('allMediaContainer');
const allMediaList = document.getElementById('allMediaList');
const errorMsg = document.getElementById('errorMsg');

let currentDownloadUrl = '';
let selectedQuality = 'hd';
let selectedFormat = 'video';

// ── Détection live de la plateforme ──────────────────────────────────
const PLATFORM_ICONS = {
    'youtube.com': { name: 'YouTube', icon: '▶️' },
    'youtu.be': { name: 'YouTube', icon: '▶️' },
    'tiktok.com': { name: 'TikTok', icon: '🎵' },
    'instagram.com': { name: 'Instagram', icon: '📸' },
    'facebook.com': { name: 'Facebook', icon: '👤' },
    'fb.watch': { name: 'Facebook', icon: '👤' },
    'twitter.com': { name: 'X / Twitter', icon: '🐦' },
    'x.com': { name: 'X / Twitter', icon: '🐦' },
    'pinterest.com': { name: 'Pinterest', icon: '📌' },
    'pin.it': { name: 'Pinterest', icon: '📌' },
    'spotify.com': { name: 'Spotify', icon: '🎧' },
    'soundcloud.com': { name: 'SoundCloud', icon: '📻' },
};

function detectPlatformFromUrl(val) {
    const lower = val.toLowerCase();
    for (const [domain, data] of Object.entries(PLATFORM_ICONS)) {
        if (lower.includes(domain)) return data;
    }
    return null;
}

urlInput?.addEventListener('input', () => {
    const val = urlInput.value.trim();
    if (clearBtn) {
        clearBtn.classList.toggle('hidden', val.length === 0);
    }

    const detected = detectPlatformFromUrl(val);
    if (platformHint) {
        if (detected) {
            platformHint.textContent = `✓ ${detected.icon} ${detected.name} détecté`;
            platformHint.classList.add('visible');
        } else {
            platformHint.textContent = '';
            platformHint.classList.remove('visible');
        }
    }

    // Afficher les options de qualité pour YouTube
    if (qualityWrap) {
        if (detected && detected.name === 'YouTube') {
            qualityWrap.classList.add('visible');
        } else {
            qualityWrap.classList.remove('visible');
        }
    }

    // Réinitialiser les cartes
    resultCard?.classList.add('hidden');
    errorMsg?.classList.add('hidden');
});

// ── Bouton effacer le champ ──────────────────────────────────────────
clearBtn?.addEventListener('click', () => {
    urlInput.value = '';
    urlInput.dispatchEvent(new Event('input'));
    urlInput.focus();
});

// ── Bouton coller depuis le presse-papier ────────────────────────────
pasteBtn?.addEventListener('click', async () => {
    try {
        const text = await navigator.clipboard.readText();
        if (text) {
            urlInput.value = text.trim();
            urlInput.dispatchEvent(new Event('input'));
            urlInput.focus();

            pasteBtn.textContent = '✅';
            pasteBtn.setAttribute('title', 'Collé !');
            pasteBtn.setAttribute('aria-label', 'Lien collé depuis le presse-papier');
            setTimeout(() => {
                pasteBtn.textContent = '📋';
                pasteBtn.setAttribute('title', 'Coller depuis le presse-papier');
                pasteBtn.setAttribute('aria-label', 'Coller le lien depuis le presse-papier');
            }, 1500);
        }
    } catch {
        urlInput.focus();
    }
});

// ── Sélecteur de format segmenté (Vidéo / Audio) ─────────────────────
function setFormat(format) {
    selectedFormat = format;
    const isAudio = format === 'audio';

    if (btnFormatVideo) {
        btnFormatVideo.classList.toggle('active', !isAudio);
        btnFormatVideo.setAttribute('aria-checked', !isAudio ? 'true' : 'false');
    }
    if (btnFormatAudio) {
        btnFormatAudio.classList.toggle('active', isAudio);
        btnFormatAudio.setAttribute('aria-checked', isAudio ? 'true' : 'false');
    }
    if (formatToggle) {
        formatToggle.checked = isAudio;
    }

    if (qualityVideo) qualityVideo.classList.toggle('hidden', isAudio);
    if (qualityAudio) qualityAudio.classList.toggle('hidden', !isAudio);

    selectedQuality = isAudio ? '320k' : 'hd';
    document.querySelectorAll('.quality-btn').forEach(b => {
        b.classList.remove('active');
        if (b.dataset.q === selectedQuality) b.classList.add('active');
    });
}

btnFormatVideo?.addEventListener('click', () => setFormat('video'));
btnFormatAudio?.addEventListener('click', () => setFormat('audio'));

// Gestion des boutons de qualité
document.querySelectorAll('.quality-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const group = btn.closest('.quality-group');
        group?.querySelectorAll('.quality-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedQuality = btn.dataset.q || 'hd';
    });
});

// ── Barre de progression ─────────────────────────────────────────────
let progressTimer = null;

function startProgress() {
    const wrap = document.getElementById('progressWrap');
    const bar = document.getElementById('progressBar');
    const label = document.getElementById('progressLabel');

    if (!wrap || !bar || !label) return;

    wrap.classList.remove('hidden');
    bar.style.width = '10%';
    label.textContent = 'Connexion au serveur…';

    const steps = [
        { pct: 30, msg: 'Extraction du flux…', delay: 400 },
        { pct: 60, msg: 'Analyse du média…', delay: 1500 },
        { pct: 85, msg: 'Préparation du fichier…', delay: 3000 },
    ];

    steps.forEach(({ pct, msg, delay }) => {
        setTimeout(() => {
            if (!wrap.classList.contains('hidden')) {
                bar.style.width = pct + '%';
                label.textContent = msg;
            }
        }, delay);
    });
}

function finishProgress(success = true) {
    const wrap = document.getElementById('progressWrap');
    const bar = document.getElementById('progressBar');
    const label = document.getElementById('progressLabel');

    if (!wrap || !bar || !label) return;

    bar.style.width = '100%';
    label.textContent = success ? '✅ Média prêt !' : '❌ Échec';
    setTimeout(() => {
        wrap.classList.add('hidden');
        bar.style.width = '0%';
    }, 1200);
}

// ── Soumission du formulaire ─────────────────────────────────────────
form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const rawUrl = urlInput.value.trim();
    if (!rawUrl) return;

    resultCard?.classList.add('hidden');
    errorMsg?.classList.add('hidden');
    if (thumbWrap) {
        thumbWrap.innerHTML = '';
        thumbWrap.classList.add('hidden');
    }
    if (allMediaList) allMediaList.innerHTML = '';
    allMediaContainer?.classList.add('hidden');

    const btnText = submitBtn.querySelector('.btn-text');
    const loader = submitBtn.querySelector('.loader');

    btnText?.classList.add('hidden');
    loader?.classList.remove('hidden');
    submitBtn.disabled = true;

    startProgress();

    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url: rawUrl,
                format: selectedFormat,
                quality: selectedQuality
            })
        });

        let data;
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            data = await res.json();
        } else {
            const rawText = await res.text();
            data = { success: false, error: rawText || `Erreur serveur (${res.status})` };
        }

        if (!res.ok) {
            finishProgress(false);
            showError(data.error || `Erreur requête (${res.status})`);
            return;
        }

        if (data.success && data.download_url) {
            finishProgress(true);
            incrementCount();
            hideBanner();
            saveHistory(data, rawUrl);

            // Badge plateforme
            const platformInfo = detectPlatformFromUrl(rawUrl) || { name: data.platform || 'Média', icon: '🌐' };
            if (platformBadge) {
                platformBadge.textContent = `${platformInfo.icon} ${data.platform || platformInfo.name}`;
            }

            // Tag de format
            if (mediaTypeTag) {
                mediaTypeTag.textContent = data.format ? data.format.toUpperCase() : (data.media_type === 'audio' ? 'MP3' : 'MP4');
            }

            // Titre du média
            const cleanTitle = (data.title || 'Média').trim();
            if (videoTitle) {
                videoTitle.textContent = cleanTitle;
            }

            // Thumbnail dynamique (créé proprement sans balise vide statique)
            if (data.thumbnail && data.thumbnail !== data.download_url && thumbWrap) {
                thumbWrap.innerHTML = '';
                const img = document.createElement('img');
                img.className = 'thumb';
                img.alt = `Aperçu de ${cleanTitle}`;
                img.loading = 'lazy';
                img.onload = () => {
                    thumbWrap.classList.remove('hidden');
                };
                img.src = data.thumbnail;
                thumbWrap.appendChild(img);
            }

            // Préparation des URLs de téléchargement et d'aperçu
            currentDownloadUrl = data.download_url;
            const ext = data.media_type === 'audio' ? '.mp3' : (data.media_type === 'image' ? '.jpg' : '.mp4');
            const safeFilename = cleanTitle.replace(/[/\\?%*:|"<>]/g, '-').slice(0, 100) + ext;
            const proxyDownloadUrl = `/api/proxy?url=${encodeURIComponent(data.download_url)}&filename=${encodeURIComponent(safeFilename)}`;

            // Bouton Télécharger (utilise le proxy avec en-têtes d'attachement direct)
            if (downloadLink) {
                downloadLink.href = proxyDownloadUrl;
                downloadLink.download = safeFilename;
                if (downloadBtnText) {
                    downloadBtnText.textContent = data.media_type === 'audio' ? 'Télécharger l\'audio (MP3)' : 'Télécharger le fichier (MP4)';
                }
            }

            // Lien direct d'aperçu
            if (previewLink) {
                previewLink.href = data.download_url;
            }

            // Multi-médias / Carrousel
            if (data.all_media && data.all_media.length > 1 && allMediaList && allMediaContainer) {
                allMediaList.innerHTML = '';
                data.all_media.forEach((m, i) => {
                    const itemExt = m.type === 'image' ? '.jpg' : '.mp4';
                    const itemFilename = `${safeFilename.replace(/\.[^/.]+$/, '')}_${i + 1}${itemExt}`;
                    const itemProxyUrl = `/api/proxy?url=${encodeURIComponent(m.url)}&filename=${encodeURIComponent(itemFilename)}`;

                    const itemBtn = document.createElement('a');
                    itemBtn.href = itemProxyUrl;
                    itemBtn.download = itemFilename;
                    itemBtn.className = 'media-item-btn';
                    itemBtn.textContent = m.type === 'image' ? `🖼️ Image ${i + 1}` : `🎬 Vidéo ${i + 1}`;
                    allMediaList.appendChild(itemBtn);
                });
                allMediaContainer.classList.remove('hidden');
            }

            resultCard?.classList.remove('hidden');
            if (navigator.vibrate) navigator.vibrate(40);
            launchConfetti();
        } else {
            finishProgress(false);
            showError(data.error || 'Erreur lors de l\'extraction du média.');
        }
    } catch (err) {
        finishProgress(false);
        showError('Impossible de contacter le serveur. Vérifie ta connexion ou réessaie.');
    } finally {
        btnText?.classList.remove('hidden');
        loader?.classList.add('hidden');
        submitBtn.disabled = false;
    }
});

// Feedback au clic de téléchargement avec fallback blob si navigation bloquée
downloadLink?.addEventListener('click', async (e) => {
    if (downloadBtnText) {
        const original = downloadBtnText.textContent;
        downloadBtnText.textContent = '⚡ Téléchargement en cours…';
        if (navigator.vibrate) navigator.vibrate(30);

        setTimeout(() => {
            downloadBtnText.textContent = original;
        }, 3000);
    }
});

// Bouton copier le lien direct
copyLinkBtn?.addEventListener('click', async () => {
    if (!currentDownloadUrl) return;
    try {
        await navigator.clipboard.writeText(currentDownloadUrl);
        copyLinkBtn.textContent = '✅ Lien copié !';
        setTimeout(() => {
            copyLinkBtn.textContent = '📋 Copier le lien';
        }, 2000);
    } catch {
        showError('Impossible d\'accéder au presse-papier.');
    }
});

// Affichage des erreurs
function showError(msg) {
    if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
    if (errorMsg) {
        errorMsg.textContent = '⚠️ ' + msg;
        errorMsg.classList.remove('hidden');
    }
}

// ── Historique des téléchargements (LocalStorage) ────────────────────
function saveHistory(data, originalUrl) {
    if (!data.thumbnail) return;
    let history = JSON.parse(localStorage.getItem('menmaHistory') || '[]');
    history = history.filter(h => h.originalUrl !== originalUrl);
    history.unshift({
        title: data.title || 'Média',
        thumbnail: data.thumbnail,
        platform: data.platform || 'Média',
        originalUrl: originalUrl
    });
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
        const card = document.createElement('div');
        card.className = 'history-item';
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', `Recharger ${item.title} (${item.platform})`);

        const handleSelect = () => {
            urlInput.value = item.originalUrl;
            urlInput.dispatchEvent(new Event('input'));
            form?.dispatchEvent(new Event('submit'));
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };

        card.onclick = handleSelect;
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleSelect();
            }
        });

        const platformInfo = detectPlatformFromUrl(item.originalUrl) || { icon: '🌐' };

        card.innerHTML = `
            <div class="history-platform">${platformInfo.icon}</div>
            <img class="history-thumb" src="${item.thumbnail}" alt="Aperçu de ${item.title}">
            <div class="history-title">${item.title}</div>
        `;

        historyGallery.appendChild(card);
    });
}

document.getElementById('clearHistoryBtn')?.addEventListener('click', () => {
    localStorage.removeItem('menmaHistory');
    renderHistory();
});

// ── Thème Clair / Sombre ─────────────────────────────────────────────
const themeToggle = document.getElementById('themeToggle');
const savedTheme = localStorage.getItem('menmaTheme');
if (savedTheme === 'light') {
    document.body.classList.add('light-mode');
    if (themeToggle) themeToggle.textContent = '🌙';
}

themeToggle?.addEventListener('click', () => {
    const isLight = document.body.classList.toggle('light-mode');
    if (themeToggle) themeToggle.textContent = isLight ? '🌙' : '☀️';
    localStorage.setItem('menmaTheme', isLight ? 'light' : 'dark');
    if (navigator.vibrate) navigator.vibrate(25);
});

// ── Compteur de téléchargements ──────────────────────────────────────
function getCount() {
    return parseInt(localStorage.getItem('menmaCount') || '0', 10);
}
function incrementCount() {
    const c = getCount() + 1;
    localStorage.setItem('menmaCount', c);
    updateCountDisplay(c);
}
function updateCountDisplay(c) {
    const el = document.getElementById('dlCount');
    if (el) el.textContent = c.toLocaleString('fr-FR');
}

// ── Bannière presse-papier intelligente ──────────────────────────────
let bannerUrl = '';
const clipboardBanner = document.getElementById('clipboardBanner');
const clipboardBannerText = document.getElementById('clipboardBannerText');
const clipboardBannerBtn = document.getElementById('clipboardBannerBtn');
const clipboardBannerClose = document.getElementById('clipboardBannerClose');

async function checkClipboardForUrl() {
    if (urlInput && urlInput.value.trim()) return;
    try {
        const text = await navigator.clipboard.readText();
        if (!text) return;
        const match = text.match(/(https?:\/\/[^\s]+)/);
        if (!match) return;
        const url = match[0];

        const detected = detectPlatformFromUrl(url);
        if (!detected) return;

        bannerUrl = url;
        if (clipboardBannerText) {
            clipboardBannerText.textContent = `${detected.icon} ${detected.name} détecté`;
        }
        clipboardBanner?.classList.remove('hidden');
        setTimeout(() => clipboardBanner?.classList.add('visible'), 20);

        setTimeout(() => hideBanner(), 8000);
    } catch {}
}

function hideBanner() {
    clipboardBanner?.classList.remove('visible');
    setTimeout(() => clipboardBanner?.classList.add('hidden'), 300);
}

clipboardBannerBtn?.addEventListener('click', () => {
    if (bannerUrl && urlInput && form) {
        urlInput.value = bannerUrl;
        urlInput.dispatchEvent(new Event('input'));
        form.dispatchEvent(new Event('submit'));
        hideBanner();
    }
});
clipboardBannerClose?.addEventListener('click', hideBanner);

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkClipboardForUrl();
});

// ── Bouton Partager ──────────────────────────────────────────────────
document.getElementById('shareAppBtn')?.addEventListener('click', async () => {
    const shareData = {
        title: 'OmniDL — Téléchargeur Média Universel',
        text: 'Télécharge tes vidéos TikTok, YouTube, Instagram en haute qualité en 1 clic 🔥',
        url: window.location.origin
    };
    try {
        if (navigator.share) {
            await navigator.share(shareData);
        } else {
            await navigator.clipboard.writeText(shareData.url);
            const btn = document.getElementById('shareAppBtn');
            if (btn) {
                btn.textContent = '✅';
                setTimeout(() => { btn.textContent = '🔗'; }, 2000);
            }
        }
    } catch {}
    if (navigator.vibrate) navigator.vibrate(25);
});

// ── Effet Confettis ──────────────────────────────────────────────────
function launchConfetti() {
    const canvas = document.getElementById('confettiCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#4f46e5', '#e11d48', '#10b981', '#f59e0b', '#3b82f6'];
    const particles = Array.from({ length: 70 }, () => ({
        x: Math.random() * canvas.width,
        y: -10,
        r: Math.random() * 6 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        speed: Math.random() * 3 + 2,
        drift: (Math.random() - 0.5) * 2,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 5
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
            ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 0.6);
            ctx.restore();
        });
        if (alive) frame = requestAnimationFrame(draw);
        else ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    if (frame) cancelAnimationFrame(frame);
    draw();
}

// ── Initialisation au chargement ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    updateCountDisplay(getCount());
    renderHistory();
    setTimeout(checkClipboardForUrl, 600);

    // Support Share Target URL
    const params = new URLSearchParams(window.location.search);
    const sharedUrl = params.get('url') || params.get('text');
    if (sharedUrl && /https?:\/\//.test(sharedUrl)) {
        const urlMatch = sharedUrl.match(/(https?:\/\/[^\s]+)/);
        if (urlMatch && urlInput && form) {
            urlInput.value = urlMatch[0];
            urlInput.dispatchEvent(new Event('input'));
            setTimeout(() => form.dispatchEvent(new Event('submit')), 300);
        }
    }
});
