document.getElementById('downloadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const urlInput = document.getElementById('urlInput');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const loader = submitBtn.querySelector('.loader');
    const resultCard = document.getElementById('resultCard');
    const errorMsg = document.getElementById('errorMsg');
    
    // UI states
    errorMsg.classList.add('hidden');
    resultCard.classList.add('hidden');
    btnText.classList.add('hidden');
    loader.classList.remove('hidden');
    submitBtn.disabled = true;

    try {
        const response = await fetch('/api/download', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url: urlInput.value.trim() })
        });

        const data = await response.json();

        if (data.success) {
            document.getElementById('platformBadge').textContent = data.platform;
            document.getElementById('videoTitle').textContent = data.title || "Vidéo prête !";
            document.getElementById('downloadLink').href = data.download_url;
            resultCard.classList.remove('hidden');
            urlInput.value = '';
        } else {
            showError(data.error || 'Erreur lors du téléchargement');
        }
    } catch (err) {
        showError('Impossible de se connecter au serveur.');
    } finally {
        btnText.classList.remove('hidden');
        loader.classList.add('hidden');
        submitBtn.disabled = false;
    }
});

function showError(msg) {
    const errorMsg = document.getElementById('errorMsg');
    errorMsg.textContent = msg;
    errorMsg.classList.remove('hidden');
}
