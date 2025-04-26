function parseVersion(versionString) {
    if (!versionString || !versionString.startsWith('v')) return null;
    const parts = versionString.substring(1).split('.');
    if (parts.length < 3) return null;
    return {
        major: parseInt(parts[0], 10),
        minor: parseInt(parts[1], 10),
        patch: parseInt(parts[2], 10),
        build: null
    };
}

async function analyzeWithChatGPT(currentVersionInfo, targetNextVersionInfo, apiKey) {
    const apiUrl = 'https://api.openai.com/v1/chat/completions';

    let promptContent = `
You are an expert assistant analyzing FortiOS firewall firmware data and release notes to help users decide on upgrades.

**Current Installed Version Details:**
* **Version:** ${currentVersionInfo.version}
* **Build:** ${currentVersionInfo.build}
* **Maturity:** ${currentVersionInfo.maturity} (${currentVersionInfo.maturity === 'M' ? 'Mature' : (currentVersionInfo.maturity === 'F' ? 'Feature' : 'Unknown')})
* **Release Notes URL:** ${currentVersionInfo.notes}

**Analysis Task for Current Version (${currentVersionInfo.version}):**
1.  Analyze the details provided above for the current version.
2.  Based on the provided release notes URL (${currentVersionInfo.notes}) and your knowledge of FortiOS:
    * Summarize the likely **resolved issues/fixed bugs** mentioned in the release notes for version ${currentVersionInfo.version}.
    * Summarize the likely **known issues/limitations** mentioned in the release notes for version ${currentVersionInfo.version}. (If you can access the URL, use the information there; otherwise, use your general knowledge.)

---
`;

    if (targetNextVersionInfo) {
        promptContent += `
**Target Next Available Version Details:**
* **Version:** ${targetNextVersionInfo.version}
* **Build:** ${targetNextVersionInfo.build}
* **Maturity:** ${targetNextVersionInfo.maturity} (${targetNextVersionInfo.maturity === 'M' ? 'Mature' : (targetNextVersionInfo.maturity === 'F' ? 'Feature' : 'Unknown')})
* **Release Notes URL:** ${targetNextVersionInfo.notes}

**Analysis Task for Next Version (${targetNextVersionInfo.version}):**
3.  Analyze the details provided above for the next available version.
4.  Based on the provided release notes URL (${targetNextVersionInfo.notes}) and your knowledge of FortiOS:
    * Summarize the likely **resolved issues/fixed bugs** mentioned in the release notes for version ${targetNextVersionInfo.version}.
    * Summarize the likely **known issues/limitations** mentioned in the release notes for version ${targetNextVersionInfo.version}. (If you can access the URL, use the information there; otherwise, use your general knowledge.)

---

**Overall Summary and Recommendation:**
5.  Provide a combined summary in TURKISH.
    * Start with the analysis of the current version (${currentVersionInfo.version}).
    * Present the analysis of the target next version (${targetNextVersionInfo.version}).
    * Conclude with a brief comparison highlighting key fixes or known issues in both versions, and consider their maturity levels to help the user decide whether upgrading from ${currentVersionInfo.version} to ${targetNextVersionInfo.version} is advisable. Emphasize checking the official release notes via the provided links for full details.
`;
    } else {
        promptContent += `
**Next Available Version:**
A specific target successor version (like the next patch in the same branch) was not identified in the available list provided by the firewall API data processed by the extension.

---

**Overall Summary:**
3. Provide a summary in TURKISH based *only* based on the analysis of the current version (${currentVersionInfo.version}) as described in steps 1 & 2. Mention that while other versions might be available, a direct comparison target wasn't automatically selected. Advise checking the official release notes.
`;
    }

    const requestBody = {
        model: "gpt-4o",
        messages: [
            {
                role: "system",
                content: "You are an expert Fortinet FortiOS analyst. Analyze the provided version details and release note URLs. Use your knowledge or access the URLs if possible to summarize release notes content (fixed/known issues) and provide upgrade advice in Turkish."
            },
            {
                role: "user",
                content: promptContent
            }
        ],
        temperature: 0.5,
    };

    console.log("Arka Plan: ChatGPT API'sine istek gönderiliyor (Link Analizi Promptu ile)...");
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("ChatGPT API Yanıt Hatası:", response.status, response.statusText, errorData);
            throw new Error(`ChatGPT API Hatası: ${response.status} ${response.statusText}. ${errorData.error?.message || ''}`);
        }

        const result = await response.json();
        console.log("Arka Plan: ChatGPT API yanıtı alındı.");

        if (result.choices && result.choices.length > 0 && result.choices[0].message) {
            return result.choices[0].message.content.trim();
        } else {
            console.error("ChatGPT API Yanıt Formatı Beklenenden Farklı:", result);
            throw new Error("ChatGPT API'sinden geçerli bir analiz yanıtı alınamadı.");
        }
    } catch (error) {
        console.error("ChatGPT API İsteği Sırasında Hata:", error);
        throw new Error(`ChatGPT API isteği başarısız: ${error.message}`);
    }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "startAnalysis") {
        console.log("Arka Plan: Link tabanlı karşılaştırmalı analiz isteği alındı.");
        chrome.storage.sync.get(['apiKey', 'targetUrl'], async (items) => {
            const apiKey = items.apiKey;
            const firmwareBaseUrl = items.targetUrl;

            if (!apiKey) { sendResponse({ error: "API anahtarı eksik." }); return; }
            if (!firmwareBaseUrl) { sendResponse({ error: "URL ayarı eksik." }); return; }

            const firmwareApiUrl = `${firmwareBaseUrl}/api/v2/monitor/system/firmware?vdom=root`;

            try {
                console.log(`Arka Plan: Firmware verisi isteniyor: ${firmwareApiUrl}`);
                const firmwareResponse = await fetch(firmwareApiUrl);
                if (!firmwareResponse.ok) { throw new Error(`Firmware API Hatası: ${firmwareResponse.status} ${firmwareResponse.statusText}`); }

                const firmwareData = await firmwareResponse.json();
                console.log("Arka Plan: Firmware verisi alındı ve JSON olarak ayrıştırıldı.");

                const currentVersionInfo = firmwareData?.results?.current;
                const availableVersions = firmwareData?.results?.available;

                if (!currentVersionInfo || !availableVersions) {
                    throw new Error("Alınan JSON verisi beklenen formatta değil ('results.current' veya 'results.available' bulunamadı).");
                }

                let targetNextVersionInfo = null;
                const currentVersionParsed = parseVersion(currentVersionInfo.version);

                if (currentVersionParsed) {
                    const targetVersionString = `v${currentVersionParsed.major}.${currentVersionParsed.minor}.${currentVersionParsed.patch + 1}`;
                    console.log(`Arka Plan: Sonraki hedef sürüm aranıyor: ${targetVersionString}`);
                    targetNextVersionInfo = availableVersions.find(v => v.version === targetVersionString);

                    if (targetNextVersionInfo) {
                        console.log(`Arka Plan: Hedef sürüm bulundu: ${targetNextVersionInfo.version}`);
                    } else {
                        console.log(`Arka Plan: Direkt sonraki patch (${targetVersionString}) bulunamadı. Karşılaştırma için hedef seçilmedi.`);
                    }
                } else {
                    console.warn("Mevcut versiyon numarası ayrıştırılamadı, sonraki hedef versiyon aranamıyor.");
                }

                const analysisResult = await analyzeWithChatGPT(
                    currentVersionInfo,
                    targetNextVersionInfo,
                    apiKey
                );
                console.log("Arka Plan: Link tabanlı ChatGPT analizi tamamlandı.");

                sendResponse({ analysis: analysisResult });

            } catch (error) {
                console.error("Arka Plan: Analiz sırasında hata:", error);
                if (error instanceof SyntaxError) {
                    sendResponse({ error: `Firmware API'sinden gelen yanıt JSON formatında değil veya bozuk: ${error.message}` });
                } else {
                    sendResponse({ error: `Analiz sırasında hata oluştu: ${error.message}` });
                }
            }
        });
        return true;
    }
});

chrome.action.onClicked.addListener((tab) => {
  chrome.runtime.openOptionsPage();
});
