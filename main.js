const express = require('express');
const path = require('path'); // Modul Node.js untuk bekerja dengan path file
const { ethers } = require('ethers');
const sqlite3 = require('sqlite3').verbose(); // Import sqlite3

const app = express();
const port = 3000; // Aplikasi akan berjalan di port ini

// Tentukan path ke file database SQLite
const dbPath = path.join(__dirname, 'wallets.db');
// Buat atau hubungkan ke database
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Error opening database", err.message);
    } else {
        console.log("Successfully connected to the SQLite database 'wallets.db'");
        // Buat tabel jika belum ada
        db.run(`CREATE TABLE IF NOT EXISTS wallets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            address TEXT UNIQUE NOT NULL,
            private_key TEXT NOT NULL,
            secret_phrase TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) {
                console.error("Error creating table", err.message);
            } else {
                console.log("Table 'wallets' is ready or already exists.");
            }
        });
    }
});

// Middleware untuk menyajikan file statis dari direktori 'public'
app.use(express.static(path.join(__dirname, 'public')));

// API Endpoint untuk membuat wallet
app.get('/api/buat-wallet', (req, res) => {
    try {
        const wallet = ethers.Wallet.createRandom();
        const walletInfo = {
            address: wallet.address,
            privateKey: wallet.privateKey,
            secret: wallet.mnemonic.phrase
        };
        // Simpan ke database
        const insertQuery = `INSERT INTO wallets (address, private_key, secret_phrase) VALUES (?, ?, ?)`;
        db.run(insertQuery, [walletInfo.address, walletInfo.privateKey, walletInfo.secret], function(err) {
            if (err) {
                console.error("Error saving wallet to database", err.message);
                // Meskipun gagal simpan ke DB, kita tetap kirim info wallet ke user untuk UI
                // Anda bisa memutuskan perilaku lain jika penyimpanan DB adalah kritikal
                return res.status(500).json({ 
                    error: "Gagal menyimpan wallet ke database, tetapi wallet berhasil dibuat.",
                    wallet: walletInfo // Kirim info wallet agar UI tetap berfungsi
                });
            }
            console.log(`A new wallet has been inserted with rowid ${this.lastID}`);
            res.json(walletInfo); // Kirim data wallet sebagai JSON ke client
        });
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

// Pastikan koneksi database ditutup dengan baik saat aplikasi berhenti (opsional but good practice)
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            return console.error(err.message);
        }
        console.log('Database connection closed.');
        process.exit(0);
    });
});