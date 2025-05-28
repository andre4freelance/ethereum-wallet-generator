const express = require('express');
const path = require('path'); // Modul Node.js untuk bekerja dengan path file
const { ethers } = require('ethers');

const app = express();
const port = 3000; // Aplikasi akan berjalan di port ini

// Middleware untuk menyajikan file statis dari direktori 'public'
app.use(express.static(path.join(__dirname, 'public')));

// API Endpoint untuk membuat wallet
app.get('/api/buat-wallet', (req, res) => {
    try {
        const wallet = ethers.Wallet.createRandom();
        const walletInfo = {
            address: wallet.address,
            privateKey: wallet.privateKey,
            mnemonic: wallet.mnemonic.phrase
        };
        res.json(walletInfo);
    } catch (error) {
        console.error("Error creating wallet:", error);
        res.status(500).json({ error: "Gagal membuat wallet" });
    }
});

// Route default untuk menyajikan index.html jika path root diminta
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`http://localhost:${port}`);
});