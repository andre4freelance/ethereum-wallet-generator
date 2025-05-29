const express = require('express'); // Modul untuk membuat server web
const path = require('path'); // Modul Node.js untuk bekerja dengan path file
const { ethers } = require('ethers'); // Modul untuk Ethereum, digunakan untuk membuat wallet
const sqlite3 = require('sqlite3').verbose(); // Modul untuk SQLite database
const session = require('express-session'); // Modul untuk session management

const app = express();
const port = 3000; // Aplikasi akan berjalan di port ini

// Konfigurasi Session
app.use(session({
    secret: 'rahasia-kecil-kecilan', // Ganti dengan secret yang lebih kuat
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Untuk HTTP. Untuk HTTPS, set ke true
}));

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
            seed_phrase TEXT NOT NULL,
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

// Middleware untuk parsing body request (untuk login form)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


// --- AREA LOGIN ---
// User & Pass sederhana (JANGAN GUNAKAN INI DI PRODUKSI!)
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'rahasiaku2025';

// Middleware untuk cek apakah user sudah login
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    }
    // Jika belum login, bisa redirect ke halaman login atau kirim error
    // Untuk API, kita kirim error
    res.status(401).json({ error: "Akses ditolak, user atau password salah! Silakan login ulang" });
}

// Endpoint Login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_USER && password === ADMIN_PASS) {
        req.session.user = { username: ADMIN_USER };
        // Redirect ke halaman utama setelah login berhasil, atau kirim status sukses
        // Jika login dari halaman HTML khusus login, redirect lebih cocok.
        // Jika login via fetch dari SPA, kirim JSON.
        res.json({ success: true, message: "Login berhasil." });
    } else {
        res.status(401).json({ success: false, message: "Username atau password salah." });
    }
});

// Endpoint Logout
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ error: "Gagal logout." });
        }
        // Redirect ke halaman login atau halaman utama
        // atau kirim status sukses jika ini API call
        res.json({ success: true, message: "Logout berhasil." });
    });
});

// Cek status login
app.get('/api/auth/status', (req, res) => {
    if (req.session.user) {
        res.json({ loggedIn: true, user: req.session.user });
    } else {
        res.json({ loggedIn: false });
    }
});

// --- AKHIR AREA LOGIN ---

// Middleware untuk menyajikan file statis dari direktori 'public'
app.use(express.static(path.join(__dirname, 'public')));

// API Endpoint untuk membuat wallet
app.get('/api/buat-wallet', (req, res) => {
    try {
        const wallet = ethers.Wallet.createRandom();
        const walletInfo = {
            address: wallet.address,
            privateKey: wallet.privateKey,
            seed: wallet.mnemonic.phrase
        };
        // Simpan ke database
        const insertQuery = `INSERT INTO wallets (address, private_key, seed_phrase) VALUES (?, ?, ?)`;
        db.run(insertQuery, [walletInfo.address, walletInfo.privateKey, walletInfo.seed], function(err) {
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

// API Endpoint untuk mengambil semua wallet (DILINDUNGI LOGIN)
app.get('/api/admin/wallets', isAuthenticated, (req, res) => { // Perhatikan isAuthenticated
    const sql = "SELECT * FROM wallets ORDER BY created_at DESC"; // Ambil semua data untuk admin
    
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error("Error fetching wallets from database", err.message);
            res.status(500).json({ error: "Gagal mengambil data wallets dari database" });
            return;
        }
        res.json({ wallets: rows });
    });
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