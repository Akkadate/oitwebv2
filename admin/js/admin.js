/* ============================================
   NBU IT - Admin Panel JavaScript
   ============================================ */

const API_BASE = '/api';
let authToken = localStorage.getItem('nbu_admin_token');
let currentPage = 'dashboard';
let editingId = null;
let editingType = null;

// ============================================
// AUTH
// ============================================
function checkAuth() {
    if (authToken) {
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'flex';
        const user = JSON.parse(localStorage.getItem('nbu_admin_user') || '{}');
        document.getElementById('adminName').textContent = user.name || 'Admin';
        loadDashboard();
    }
}

document.getElementById('loginForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const res = await fetch(API_BASE + '/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();

        if (data.success) {
            authToken = data.token;
            localStorage.setItem('nbu_admin_token', data.token);
            localStorage.setItem('nbu_admin_user', JSON.stringify(data.user));
            document.getElementById('loginPage').style.display = 'none';
            document.getElementById('adminPanel').style.display = 'flex';
            document.getElementById('adminName').textContent = data.user.name;
            loadDashboard();
        } else {
            showLoginError(data.error || 'เข้าสู่ระบบไม่สำเร็จ');
        }
    } catch (err) {
        showLoginError('ไม่สามารถเชื่อมต่อ Server ได้');
    }
});

function showLoginError(msg) {
    const el = document.getElementById('loginError');
    document.getElementById('loginErrorText').textContent = msg;
    el.style.display = 'block';
    setTimeout(() => el.style.display = 'none', 4000);
}

function logout() {
    authToken = null;
    localStorage.removeItem('nbu_admin_token');
    localStorage.removeItem('nbu_admin_user');
    document.getElementById('adminPanel').style.display = 'none';
    document.getElementById('loginPage').style.display = 'flex';
    document.getElementById('loginUsername').value = '';
    document.getElementById('loginPassword').value = '';
}

// ============================================
// API HELPERS
// ============================================
async function apiGet(endpoint) {
    const res = await fetch(API_BASE + endpoint, {
        headers: { 'X-Auth-Token': authToken }
    });
    return res.json();
}

async function apiPost(endpoint, data) {
    const res = await fetch(API_BASE + endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Auth-Token': authToken
        },
        body: JSON.stringify(data)
    });
    return res.json();
}

async function apiPut(endpoint, data) {
    const res = await fetch(API_BASE + endpoint, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-Auth-Token': authToken
        },
        body: JSON.stringify(data)
    });
    return res.json();
}

async function apiDelete(endpoint) {
    const res = await fetch(API_BASE + endpoint, {
        method: 'DELETE',
        headers: { 'X-Auth-Token': authToken }
    });
    return res.json();
}

// ============================================
// NAVIGATION
// ============================================
document.querySelectorAll('.sidebar-menu a[data-page]').forEach(link => {
    link.addEventListener('click', function (e) {
        e.preventDefault();
        const page = this.dataset.page;
        navigateTo(page);
    });
});

function navigateTo(page) {
    currentPage = page;
    document.querySelectorAll('.page-content').forEach(p => p.style.display = 'none');
    document.getElementById('page-' + page).style.display = 'block';
    document.querySelectorAll('.sidebar-menu a').forEach(a => a.classList.remove('active'));
    document.querySelector('.sidebar-menu a[data-page="' + page + '"]').classList.add('active');

    switch (page) {
        case 'dashboard': loadDashboard(); break;
        case 'news': loadNews(); break;
        case 'announcements': loadAnnouncements(); break;
        case 'documents': loadDocuments(); break;
        case 'services': loadServices(); break;
        case 'faq': loadFaq(); break;
    }
}

// ============================================
// DASHBOARD
// ============================================
async function loadDashboard() {
    try {
        const stats = await apiGet('/stats');
        document.getElementById('statNews').textContent = stats.news;
        document.getElementById('statAnnouncements').textContent = stats.announcements;
        document.getElementById('statDocuments').textContent = stats.documents;
        document.getElementById('statFaq').textContent = stats.faq;
        document.getElementById('statServices').textContent = stats.services;
    } catch (e) {
        console.error('Failed to load stats', e);
    }
}

// ============================================
// NEWS CRUD
// ============================================
async function loadNews() {
    const items = await apiGet('/news');
    const tbody = document.getElementById('newsTableBody');

    if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><i class="fas fa-newspaper"></i><p>ยังไม่มีข่าวสาร</p></div></td></tr>';
        return;
    }

    tbody.innerHTML = items.map(item => `
        <tr>
            <td><img src="${item.image || 'https://via.placeholder.com/60x40'}" class="img-thumb" alt=""></td>
            <td><strong>${item.title_th}</strong><br><small style="color:#999">${item.title_en || ''}</small></td>
            <td>${getCategoryLabel(item.category)}</td>
            <td>${formatDate(item.date)}</td>
            <td><span class="badge badge-${item.status}">${item.status === 'published' ? 'เผยแพร่' : 'ฉบับร่าง'}</span></td>
            <td>
                <div class="action-btns">
                    <button class="btn-edit" onclick="editItem('news', ${item.id})"><i class="fas fa-edit"></i></button>
                    <button class="btn-delete" onclick="deleteItem('news', ${item.id})"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

// ============================================
// ANNOUNCEMENTS CRUD
// ============================================
async function loadAnnouncements() {
    const items = await apiGet('/announcements');
    const tbody = document.getElementById('announcementsTableBody');

    if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5"><div class="empty-state"><i class="fas fa-bullhorn"></i><p>ยังไม่มีประกาศ</p></div></td></tr>';
        return;
    }

    tbody.innerHTML = items.map(item => `
        <tr>
            <td><strong>${item.title_th}</strong><br><small style="color:#999">${item.title_en || ''}</small></td>
            <td><span class="badge badge-${item.priority}">${getPriorityLabel(item.priority)}</span></td>
            <td>${formatDate(item.date)}</td>
            <td><span class="badge badge-${item.status}">${item.status === 'active' ? 'แสดง' : 'ซ่อน'}</span></td>
            <td>
                <div class="action-btns">
                    <button class="btn-edit" onclick="editItem('announcements', ${item.id})"><i class="fas fa-edit"></i></button>
                    <button class="btn-delete" onclick="deleteItem('announcements', ${item.id})"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

// ============================================
// DOCUMENTS CRUD
// ============================================
async function loadDocuments() {
    const items = await apiGet('/documents');
    const tbody = document.getElementById('documentsTableBody');

    if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5"><div class="empty-state"><i class="fas fa-file-alt"></i><p>ยังไม่มีเอกสาร</p></div></td></tr>';
        return;
    }

    tbody.innerHTML = items.map(item => `
        <tr>
            <td><i class="${item.icon || 'fas fa-file'}" style="font-size:24px;color:#003087;"></i></td>
            <td><strong>${item.title_th}</strong><br><small style="color:#999">${item.title_en || ''}</small></td>
            <td>${item.category || '-'}</td>
            <td><span class="badge badge-${item.status}">${item.status === 'published' ? 'เผยแพร่' : 'ฉบับร่าง'}</span></td>
            <td>
                <div class="action-btns">
                    <button class="btn-edit" onclick="editItem('documents', ${item.id})"><i class="fas fa-edit"></i></button>
                    <button class="btn-delete" onclick="deleteItem('documents', ${item.id})"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

// ============================================
// FAQ CRUD
// ============================================
async function loadFaq() {
    const items = await apiGet('/faq');
    const tbody = document.getElementById('faqTableBody');

    if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4"><div class="empty-state"><i class="fas fa-question-circle"></i><p>ยังไม่มีคำถาม</p></div></td></tr>';
        return;
    }

    tbody.innerHTML = items.map(item => `
        <tr>
            <td>${item.order || '-'}</td>
            <td><strong>${item.question_th}</strong><br><small style="color:#999">${item.question_en || ''}</small></td>
            <td><span class="badge badge-${item.status}">${item.status === 'published' ? 'เผยแพร่' : 'ฉบับร่าง'}</span></td>
            <td>
                <div class="action-btns">
                    <button class="btn-edit" onclick="editItem('faq', ${item.id})"><i class="fas fa-edit"></i></button>
                    <button class="btn-delete" onclick="deleteItem('faq', ${item.id})"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

// ============================================
// SERVICES CRUD
// ============================================
async function loadServices() {
    const items = await apiGet('/services');
    const tbody = document.getElementById('servicesTableBody');

    if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><i class="fas fa-th-large"></i><p>ยังไม่มีบริการ</p></div></td></tr>';
        return;
    }

    items.sort((a, b) => (a.order || 0) - (b.order || 0));

    tbody.innerHTML = items.map(item => `
        <tr>
            <td><i class="${item.icon || 'fas fa-cog'}" style="font-size:24px;color:#003087;"></i></td>
            <td><strong>${item.title_th}</strong><br><small style="color:#999">${item.title_en || ''}</small></td>
            <td>${getServiceCategoryLabel(item.category)}</td>
            <td>${item.order || '-'}</td>
            <td><span class="badge badge-${item.status}">${item.status === 'published' ? 'เผยแพร่' : 'ฉบับร่าง'}</span></td>
            <td>
                <div class="action-btns">
                    <button class="btn-edit" onclick="editItem('services', ${item.id})"><i class="fas fa-edit"></i></button>
                    <button class="btn-delete" onclick="deleteItem('services', ${item.id})"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

function getServiceCategoryLabel(cat) {
    const labels = {
        account: 'บัญชีผู้ใช้', email: 'อีเมล', software: 'ซอฟต์แวร์',
        network: 'เครือข่าย', facility: 'สิ่งอำนวยความสะดวก', other: 'อื่นๆ'
    };
    return labels[cat] || cat || '-';
}

// ============================================
// MODAL FORMS
// ============================================
function openModal(type, data = null) {
    editingType = type;
    editingId = data ? data.id : null;
    const isEdit = !!data;

    document.getElementById('modalTitle').textContent = isEdit ? 'แก้ไขข้อมูล' : 'เพิ่มข้อมูลใหม่';

    let formHTML = '';

    switch (type) {
        case 'news':
            formHTML = `
                <div class="form-row">
                    <div class="form-group">
                        <label>หัวข้อ (ไทย) <small>*</small></label>
                        <input type="text" class="form-control" id="f_title_th" value="${esc(data?.title_th)}" required>
                    </div>
                    <div class="form-group">
                        <label>หัวข้อ (English)</label>
                        <input type="text" class="form-control" id="f_title_en" value="${esc(data?.title_en)}">
                    </div>
                </div>
                <div class="form-group">
                    <label>เนื้อหาย่อ (ไทย) <small>— แสดงในหน้าแรก</small></label>
                    <textarea class="form-control" id="f_excerpt_th" rows="2">${esc(data?.excerpt_th)}</textarea>
                </div>
                <div class="form-group">
                    <label>เนื้อหาย่อ (English)</label>
                    <textarea class="form-control" id="f_excerpt_en" rows="2">${esc(data?.excerpt_en)}</textarea>
                </div>
                <div class="form-group">
                    <label>เนื้อหาเต็ม (ไทย) <small>— แสดงในหน้าอ่านข่าว</small></label>
                    <textarea class="form-control" id="f_content_th" rows="6" placeholder="เนื้อหาข่าวฉบับเต็ม... รองรับ HTML เช่น &lt;p&gt;, &lt;strong&gt;, &lt;ul&gt;">${esc(data?.content_th)}</textarea>
                </div>
                <div class="form-group">
                    <label>เนื้อหาเต็ม (English)</label>
                    <textarea class="form-control" id="f_content_en" rows="6" placeholder="Full news content... supports HTML">${esc(data?.content_en)}</textarea>
                </div>
                <div class="form-group">
                    <label>รูปภาพ</label>
                    <div class="image-upload-wrapper">
                        <div class="image-upload-row">
                            <input type="text" class="form-control" id="f_image" value="${esc(data?.image)}" placeholder="วาง URL หรือกดอัปโหลด...">
                            <label class="btn-upload" for="f_image_file"><i class="fas fa-cloud-upload-alt"></i> อัปโหลด</label>
                            <input type="file" id="f_image_file" accept="image/*" style="display:none" onchange="uploadImage(this)">
                        </div>
                        <div class="image-preview-box" id="f_image_preview" ${data?.image ? '' : 'style="display:none"'}>
                            ${data?.image ? '<img src="' + esc(data.image) + '" alt="preview">' : ''}
                            <button type="button" class="btn-remove-img" onclick="removeImage()"><i class="fas fa-times"></i></button>
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <label>วันที่</label>
                    <input type="date" class="form-control" id="f_date" value="${data?.date || new Date().toISOString().split('T')[0]}">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>หมวดหมู่</label>
                        <select class="form-control" id="f_category">
                            <option value="general" ${data?.category === 'general' ? 'selected' : ''}>ทั่วไป</option>
                            <option value="training" ${data?.category === 'training' ? 'selected' : ''}>อบรม</option>
                            <option value="service" ${data?.category === 'service' ? 'selected' : ''}>บริการ</option>
                            <option value="maintenance" ${data?.category === 'maintenance' ? 'selected' : ''}>ปรับปรุงระบบ</option>
                            <option value="security" ${data?.category === 'security' ? 'selected' : ''}>ความปลอดภัย</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>สถานะ</label>
                        <select class="form-control" id="f_status">
                            <option value="published" ${data?.status === 'published' ? 'selected' : ''}>เผยแพร่</option>
                            <option value="draft" ${data?.status === 'draft' ? 'selected' : ''}>ฉบับร่าง</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="f_featured" ${data?.featured ? 'checked' : ''}> แสดงเป็นข่าวเด่น (Carousel)
                    </label>
                </div>
            `;
            break;

        case 'announcements':
            formHTML = `
                <div class="form-row">
                    <div class="form-group">
                        <label>หัวข้อ (ไทย) <small>*</small></label>
                        <input type="text" class="form-control" id="f_title_th" value="${esc(data?.title_th)}" required>
                    </div>
                    <div class="form-group">
                        <label>หัวข้อ (English)</label>
                        <input type="text" class="form-control" id="f_title_en" value="${esc(data?.title_en)}">
                    </div>
                </div>
                <div class="form-group">
                    <label>เนื้อหา (ไทย)</label>
                    <textarea class="form-control" id="f_content_th">${esc(data?.content_th)}</textarea>
                </div>
                <div class="form-group">
                    <label>เนื้อหา (English)</label>
                    <textarea class="form-control" id="f_content_en">${esc(data?.content_en)}</textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>ความสำคัญ</label>
                        <select class="form-control" id="f_priority">
                            <option value="high" ${data?.priority === 'high' ? 'selected' : ''}>สูง</option>
                            <option value="medium" ${data?.priority === 'medium' ? 'selected' : ''}>กลาง</option>
                            <option value="low" ${data?.priority === 'low' ? 'selected' : ''}>ต่ำ</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>สถานะ</label>
                        <select class="form-control" id="f_status">
                            <option value="active" ${data?.status === 'active' ? 'selected' : ''}>แสดง</option>
                            <option value="inactive" ${data?.status === 'inactive' ? 'selected' : ''}>ซ่อน</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label>วันที่</label>
                    <input type="date" class="form-control" id="f_date" value="${data?.date || new Date().toISOString().split('T')[0]}">
                </div>
            `;
            break;

        case 'documents':
            formHTML = `
                <div class="form-row">
                    <div class="form-group">
                        <label>ชื่อเอกสาร (ไทย) <small>*</small></label>
                        <input type="text" class="form-control" id="f_title_th" value="${esc(data?.title_th)}" required>
                    </div>
                    <div class="form-group">
                        <label>ชื่อเอกสาร (English)</label>
                        <input type="text" class="form-control" id="f_title_en" value="${esc(data?.title_en)}">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>คำอธิบาย (ไทย)</label>
                        <input type="text" class="form-control" id="f_description_th" value="${esc(data?.description_th)}">
                    </div>
                    <div class="form-group">
                        <label>คำอธิบาย (English)</label>
                        <input type="text" class="form-control" id="f_description_en" value="${esc(data?.description_en)}">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>ไอคอน <small>(Font Awesome class)</small></label>
                        <input type="text" class="form-control" id="f_icon" value="${esc(data?.icon)}" placeholder="fas fa-file-pdf">
                    </div>
                    <div class="form-group">
                        <label>URL ไฟล์</label>
                        <input type="text" class="form-control" id="f_file_url" value="${esc(data?.file_url)}" placeholder="https://... หรือ /uploads/...">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>หมวดหมู่</label>
                        <select class="form-control" id="f_category">
                            <option value="cybersecurity" ${data?.category === 'cybersecurity' ? 'selected' : ''}>ความมั่นคงปลอดภัยไซเบอร์</option>
                            <option value="policy" ${data?.category === 'policy' ? 'selected' : ''}>นโยบาย</option>
                            <option value="report" ${data?.category === 'report' ? 'selected' : ''}>รายงาน</option>
                            <option value="manual" ${data?.category === 'manual' ? 'selected' : ''}>คู่มือ</option>
                            <option value="other" ${data?.category === 'other' ? 'selected' : ''}>อื่นๆ</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>สถานะ</label>
                        <select class="form-control" id="f_status">
                            <option value="published" ${data?.status === 'published' ? 'selected' : ''}>เผยแพร่</option>
                            <option value="draft" ${data?.status === 'draft' ? 'selected' : ''}>ฉบับร่าง</option>
                        </select>
                    </div>
                </div>
            `;
            break;

        case 'services':
            formHTML = `
                <div class="form-row">
                    <div class="form-group">
                        <label>ชื่อบริการ (ไทย) <small>*</small></label>
                        <input type="text" class="form-control" id="f_title_th" value="${esc(data?.title_th)}" required>
                    </div>
                    <div class="form-group">
                        <label>ชื่อบริการ (English)</label>
                        <input type="text" class="form-control" id="f_title_en" value="${esc(data?.title_en)}">
                    </div>
                </div>
                <div class="form-group">
                    <label>คำอธิบายสั้น (ไทย)</label>
                    <textarea class="form-control" id="f_description_th" rows="2">${esc(data?.description_th)}</textarea>
                </div>
                <div class="form-group">
                    <label>คำอธิบายสั้น (English)</label>
                    <textarea class="form-control" id="f_description_en" rows="2">${esc(data?.description_en)}</textarea>
                </div>
                <div class="form-group">
                    <label>เนื้อหาเต็ม (ไทย) <small>— แสดงในหน้ารายละเอียดบริการ</small></label>
                    <textarea class="form-control" id="f_content_th" rows="6" placeholder="เนื้อหาบริการฉบับเต็ม... รองรับ HTML">${esc(data?.content_th)}</textarea>
                </div>
                <div class="form-group">
                    <label>เนื้อหาเต็ม (English)</label>
                    <textarea class="form-control" id="f_content_en" rows="6">${esc(data?.content_en)}</textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>ไอคอน <small>(Font Awesome class)</small></label>
                        <input type="text" class="form-control" id="f_icon" value="${esc(data?.icon)}" placeholder="fas fa-cog">
                    </div>
                    <div class="form-group">
                        <label>รูปภาพ (URL)</label>
                        <div class="image-upload-wrapper">
                            <div class="image-upload-row">
                                <input type="text" class="form-control" id="f_image" value="${esc(data?.image)}" placeholder="วาง URL หรือกดอัปโหลด...">
                                <label class="btn-upload" for="f_image_file"><i class="fas fa-cloud-upload-alt"></i> อัปโหลด</label>
                                <input type="file" id="f_image_file" accept="image/*" style="display:none" onchange="uploadImage(this)">
                            </div>
                            <div class="image-preview-box" id="f_image_preview" ${data?.image ? '' : 'style="display:none"'}>
                                ${data?.image ? '<img src="' + esc(data.image) + '" alt="preview">' : ''}
                                <button type="button" class="btn-remove-img" onclick="removeImage()"><i class="fas fa-times"></i></button>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>หมวดหมู่</label>
                        <select class="form-control" id="f_category">
                            <option value="account" ${data?.category === 'account' ? 'selected' : ''}>บัญชีผู้ใช้</option>
                            <option value="email" ${data?.category === 'email' ? 'selected' : ''}>อีเมล</option>
                            <option value="software" ${data?.category === 'software' ? 'selected' : ''}>ซอฟต์แวร์</option>
                            <option value="network" ${data?.category === 'network' ? 'selected' : ''}>เครือข่าย</option>
                            <option value="facility" ${data?.category === 'facility' ? 'selected' : ''}>สิ่งอำนวยความสะดวก</option>
                            <option value="other" ${data?.category === 'other' ? 'selected' : ''}>อื่นๆ</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>ลำดับการแสดง</label>
                        <input type="number" class="form-control" id="f_order" value="${data?.order || 1}" min="1">
                    </div>
                </div>
                <div class="form-group">
                    <label>สถานะ</label>
                    <select class="form-control" id="f_status">
                        <option value="published" ${data?.status === 'published' ? 'selected' : ''}>เผยแพร่</option>
                        <option value="draft" ${data?.status === 'draft' ? 'selected' : ''}>ฉบับร่าง</option>
                    </select>
                </div>
            `;
            break;

        case 'faq':
            formHTML = `
                <div class="form-group">
                    <label>คำถาม (ไทย) <small>*</small></label>
                    <input type="text" class="form-control" id="f_question_th" value="${esc(data?.question_th)}" required>
                </div>
                <div class="form-group">
                    <label>คำถาม (English)</label>
                    <input type="text" class="form-control" id="f_question_en" value="${esc(data?.question_en)}">
                </div>
                <div class="form-group">
                    <label>คำตอบ (ไทย)</label>
                    <textarea class="form-control" id="f_answer_th">${esc(data?.answer_th)}</textarea>
                </div>
                <div class="form-group">
                    <label>คำตอบ (English)</label>
                    <textarea class="form-control" id="f_answer_en">${esc(data?.answer_en)}</textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>ลำดับการแสดง</label>
                        <input type="number" class="form-control" id="f_order" value="${data?.order || 1}" min="1">
                    </div>
                    <div class="form-group">
                        <label>สถานะ</label>
                        <select class="form-control" id="f_status">
                            <option value="published" ${data?.status === 'published' ? 'selected' : ''}>เผยแพร่</option>
                            <option value="draft" ${data?.status === 'draft' ? 'selected' : ''}>ฉบับร่าง</option>
                        </select>
                    </div>
                </div>
            `;
            break;
    }

    document.getElementById('modalBody').innerHTML = formHTML;
    document.getElementById('formModal').classList.add('show');
}

function closeModal() {
    document.getElementById('formModal').classList.remove('show');
    editingId = null;
    editingType = null;
}

// ============================================
// SAVE ITEM
// ============================================
async function saveItem() {
    let data = {};

    switch (editingType) {
        case 'news':
            data = {
                title_th: gv('f_title_th'),
                title_en: gv('f_title_en'),
                excerpt_th: gv('f_excerpt_th'),
                excerpt_en: gv('f_excerpt_en'),
                content_th: gv('f_content_th'),
                content_en: gv('f_content_en'),
                image: gv('f_image'),
                date: gv('f_date'),
                category: gv('f_category'),
                status: gv('f_status'),
                featured: document.getElementById('f_featured').checked
            };
            if (!data.title_th) return showToast('กรุณากรอกหัวข้อ', 'error');
            break;

        case 'announcements':
            data = {
                title_th: gv('f_title_th'),
                title_en: gv('f_title_en'),
                content_th: gv('f_content_th'),
                content_en: gv('f_content_en'),
                priority: gv('f_priority'),
                status: gv('f_status'),
                date: gv('f_date')
            };
            if (!data.title_th) return showToast('กรุณากรอกหัวข้อ', 'error');
            break;

        case 'documents':
            data = {
                title_th: gv('f_title_th'),
                title_en: gv('f_title_en'),
                description_th: gv('f_description_th'),
                description_en: gv('f_description_en'),
                icon: gv('f_icon'),
                file_url: gv('f_file_url'),
                category: gv('f_category'),
                status: gv('f_status')
            };
            if (!data.title_th) return showToast('กรุณากรอกชื่อเอกสาร', 'error');
            break;

        case 'services':
            data = {
                title_th: gv('f_title_th'),
                title_en: gv('f_title_en'),
                description_th: gv('f_description_th'),
                description_en: gv('f_description_en'),
                content_th: gv('f_content_th'),
                content_en: gv('f_content_en'),
                icon: gv('f_icon'),
                image: gv('f_image'),
                category: gv('f_category'),
                order: parseInt(gv('f_order')) || 1,
                status: gv('f_status')
            };
            if (!data.title_th) return showToast('กรุณากรอกชื่อบริการ', 'error');
            break;

        case 'faq':
            data = {
                question_th: gv('f_question_th'),
                question_en: gv('f_question_en'),
                answer_th: gv('f_answer_th'),
                answer_en: gv('f_answer_en'),
                order: parseInt(gv('f_order')) || 1,
                status: gv('f_status')
            };
            if (!data.question_th) return showToast('กรุณากรอกคำถาม', 'error');
            break;
    }

    try {
        if (editingId) {
            await apiPut(`/${editingType}/${editingId}`, data);
            showToast('แก้ไขข้อมูลสำเร็จ', 'success');
        } else {
            await apiPost(`/${editingType}`, data);
            showToast('เพิ่มข้อมูลสำเร็จ', 'success');
        }
        closeModal();
        navigateTo(editingType || currentPage);
    } catch (err) {
        showToast('เกิดข้อผิดพลาด: ' + err.message, 'error');
    }
}

// ============================================
// EDIT ITEM
// ============================================
async function editItem(type, id) {
    try {
        const data = await apiGet(`/${type}/${id}`);
        openModal(type, data);
    } catch (err) {
        showToast('ไม่สามารถโหลดข้อมูลได้', 'error');
    }
}

// ============================================
// DELETE ITEM
// ============================================
function deleteItem(type, id) {
    const overlay = document.getElementById('confirmDelete');
    overlay.classList.add('show');

    document.getElementById('btnConfirmDelete').onclick = async function () {
        try {
            await apiDelete(`/${type}/${id}`);
            showToast('ลบข้อมูลสำเร็จ', 'success');
            closeConfirm();
            navigateTo(type);
        } catch (err) {
            showToast('เกิดข้อผิดพลาด', 'error');
        }
    };
}

function closeConfirm() {
    document.getElementById('confirmDelete').classList.remove('show');
}

// ============================================
// HELPERS
// ============================================
function gv(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
}

function esc(val) {
    if (!val) return '';
    return String(val).replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`;
}

function getCategoryLabel(cat) {
    const labels = {
        general: 'ทั่วไป', training: 'อบรม', service: 'บริการ',
        maintenance: 'ปรับปรุงระบบ', security: 'ความปลอดภัย'
    };
    return labels[cat] || cat || '-';
}

function getPriorityLabel(p) {
    const labels = { high: 'สูง', medium: 'กลาง', low: 'ต่ำ' };
    return labels[p] || p || '-';
}

function showToast(msg, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.className = 'toast toast-' + type + ' show';
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// ============================================
// IMAGE UPLOAD
// ============================================
async function uploadImage(input) {
    const file = input.files[0];
    if (!file) return;

    // Validate
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
        showToast('ไฟล์ใหญ่เกิน 10MB', 'error');
        input.value = '';
        return;
    }

    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowed.includes(file.type)) {
        showToast('รองรับเฉพาะไฟล์ JPG, PNG, GIF, WebP', 'error');
        input.value = '';
        return;
    }

    // Show uploading state
    showToast('กำลังอัปโหลด...', 'success');

    const formData = new FormData();
    formData.append('file', file);

    try {
        const res = await fetch(API_BASE + '/upload', {
            method: 'POST',
            headers: { 'X-Auth-Token': authToken },
            body: formData
        });
        const result = await res.json();

        if (result.success) {
            document.getElementById('f_image').value = result.url;
            showImagePreview(result.url);
            showToast('อัปโหลดสำเร็จ', 'success');
        } else {
            showToast('อัปโหลดไม่สำเร็จ: ' + (result.error || ''), 'error');
        }
    } catch (err) {
        showToast('อัปโหลดไม่สำเร็จ', 'error');
    }

    input.value = '';
}

function showImagePreview(url) {
    const box = document.getElementById('f_image_preview');
    if (!box) return;
    box.innerHTML = '<img src="' + url + '" alt="preview"><button type="button" class="btn-remove-img" onclick="removeImage()"><i class="fas fa-times"></i></button>';
    box.style.display = 'block';
}

function removeImage() {
    document.getElementById('f_image').value = '';
    const box = document.getElementById('f_image_preview');
    if (box) {
        box.innerHTML = '';
        box.style.display = 'none';
    }
}

// Auto-preview when URL is typed/pasted
document.addEventListener('change', function(e) {
    if (e.target && e.target.id === 'f_image') {
        const val = e.target.value.trim();
        if (val) {
            showImagePreview(val);
        } else {
            removeImage();
        }
    }
});

// ============================================
// INIT
// ============================================
checkAuth();
