document.addEventListener('DOMContentLoaded', () => {
    const targetUrlInput = document.getElementById('targetUrl');
    const apiKeyInput = document.getElementById('apiKey');
    const saveButton = document.getElementById('saveButton');
    const statusElement = document.getElementById('status');
    const toggleButton = document.getElementById('toggleApiKey');

    const eyeIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye-fill" viewBox="0 0 16 16"><path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"/><path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8zm8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"/></svg>`;
    const eyeSlashIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye-slash-fill" viewBox="0 0 16 16"><path d="m10.79 12.912-1.614-1.615a3.5 3.5 0 0 1-4.474-4.474l-2.06-2.06C.938 6.278 0 8 0 8s3 5.5 8 5.5a7.029 7.029 0 0 0 2.79-.588zM5.21 3.088A7.028 7.028 0 0 1 8 2.5c5 0 8 5.5 8 5.5s-.939 1.721-2.641 3.238l-2.062-2.062a3.5 3.5 0 0 0-4.474-4.474L5.21 3.089z"/><path d="M5.525 7.646a2.5 2.5 0 0 0 2.829 2.829l-2.83-2.829zm4.95.708-2.829-2.83a2.5 2.5 0 0 1 2.829 2.829zm3.171 6-12-12 .708-.708 12 12-.708.708z"/></svg>`;

    function loadOptions() {
        chrome.storage.sync.get(['targetUrl', 'apiKey'], (items) => {
            if (chrome.runtime.lastError) {
                console.error("Ayarlar yüklenirken hata:", chrome.runtime.lastError);
                statusElement.textContent = 'Hata: Ayarlar yüklenemedi. ' + chrome.runtime.lastError.message;
                statusElement.classList.add('error');
                return;
            }
            if (items.targetUrl) targetUrlInput.value = items.targetUrl;
            if (items.apiKey) apiKeyInput.value = items.apiKey;
        });
    }

    function saveOptions() {
        const targetUrl = targetUrlInput.value;
        const apiKey = apiKeyInput.value;
        statusElement.classList.remove('success', 'error');
        statusElement.textContent = '';

        if (!targetUrl || !apiKey) {
            statusElement.textContent = 'Hata: Lütfen tüm alanları doldurun.';
            statusElement.classList.add('error');
            setTimeout(() => {
                if (statusElement.textContent === 'Hata: Lütfen tüm alanları doldurun.') {
                    statusElement.textContent = '';
                    statusElement.classList.remove('error');
                }
            }, 4000);
            return;
        }

        chrome.storage.sync.set({ targetUrl, apiKey }, () => {
            if (chrome.runtime.lastError) {
                console.error("Ayarlar kaydedilirken hata:", chrome.runtime.lastError);
                statusElement.textContent = 'Hata: Ayarlar kaydedilemedi. ' + chrome.runtime.lastError.message;
                statusElement.classList.add('error');
            } else {
                statusElement.textContent = 'Ayarlar başarıyla kaydedildi!';
                statusElement.classList.add('success');
                setTimeout(() => {
                    if (statusElement.textContent === 'Ayarlar başarıyla kaydedildi!') {
                        statusElement.textContent = '';
                        statusElement.classList.remove('success');
                    }
                }, 3000);
            }
        });
    }

    function setupApiKeyToggle() {
        if (toggleButton && apiKeyInput) {
            toggleButton.innerHTML = eyeIcon;
            toggleButton.addEventListener('click', () => {
                const type = apiKeyInput.getAttribute('type') === 'password' ? 'text' : 'password';
                apiKeyInput.setAttribute('type', type);
                toggleButton.innerHTML = type === 'password' ? eyeIcon : eyeSlashIcon;
            });
        } else {
            console.warn("API Key toggle butonu veya input alanı bulunamadı.");
        }
    }

    if (saveButton) {
        saveButton.addEventListener('click', saveOptions);
    } else {
        console.error("Kaydet butonu bulunamadı!");
    }

    loadOptions();
    setupApiKeyToggle();
});
