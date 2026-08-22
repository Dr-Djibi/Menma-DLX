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
