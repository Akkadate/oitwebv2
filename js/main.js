/* ============================================
   สำนักเทคโนโลยีสารสนเทศ มหาวิทยาลัยนอร์ทกรุงเทพ
   NBU IT - Main JavaScript
   ============================================ */

const API = '/api';
const MONTHS_TH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

function formatDateTh(dateStr) {
    var d = new Date(dateStr);
    return d.getDate() + ' ' + MONTHS_TH[d.getMonth()] + ' ' + (d.getFullYear() + 543);
}

function getCategoryTag(cat) {
    var labels = { general: 'ทั่วไป', training: 'อบรม', service: 'บริการ', maintenance: 'ปรับปรุง', security: 'ความปลอดภัย' };
    return labels[cat] || 'ข่าว';
}

$(document).ready(function () {

    // ============================================
    // Load dynamic content from API
    // ============================================
    loadFeaturedNews();
    loadNews();
    loadAnnouncements();
    loadDocuments();
    loadServices();
    loadFaq();

    // ============================================
    // FEATURED NEWS CAROUSEL
    // ============================================
    function loadFeaturedNews() {
        $.getJSON(API + '/news', function (data) {
            var featured = data.filter(function (n) { return n.featured && n.status === 'published'; });
            var container = $('#featuredCarousel');
            container.empty();

            if (featured.length === 0) return;

            featured.forEach(function (item) {
                container.append(
                    '<div class="news-slide">' +
                    '  <img src="' + (item.image || 'https://via.placeholder.com/800x350') + '" alt="' + item.title_th + '">' +
                    '  <div class="news-overlay">' +
                    '    <span class="news-tag">' + getCategoryTag(item.category) + '</span>' +
                    '    <h4>' + item.title_th + '</h4>' +
                    '    <p>' + (item.excerpt_th || '').substring(0, 100) + '</p>' +
                    '  </div>' +
                    '</div>'
                );
            });

            // Init Owl Carousel after data loaded
            container.owlCarousel({
                loop: true,
                margin: 20,
                nav: true,
                dots: true,
                autoplay: true,
                autoplayTimeout: 4000,
                autoplayHoverPause: true,
                smartSpeed: 600,
                navText: [
                    '<i class="fas fa-chevron-left"></i>',
                    '<i class="fas fa-chevron-right"></i>'
                ],
                responsive: {
                    0: { items: 1 },
                    768: { items: 2 },
                    1024: { items: 3 }
                }
            });
        });
    }

    // ============================================
    // NEWS GRID
    // ============================================
    function loadNews() {
        $.getJSON(API + '/news', function (data) {
            var published = data.filter(function (n) { return n.status === 'published'; });
            published.sort(function (a, b) { return new Date(b.date) - new Date(a.date); });
            var latest = published.slice(0, 3);
            var container = $('#newsGrid');
            container.empty();

            latest.forEach(function (item) {
                container.append(
                    '<div class="col-lg-4 col-md-6">' +
                    '  <div class="news-card fade-in">' +
                    '    <div class="card-img-wrapper">' +
                    '      <img src="' + (item.image || 'https://via.placeholder.com/600x200') + '" alt="' + item.title_th + '">' +
                    '      <span class="card-date"><i class="far fa-calendar-alt me-1"></i> ' + formatDateTh(item.date) + '</span>' +
                    '    </div>' +
                    '    <div class="card-body">' +
                    '      <h5>' + item.title_th + '</h5>' +
                    '      <p>' + (item.excerpt_th || '') + '</p>' +
                    '      <a href="/news-detail.html?id=' + item.id + '" class="read-more">อ่านเพิ่มเติม <i class="fas fa-arrow-right"></i></a>' +
                    '    </div>' +
                    '  </div>' +
                    '</div>'
                );
            });

            checkFadeIn();
        });
    }

    // ============================================
    // ANNOUNCEMENTS
    // ============================================
    function loadAnnouncements() {
        $.getJSON(API + '/announcements', function (data) {
            var active = data.filter(function (a) { return a.status === 'active'; });
            if (active.length === 0) return;

            var texts = active.map(function (a) { return a.title_th + ' — ' + a.content_th; });
            $('#announcementText').text(texts.join(' | '));
        });
    }

    // ============================================
    // DOCUMENTS
    // ============================================
    function loadDocuments() {
        $.getJSON(API + '/documents', function (data) {
            var published = data.filter(function (d) { return d.status === 'published'; });
            var container = $('#documentsGrid');
            container.empty();

            published.forEach(function (item) {
                container.append(
                    '<div class="col-lg-3 col-md-6">' +
                    '  <div class="doc-card fade-in">' +
                    '    <div class="doc-thumbnail">' +
                    '      <i class="' + (item.icon || 'fas fa-file') + '"></i>' +
                    '    </div>' +
                    '    <div class="doc-info">' +
                    '      <h5>' + item.title_th + '</h5>' +
                    '      <p>' + (item.description_th || '') + '</p>' +
                    '      <a href="' + (item.file_url || '#') + '" class="btn-nbu" style="font-size:13px;padding:6px 18px;"><i class="fas fa-download me-1"></i> ดาวน์โหลด</a>' +
                    '    </div>' +
                    '  </div>' +
                    '</div>'
                );
            });

            checkFadeIn();
        });
    }

    // ============================================
    // SERVICES
    // ============================================
    function loadServices() {
        $.getJSON(API + '/services', function (data) {
            var published = data.filter(function (s) { return s.status === 'published'; });
            published.sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
            var homepage = published.slice(0, 8); // แสดงแค่ 8 รายการในหน้าแรก
            var container = $('#servicesGrid');
            container.empty();

            homepage.forEach(function (item) {
                container.append(
                    '<div class="col-lg-3 col-md-4 col-sm-6">' +
                    '  <a href="/service-detail.html?id=' + item.id + '" style="text-decoration:none;">' +
                    '    <div class="service-card fade-in">' +
                    '      <div class="service-icon">' +
                    '        <i class="' + (item.icon || 'fas fa-cog') + '"></i>' +
                    '      </div>' +
                    '      <h5>' + item.title_th + '</h5>' +
                    '      <p>' + (item.description_th || '') + '</p>' +
                    '      <span class="service-link">รายละเอียด <i class="fas fa-arrow-right"></i></span>' +
                    '    </div>' +
                    '  </a>' +
                    '</div>'
                );
            });

            checkFadeIn();
        });
    }

    // ============================================
    // FAQ
    // ============================================
    function loadFaq() {
        $.getJSON(API + '/faq', function (data) {
            var published = data.filter(function (f) { return f.status === 'published'; });
            published.sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
            var container = $('#faqList');
            container.empty();

            published.forEach(function (item, idx) {
                container.append(
                    '<div class="faq-item' + (idx === 0 ? ' active' : '') + '">' +
                    '  <div class="faq-question">' +
                    '    <span>' + item.question_th + '</span>' +
                    '    <i class="fas fa-chevron-down"></i>' +
                    '  </div>' +
                    '  <div class="faq-answer"' + (idx === 0 ? '' : ' style="display:none"') + '>' +
                    '    <p>' + item.answer_th + '</p>' +
                    '  </div>' +
                    '</div>'
                );
            });

            // Re-bind FAQ click
            $(document).on('click', '.faq-question', function () {
                var parent = $(this).closest('.faq-item');
                if (parent.hasClass('active')) {
                    parent.removeClass('active');
                    parent.find('.faq-answer').slideUp();
                } else {
                    $('.faq-item').removeClass('active').find('.faq-answer').slideUp();
                    parent.addClass('active');
                    parent.find('.faq-answer').slideDown();
                }
            });
        });
    }

    // ============================================
    // Navbar scroll effect
    // ============================================
    $(window).on('scroll', function () {
        var scrollTop = $(this).scrollTop();

        if (scrollTop > 50) {
            $('#mainNavbar').addClass('scrolled');
        } else {
            $('#mainNavbar').removeClass('scrolled');
        }

        if (scrollTop > 400) {
            $('#backToTop').addClass('show');
        } else {
            $('#backToTop').removeClass('show');
        }
    });

    // ============================================
    // Back to top
    // ============================================
    $('#backToTop').on('click', function () {
        $('html, body').animate({ scrollTop: 0 }, 600);
    });

    // ============================================
    // Smooth scroll for anchor links
    // ============================================
    $('a[href^="#"]').on('click', function (e) {
        var target = $(this.getAttribute('href'));
        if (target.length) {
            e.preventDefault();
            $('html, body').animate({
                scrollTop: target.offset().top - 70
            }, 600);
            $('.navbar-collapse').collapse('hide');
        }
    });

    // ============================================
    // Fade-in animation on scroll
    // ============================================
    function checkFadeIn() {
        var windowHeight = $(window).height();
        var scrollTop = $(window).scrollTop();

        $('.fade-in').each(function () {
            var elementTop = $(this).offset().top;
            if (elementTop < scrollTop + windowHeight - 80) {
                $(this).addClass('visible');
            }
        });
    }

    $(window).on('scroll', checkFadeIn);
    checkFadeIn();

    // ============================================
    // Active nav link on scroll
    // ============================================
    $(window).on('scroll', function () {
        var scrollPos = $(this).scrollTop() + 100;

        $('section[id]').each(function () {
            var sectionTop = $(this).offset().top - 100;
            var sectionBottom = sectionTop + $(this).outerHeight();
            var sectionId = $(this).attr('id');

            if (scrollPos >= sectionTop && scrollPos < sectionBottom) {
                $('.nav-link').removeClass('active');
                $('.nav-link[href="#' + sectionId + '"]').addClass('active');
            }
        });
    });

});
