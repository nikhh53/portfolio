/*
 * Boot-Screen im Terminal-Stil
 * Läuft vor dem Portfolio und fragt danach den Modus ab:
 * easy_mode() zeigt das Portfolio normal, hard_mode() startet die Rätsel
 * aus hardmode.js, os_mode() startet NIK OS aus os.js.
 * Das Overlay wird per JavaScript erzeugt, damit die Seite ohne
 * JavaScript ganz normal sichtbar bleibt.
 */
const TYPE_SPEED = 26;
const LINE_PAUSE = 140;

// Jede Zeile besteht aus Teilen [Text, CSS-Klasse]
const bootScript = [
    { type: 'command', parts: [['$ ', 'prompt-sign'], [`ssh ${visitorUser}@nikhh53.github.io`]] },
    { type: 'log', parts: [['Verbindung zu nikhh53.github.io wird aufgebaut ...', 'muted']] },
    {
        type: 'log',
        parts: visitorCompany
            ? [['[ OK ] ', 'tag-ok'], ['Verbindung zu '], [visitorCompany, 'syntax-string'], [' hergestellt. Schön, dass Sie da sind!']]
            : [['[ OK ] ', 'tag-ok'], ['Verbunden. Willkommen, Gast.']]
    },
    { type: 'command', parts: [['$ ', 'prompt-sign'], ['cd ~/portfolio && npm run build']] },
    { type: 'log', parts: [['> portfolio@2027.6.0 build', 'muted']] },
    { type: 'log', parts: [['[info] ', 'tag-info'], ['Kompiliere index.html ...']] },
    { type: 'log', parts: [['[ OK ] ', 'tag-ok'], ['about.module      geladen']] },
    { type: 'log', parts: [['[ OK ] ', 'tag-ok'], ['skills.module     geladen  '], ['(TypeScript, React, Node.js, PostgreSQL, Docker, Python, Git)', 'muted']] },
    { type: 'log', parts: [['[ OK ] ', 'tag-ok'], ['projects.module   geladen  '], ['(2 fertig, 1 in Planung)', 'muted']] },
    { type: 'log', parts: [['[ OK ] ', 'tag-ok'], ['contact.module    geladen']] },
    { type: 'log', parts: [['[warn] ', 'tag-warn'], ['praktikum.status = "gesucht"  '], ['(Hamburg, 07.06.2027 - 31.01.2028)', 'muted']] },
    { type: 'log', parts: [['[ OK ] ', 'tag-ok'], ['Build abgeschlossen in 1.37s']] },
    { type: 'command', parts: [['$ ', 'prompt-sign'], ['python3']] },
    { type: 'log', parts: [['Python 3.12.4 | Tippe help() für Hilfe.', 'muted']] },
    {
        type: 'command',
        parts: [
            ['>>> ', 'prompt-sign'],
            ['from ', 'syntax-keyword'],
            ['niklas '],
            ['import ', 'syntax-keyword'],
            ['Portfolio']
        ]
    },
    {
        type: 'command',
        parts: [
            ['>>> ', 'prompt-sign'],
            ['portfolio = '],
            ['Portfolio', 'syntax-function'],
            ['(name='],
            ['"Niklas Bakowsky"', 'syntax-string'],
            [', stadt='],
            ['"Hamburg"', 'syntax-string'],
            [')']
        ]
    },
    {
        type: 'command',
        parts: [['>>> ', 'prompt-sign'], ['help', 'syntax-function'], ['(portfolio.start)']]
    }
];

const helpLines = [
    [['Wähle, wie du das Portfolio sehen möchtest:']],
    [['  easy_mode()   ', 'syntax-function'], ['das Portfolio ganz normal ansehen', 'muted']],
    [['  hard_mode()   ', 'syntax-function'], ['dich Seite für Seite durchs Portfolio coden', 'muted']],
    [['  os_mode()     ', 'syntax-function'], ['das Portfolio als eigenes Betriebssystem starten', 'muted']],
    [['  help          ', 'syntax-function'], ['weitere Befehle wie ls, whoami oder git log', 'muted']]
];


/*
 * Startet den Boot-Screen. targetMode ist 'hard' oder 'os', wenn der
 * Besucher den Modus vorher auf dem Willkommensbildschirm gewählt hat;
 * dann läuft das Terminal nur als Einleitung und startet den Modus selbst.
 */
function startBootScreen(targetMode) {
    const prefersReducedMotion =
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let bootInstant = prefersReducedMotion;
    let bootRunning = true;

    const bootScreen = document.createElement('div');
    bootScreen.className = 'boot-screen';
    bootScreen.setAttribute('role', 'dialog');
    bootScreen.setAttribute('aria-label', 'Portfolio wird geladen');
    bootScreen.innerHTML = `
        <div class="boot-header">
            <span>${visitorUser}@nikhh53: ~/portfolio</span>
            <button type="button" class="boot-skip">Überspringen (Esc)</button>
        </div>
        <div class="boot-log" aria-live="polite"></div>
        <label class="boot-input-row" hidden>
            <span class="prompt-sign">&gt;&gt;&gt;</span>
            <input
                class="boot-input"
                type="text"
                autocomplete="off"
                autocapitalize="off"
                spellcheck="false"
                aria-label="Befehl eingeben, zum Beispiel easy_mode()"
            >
        </label>
        <div class="boot-choices" hidden>
            <button type="button" class="boot-choice" data-command="easy_mode()">
                easy_mode()<small>normal ansehen</small>
            </button>
            <button type="button" class="boot-choice" data-command="hard_mode()">
                hard_mode()<small>durchs Portfolio coden</small>
            </button>
            <button type="button" class="boot-choice" data-command="os_mode()">
                os_mode()<small>NIK OS starten</small>
            </button>
        </div>
    `;

    document.body.prepend(bootScreen);
    document.body.classList.add('boot-active');

    const bootLog = bootScreen.querySelector('.boot-log');
    const bootInputRow = bootScreen.querySelector('.boot-input-row');
    const bootInput = bootScreen.querySelector('.boot-input');
    const bootChoices = bootScreen.querySelector('.boot-choices');

    function wait(milliseconds) {
        if (bootInstant) {
            return Promise.resolve();
        }

        return new Promise(resolve => window.setTimeout(resolve, milliseconds));
    }

    function createLine(className = '') {
        const line = document.createElement('div');
        line.className = `boot-line ${className}`.trim();
        bootLog.append(line);
        return line;
    }

    function scrollLogToEnd() {
        bootLog.scrollTop = bootLog.scrollHeight;
    }

    function printLine(parts, className = '') {
        const line = createLine(className);

        parts.forEach(([text, partClass]) => {
            const span = document.createElement('span');
            span.textContent = text;

            if (partClass) {
                span.className = partClass;
            }

            line.append(span);
        });

        scrollLogToEnd();
    }

    // Zeile Zeichen für Zeichen eintippen, das Prompt-Zeichen erscheint sofort
    async function typeLine(parts) {
        const line = createLine('command');
        const cursor = document.createElement('span');
        cursor.className = 'boot-cursor';

        for (const [text, partClass] of parts) {
            const span = document.createElement('span');

            if (partClass) {
                span.className = partClass;
            }

            line.append(span, cursor);

            if (partClass === 'prompt-sign' || bootInstant) {
                span.textContent = text;
                continue;
            }

            for (const character of text) {
                if (bootInstant) {
                    span.textContent = text;
                    break;
                }

                span.textContent += character;
                scrollLogToEnd();
                await wait(TYPE_SPEED + Math.random() * TYPE_SPEED);
            }
        }

        await wait(LINE_PAUSE * 2);
        cursor.remove();
    }

    async function runBootScript() {
        await wait(500);

        // Mit vorab gewähltem Modus reicht die kurze Fassung
        const script = targetMode ? bootScript.slice(0, 12) : bootScript;

        for (const entry of script) {
            if (!bootRunning) {
                return;
            }

            if (entry.type === 'command') {
                await typeLine(entry.parts);
            } else {
                await wait(LINE_PAUSE + Math.random() * LINE_PAUSE);
                printLine(entry.parts);
            }
        }

        if (targetMode === 'hard') {
            runCommand('hard_mode()');
            return;
        }

        if (targetMode === 'os') {
            runCommand('os_mode()');
            return;
        }

        helpLines.forEach(parts => printLine(parts));
        showPrompt();
    }

    function showPrompt() {
        bootInputRow.hidden = false;
        bootChoices.hidden = false;
        scrollLogToEnd();
        bootInput.focus({ preventScroll: true });
    }

    function closeBootScreen() {
        if (!bootRunning) {
            return;
        }

        bootRunning = false;
        bootScreen.classList.add('closing');
        document.body.classList.remove('boot-active');

        window.setTimeout(() => bootScreen.remove(), 700);
    }

    function chooseEasyMode() {
        printLine([['Starte easy_mode() ...', 'success']]);
        window.setTimeout(closeBootScreen, bootInstant ? 0 : 450);
    }

    function chooseHardMode() {
        printLine([['Starte hard_mode() ... Das Portfolio ist verschlüsselt. Viel Erfolg!', 'success']]);

        window.setTimeout(() => {
            closeBootScreen();
            document.dispatchEvent(new CustomEvent('portfolio:hard-mode'));
        }, bootInstant ? 0 : 900);
    }

    function chooseOsMode() {
        printLine([['Starte os_mode() ... NIK OS fährt hoch.', 'success']]);

        window.setTimeout(() => {
            closeBootScreen();
            document.dispatchEvent(new CustomEvent('portfolio:os-mode'));
        }, bootInstant ? 0 : 900);
    }

    // Eingaben wie in einer Python-Konsole auswerten
    function runCommand(rawInput) {
        const input = rawInput.trim();
        const command = input
            .toLowerCase()
            .replace(/\s+/g, '')
            .replace(/^portfolio\.(start\.)?/, '');

        printLine([['>>> ', 'prompt-sign'], [input]], 'command');

        if (command === '') {
            return;
        }

        if (command === 'easy_mode()' || command === 'exit()' || command === 'quit()') {
            chooseEasyMode();
            return;
        }

        if (command === 'hard_mode()') {
            chooseHardMode();
            return;
        }

        if (command === 'os_mode()') {
            chooseOsMode();
            return;
        }

        if (command === 'easy_mode' || command === 'hard_mode' || command === 'os_mode') {
            printLine([[`<function ${command}>`, 'muted']]);
            printLine([['Tipp: Funktionen ruft man mit Klammern auf, also '], [`${command}()`, 'syntax-function']]);
            return;
        }

        if (command === 'help()' || command === 'help(portfolio.start)') {
            helpLines.forEach(parts => printLine(parts));
            return;
        }

        if (command === 'clear()' || command === 'clear') {
            bootLog.textContent = '';
            return;
        }

        const shellOutput = runShellCommand(input);

        if (shellOutput) {
            shellOutput.forEach(({ text, kind }) => printLine([[text]], kind));
            return;
        }

        const name = input.split('(')[0] || input;
        printLine([[`NameError: name '${name}' is not defined. Probier help`]], 'error');
    }

    bootInput.addEventListener('keydown', event => {
        if (event.key !== 'Enter') {
            return;
        }

        event.preventDefault();
        runCommand(bootInput.value);
        bootInput.value = '';
    });

    bootChoices.addEventListener('click', event => {
        const choice = event.target.closest('[data-command]');

        if (choice) {
            runCommand(choice.dataset.command);
        }
    });

    // Mit vorab gewähltem Modus spult Überspringen vor, statt abzubrechen
    bootScreen.querySelector('.boot-skip').addEventListener('click', () => {
        if (targetMode) {
            bootInstant = true;
            return;
        }

        closeBootScreen();
    });

    // Klick auf den Log spult die Animation vor, ein Klick ins Leere setzt den Fokus
    bootScreen.addEventListener('click', event => {
        if (event.target.closest('button')) {
            return;
        }

        if (bootInputRow.hidden) {
            bootInstant = true;
        } else {
            bootInput.focus({ preventScroll: true });
        }
    });

    /*
     * Solange der Boot-Screen offen ist, sollen die Tastenkürzel des
     * Portfolios (Pfeile, Escape) nicht im Hintergrund weiterblättern.
     */
    document.addEventListener(
        'keydown',
        event => {
            if (!bootRunning) {
                return;
            }

            if (event.key === 'Escape') {
                event.preventDefault();
                event.stopImmediatePropagation();

                if (targetMode) {
                    bootInstant = true;
                } else {
                    closeBootScreen();
                }
            } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                event.stopImmediatePropagation();
            } else if (bootInputRow.hidden && (event.key === 'Enter' || event.key === ' ')) {
                event.preventDefault();
                bootInstant = true;
            }
        },
        { capture: true }
    );

    runBootScript();
}
