/*
 * os_mode(): NIK OS, das Portfolio als kleines Betriebssystem.
 * Desktop mit Symbolen, Fenstern (verschieben, minimieren, maximieren),
 * Dock, Startmenü und Einstellungen, die im Browser gespeichert werden.
 * Die Inhalte werden aus dem normalen Portfolio übernommen, damit es
 * nur eine Quelle für Texte gibt.
 * Gestartet wird der Modus vom Boot-Screen über das Event "portfolio:os-mode".
 */
const OS_SETTINGS_KEY = 'nik-os-settings';
const OS_WALLPAPERS = ['aurora', 'grid', 'midnight'];
const OS_ACCENTS = { Türkis: '#00e5cc', Violett: '#a78bfa', Orange: '#ff9f43' };
const OS_WINDOW_OFFSET = 32;
const OS_CLOCK_INTERVAL = 10000;
const OS_SPARK_INTERVAL = 700;
const OS_SPARK_POINTS = 24;
const OS_TOAST_DURATION = 4200;
const OS_MOBILE_WIDTH = 700;

const OS_APPS = {
    about: { title: 'Über mich', icon: 'fa-user', width: 620, height: 560 },
    projects: { title: 'Projekte', icon: 'fa-folder-open', width: 820, height: 600 },
    skills: { title: 'System Monitor', icon: 'fa-microchip', width: 640, height: 500 },
    terminal: { title: 'Terminal', icon: 'fa-terminal', width: 620, height: 400 },
    cv: { title: 'lebenslauf.pdf', icon: 'fa-file-pdf', width: 680, height: 640 },
    contact: { title: 'Kontakt', icon: 'fa-envelope', width: 560, height: 600 },
    settings: { title: 'Einstellungen', icon: 'fa-gear', width: 460, height: 420 }
};

const osState = {
    root: null,
    windows: new Map(),
    topZ: 10,
    timers: [],
    settings: { wallpaper: OS_WALLPAPERS[0], accent: OS_ACCENTS.Türkis }
};

/* Einstellungen im Browser merken (privates Fenster: einfach ohne) */

function loadOsSettings() {
    try {
        const saved = JSON.parse(localStorage.getItem(OS_SETTINGS_KEY));
        Object.assign(osState.settings, saved);
    } catch {
        // Ohne gespeicherte Einstellungen gelten die Standardwerte
    }
}

function saveOsSettings() {
    try {
        localStorage.setItem(OS_SETTINGS_KEY, JSON.stringify(osState.settings));
    } catch {
        // Speichern ist optional
    }
}

function applyOsSettings() {
    osState.root.dataset.wallpaper = osState.settings.wallpaper;
    osState.root.style.setProperty('--os-accent', osState.settings.accent);
}

/* Inhalte aus dem Portfolio übernehmen */

function cloneFromPortfolio(selector) {
    const clone = document.querySelector(selector).cloneNode(true);
    clone.removeAttribute('id');
    clone.querySelectorAll('[id]').forEach(element => element.removeAttribute('id'));
    return clone;
}

function renderAboutApp(body) {
    body.innerHTML = `
        <div class="os-profile">
            <img src="büro.jpeg" alt="Niklas Bakowsky">
            <div>
                <p class="os-kicker">Entwickler-Steckbrief</p>
                <h2>Niklas Bakowsky</h2>
                <p class="os-muted">Anwendungsentwickler in der Umschulung · Hamburg</p>
            </div>
        </div>
    `;
    body.append(cloneFromPortfolio('#about .about-content'), cloneFromPortfolio('#about .internship-card'));
}

function renderProjectsApp(body) {
    body.innerHTML = `
        <div class="os-path"><i class="fas fa-folder"></i> ~/projekte</div>
    `;
    body.append(cloneFromPortfolio('.projects-grid'));
}

function renderSkillsApp(body) {
    const skills = [...document.querySelectorAll('#skills .skill-card')];

    body.innerHTML = `
        <div class="os-monitor-head">
            <span>Prozess</span>
            <span>Wofür ich es nutze</span>
            <span>Aktivität</span>
        </div>
        <ul class="os-processes"></ul>
    `;

    const list = body.querySelector('.os-processes');

    skills.forEach(card => {
        const row = document.createElement('li');
        row.innerHTML = `
            <span class="os-process-name"></span>
            <span class="os-muted"></span>
            <canvas width="120" height="28" aria-hidden="true"></canvas>
        `;
        row.querySelector('.os-process-name').prepend(card.querySelector('i').cloneNode(true));
        row.querySelector('.os-process-name').append(` ${card.querySelector('h3').textContent.trim()}`);
        row.querySelector('.os-muted').textContent = card.querySelector('p').textContent.trim();
        list.append(row);
    });

    // Dekorative Live-Kurven, wie in einem echten System Monitor
    const sparks = [...list.querySelectorAll('canvas')].map(canvas => ({
        canvas,
        values: Array.from({ length: OS_SPARK_POINTS }, () => Math.random())
    }));

    function draw() {
        sparks.forEach(({ canvas, values }) => {
            values.shift();
            values.push(Math.min(1, Math.max(0, values[values.length - 1] + (Math.random() - 0.5) * 0.5)));

            const context = canvas.getContext('2d');
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.strokeStyle = osState.settings.accent;
            context.lineWidth = 1.5;
            context.beginPath();
            values.forEach((value, index) => {
                const x = (index / (OS_SPARK_POINTS - 1)) * canvas.width;
                const y = canvas.height - 3 - value * (canvas.height - 6);
                index === 0 ? context.moveTo(x, y) : context.lineTo(x, y);
            });
            context.stroke();
        });
    }

    draw();
    osState.timers.push(window.setInterval(draw, OS_SPARK_INTERVAL));
}

function renderTerminalApp(body) {
    body.innerHTML = `
        <div class="os-terminal-output" aria-live="polite"></div>
        <form class="os-terminal-row">
            <span>${escapeOsText(visitorUser)}@nik-os:~$</span>
            <input type="text" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Befehl eingeben">
        </form>
    `;

    const output = body.querySelector('.os-terminal-output');
    const input = body.querySelector('input');

    function print(text, kind = '') {
        const line = document.createElement('div');
        line.className = kind;
        line.textContent = text;
        output.append(line);
        output.scrollTop = output.scrollHeight;
    }

    print('NIK OS Terminal. Tippe help für alle Befehle.', 'muted');

    body.querySelector('form').addEventListener('submit', event => {
        event.preventDefault();
        const command = input.value.trim();
        input.value = '';
        print(`$ ${command}`, 'command');

        if (command === '') {
            return;
        }

        if (command === 'clear') {
            output.textContent = '';
            return;
        }

        if (command === 'easy_mode()' || command === 'shutdown') {
            closeOs();
            return;
        }

        if (command === 'hard_mode()') {
            closeOs();
            document.dispatchEvent(new CustomEvent('portfolio:hard-mode'));
            return;
        }

        const lines = runShellCommand(command);

        if (lines) {
            lines.forEach(({ text, kind }) => print(text, kind));
        } else {
            print(`${command.split(' ')[0]}: Befehl nicht gefunden. Probier help`, 'error');
        }
    });

    body.addEventListener('click', () => input.focus({ preventScroll: true }));
    window.setTimeout(() => input.focus({ preventScroll: true }), 50);
}

function renderCvApp(body) {
    body.innerHTML = `
        <div class="os-toolbar">
            <span class="os-muted">lebenslauf.pdf</span>
            <a class="os-button" href="${CV_PATH}" download><i class="fas fa-download"></i> Herunterladen</a>
        </div>
        <iframe class="os-pdf" src="${CV_PATH}" title="Lebenslauf von Niklas Bakowsky"></iframe>
    `;
}

function renderContactApp(body) {
    body.innerHTML = `
        <p class="os-kicker">Kontakt</p>
        <h2>Lassen Sie uns kennenlernen</h2>
    `;
    body.append(cloneFromPortfolio('#contact .contact-options'));

    const hire = document.createElement('a');
    hire.className = 'os-button primary os-hire';
    hire.href = hireMailLink();
    hire.innerHTML = '<i class="fas fa-paper-plane"></i> sudo hire niklas';
    body.append(hire);
}

function renderSettingsApp(body) {
    body.innerHTML = `
        <p class="os-kicker">Hintergrund</p>
        <div class="os-wallpapers">
            ${OS_WALLPAPERS.map(name => `
                <button type="button" class="os-wallpaper-choice" data-wallpaper="${name}" aria-label="Hintergrund ${name}"></button>
            `).join('')}
        </div>
        <p class="os-kicker">Akzentfarbe</p>
        <div class="os-accents">
            ${Object.entries(OS_ACCENTS).map(([name, color]) => `
                <button type="button" class="os-accent-choice" data-accent="${color}" style="--swatch: ${color}">${name}</button>
            `).join('')}
        </div>
        <p class="os-muted">Ihre Auswahl bleibt in diesem Browser gespeichert.</p>
    `;

    function markSelection() {
        body.querySelectorAll('.os-wallpaper-choice').forEach(button => {
            button.classList.toggle('selected', button.dataset.wallpaper === osState.settings.wallpaper);
        });
        body.querySelectorAll('.os-accent-choice').forEach(button => {
            button.classList.toggle('selected', button.dataset.accent === osState.settings.accent);
        });
    }

    body.addEventListener('click', event => {
        const wallpaper = event.target.closest('.os-wallpaper-choice');
        const accent = event.target.closest('.os-accent-choice');

        if (wallpaper) {
            osState.settings.wallpaper = wallpaper.dataset.wallpaper;
        } else if (accent) {
            osState.settings.accent = accent.dataset.accent;
        } else {
            return;
        }

        applyOsSettings();
        saveOsSettings();
        markSelection();
    });

    markSelection();
}

const OS_RENDERERS = {
    about: renderAboutApp,
    projects: renderProjectsApp,
    skills: renderSkillsApp,
    terminal: renderTerminalApp,
    cv: renderCvApp,
    contact: renderContactApp,
    settings: renderSettingsApp
};

function escapeOsText(text) {
    const element = document.createElement('span');
    element.textContent = text;
    return element.innerHTML;
}

/* Fenster */

function focusWindow(windowElement) {
    osState.windows.forEach(other => other.classList.remove('focused'));
    windowElement.classList.add('focused');
    windowElement.style.zIndex = ++osState.topZ;
}

function updateDock() {
    osState.root.querySelectorAll('.os-dock [data-app]').forEach(button => {
        button.classList.toggle('open', osState.windows.has(button.dataset.app));
    });
}

function openApp(app) {
    const existing = osState.windows.get(app);

    if (existing) {
        existing.hidden = false;
        focusWindow(existing);
        return;
    }

    const config = OS_APPS[app];
    const desktop = osState.root.querySelector('.os-desktop');
    const offset = osState.windows.size * OS_WINDOW_OFFSET;
    const width = Math.min(config.width, desktop.clientWidth - 24);
    const dockSpace = parseInt(getComputedStyle(osState.root).getPropertyValue('--os-dock-space'), 10);
    const height = Math.min(config.height, desktop.clientHeight - dockSpace - 24);

    const windowElement = document.createElement('section');
    windowElement.className = 'os-window';
    windowElement.dataset.app = app;
    windowElement.setAttribute('aria-label', config.title);
    windowElement.style.width = `${width}px`;
    windowElement.style.height = `${height}px`;
    windowElement.style.left = `${Math.max(12, Math.min(140 + offset, desktop.clientWidth - width - 12))}px`;
    windowElement.style.top = `${Math.max(12, Math.min(30 + offset, desktop.clientHeight - dockSpace - height - 12))}px`;
    windowElement.innerHTML = `
        <header class="os-window-bar">
            <span class="os-window-buttons">
                <button type="button" data-action="close" aria-label="Schließen"></button>
                <button type="button" data-action="minimize" aria-label="Minimieren"></button>
                <button type="button" data-action="maximize" aria-label="Maximieren"></button>
            </span>
            <span class="os-window-title"><i class="fas ${config.icon}"></i> ${config.title}</span>
        </header>
        <div class="os-window-body"></div>
    `;

    OS_RENDERERS[app](windowElement.querySelector('.os-window-body'));

    windowElement.querySelector('.os-window-buttons').addEventListener('click', event => {
        const action = event.target.closest('[data-action]')?.dataset.action;

        if (action === 'close') {
            windowElement.remove();
            osState.windows.delete(app);
            updateDock();
        } else if (action === 'minimize') {
            windowElement.hidden = true;
        } else if (action === 'maximize') {
            windowElement.classList.toggle('maximized');
        }
    });

    windowElement.addEventListener('pointerdown', () => focusWindow(windowElement));
    windowElement.querySelector('.os-window-bar').addEventListener('dblclick', () => {
        windowElement.classList.toggle('maximized');
    });
    enableWindowDrag(windowElement, desktop);

    desktop.append(windowElement);
    osState.windows.set(app, windowElement);
    focusWindow(windowElement);
    updateDock();
}

// Fenster an der Titelleiste verschieben (Maus und Touch)
function enableWindowDrag(windowElement, desktop) {
    const bar = windowElement.querySelector('.os-window-bar');

    bar.addEventListener('pointerdown', event => {
        if (event.target.closest('button') || windowElement.classList.contains('maximized')
            || window.innerWidth <= OS_MOBILE_WIDTH) {
            return;
        }

        const startX = event.clientX - windowElement.offsetLeft;
        const startY = event.clientY - windowElement.offsetTop;
        bar.setPointerCapture(event.pointerId);

        function onMove(moveEvent) {
            const maxLeft = desktop.clientWidth - 80;
            const maxTop = desktop.clientHeight - 40;
            windowElement.style.left = `${Math.min(maxLeft, Math.max(-windowElement.offsetWidth + 80, moveEvent.clientX - startX))}px`;
            windowElement.style.top = `${Math.min(maxTop, Math.max(0, moveEvent.clientY - startY))}px`;
        }

        function onUp() {
            bar.removeEventListener('pointermove', onMove);
            bar.removeEventListener('pointerup', onUp);
        }

        bar.addEventListener('pointermove', onMove);
        bar.addEventListener('pointerup', onUp);
    });
}

/* Oberfläche */

function updateClock() {
    const now = new Date();
    osState.root.querySelector('.os-clock').textContent = now.toLocaleString('de-DE', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showToast(text) {
    const toast = document.createElement('div');
    toast.className = 'os-toast';
    toast.innerHTML = '<i class="fas fa-bell"></i><span></span>';
    toast.querySelector('span').textContent = text;
    osState.root.append(toast);
    window.setTimeout(() => toast.classList.add('closing'), OS_TOAST_DURATION);
    window.setTimeout(() => toast.remove(), OS_TOAST_DURATION + 600);
}

function osAppButton(app, className) {
    const config = OS_APPS[app];

    return `
        <button type="button" class="${className}" data-app="${app}">
            <i class="fas ${config.icon}"></i>
            <span>${config.title}</span>
        </button>
    `;
}

function startOs() {
    loadOsSettings();

    const apps = Object.keys(OS_APPS);
    const root = document.createElement('div');
    root.className = 'os';
    root.setAttribute('role', 'application');
    root.setAttribute('aria-label', 'NIK OS');
    root.innerHTML = `
        <header class="os-topbar">
            <button type="button" class="os-start" aria-expanded="false"><i class="fas fa-diamond"></i> NIK OS</button>
            <span class="os-topbar-spacer"></span>
            <span class="os-user"><i class="fas fa-user"></i> ${escapeOsText(visitorUser)}</span>
            <span class="os-clock"></span>
        </header>
        <nav class="os-menu" hidden aria-label="Startmenü">
            ${apps.map(app => osAppButton(app, 'os-menu-item')).join('')}
            <hr>
            <button type="button" class="os-menu-item" data-mode="hard"><i class="fas fa-code"></i><span>hard_mode() starten</span></button>
            <button type="button" class="os-menu-item" data-mode="easy"><i class="fas fa-power-off"></i><span>Herunterfahren (normales Portfolio)</span></button>
        </nav>
        <main class="os-desktop">
            <div class="os-icons">
                ${apps.map(app => osAppButton(app, 'os-icon')).join('')}
            </div>
        </main>
        <nav class="os-dock" aria-label="Dock">
            ${apps.map(app => osAppButton(app, 'os-dock-item')).join('')}
        </nav>
    `;

    osState.root = root;
    applyOsSettings();
    document.body.append(root);
    document.body.classList.add('os-active');

    const menu = root.querySelector('.os-menu');
    const startButton = root.querySelector('.os-start');

    function toggleMenu(open) {
        menu.hidden = !open;
        startButton.setAttribute('aria-expanded', String(open));
    }

    startButton.addEventListener('click', () => toggleMenu(menu.hidden));

    root.addEventListener('click', event => {
        const appButton = event.target.closest('[data-app]:not(.os-window)');
        const modeButton = event.target.closest('[data-mode]');

        if (!event.target.closest('.os-menu, .os-start')) {
            toggleMenu(false);
        }

        if (modeButton) {
            closeOs();

            if (modeButton.dataset.mode === 'hard') {
                document.dispatchEvent(new CustomEvent('portfolio:hard-mode'));
            }
            return;
        }

        if (!appButton) {
            return;
        }

        toggleMenu(false);

        // Klick im Dock auf das vorderste Fenster minimiert es, wie gewohnt
        const existing = osState.windows.get(appButton.dataset.app);

        if (appButton.classList.contains('os-dock-item') && existing && !existing.hidden
            && existing.classList.contains('focused')) {
            existing.hidden = true;
            return;
        }

        openApp(appButton.dataset.app);
    });

    updateClock();
    osState.timers.push(window.setInterval(updateClock, OS_CLOCK_INTERVAL));

    openApp('about');
    showToast(visitorCompany
        ? `Willkommen bei NIK OS, ${visitorCompany}! Alles hier ist anklickbar.`
        : 'Willkommen bei NIK OS! Alles hier ist anklickbar.');
}

function closeOs() {
    if (!osState.root) {
        return;
    }

    osState.timers.forEach(timer => window.clearInterval(timer));
    osState.timers = [];
    osState.windows.clear();

    const root = osState.root;
    osState.root = null;
    root.classList.add('closing');
    document.body.classList.remove('os-active');
    window.setTimeout(() => root.remove(), 500);
}

document.addEventListener('portfolio:os-mode', startOs);

// Pfeiltasten gehören den Fenstern, nicht der Bereichsnavigation dahinter
document.addEventListener(
    'keydown',
    event => {
        if (!osState.root || !['ArrowLeft', 'ArrowRight', 'Escape'].includes(event.key)) {
            return;
        }

        event.stopImmediatePropagation();

        if (event.key === 'Escape') {
            osState.root.querySelector('.os-menu').hidden = true;
        }
    },
    { capture: true }
);
