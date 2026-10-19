/*
 * Editor-Ansicht für hard_mode(): Datei-Tabs, Explorer, Zeilennummern
 * und Statusleiste wie in einer IDE. Gesperrte Inhalte stehen als
 * verschlüsselter Code da, bis die passende Aufgabe gelöst ist.
 * Gesteuert wird alles von hardmode.js.
 */
const IDE_FILES = {
    hero: { name: 'start.py', badge: 'py', language: 'Python' },
    about: { name: 'ueber_mich.md', badge: 'md', language: 'Markdown' },
    skills: { name: 'netzwerk.conf', badge: 'conf', language: 'Config' },
    projects: { name: 'projekte.sql', badge: 'sql', language: 'SQL' },
    contact: { name: 'kontakt.js', badge: 'js', language: 'JavaScript' }
};
const IDE_LINE_HEIGHT = 24;
const IDE_CHAR_WIDTH = 8.4;
const CIPHER_CHARS = '0123456789abcdef{}[]()<>=;:/*#$%&!?';
const CIPHER_MAX_LENGTH = 420;
const CIPHER_EMPTY_LINES = 24;
const CIPHER_INTERVAL = 900;

let ideRoot = null;
let cipherTimer = 0;

/* Verschlüsselter Code statt Inhalt */

function randomCipherChar() {
    return CIPHER_CHARS[Math.floor(Math.random() * CIPHER_CHARS.length)];
}

// Text behält seine Form (Leerzeichen, Zeilen), nur die Zeichen werden ersetzt
function cipherFor(element) {
    const text = element.textContent.replace(/\s+/g, ' ').trim().slice(0, CIPHER_MAX_LENGTH);

    if (text) {
        return text.replace(/\S/g, randomCipherChar);
    }

    // Bilder ohne Text: Zeilen wie aus einem Hex-Dump
    return Array.from({ length: CIPHER_EMPTY_LINES }, () =>
        Array.from({ length: 8 }, () => `0x${randomCipherChar()}${randomCipherChar()}`).join(' ')
    ).join('\n');
}

function encryptElement(element) {
    if (getComputedStyle(element).position === 'static') {
        element.classList.add('hm-cipher-anchor');
    }

    element.dataset.cipher = cipherFor(element);
}

function decryptElement(element) {
    element.classList.remove('hm-cipher-anchor');
    delete element.dataset.cipher;
}

// Ein paar Zeichen pro Takt neu würfeln, damit der Code "lebt"
function shuffleCiphers() {
    document.querySelectorAll('.hm-locked[data-cipher]').forEach(element => {
        const characters = [...element.dataset.cipher];

        for (let index = 0; index < characters.length / 12; index++) {
            const position = Math.floor(Math.random() * characters.length);

            if (!/\s/.test(characters[position])) {
                characters[position] = randomCipherChar();
            }
        }

        element.dataset.cipher = characters.join('');
    });
}

/* Aufbau */

function ideFileButton(panel, className) {
    const file = IDE_FILES[panel];

    return `
        <button type="button" class="${className}" data-target="${panel}">
            <span class="hm-badge hm-badge-${file.badge}">${file.badge}</span>
            <span class="hm-file-name">${file.name}</span>
            <i class="hm-file-state" aria-hidden="true"></i>
        </button>
    `;
}

function createIde() {
    ideRoot = document.createElement('div');
    ideRoot.className = 'hm-ide';

    const panels = Object.keys(IDE_FILES);

    ideRoot.innerHTML = `
        <div class="hm-titlebar">
            <span class="hm-window-dots" aria-hidden="true"><i></i><i></i><i></i></span>
            <span class="hm-window-title"></span>
        </div>
        <nav class="hm-tabs" aria-label="Dateien">
            ${panels.map(panel => ideFileButton(panel, 'hm-tab')).join('')}
        </nav>
        <aside class="hm-explorer" aria-label="Explorer">
            <p class="hm-explorer-title">Explorer</p>
            <p class="hm-explorer-folder"><i class="fas fa-chevron-down"></i> portfolio</p>
            ${panels.map(panel => ideFileButton(panel, 'hm-explorer-file')).join('')}
        </aside>
        <div class="hm-gutter" aria-hidden="true"><pre></pre></div>
        <div class="hm-line-highlight" aria-hidden="true"></div>
        <footer class="hm-statusbar">
            <span><i class="fas fa-code-branch"></i> main</span>
            <span class="hm-status-build"></span>
            <span class="hm-status-problems"></span>
            <span class="hm-status-spacer"></span>
            <span class="hm-status-cursor">Ln 1, Sp 1</span>
            <span>UTF-8</span>
            <span class="hm-status-language"></span>
            <span><i class="fas fa-user"></i> ${escapeHtml(visitorUser)}</span>
        </footer>
    `;

    // Die Buttons liegen außerhalb von script.js und öffnen den Bereich selbst
    ideRoot.querySelectorAll('[data-target]').forEach(button => {
        button.addEventListener('click', () => showPanel(button.dataset.target));
    });

    document.body.append(ideRoot);
    document.body.classList.add('hm-ide-active');

    window.addEventListener('scroll', syncGutter, { passive: true });
    window.addEventListener('resize', fillGutter);
    document.addEventListener('pointermove', trackCursorLine);
    cipherTimer = window.setInterval(shuffleCiphers, CIPHER_INTERVAL);
}

function removeIde() {
    if (!ideRoot) {
        return;
    }

    window.removeEventListener('scroll', syncGutter);
    window.removeEventListener('resize', fillGutter);
    document.removeEventListener('pointermove', trackCursorLine);
    window.clearInterval(cipherTimer);

    ideRoot.remove();
    ideRoot = null;
    document.body.classList.remove('hm-ide-active');
}

/* Zeilennummern und aktuelle Zeile */

function fillGutter() {
    const lines = Math.ceil(document.documentElement.scrollHeight / IDE_LINE_HEIGHT);
    ideRoot.querySelector('.hm-gutter pre').textContent =
        Array.from({ length: lines }, (_, index) => index + 1).join('\n');
    syncGutter();
}

function syncGutter() {
    ideRoot.querySelector('.hm-gutter pre').style.transform = `translateY(${-window.scrollY}px)`;
}

// Die Zeile unter dem Mauszeiger wird hervorgehoben, wie der Cursor im Editor
function trackCursorLine(event) {
    const top = ideRoot.querySelector('.hm-gutter').getBoundingClientRect().top;
    const line = Math.max(0, Math.floor((event.clientY + window.scrollY - top) / IDE_LINE_HEIGHT));
    const column = Math.max(1, Math.round(event.clientX / IDE_CHAR_WIDTH));

    ideRoot.querySelector('.hm-line-highlight').style.transform =
        `translateY(${top + line * IDE_LINE_HEIGHT - window.scrollY}px)`;
    ideRoot.querySelector('.hm-status-cursor').textContent = `Ln ${line + 1}, Sp ${column}`;
}

/* Zustand anzeigen */

function updateIde() {
    if (!ideRoot) {
        return;
    }

    const panel = currentPanel();
    const file = IDE_FILES[panel];

    ideRoot.querySelectorAll('[data-target]').forEach(button => {
        const target = button.dataset.target;
        const state = !isPanelReachable(target) ? 'locked' : isPanelSolved(target) ? 'done' : 'open';

        button.classList.toggle('active', target === panel);
        button.dataset.state = state;
        button.querySelector('.hm-file-state').className = `hm-file-state ${{
            locked: 'fas fa-lock',
            done: 'fas fa-check',
            open: 'hm-dot'
        }[state]}`;
    });

    ideRoot.querySelector('.hm-window-title').textContent = `${file.name} — ~/portfolio — hard_mode()`;
    ideRoot.querySelector('.hm-status-language').textContent = file.language;
    ideRoot.querySelector('.hm-status-build').textContent =
        `⟳ build ${hardState.solved.size}/${HARD_MODE_PUZZLES.length}`;
    ideRoot.querySelector('.hm-status-problems').innerHTML =
        `<i class="fas fa-circle-xmark"></i> ${hardState.wrongTotal} <i class="fas fa-triangle-exclamation"></i> ${hardState.hintsUsed}`;

    fillGutter();
}
