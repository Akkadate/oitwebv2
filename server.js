/* ============================================
   NBU IT Website - Backend Server
   Node.js + Express
   ============================================ */

const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const UPLOAD_DIR = path.join(__dirname, 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer config for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const name = Date.now() + '-' + Math.round(Math.random() * 1000) + ext;
        cb(null, name);
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif|webp|pdf|doc|docx|xls|xlsx|ppt|pptx/;
        const ext = allowed.test(path.extname(file.originalname).toLowerCase());
        const mime = allowed.test(file.mimetype);
        if (ext || mime) {
            cb(null, true);
        } else {
            cb(new Error('File type not allowed'));
        }
    }
});

// Middleware
app.use(express.json());
app.use(express.static(__dirname)); // Serve static files
app.use('/uploads', express.static(UPLOAD_DIR));

// ============================================
// Helper functions
// ============================================
function readJSON(filename) {
    const filepath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filepath)) return [];
    const raw = fs.readFileSync(filepath, 'utf-8');
    return JSON.parse(raw);
}

function writeJSON(filename, data) {
    const filepath = path.join(DATA_DIR, filename);
    fs.writeFileSync(filepath, JSON.stringify(data, null, 4), 'utf-8');
}

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

function getNextId(items) {
    if (items.length === 0) return 1;
    return Math.max(...items.map(item => item.id)) + 1;
}

// ============================================
// Auth middleware
// ============================================
function authMiddleware(req, res, next) {
    const token = req.headers['x-auth-token'];
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    // Simple token validation (token = base64 of username:hash)
    try {
        const decoded = Buffer.from(token, 'base64').toString('utf-8');
        const [username, hash] = decoded.split(':');
        const users = readJSON('users.json');
        const user = users.find(u => u.username === username && u.password === hash);
        if (!user) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    } catch (e) {
        return res.status(401).json({ error: 'Invalid token' });
    }
}

// ============================================
// AUTH API
// ============================================
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const users = readJSON('users.json');
    const hash = hashPassword(password);
    const user = users.find(u => u.username === username && u.password === hash);

    if (!user) {
        return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = Buffer.from(user.username + ':' + user.password).toString('base64');
    res.json({
        success: true,
        token,
        user: { id: user.id, username: user.username, name: user.name, role: user.role }
    });
});

app.post('/api/change-password', authMiddleware, (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const users = readJSON('users.json');
    const userIndex = users.findIndex(u => u.id === req.user.id);

    if (hashPassword(currentPassword) !== users[userIndex].password) {
        return res.status(400).json({ error: 'Current password is incorrect' });
    }

    users[userIndex].password = hashPassword(newPassword);
    writeJSON('users.json', users);

    const token = Buffer.from(users[userIndex].username + ':' + users[userIndex].password).toString('base64');
    res.json({ success: true, token });
});

// ============================================
// GENERIC CRUD API FACTORY
// ============================================
function createCrudRoutes(resourceName, filename) {
    const router = express.Router();

    // GET all (public)
    router.get('/', (req, res) => {
        const items = readJSON(filename);
        res.json(items);
    });

    // GET one (public)
    router.get('/:id', (req, res) => {
        const items = readJSON(filename);
        const item = items.find(i => i.id === parseInt(req.params.id));
        if (!item) return res.status(404).json({ error: 'Not found' });
        res.json(item);
    });

    // CREATE (protected)
    router.post('/', authMiddleware, (req, res) => {
        const items = readJSON(filename);
        const newItem = {
            id: getNextId(items),
            ...req.body
        };
        items.push(newItem);
        writeJSON(filename, items);
        res.status(201).json(newItem);
    });

    // UPDATE (protected)
    router.put('/:id', authMiddleware, (req, res) => {
        const items = readJSON(filename);
        const index = items.findIndex(i => i.id === parseInt(req.params.id));
        if (index === -1) return res.status(404).json({ error: 'Not found' });

        items[index] = { ...items[index], ...req.body, id: items[index].id };
        writeJSON(filename, items);
        res.json(items[index]);
    });

    // DELETE (protected)
    router.delete('/:id', authMiddleware, (req, res) => {
        let items = readJSON(filename);
        const index = items.findIndex(i => i.id === parseInt(req.params.id));
        if (index === -1) return res.status(404).json({ error: 'Not found' });

        const deleted = items.splice(index, 1)[0];
        writeJSON(filename, items);
        res.json({ success: true, deleted });
    });

    return router;
}

// Register CRUD routes
app.use('/api/news', createCrudRoutes('news', 'news.json'));
app.use('/api/announcements', createCrudRoutes('announcements', 'announcements.json'));
app.use('/api/documents', createCrudRoutes('documents', 'documents.json'));
app.use('/api/faq', createCrudRoutes('faq', 'faq.json'));
app.use('/api/services', createCrudRoutes('services', 'services.json'));

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
        url: '/uploads/' + req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size
    });
});

// ============================================
// DASHBOARD STATS API
// ============================================
app.get('/api/stats', authMiddleware, (req, res) => {
    const news = readJSON('news.json');
    const announcements = readJSON('announcements.json');
    const documents = readJSON('documents.json');
    const faq = readJSON('faq.json');
    const services = readJSON('services.json');

    res.json({
        news: news.length,
        newsPublished: news.filter(n => n.status === 'published').length,
        announcements: announcements.length,
        announcementsActive: announcements.filter(a => a.status === 'active').length,
        documents: documents.length,
        faq: faq.length,
        services: services.length,
        servicesPublished: services.filter(s => s.status === 'published').length
    });
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
