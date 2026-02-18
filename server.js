/* ============================================
   NBU IT Website - Backend Server
   Node.js + Express + PostgreSQL (Supabase)
   ============================================ */

require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const multer = require('multer');
const compression = require('compression');
const { Pool } = require('pg');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// PostgreSQL Connection
// ============================================
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

pool.query('SELECT NOW()').then(() => {
    console.log('  Database: Connected to PostgreSQL');
}).catch(err => {
    console.error('  Database: Connection failed -', err.message);
});

// ============================================
// Cloudinary + Multer config
// ============================================
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'nbu-it',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'],
        resource_type: 'auto'
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }
});

// ============================================
// Middleware
// ============================================
app.use(compression());
app.use(express.json());

app.use(express.static(__dirname, {
    maxAge: '1h',
    etag: true
}));

// ============================================
// Helper functions
// ============================================
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// ============================================
// Auth middleware
// ============================================
async function authMiddleware(req, res, next) {
    const token = req.headers['x-auth-token'];
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
        const decoded = Buffer.from(token, 'base64').toString('utf-8');
        const [username, hash] = decoded.split(':');
        const result = await pool.query(
            'SELECT * FROM users WHERE username = $1 AND password = $2',
            [username, hash]
        );
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        req.user = result.rows[0];
        next();
    } catch (e) {
        return res.status(401).json({ error: 'Invalid token' });
    }
}

// ============================================
// Cache headers for API
// ============================================
function apiCache(seconds) {
    return function (req, res, next) {
        res.set('Cache-Control', 'public, max-age=' + seconds);
        next();
    };
}

// ============================================
// AUTH API
// ============================================
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const hash = hashPassword(password);
    const result = await pool.query(
        'SELECT * FROM users WHERE username = $1 AND password = $2',
        [username, hash]
    );

    if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = result.rows[0];
    const token = Buffer.from(user.username + ':' + user.password).toString('base64');
    res.json({
        success: true,
        token,
        user: { id: user.id, username: user.username, name: user.name, role: user.role }
    });
});

app.post('/api/change-password', authMiddleware, async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (hashPassword(currentPassword) !== req.user.password) {
        return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const newHash = hashPassword(newPassword);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [newHash, req.user.id]);

    const token = Buffer.from(req.user.username + ':' + newHash).toString('base64');
    res.json({ success: true, token });
});

// ============================================
// GENERIC CRUD API FACTORY (PostgreSQL)
// ============================================
function createCrudRoutes(tableName, orderBy = 'id') {
    const router = express.Router();

    // GET all (public)
    router.get('/', apiCache(60), async (req, res) => {
        try {
            const result = await pool.query(`SELECT * FROM ${tableName} ORDER BY ${orderBy}`);
            res.json(result.rows);
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // GET one (public)
    router.get('/:id', apiCache(60), async (req, res) => {
        try {
            const result = await pool.query(`SELECT * FROM ${tableName} WHERE id = $1`, [req.params.id]);
            if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
            res.json(result.rows[0]);
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // CREATE (protected)
    router.post('/', authMiddleware, async (req, res) => {
        try {
            const data = req.body;
            const keys = Object.keys(data);
            const values = Object.values(data);
            const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
            const columns = keys.map(k => k === 'order' ? `"order"` : k).join(', ');

            const result = await pool.query(
                `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders}) RETURNING *`,
                values
            );
            res.status(201).json(result.rows[0]);
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // UPDATE (protected)
    router.put('/:id', authMiddleware, async (req, res) => {
        try {
            const data = req.body;
            delete data.id;
            const keys = Object.keys(data);
            const values = Object.values(data);
            const setClause = keys.map((k, i) => {
                const col = k === 'order' ? `"order"` : k;
                return `${col} = $${i + 1}`;
            }).join(', ');

            values.push(req.params.id);
            const result = await pool.query(
                `UPDATE ${tableName} SET ${setClause} WHERE id = $${values.length} RETURNING *`,
                values
            );
            if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
            res.json(result.rows[0]);
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // DELETE (protected)
    router.delete('/:id', authMiddleware, async (req, res) => {
        try {
            const result = await pool.query(
                `DELETE FROM ${tableName} WHERE id = $1 RETURNING *`,
                [req.params.id]
            );
            if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
            res.json({ success: true, deleted: result.rows[0] });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    return router;
}

// Register CRUD routes
app.use('/api/news', createCrudRoutes('news', 'id DESC'));
app.use('/api/announcements', createCrudRoutes('announcements', 'id DESC'));
app.use('/api/documents', createCrudRoutes('documents'));
app.use('/api/faq', createCrudRoutes('faq'));
app.use('/api/services', createCrudRoutes('services'));

// ============================================
// FILE UPLOAD API
// ============================================
app.post('/api/upload', authMiddleware, upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    res.json({
        success: true,
        filename: req.file.filename,
        url: req.file.path,
        originalName: req.file.originalname,
        size: req.file.size
    });
});

// ============================================
// DASHBOARD STATS API
// ============================================
app.get('/api/stats', authMiddleware, async (req, res) => {
    try {
        const [news, announcements, documents, faq, services] = await Promise.all([
            pool.query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = $1) as published FROM news', ['published']),
            pool.query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = $1) as active FROM announcements', ['active']),
            pool.query('SELECT COUNT(*) as total FROM documents'),
            pool.query('SELECT COUNT(*) as total FROM faq'),
            pool.query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = $1) as published FROM services', ['published'])
        ]);

        res.json({
            news: parseInt(news.rows[0].total),
            newsPublished: parseInt(news.rows[0].published),
            announcements: parseInt(announcements.rows[0].total),
            announcementsActive: parseInt(announcements.rows[0].active),
            documents: parseInt(documents.rows[0].total),
            faq: parseInt(faq.rows[0].total),
            services: parseInt(services.rows[0].total),
            servicesPublished: parseInt(services.rows[0].published)
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
    console.log('========================================');
    console.log('  NBU IT Website Server');
    console.log('========================================');
    console.log(`  Website:  http://localhost:${PORT}`);
    console.log(`  Admin:    http://localhost:${PORT}/admin`);
    console.log(`  API:      http://localhost:${PORT}/api`);
    console.log('========================================');
    console.log('  Default Login:');
    console.log('    Username: admin');
    console.log('    Password: password');
    console.log('========================================');
});
