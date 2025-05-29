document.addEventListener('DOMContentLoaded', () => {
    
    const loginForm = document.getElementById('loginForm');
    const loginMessage = document.getElementById('loginMessage');
    const authArea = document.getElementById('authArea');
    const loginFormArea = document.getElementById('loginFormArea');
    const loggedInArea = document.getElementById('loggedInArea');
    const loggedInUserSpan = document.getElementById('loggedInUser');
    const logoutBtn = document.getElementById('logoutBtn');

    const createWalletSection = document.getElementById('createWalletSection');
    const generateWalletBtn = document.getElementById('generateWalletBtn');
    const walletDetailsDiv = document.getElementById('walletDetails');
    const addressSpan = document.getElementById('address'); // Hanya alamat untuk generate publik
    const newWalletPrivateKeySpan = document.getElementById('newWalletPrivateKey'); // Hanya private key untuk generate publik
    const newWalletseedPhraseSpan = document.getElementById('newWalletseedPhrase'); // Hanya seed phrase untuk generate publik
    const loadingMessageDiv = document.getElementById('loadingMessage');

    const adminSection = document.getElementById('adminSection');
    const separatorForAdmin = document.getElementById('separatorForAdmin');
    const loadAllWalletsBtn = document.getElementById('loadAllWalletsBtn');
    const allWalletsListDiv = document.getElementById('allWalletsList');
    const adminMessage = document.getElementById('adminMessage');

    // Fungsi untuk update UI berdasarkan status login
    async function updateLoginState() {
        try {
            const response = await fetch('/api/auth/status');
            const data = await response.json();

            if (data.loggedIn) {
                loginFormArea.classList.add('hidden');
                loggedInArea.classList.remove('hidden');
                loggedInUserSpan.textContent = data.user.username;
                createWalletSection.classList.remove('hidden');
                adminSection.classList.remove('hidden');
                separatorForAdmin.classList.remove('hidden');
            } else {
                loginFormArea.classList.remove('hidden');
                loggedInArea.classList.add('hidden');
                createWalletSection.classList.add('hidden');
                adminSection.classList.add('hidden');
                separatorForAdmin.classList.add('hidden');
                allWalletsListDiv.innerHTML = ''; // Bersihkan daftar wallet jika logout
            }
        } catch (error) {
            console.error("Error checking login status:", error);
            // Asumsikan tidak login jika ada error
            loginFormArea.classList.remove('hidden');
            loggedInArea.classList.add('hidden');
            createWalletSection.classList.add('hidden');
            adminSection.classList.add('hidden');
            separatorForAdmin.classList.add('hidden');
        }
    }

    // Handle Login
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = loginForm.username.value;
            const password = loginForm.password.value;
            loginMessage.textContent = 'Logging in...';

            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                const data = await response.json();
                if (data.success) {
                    loginMessage.textContent = data.message;
                    loginMessage.style.color = 'green';
                    await updateLoginState();
                } else {
                    loginMessage.textContent = data.message || 'Login gagal.';
                    loginMessage.style.color = 'red';
                }
            } catch (error) {
                loginMessage.textContent = 'Error saat login.';
                loginMessage.style.color = 'red';
                console.error("Login error:", error);
            }
        });
    }

    // Handle Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                const response = await fetch('/logout');
                const data = await response.json();
                if (data.success) {
                    alert(data.message); // atau update UI dengan cara lain
                    await updateLoginState();
                } else {
                    alert(data.message || 'Logout gagal.');
                }
            } catch (error) {
                alert('Error saat logout.');
                console.error("Logout error:", error);
            }
        });
    }

    // Handle Generate Wallet (Publik)
    if (generateWalletBtn) {
        generateWalletBtn.addEventListener('click', async () => {
            walletDetailsDiv.classList.add('hidden');
            if(loadingMessageDiv) loadingMessageDiv.classList.remove('hidden');

            try {
                const response = await fetch('/api/buat-wallet');
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
                }
                const walletInfo = await response.json();
                if (addressSpan) addressSpan.textContent = walletInfo.address;

                // Untuk menampilkan private key dan seed phrase
                if (newWalletPrivateKeySpan && walletInfo.privateKey) {
                newWalletPrivateKeySpan.textContent = walletInfo.privateKey;
                }
                if (newWalletseedPhraseSpan && walletInfo.seed) {
                newWalletseedPhraseSpan.textContent = walletInfo.seed;
                }

                if (walletDetailsDiv) walletDetailsDiv.classList.remove('hidden');
                // const walletInfo = await response.json();
                // addressSpan.textContent = walletInfo.address; // Hanya tampilkan alamat
                // walletDetailsDiv.classList.remove('hidden');
            } catch (error) {
                console.error("Gagal membuat wallet:", error);
                alert("Terjadi kesalahan saat membuat wallet: " + error.message);
            } finally {
                if(loadingMessageDiv) loadingMessageDiv.classList.add('hidden');
            }
        });
    }
    
    // Handle Load All Wallets (Admin)
    if (loadAllWalletsBtn) {
        loadAllWalletsBtn.addEventListener('click', async () => {
            allWalletsListDiv.innerHTML = 'Memuat daftar wallet...';
            adminMessage.textContent = '';
            try {
                const response = await fetch('/api/admin/wallets');
                if (!response.ok) {
                    const errorData = await response.json();
                     // Cek jika error karena belum login
                    if (response.status === 401) {
                        adminMessage.textContent = 'Akses ditolak. Anda harus login sebagai admin.';
                        adminMessage.style.color = 'red';
                        allWalletsListDiv.innerHTML = '';
                        // Mungkin panggil updateLoginState() untuk refresh UI login
                        await updateLoginState(); 
                        return;
                    }
                    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                
                if (data.wallets && data.wallets.length > 0) {
                    let html = '<table><thead><tr><th>ID</th><th>Alamat</th><th>Private Key</th><th>Seed Phrase</th><th>Dibuat</th></tr></thead><tbody>';
                    data.wallets.forEach(wallet => {
                        html += `<tr>
                                    <td>${wallet.id}</td>
                                    <td>${wallet.address}</td>
                                    <td class="sensitive">${wallet.private_key}</td>
                                    <td class="sensitive">${wallet.seed_phrase}</td> 
                                    <td>${new Date(wallet.created_at).toLocaleString()}</td>
                                 </tr>`;
                    });
                    html += '</tbody></table>';
                    allWalletsListDiv.innerHTML = html;
                } else {
                    allWalletsListDiv.innerHTML = 'Tidak ada wallet yang tersimpan di database.';
                }
            } catch (error) {
                console.error("Gagal memuat semua wallet:", error);
                allWalletsListDiv.innerHTML = `Error: ${error.message}`;
            }
        });
    }

    // Inisialisasi status login saat halaman dimuat
    updateLoginState();
});