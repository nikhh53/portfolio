/*
 * Mini-Shell für Boot-Screen und hard_mode()-Konsole.
 * Kennt ein paar Befehle rund ums Portfolio und einige Easter Eggs.
 * Außerdem liest sie den Firmennamen aus dem Link (?firma=...), damit
 * Begrüßung und Finale persönlich werden.
 */
const COMPANY_MAX_LENGTH = 40;
const CONTACT_EMAIL = 'nikhh53@gmail.com';
const CV_PATH = 'lebenslauf.pdf';
const MATRIX_DURATION = 4000;

// Firmenname aus dem Link, nur als Text verwendet (nie als HTML)
const visitorCompany = (() => {
    const value = new URLSearchParams(window.location.search).get('firma') || '';
    return value.replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, COMPANY_MAX_LENGTH);
})();

const visitorUser = visitorCompany
    ? visitorCompany.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'gast'
    : 'gast';

function hireMailLink() {
    const subject = visitorCompany
        ? `Praktikum bei ${visitorCompany} ab Juni 2027`
        : 'Umschulungspraktikum ab Juni 2027';

    return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`;
}

function downloadCv() {
    const link = document.createElement('a');
    link.href = CV_PATH;
    link.download = '';
    link.click();
}

// Grüner Zeichenregen über den ganzen Bildschirm, beendet sich selbst
function startMatrix() {
    const canvas = document.createElement('canvas');
    canvas.className = 'matrix-rain';
    document.body.append(canvas);

    const context = canvas.getContext('2d');
    const fontSize = 16;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const drops = Array.from({ length: Math.ceil(canvas.width / fontSize) }, () => Math.random() * -50);
    const startedAt = performance.now();

    function frame(now) {
        context.fillStyle = 'rgba(0, 0, 0, 0.08)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = '#00e5cc';
        context.font = `${fontSize}px monospace`;

        drops.forEach((y, column) => {
            context.fillText(Math.random() > 0.5 ? '1' : '0', column * fontSize, y * fontSize);
            drops[column] = y * fontSize > canvas.height && Math.random() > 0.97 ? 0 : y + 1;
        });

        if (now - startedAt < MATRIX_DURATION) {
            requestAnimationFrame(frame);
        } else {
            canvas.classList.add('closing');
            window.setTimeout(() => canvas.remove(), 600);
        }
    }

    requestAnimationFrame(frame);
}

const SHELL_HELP = [
    { text: 'Verfügbare Befehle:' },
    { text: '  whoami, ls, cat <datei>, git log, ./kontakt.sh', kind: 'muted' },
    { text: '  ai                 ', kind: 'muted' },
    { text: '  sudo hire niklas   ', kind: 'success' },
    { text: '  clear              ', kind: 'muted' },
    { text: 'Es gibt auch ein paar versteckte Befehle ...', kind: 'muted' }
];

const SHELL_COMMANDS = {
    'help': () => SHELL_HELP,
    'whoami': () => [
        { text: visitorCompany ? `${visitorUser} (Besuch von ${visitorCompany})` : 'gast' },
        { text: 'Gegenüber: Niklas Bakowsky, Anwendungsentwickler in der Umschulung, Hamburg', kind: 'muted' }
    ],
    'ls': () => [{ text: 'about.txt  skills.json  huddl.md  klassenbot.md  projekte/  lebenslauf.pdf  kontakt.sh' }],
    'ls projekte': () => [{ text: 'huddl/  bots-und-web/  klassenbot/  python-projekte/' }],
    'cat about.txt': () => [
        { text: 'Umschulung zum Fachinformatiker für Anwendungsentwicklung.' },
        { text: 'Am meisten lerne ich, wenn aus einer Idee eine funktionierende Anwendung wird.' },
        { text: 'Gesucht: Umschulungspraktikum in Hamburg, 07.06.2027 - 31.01.2028.', kind: 'success' }
    ],
    'cat huddl.md': () => [
        { text: '# Huddl, Familien-App', kind: 'success' },
        { text: 'Private Web-App (PWA) mit Kalender, Chat, Einkaufslisten, Aufgaben und Stammbaum.' },
        { text: 'Rechtemodell für Eltern, Kinder und Gäste, immer auf dem Server geprüft.' },
        { text: 'Login mit Passkeys, Datenexport, Konto löschen. Kinderdaten besonders geschützt.' },
        { text: 'Stack: TypeScript, React, Node.js, PostgreSQL, Docker.', kind: 'muted' }
    ],
    'cat klassenbot.md': () => [
        { text: '# Klassenbot', kind: 'success' },
        { text: 'Discord-Bot für meine Umschulungsklasse: Berichtsheft, Termine, Wissensbereich.' },
        { text: 'Rund 100 Lernartikel als Markdown, mit Diagrammen, automatisch synchronisiert.' },
        { text: 'Stack: TypeScript, SQLite, Discord.', kind: 'muted' }
    ],
    'ai': () => [
        { text: 'Ich arbeite mit KI-Unterstützung (Claude Code).', kind: 'success' },
        { text: 'Ziel, Aufbau und Regeln lege ich fest, die KI schreibt Entwürfe und Code mit.' },
        { text: 'Jede Änderung läuft als Pull Request, ich prüfe und teste sie und veröffentliche selbst.' },
        { text: 'Was ich zeige, erkläre ich im Gespräch.', kind: 'muted' }
    ],
    'cat skills.json': () => [
        { text: '["TypeScript", "React", "Node.js", "PostgreSQL", "Docker", "Python", "Git"]' }
    ],
    'cat lebenslauf.pdf': () => {
        downloadCv();
        return [
            { text: 'cat: lebenslauf.pdf ist eine Binärdatei.', kind: 'muted' },
            { text: 'Ich lade sie stattdessen für Sie herunter ...', kind: 'success' }
        ];
    },
    'git log': () => [
        { text: 'commit HEAD (gesucht)', kind: 'warn' },
        { text: '    todo: Umschulungspraktikum ab 07.06.2027 in Hamburg' },
        { text: 'commit a3f9e21', kind: 'warn' },
        { text: '    feat: Huddl, Familien-App (TypeScript, React, PostgreSQL, Passkeys)' },
        { text: 'commit 7c41b08', kind: 'warn' },
        { text: '    feat: Klassenbot mit Berichtsheft und Wissensbereich' },
        { text: 'commit 2e8d5a4', kind: 'warn' },
        { text: '    feat: Python-Projekte (Ticketsystem, Pokémon Minigame)' },
        { text: 'commit 0b1c3f7', kind: 'warn' },
        { text: '    init: Umschulung Fachinformatiker Anwendungsentwicklung' }
    ],
    './kontakt.sh': () => [
        { text: `E-Mail:  ${CONTACT_EMAIL}` },
        { text: 'GitHub:  github.com/nikhh53' },
        { text: 'Tipp: sudo hire niklas', kind: 'muted' }
    ],
    'sudo hire niklas': () => {
        window.setTimeout(() => {
            window.location.href = hireMailLink();
        }, 900);

        return [
            { text: `[sudo] Passwort für ${visitorUser}: ********`, kind: 'muted' },
            { text: 'Zugriff gewährt. Öffne eine E-Mail an Niklas ...', kind: 'success' }
        ];
    },
    'matrix': () => {
        startMatrix();
        return [{ text: 'Wake up, Neo ...', kind: 'success' }];
    },
    'make coffee': () => [
        { text: 'make: *** Keine Regel, um »coffee« zu erstellen.', kind: 'error' },
        { text: 'Gern beim Vorstellungsgespräch.', kind: 'muted' }
    ],
    'rm -rf /': () => [{ text: 'rm: Netter Versuch. Das Portfolio bleibt.', kind: 'error' }],
    'exit': () => [{ text: 'Schon gehen? Vorher noch: sudo hire niklas', kind: 'muted' }]
};

/*
 * Führt einen Befehl aus und gibt die Ausgabezeilen zurück.
 * null bedeutet: unbekannter Befehl, der Aufrufer meldet den Fehler.
 */
function runShellCommand(rawInput) {
    const command = rawInput.trim().replace(/\s+/g, ' ').toLowerCase();

    if (SHELL_COMMANDS[command]) {
        return SHELL_COMMANDS[command]();
    }

    if (command.startsWith('sudo ')) {
        return [{ text: `${visitorUser} ist nicht in der sudoers-Datei. Dieser Vorfall wird gemeldet.`, kind: 'error' }];
    }

    if (command.startsWith('cat ')) {
        return [{ text: `cat: ${rawInput.trim().slice(4)}: Datei oder Verzeichnis nicht gefunden`, kind: 'error' }];
    }

    return null;
}
