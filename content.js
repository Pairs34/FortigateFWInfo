let analysisModal = null;
let modalOverlay = null;

chrome.storage.sync.get(['targetUrl'], function(items) {
    const savedUrl = items.targetUrl;
    if (savedUrl && window.location.href.startsWith(savedUrl)) {
        createModernAnalysisButton();
        createResultModal();
    }
});

function createModernAnalysisButton() {
    if (document.getElementById('firmwareAnalysisButtonModern')) return;

    const button = document.createElement('button');
    button.id = 'firmwareAnalysisButtonModern';
    const svgIconHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-search-heart" viewBox="0 0 16 16" style="vertical-align: -3px; margin-right: 8px;">
          <path d="M6.5 4.482c1.664-1.673 5.825 1.254 0 5.018-5.825-3.764-1.664-6.69 0-5.018Z"/>
          <path d="M13 6.5a6.471 6.471 0 0 1-1.258 3.874c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 1-1.414 1.415l-3.85-3.85a1.007 1.007 0 0 1-.115-.1A6.471 6.471 0 0 1 6.5 13a6.5 6.5 0 1 1 6.5-6.5zm-8.5 0a4.5 4.5 0 1 0 9 0 4.5 4.5 0 0 0-9 0z"/>
        </svg>`;
    button.innerHTML = svgIconHTML + 'Versiyon Analizi Yap';

    Object.assign(button.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: '10010',
        padding: '12px 22px',
        backgroundColor: '#007bff',
        color: 'white',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        fontSize: '15px',
        fontWeight: '600',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        boxShadow: '0 5px 15px rgba(0, 123, 255, 0.2)',
        transition: 'all 0.25s ease-out',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    });

    button.onmouseover = () => {
        button.style.backgroundColor = '#0056b3';
        button.style.boxShadow = '0 8px 20px rgba(0, 86, 179, 0.25)';
        button.style.transform = 'translateY(-1px)';
    };
    button.onmouseout = () => {
        button.style.backgroundColor = '#007bff';
        button.style.boxShadow = '0 5px 15px rgba(0, 123, 255, 0.2)';
        button.style.transform = 'translateY(0)';
    };
    button.onmousedown = () => {
        button.style.transform = 'translateY(0.5px)';
        button.style.backgroundColor = '#004085';
        button.style.boxShadow = '0 2px 8px rgba(0, 64, 133, 0.2)';
    };
    button.onmouseup = () => {
        button.onmouseover();
    };

    button.onclick = handleAnalysisRequest;
    document.body.appendChild(button);
}

function createResultModal() {
    if (document.getElementById('analysisModalOverlay')) return;

    modalOverlay = document.createElement('div');
    modalOverlay.id = 'analysisModalOverlay';
    Object.assign(modalOverlay.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(40, 40, 60, 0.7)',
        zIndex: '10000',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        opacity: '0',
        visibility: 'hidden',
        transition: 'opacity 0.3s ease, visibility 0.3s ease'
    });
    modalOverlay.onclick = (event) => {
        if (event.target === modalOverlay) hideModal();
    };

    analysisModal = document.createElement('div');
    analysisModal.id = 'analysisModalContent';
    Object.assign(analysisModal.style, {
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        backgroundColor: 'white',
        padding: '35px 40px',
        borderRadius: '10px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
        zIndex: '10001',
        width: '90%',
        maxWidth: '700px',
        maxHeight: '85%',
        overflowY: 'auto',
        position: 'relative',
        transform: 'scale(0.95)',
        opacity: '0',
        transition: 'opacity 0.3s ease, transform 0.3s ease'
    });

    const title = document.createElement('h3');
    title.id = 'analysisModalTitle';
    title.textContent = 'Firmware Analiz Sonucu';
    Object.assign(title.style, {
        marginTop: '0',
        marginBottom: '25px',
        fontSize: '22px',
        fontWeight: '600',
        color: '#2c3e50',
        borderBottom: 'none',
        paddingBottom: '0'
    });

    const content = document.createElement('div');
    content.id = 'analysisModalBody';
    content.innerHTML = '<div class="modal-loading"><i>Analiz bekleniyor...</i></div>';
    Object.assign(content.style, {
        lineHeight: '1.7',
        fontSize: '15px',
        color: '#444'
    });

    const closeButton = document.createElement('button');
    closeButton.id = 'analysisModalClose';
    closeButton.innerHTML = '&times;';
    Object.assign(closeButton.style, {
        position: 'absolute',
        top: '15px',
        right: '15px',
        fontSize: '28px',
        fontWeight: 'normal',
        color: '#999',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: '0 8px',
        lineHeight: '1',
        transition: 'color 0.2s ease, transform 0.2s ease'
    });
    closeButton.onmouseover = () => {
        closeButton.style.color = '#333';
        closeButton.style.transform = 'scale(1.1)';
    };
    closeButton.onmouseout = () => {
        closeButton.style.color = '#999';
        closeButton.style.transform = 'scale(1)';
    };
    closeButton.onclick = hideModal;

    analysisModal.appendChild(closeButton);
    analysisModal.appendChild(title);
    analysisModal.appendChild(content);
    modalOverlay.appendChild(analysisModal);
    document.body.appendChild(modalOverlay);

    const styleSheet = document.createElement("style");
    styleSheet.textContent = `
        .modal-loading::before {
            content: '';
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid rgba(0, 123, 255, 0.2);
            border-radius: 50%;
            border-top-color: #007bff;
            animation: modal-spinner 0.8s linear infinite;
            vertical-align: -4px;
            margin-right: 10px;
        }
        @keyframes modal-spinner {
            to { transform: rotate(360deg); }
        }
        #analysisModalBody strong { color: #d9534f; }
        #analysisModalBody i { color: #777; }
        #analysisModalBody br + br { margin-top: 10px; display: block; }
    `;
    document.head.appendChild(styleSheet);
}

function showModal(title = 'Firmware Analiz Sonucu', body = '<div class="modal-loading"><i>Analiz bekleniyor...</i></div>') {
    if (!modalOverlay || !analysisModal) {
        createResultModal();
        if (!modalOverlay || !analysisModal) return;
    }

    document.getElementById('analysisModalTitle').textContent = title;
    document.getElementById('analysisModalBody').innerHTML = body;

    modalOverlay.style.visibility = 'visible';
    modalOverlay.style.opacity = '1';
    analysisModal.style.opacity = '1';
    analysisModal.style.transform = 'scale(1)';

    const mainButton = document.getElementById('firmwareAnalysisButtonModern');
    if(mainButton) {
        mainButton.disabled = true;
        mainButton.style.opacity = '0.6';
        mainButton.style.cursor = 'default';
    }
}

function hideModal() {
    if (!modalOverlay || !analysisModal) return;

    modalOverlay.style.opacity = '0';
    analysisModal.style.opacity = '0';
    analysisModal.style.transform = 'scale(0.95)';

    setTimeout(() => {
        modalOverlay.style.visibility = 'hidden';
    }, 300);

    const mainButton = document.getElementById('firmwareAnalysisButtonModern');
    if (mainButton) {
        mainButton.disabled = false;
        mainButton.style.opacity = '1';
        mainButton.style.cursor = 'pointer';
        const svgIconHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-search-heart" viewBox="0 0 16 16" style="vertical-align: -3px; margin-right: 8px;">
              <path d="M6.5 4.482c1.664-1.673 5.825 1.254 0 5.018-5.825-3.764-1.664-6.69 0-5.018Z"/>
              <path d="M13 6.5a6.471 6.471 0 0 1-1.258 3.874c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 1-1.414 1.415l-3.85-3.85a1.007 1.007 0 0 1-.115-.1A6.471 6.471 0 0 1 6.5 13a6.5 6.5 0 1 1 6.5-6.5zm-8.5 0a4.5 4.5 0 1 0 9 0 4.5 4.5 0 0 0-9 0z"/>
            </svg>`;
        mainButton.innerHTML = svgIconHTML + 'Versiyon Analizi Yap';
    }
}

function handleAnalysisRequest() {
    const button = document.getElementById('firmwareAnalysisButtonModern');

    button.disabled = true;
    const loadingIconHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-hourglass-split" viewBox="0 0 16 16" style="vertical-align: -3px; margin-right: 8px;">
          <path d="M2.5 15a.5.5 0 1 1 0-1h1v-1a4.5 4.5 0 0 1 2.557-4.06c.29-.139.443-.377.443-.59v-.7c0-.213-.154-.451-.443-.59A4.5 4.5 0 0 1 3.5 3V2h-1a.5.5 0 0 1 0-1h11a.5.5 0 0 1 0 1h-1v1a4.5 4.5 0 0 1-2.557 4.06c-.29.139-.443.377-.443.59v.7c0 .213.154.451.443.59A4.5 4.5 0 0 1 12.5 13v1h1a.5.5 0 0 1 0 1h-11zm2-13v1c0 .537.12 1.045.337 1.5h6.326c.216-.455.337-.963.337-1.5V2h-7zm3 6.35c0 .701-.478 1.236-1.011 1.492A3.5 3.5 0 0 0 4.5 13V9.65c.29.139.443.377.443.59v.7c0 .213.154.451.443.59.91.433 1.586 1.262 1.84 2.166h.534c.254-.904.93-1.733 1.84-2.166.29-.139.443-.377.443-.59v-.7c0-.213-.154-.451-.443-.59-1.11-.525-1.557-1.591-1.557-2.65V5.337H7.5v3.013z"/>
        </svg>`;
    button.innerHTML = loadingIconHTML + 'Analiz Yapılıyor...';
    button.style.opacity = '0.6';
    button.style.cursor = 'default';

    showModal('Analiz Başlatıldı', '<div class="modal-loading"><i>Firmware verisi alınıyor ve ChatGPT ile analiz ediliyor... Lütfen bekleyin.</i></div>');

    chrome.runtime.sendMessage({ action: "startAnalysis" }, function(response) {
        if (chrome.runtime.lastError) {
            showModal('İletişim Hatası', `<p><strong>Hata:</strong> Arka plan betiğiyle iletişim kurulamadı.<br><small>(${chrome.runtime.lastError.message})</small></p>`);
            return;
        }

        if (response && response.error) {
            showModal('Analiz Hatası', `<p><strong>Hata:</strong> ${response.error}</p>`);
        } else if (response && response.analysis) {
            let formattedAnalysis = response.analysis
                .replace(/\n/g, '<br>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/```([\s\S]*?)```/g, '<pre style="background-color:#f0f0f0; padding:10px; border-radius:5px; white-space:pre-wrap; word-wrap:break-word;">$1</pre>')
                .replace(/`([^`]+)`/g, '<code style="background-color:#f0f0f0; padding:2px 4px; border-radius:3px;">$1</code>');

            formattedAnalysis = formattedAnalysis.replace(/^(#{1,4})\s+(.*?)(\<br\>|$)/gm, (match, hashes, title, end) => {
                const level = hashes.length;
                return `<h${level+2} style="margin-top: 15px; margin-bottom: 5px; font-weight:600;">${title}</h${level+2}>${end === '<br>' ? '<br>' : ''}`;
            });

            formattedAnalysis = formattedAnalysis.replace(/^(\s*[\*\-]\s+)(.*?)(\<br\>|$)/gm, (match, prefix, item, end) => {
                return `<li style="margin-left: 20px; margin-bottom: 5px;">${item}</li>${end === '<br>' ? '<br>' : ''}`;
            });

            showModal('Firmware Analiz Sonucu', formattedAnalysis);
        } else {
            showModal('Hata', '<p><strong>Beklenmedik Yanıt:</strong> Geçerli bir analiz sonucu alınamadı.</p>');
        }
    });
}
