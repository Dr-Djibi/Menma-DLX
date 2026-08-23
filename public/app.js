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

// ── Soumission du formulaire ─────────────────────────────────────────
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    resultCard.classList.add('hidden');
    errorMsg.classList.add('hidden');
    allMediaList.innerHTML = '';
    thumbImg.classList.add('hidden');

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
            // Badge plateforme
            const icons = { YouTube: '▶️', TikTok: '🎵', Instagram: '📸', Facebook: '👤', Twitter: '🐦' };
            platformBadge.textContent = (icons[data.platform] || '🌐') + ' ' + data.platform;

            // Titre
            videoTitle.textContent = data.title || 'Vidéo prête !';

            // Thumbnail si disponible
            if (data.thumbnail) {
                thumbImg.src = data.thumbnail;
                thumbImg.classList.remove('hidden');
            }

            // Lien de téléchargement principal
            downloadLink.href = data.download_url;
            downloadLink.textContent = data.media_type === 'image' ? '🖼️ Télécharger l\'image' : '💾 Télécharger la vidéo';

            // Carrousel Instagram (all_media)
            if (data.all_media && data.all_media.length > 1) {
                data.all_media.forEach((m, i) => {
                    const a = document.createElement('a');
                    a.href = m.url;
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
            urlInput.value = '';
            if (platformHint) platformHint.textContent = '';
        } else {
            showError(data.error || 'Erreur lors du téléchargement');
        }
    } catch {
        showError('Impossible de contacter le serveur. Vérifie ta connexion.');
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

downloadLink.addEventListener('click', function() {
    const originalText = this.textContent;
    this.textContent = '⏳ Ouverture du fichier...';
    setTimeout(() => this.textContent = originalText, 3000);
});
