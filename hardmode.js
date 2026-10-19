/*
 * hard_mode(): Das Portfolio ist "verschlüsselt" und baut sich beim
 * Lösen der Rätsel Stück für Stück im Hintergrund auf. Jedes Rätsel ist
 * ein Lückencode, dessen Lücken per Drag-and-drop (oder Antippen) mit
 * Bausteinen gefüllt werden. Jeder Baustein wird sofort geprüft.
 * Rätsel: hardmode-puzzles.js, Effekte: hardmode-effects.js,
 * Editor-Ansicht: hardmode-ide.js, Finale: hardmode-finale.js.
 * Gestartet wird der Modus vom Boot-Screen über das Event
 * "portfolio:hard-mode".
 */
const HARD_PANEL_ORDER = ['hero', 'about', 'skills', 'projects', 'contact'];
const PANEL_LABELS = {
    hero: 'Start',
    about: 'Über mich',
    skills: 'Skills',
    projects: 'Projekte',
    contact: 'Kontakt'
};
const HINT_AFTER_ATTEMPTS = 2;
const NEXT_PUZZLE_DELAY = 1200;
const WRONG_MARK_DURATION = 600;
const REVEAL_STAGGER = 180;
const DRAG_THRESHOLD = 5;
const SHELL_MAX_LINES = 14;

const TOTAL_SLOTS = HARD_MODE_PUZZLES.reduce((sum, puzzle) => sum + puzzle.solution.length, 0);

// Pro Rätsel die Lücken, die schon richtig gefüllt sind
const placedSlots = new Map(HARD_MODE_PUZZLES.map(puzzle => [puzzle, new Set()]));

const hardState = {
    active: false,
    solved: new Set(),
    attempts: 0,
    wrongTotal: 0,
    hintsUsed: 0,
    startedAt: 0,
    collapsed: false,
    renderedPanel: null
};

let hardConsole = null;

function puzzlesOf(panel) {
    return HARD_MODE_PUZZLES.filter(puzzle => puzzle.panel === panel);
}

function isPanelSolved(panel) {
    return puzzlesOf(panel).every(puzzle => hardState.solved.has(puzzle));
}

// Ein Bereich ist erreichbar, wenn alle Bereiche davor gelöst sind
function isPanelReachable(panel) {
    const index = HARD_PANEL_ORDER.indexOf(panel);
    return HARD_PANEL_ORDER.slice(0, index).every(isPanelSolved);
}

function currentPanel() {
    const active = document.querySelector('[data-panel].active-panel');
    return active ? active.dataset.panel : 'hero';
}

function nextPanel(panel) {
    return HARD_PANEL_ORDER[HARD_PANEL_ORDER.indexOf(panel) + 1];
}

function escapeHtml(text) {
    const element = document.createElement('span');
    element.textContent = text;
    return element.innerHTML;
}

/* Sperren und Freischalten */

function revealElements(puzzle) {
    return puzzle.reveals.flatMap(selector => [...document.querySelectorAll(selector)]);
}

function lockElement(element) {
    element.classList.add('hm-locked');
    encryptElement(element);
    element.setAttribute('aria-hidden', 'true');
    element.setAttribute('inert', '');
}

function unlockElement(element, animate) {
    if (!element.classList.contains('hm-locked')) {
        return;
    }

    element.classList.remove('hm-locked');
    decryptElement(element);
    element.removeAttribute('aria-hidden');
    element.removeAttribute('inert');

    if (animate) {
        element.classList.add('hm-decoding');
        decodeText(element);
        window.setTimeout(() => element.classList.remove('hm-decoding'), DECODE_DURATION);
    }
}

// Der Anteil richtiger Lücken bestimmt, wie viel vom Bereich schon sichtbar ist
function revealProgress(puzzle, correctCount) {
    const elements = revealElements(puzzle);
    const visible = Math.ceil((elements.length * correctCount) / puzzle.solution.length);

    elements
        .slice(0, visible)
        .filter(element => element.classList.contains('hm-locked'))
        .forEach((element, index) => {
            window.setTimeout(() => unlockElement(element, true), index * REVEAL_STAGGER);
        });
}

function updateNavigationLocks() {
    document.querySelectorAll('[data-target]').forEach(button => {
        const locked = hardState.active && !isPanelReachable(button.dataset.target);
        button.classList.toggle('hm-nav-locked', locked);
    });
}

/* Konsole (rechts bzw. unten) */

function createConsole() {
    hardConsole = document.createElement('aside');
    hardConsole.className = 'hm-console';
    hardConsole.setAttribute('aria-label', 'hard_mode() Rätsel');
    hardConsole.innerHTML = `
        <div class="hm-header">
            <button type="button" class="hm-toggle" aria-expanded="true">
                <span class="hm-title">hard_mode()</span>
                <span class="hm-progress"></span>
            </button>
            <button type="button" class="hm-exit" title="Alles freischalten">easy_mode()</button>
        </div>
        <div class="hm-bar"><span></span></div>
        <div class="hm-body"></div>
        <form class="hm-shell">
            <div class="hm-shell-output" aria-live="polite"></div>
            <label class="hm-shell-row">
                <span class="hm-shell-prompt">$</span>
                <input class="hm-shell-input" type="text" autocomplete="off" autocapitalize="off"
                    spellcheck="false" placeholder="Befehl tippen, z. B. help" aria-label="Shell-Befehl">
            </label>
        </form>
    `;

    document.body.append(hardConsole);

    hardConsole.querySelector('.hm-toggle').addEventListener('click', () => {
        hardState.collapsed = !hardState.collapsed;
        hardConsole.classList.toggle('collapsed', hardState.collapsed);
        hardConsole.querySelector('.hm-toggle').setAttribute('aria-expanded', String(!hardState.collapsed));
    });

    hardConsole.querySelector('.hm-exit').addEventListener('click', stopHardMode);
    hardConsole.querySelector('.hm-shell').addEventListener('submit', runConsoleShell);
}

// Mini-Shell unten in der Konsole (Befehle aus shell.js)
function runConsoleShell(event) {
    event.preventDefault();

    const input = hardConsole.querySelector('.hm-shell-input');
    const output = hardConsole.querySelector('.hm-shell-output');
    const command = input.value.trim();
    input.value = '';

    if (command === '') {
        return;
    }

    if (command === 'clear') {
        output.textContent = '';
        return;
    }

    if (command === 'easy_mode()') {
        stopHardMode();
        return;
    }

    const lines = runShellCommand(command) || [{ text: `${command}: Befehl nicht gefunden. Probier help`, kind: 'error' }];

    [{ text: `$ ${command}`, kind: 'command' }, ...lines].forEach(({ text, kind }) => {
        const row = document.createElement('div');
        row.textContent = text;

        if (kind) {
            row.className = `hm-shell-${kind}`;
        }

        output.append(row);
    });

    while (output.children.length > SHELL_MAX_LINES) {
        output.firstElementChild.remove();
    }

    output.scrollTop = output.scrollHeight;
}

function updateProgressBar() {
    const correctSlots = [...placedSlots.values()].reduce((sum, placed) => sum + placed.size, 0);
    const percent = Math.round((correctSlots / TOTAL_SLOTS) * 100);

    hardConsole.querySelector('.hm-progress').textContent = `build ${percent}%`;
    hardConsole.querySelector('.hm-bar span').style.width = `${percent}%`;
}

function renderConsole() {
    if (!hardState.active) {
        return;
    }

    updateProgressBar();
    updateNavigationLocks();
    updateIde();

    const panel = currentPanel();
    const body = hardConsole.querySelector('.hm-body');
    hardState.renderedPanel = panel;

    if (hardState.solved.size === HARD_MODE_PUZZLES.length) {
        renderFinish(body);
        return;
    }

    if (!isPanelReachable(panel)) {
        body.innerHTML = `
            <p class="hm-error">PermissionError: Dieser Bereich ist noch verschlüsselt.</p>
            <button type="button" class="hm-button" data-go="${firstUnsolvedPanel()}">Zur aktuellen Aufgabe</button>
        `;
        bindGoButtons(body);
        return;
    }

    const puzzle = puzzlesOf(panel).find(item => !hardState.solved.has(item));

    if (!puzzle) {
        renderSectionDone(body, panel);
        return;
    }

    renderPuzzle(body, puzzle);
}

// Bereich fertig: sagen, was als Nächstes kommt
function renderSectionDone(body, panel) {
    const next = nextPanel(panel);
    const nextPuzzle = puzzlesOf(next).find(item => !hardState.solved.has(item));
    const ownPuzzles = puzzlesOf(panel);

    const status = ownPuzzles.length > 0
        ? `✓ Aufgabe ${HARD_MODE_PUZZLES.indexOf(ownPuzzles[ownPuzzles.length - 1]) + 1} gelöst, ${PANEL_LABELS[panel]} ist entschlüsselt.`
        : `✓ ${PANEL_LABELS[panel]} wurde schon mit der letzten Aufgabe freigeschaltet. Viel Spaß beim Lesen!`;

    const label = nextPuzzle
        ? `Weiter zu Aufgabe ${HARD_MODE_PUZZLES.indexOf(nextPuzzle) + 1}/${HARD_MODE_PUZZLES.length}: ${nextPuzzle.title}`
        : `Weiter zu ${PANEL_LABELS[next]}`;

    body.innerHTML = `
        <p class="hm-success"></p>
        <button type="button" class="hm-button primary" data-go="${next}"></button>
    `;
    body.querySelector('.hm-success').textContent = status;
    body.querySelector('[data-go]').textContent = `${label} →`;
    bindGoButtons(body);
}

function firstUnsolvedPanel() {
    return HARD_PANEL_ORDER.find(panel => !isPanelSolved(panel)) || 'contact';
}

function bindGoButtons(container) {
    container.querySelectorAll('[data-go]').forEach(button => {
        button.addEventListener('click', () => showPanel(button.dataset.go));
    });
}

/* Lückencode-Rätsel */

function renderPuzzle(body, puzzle) {
    const number = HARD_MODE_PUZZLES.indexOf(puzzle) + 1;

    // [[n]] im Code wird zur Lücke n
    const code = puzzle.code
        .split(/\[\[(\d+)\]\]/)
        .map((part, index) => index % 2 === 1
            ? `<span class="hm-slot" data-slot="${part}" role="button" tabindex="0" aria-label="Lücke ${Number(part) + 1}"></span>`
            : escapeHtml(part))
        .join('');

    const tokens = puzzle.tokens
        .map((token, index) => `<button type="button" class="hm-chip" data-token="${index}">${escapeHtml(token)}</button>`)
        .join('');

    body.innerHTML = `
        <p class="hm-kicker">Aufgabe ${number}/${HARD_MODE_PUZZLES.length} · ${puzzle.title}</p>
        <p class="hm-task">${escapeHtml(puzzle.task)}</p>
        <pre class="hm-code">${code}</pre>
        <p class="hm-muted">Ziehe die Bausteine in die Lücken oder tippe erst Baustein, dann Lücke. Jeder richtige Baustein baut das Portfolio weiter auf.</p>
        <div class="hm-pool">${tokens}</div>
        <div class="hm-feedback" aria-live="polite"></div>
        <button type="button" class="hm-hint-button" hidden>Hinweis anzeigen</button>
        <p class="hm-hint" hidden></p>
    `;

    setupDragAndDrop(body, puzzle);

    const hintButton = body.querySelector('.hm-hint-button');
    hintButton.hidden = hardState.attempts < HINT_AFTER_ATTEMPTS;
    hintButton.addEventListener('click', () => {
        hardState.hintsUsed++;
        updateIde();
        hintButton.hidden = true;
        const hint = body.querySelector('.hm-hint');
        hint.textContent = `# Hinweis: ${puzzle.hint}`;
        hint.hidden = false;
    });
}

function setupDragAndDrop(body, puzzle) {
    const pool = body.querySelector('.hm-pool');
    const slots = [...body.querySelectorAll('.hm-slot')];
    const placed = placedSlots.get(puzzle);
    let selectedChip = null;
    let busy = false;

    function selectChip(chip) {
        body.querySelectorAll('.hm-chip.selected').forEach(other => other.classList.remove('selected'));
        selectedChip = chip;
        chip?.classList.add('selected');
    }

    // Zurück in den Vorrat, in der ursprünglichen Reihenfolge
    function returnToPool(chip) {
        const index = Number(chip.dataset.token);
        const next = [...pool.children].find(other => Number(other.dataset.token) > index);
        pool.insertBefore(chip, next || null);
    }

    // Jeder Baustein wird sofort geprüft
    function placeChip(chip, slot) {
        selectChip(null);

        if (busy || slot.classList.contains('correct')) {
            return;
        }

        const slotIndex = Number(slot.dataset.slot);
        slot.append(chip);

        if (chip.textContent === puzzle.solution[slotIndex]) {
            markCorrect(chip, slot);
            placed.add(slotIndex);
            updateProgressBar();
            revealProgress(puzzle, placed.size);

            const feedback = body.querySelector('.hm-feedback');
            feedback.className = 'hm-feedback hm-success';
            feedback.textContent = `✓ ${placed.size}/${slots.length} kompiliert`;

            if (placed.size === slots.length) {
                busy = true;
                solvePuzzle(puzzle, body);
            }
            return;
        }

        busy = true;
        slot.classList.add('wrong');
        failPuzzle(`SyntaxError: ${chip.textContent} passt hier nicht.`);

        window.setTimeout(() => {
            slot.classList.remove('wrong');
            returnToPool(chip);
            busy = false;
        }, WRONG_MARK_DURATION);
    }

    function markCorrect(chip, slot) {
        chip.disabled = true;
        slot.classList.add('correct');
    }

    // Nach einem Bereichswechsel bereits gelöste Lücken wiederherstellen
    placed.forEach(slotIndex => {
        const slot = slots.find(item => Number(item.dataset.slot) === slotIndex);
        const chip = [...pool.children].find(item => item.textContent === puzzle.solution[slotIndex]);
        slot.append(chip);
        markCorrect(chip, slot);
    });

    function slotAt(x, y) {
        const element = document.elementFromPoint(x, y);
        return element ? element.closest('.hm-slot') : null;
    }

    body.querySelectorAll('.hm-chip').forEach(chip => {
        chip.addEventListener('pointerdown', event => {
            if (event.button !== 0 || chip.disabled || busy) {
                return;
            }

            const start = { x: event.clientX, y: event.clientY };
            let ghost = null;
            let hoveredSlot = null;

            function onMove(moveEvent) {
                if (!ghost) {
                    const distance = Math.hypot(moveEvent.clientX - start.x, moveEvent.clientY - start.y);

                    if (distance < DRAG_THRESHOLD) {
                        return;
                    }

                    ghost = chip.cloneNode(true);
                    ghost.classList.add('hm-ghost');
                    document.body.append(ghost);
                    chip.classList.add('dragging');
                }

                ghost.style.left = `${moveEvent.clientX}px`;
                ghost.style.top = `${moveEvent.clientY}px`;

                const slot = slotAt(moveEvent.clientX, moveEvent.clientY);

                if (slot !== hoveredSlot) {
                    hoveredSlot?.classList.remove('hover');
                    slot?.classList.add('hover');
                    hoveredSlot = slot;
                }
            }

            function onUp(upEvent) {
                window.removeEventListener('pointermove', onMove);
                window.removeEventListener('pointerup', onUp);
                window.removeEventListener('pointercancel', onUp);
                hoveredSlot?.classList.remove('hover');

                // Ohne Bewegung zählt es als Antippen
                if (!ghost) {
                    selectChip(selectedChip === chip ? null : chip);
                    return;
                }

                ghost.remove();
                chip.classList.remove('dragging');

                const slot = upEvent.type === 'pointerup' ? slotAt(upEvent.clientX, upEvent.clientY) : null;

                if (slot) {
                    placeChip(chip, slot);
                }
            }

            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
            window.addEventListener('pointercancel', onUp);
        });

        // Tastatur: Enter/Leertaste wählt den Baustein aus
        chip.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                selectChip(chip);
            }
        });
    });

    slots.forEach(slot => {
        function fillWithSelected() {
            if (selectedChip) {
                placeChip(selectedChip, slot);
            }
        }

        slot.addEventListener('click', fillWithSelected);

        slot.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                fillWithSelected();
            }
        });
    });
}

/* Ergebnis eines Versuchs */

function failPuzzle(message) {
    hardState.attempts++;
    hardState.wrongTotal++;
    updateIde();

    const feedback = hardConsole.querySelector('.hm-feedback');
    feedback.className = 'hm-feedback hm-error';
    feedback.textContent = message;

    hardConsole.classList.remove('shake');
    void hardConsole.offsetWidth;
    hardConsole.classList.add('shake');

    document.body.classList.remove('hm-glitch');
    void document.body.offsetWidth;
    document.body.classList.add('hm-glitch');

    const hint = hardConsole.querySelector('.hm-hint');

    if (hardState.attempts >= HINT_AFTER_ATTEMPTS && hint.hidden) {
        hardConsole.querySelector('.hm-hint-button').hidden = false;
    }
}

async function solvePuzzle(puzzle, body) {
    hardState.solved.add(puzzle);
    hardState.attempts = 0;

    body.querySelectorAll('.hm-pool, .hm-hint-button, .hm-hint, .hm-muted').forEach(element => {
        element.hidden = true;
    });

    await typeOutput(body.querySelector('.hm-feedback').parentElement, puzzle.output);

    if (!hardState.active) {
        return;
    }

    revealElements(puzzle).forEach(element => unlockElement(element, true));
    updateNavigationLocks();

    window.setTimeout(() => {
        if (hardState.solved.size === HARD_MODE_PUZZLES.length) {
            showFinale(finishSummary());
        }

        renderConsole();
    }, NEXT_PUZZLE_DELAY);
}

function finishSummary() {
    const seconds = Math.round((Date.now() - hardState.startedAt) / 1000);

    return {
        time: `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')} min`,
        wrong: hardState.wrongTotal,
        hints: hardState.hintsUsed
    };
}

function finishStats() {
    const summary = finishSummary();

    return [
        `zeit         = "${summary.time}"`,
        `fehlversuche = ${summary.wrong}`,
        `hinweise     = ${summary.hints}`
    ];
}

function renderFinish(body) {
    body.innerHTML = `
        <p class="hm-success hm-finish-title">✓ Portfolio vollständig entschlüsselt</p>
        <pre class="hm-code"></pre>
        <p class="hm-task">Danke fürs Durchspielen! Wenn Sie mehr sehen möchten: Ich freue mich über Ihre Nachricht.</p>
        <button type="button" class="hm-button primary hm-close">Konsole schließen</button>
    `;

    body.querySelector('.hm-code').textContent = finishStats().join('\n');
    body.querySelector('.hm-close').addEventListener('click', stopHardMode);
}

/* Start und Ende */

function startHardMode() {
    hardState.active = true;
    hardState.solved.clear();
    placedSlots.forEach(placed => placed.clear());
    hardState.attempts = 0;
    hardState.wrongTotal = 0;
    hardState.hintsUsed = 0;
    hardState.startedAt = Date.now();

    document.body.classList.add('hard-mode');
    createIde();
    HARD_MODE_PUZZLES.forEach(puzzle => revealElements(puzzle).forEach(lockElement));

    createConsole();
    showPanel('hero');
    renderConsole();
}

function stopHardMode() {
    hardState.active = false;
    HARD_MODE_PUZZLES.forEach(puzzle => revealElements(puzzle).forEach(element => unlockElement(element, false)));
    document.body.classList.remove('hard-mode');
    removeIde();
    updateNavigationLocks();

    if (hardConsole) {
        hardConsole.remove();
        hardConsole = null;
    }
}

document.addEventListener('portfolio:hard-mode', startHardMode);

// Gesperrte Bereiche lassen sich weder anklicken noch per Pfeiltaste öffnen
document.addEventListener(
    'click',
    event => {
        const button = event.target.closest('[data-target]');

        if (!hardState.active || !button || isPanelReachable(button.dataset.target)) {
            return;
        }

        event.preventDefault();
        event.stopImmediatePropagation();

        // Nur die Konsole aufklappen, gewackelt wird nur bei falschem Code
        hardState.collapsed = false;
        hardConsole.classList.remove('collapsed');
        hardConsole.querySelector('.hm-toggle').setAttribute('aria-expanded', 'true');
    },
    { capture: true }
);

document.addEventListener(
    'keydown',
    event => {
        if (!hardState.active || event.key !== 'ArrowRight') {
            return;
        }

        const next = nextPanel(currentPanel());

        if (next && !isPanelReachable(next)) {
            event.stopImmediatePropagation();
        }
    },
    { capture: true }
);

// Bei jedem Bereichswechsel die passende Aufgabe zeigen
const panelObserver = new MutationObserver(() => {
    if (hardState.active && hardConsole && currentPanel() !== hardState.renderedPanel) {
        renderConsole();
    }
});

document.querySelectorAll('[data-panel]').forEach(panel => {
    panelObserver.observe(panel, { attributes: true, attributeFilter: ['class'] });
});
