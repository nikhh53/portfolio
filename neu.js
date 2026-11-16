/*
 * Neues Portfolio: Scroll-Effekte und persönliche Begrüßung.
 * Alles läuft über einen einzigen requestAnimationFrame-Durchlauf pro Bild;
 * ohne JavaScript bleibt die Seite als normale Seite lesbar.
 */
document.documentElement.classList.add('js');

const COMPANY_MAX_LENGTH = 40;
const CONTACT_EMAIL = 'nikhh53@gmail.com';
const MARQUEE_SPEED = 0.25;

const $ = selector => document.querySelector(selector);
const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const pageTop = element => element.getBoundingClientRect().top + window.scrollY;

// Firmenname aus dem Link (?firma=...), nur als Text verwendet, nie als HTML
const company = (new URLSearchParams(window.location.search).get('firma') || '')
    .replace(/[\u0000-\u001f<>]/g, '')
    .trim()
    .slice(0, COMPANY_MAX_LENGTH);

if (company) {
    const hello = $('#hello');
    hello.textContent = `Schön, dass Sie da sind, ${company}!`;
    hello.hidden = false;
    document.querySelectorAll('a[href^="mailto:"]').forEach(link => {
        const subject = encodeURIComponent(`Praktikum bei ${company} ab Juni 2027`);
        link.href = `mailto:${CONTACT_EMAIL}?subject=${subject}`;
    });
}

// Einträge blenden beim ersten Sichtbarwerden ein
const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('in');
    });
}, { threshold: 0.2 });
document.querySelectorAll('.reveal').forEach(element => revealObserver.observe(element));

// Über-mich-Text wird Wort für Wort eingefärbt
const aboutText = $('#about-text');
aboutText.querySelectorAll('p').forEach(paragraph => {
    paragraph.innerHTML = paragraph.textContent
        .split(' ')
        .map(word => `<span class="word">${word.replace(/[<>&]/g, '')}</span>`)
        .join(' ');
});
const words = [...aboutText.querySelectorAll('.word')];

// Projekte laufen seitlich, solange die Seite senkrecht gescrollt wird
const projects = $('#projects');
const track = $('#track');
const projectCount = track.children.length;

function sizeProjects() {
    projects.style.height = `${track.scrollWidth - window.innerWidth + window.innerHeight}px`;
}
window.addEventListener('resize', sizeProjects);
window.addEventListener('load', sizeProjects);
sizeProjects();

// Lichtkegel im Start folgt der Maus
window.addEventListener('mousemove', event => {
    const hero = $('#hero').style;
    hero.setProperty('--mx', `${event.clientX}px`);
    hero.setProperty('--my', `${event.clientY}px`);
});

function update() {
    const scrollY = window.scrollY;
    const viewport = window.innerHeight;

    $('#progress').style.transform = `scaleX(${scrollY / (document.body.scrollHeight - viewport)})`;

    const heroShift = clamp(scrollY / viewport);
    $('#surname').style.transform = `translateX(${-heroShift * 18}vw)`;
    $('#portrait').style.transform = `translateY(${heroShift * 14}vh) scale(${1 + heroShift * 0.08})`;
    $('#blob').style.transform = `translateY(${-heroShift * 10}vh) rotate(${heroShift * 40}deg)`;
    $('#orb-warm').style.transform = `translateY(${scrollY * 0.12}px)`;
    $('#orb-cool').style.transform = `translateY(${-scrollY * 0.08}px)`;

    const about = aboutText.getBoundingClientRect();
    const aboutProgress = clamp((viewport * 0.75 - about.top) / (about.height + viewport * 0.2));
    words.forEach((word, index) => {
        word.classList.toggle('on', index / words.length < aboutProgress * 1.15);
    });

    const projectProgress = clamp((scrollY - pageTop(projects)) / (projects.offsetHeight - viewport));
    track.style.transform = `translateX(${-projectProgress * (track.scrollWidth - window.innerWidth)}px)`;
    $('#project-bar').style.width = `${projectProgress * 100}%`;
    const current = Math.min(projectCount, 1 + Math.floor(projectProgress * (projectCount - 0.001)));
    $('#project-nr').textContent = `0${current} / 0${projectCount}`;

    $('#skills-a').style.transform = `translateX(${-scrollY * MARQUEE_SPEED + 800}px)`;
    $('#skills-b').style.transform = `translateX(${scrollY * MARQUEE_SPEED - 3200}px)`;

    const path = $('#path');
    const pathProgress = clamp((scrollY + viewport * 0.2 - pageTop(path)) / (path.offsetHeight - viewport * 0.3));
    $('#path-line').style.transform = `scaleY(${pathProgress})`;
}

function loop() {
    update();
    window.requestAnimationFrame(loop);
}
loop();

// Huddl-Screenshots als Galerie in einem Overlay
const GALLERY = [
    { src: 'assets/huddl-start.webp', alt: 'Startseite von Huddl' },
    { src: 'assets/huddl-kalender.webp', alt: 'Kalender in Huddl' },
    { src: 'assets/huddl-chat.webp', alt: 'Familien-Chat in Huddl' },
    { src: 'assets/huddl-einkauf.webp', alt: 'Einkaufsliste in Huddl' }
];
const lightbox = $('#lightbox');
const lightboxImage = $('#lightbox-img');
let galleryIndex = 0;

function showGallery(index) {
    galleryIndex = (index + GALLERY.length) % GALLERY.length;
    lightboxImage.src = GALLERY[galleryIndex].src;
    lightboxImage.alt = GALLERY[galleryIndex].alt;
}

function closeGallery() {
    lightbox.hidden = true;
}

document.querySelectorAll('[data-gallery]').forEach(shot => {
    shot.addEventListener('click', () => {
        showGallery(Number(shot.dataset.gallery));
        lightbox.hidden = false;
    });
});
lightbox.addEventListener('click', event => {
    if (event.target === lightbox || event.target.closest('.lightbox-close')) closeGallery();
    const step = event.target.closest('[data-step]');
    if (step) showGallery(galleryIndex + Number(step.dataset.step));
});
window.addEventListener('keydown', event => {
    if (lightbox.hidden) return;
    if (event.key === 'Escape') closeGallery();
    if (event.key === 'ArrowLeft') showGallery(galleryIndex - 1);
    if (event.key === 'ArrowRight') showGallery(galleryIndex + 1);
});
