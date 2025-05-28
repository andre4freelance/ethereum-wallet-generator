document.addEventListener('DOMContentLoaded', () => {
    const generateWalletBtn = document.getElementById('generateWalletBtn');
    const walletDetailsDiv = document.getElementById('walletDetails');
    const securityWarningDiv = document.getElementById('securityWarning');
    const loadingMessageDiv = document.getElementById('loadingMessage');

    const addressSpan = document.getElementById('address');
    const privateKeySpan = document.getElementById('privateKey');
    const mnemonicSpan = document.getElementById('mnemonic');

    generateWalletBtn.addEventListener('click', async () => {
        walletDetailsDiv.classList.add('hidden');
        securityWarningDiv.classList.add('hidden');
        if(loadingMessageDiv) loadingMessageDiv.classList.remove('hidden');

        try {
            // Path API relatif terhadap root server
            const response = await fetch('/api/buat-wallet'); 

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const walletInfo = await response.json();

            addressSpan.textContent = walletInfo.address;
            privateKeySpan.textContent = walletInfo.privateKey;
            mnemonicSpan.textContent = walletInfo.mnemonic;

            walletDetailsDiv.classList.remove('hidden');
            securityWarningDiv.classList.remove('hidden');

        } catch (error) {
            console.error("Gagal mengambil data wallet:", error);
            alert("Terjadi kesalahan: " + error.message);
        } finally {
            if(loadingMessageDiv) loadingMessageDiv.classList.add('hidden');
        }
    });
});