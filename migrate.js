/* ============================================
   Migrate JSON data to Supabase PostgreSQL
   Run: node migrate.js
   ============================================ */

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const DATA_DIR = path.join(__dirname, 'data');

function readJSON(filename) {
    const filepath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filepath)) return [];
    return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
}

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('Connected to Supabase PostgreSQL');

        // ============================================
        // 1. Create tables
        // ============================================
        console.log('\n--- Creating tables ---');

        await client.query(`
            CREATE TABLE IF NOT EXISTS news (
                id SERIAL PRIMARY KEY,
                title_th TEXT,
                title_en TEXT,
                excerpt_th TEXT,
                excerpt_en TEXT,
                content_th TEXT,
                content_en TEXT,
                image TEXT,
                date DATE,
                category VARCHAR(50),
                featured BOOLEAN DEFAULT false,
                status VARCHAR(20) DEFAULT 'draft'
            );

            CREATE TABLE IF NOT EXISTS announcements (
                id SERIAL PRIMARY KEY,
                title_th TEXT,
                title_en TEXT,
                content_th TEXT,
                content_en TEXT,
                priority VARCHAR(20) DEFAULT 'medium',
                status VARCHAR(20) DEFAULT 'active',
                date DATE
            );

            CREATE TABLE IF NOT EXISTS documents (
                id SERIAL PRIMARY KEY,
                title_th TEXT,
                title_en TEXT,
                description_th TEXT,
                description_en TEXT,
                icon VARCHAR(100),
                file_url TEXT,
                category VARCHAR(50),
                status VARCHAR(20) DEFAULT 'published'
            );

            CREATE TABLE IF NOT EXISTS faq (
                id SERIAL PRIMARY KEY,
                question_th TEXT,
                question_en TEXT,
                answer_th TEXT,
                answer_en TEXT,
                "order" INTEGER DEFAULT 0,
                status VARCHAR(20) DEFAULT 'published'
            );

            CREATE TABLE IF NOT EXISTS services (
                id SERIAL PRIMARY KEY,
                title_th TEXT,
                title_en TEXT,
                description_th TEXT,
                description_en TEXT,
                content_th TEXT,
                content_en TEXT,
                icon VARCHAR(100),
                image TEXT,
                category VARCHAR(50),
                "order" INTEGER DEFAULT 0,
                status VARCHAR(20) DEFAULT 'published'
            );

            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(100) UNIQUE,
                password VARCHAR(255),
                name TEXT,
                role VARCHAR(50) DEFAULT 'admin'
            );
        `);
        console.log('Tables created successfully');

        // ============================================
        // 2. Insert data
        // ============================================

        // News
        const news = readJSON('news.json');
        for (const item of news) {
            await client.query(
                `INSERT INTO news (id, title_th, title_en, excerpt_th, excerpt_en, content_th, content_en, image, date, category, featured, status)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT (id) DO NOTHING`,
                [item.id, item.title_th, item.title_en, item.excerpt_th, item.excerpt_en, item.content_th, item.content_en, item.image, item.date, item.category, item.featured, item.status]
            );
        }
        console.log(`Inserted ${news.length} news items`);

        // Announcements
        const announcements = readJSON('announcements.json');
        for (const item of announcements) {
            await client.query(
                `INSERT INTO announcements (id, title_th, title_en, content_th, content_en, priority, status, date)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (id) DO NOTHING`,
                [item.id, item.title_th, item.title_en, item.content_th, item.content_en, item.priority, item.status, item.date]
            );
        }
        console.log(`Inserted ${announcements.length} announcements`);

        // Documents
        const documents = readJSON('documents.json');
        for (const item of documents) {
            await client.query(
                `INSERT INTO documents (id, title_th, title_en, description_th, description_en, icon, file_url, category, status)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (id) DO NOTHING`,
                [item.id, item.title_th, item.title_en, item.description_th, item.description_en, item.icon, item.file_url, item.category, item.status]
            );
        }
        console.log(`Inserted ${documents.length} documents`);

        // FAQ
        const faq = readJSON('faq.json');
        for (const item of faq) {
            await client.query(
                `INSERT INTO faq (id, question_th, question_en, answer_th, answer_en, "order", status)
                 VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO NOTHING`,
                [item.id, item.question_th, item.question_en, item.answer_th, item.answer_en, item.order, item.status]
            );
        }
        console.log(`Inserted ${faq.length} FAQ items`);

        // Services
        const services = readJSON('services.json');
        for (const item of services) {
            await client.query(
                `INSERT INTO services (id, title_th, title_en, description_th, description_en, content_th, content_en, icon, image, category, "order", status)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT (id) DO NOTHING`,
                [item.id, item.title_th, item.title_en, item.description_th, item.description_en, item.content_th, item.content_en, item.icon, item.image, item.category, item.order, item.status]
            );
        }
        console.log(`Inserted ${services.length} services`);

        // Users
        const users = readJSON('users.json');
        for (const item of users) {
            await client.query(
                `INSERT INTO users (id, username, password, name, role)
                 VALUES ($1,$2,$3,$4,$5) ON CONFLICT (id) DO NOTHING`,
                [item.id, item.username, item.password, item.name, item.role]
            );
        }
        console.log(`Inserted ${users.length} users`);

        // Reset sequences
        await client.query(`SELECT setval('news_id_seq', (SELECT COALESCE(MAX(id),0) FROM news));`);
        await client.query(`SELECT setval('announcements_id_seq', (SELECT COALESCE(MAX(id),0) FROM announcements));`);
        await client.query(`SELECT setval('documents_id_seq', (SELECT COALESCE(MAX(id),0) FROM documents));`);
        await client.query(`SELECT setval('faq_id_seq', (SELECT COALESCE(MAX(id),0) FROM faq));`);
        await client.query(`SELECT setval('services_id_seq', (SELECT COALESCE(MAX(id),0) FROM services));`);
        await client.query(`SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id),0) FROM users));`);

        console.log('\n--- Migration complete! ---');

    } catch (err) {
        console.error('Migration error:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
