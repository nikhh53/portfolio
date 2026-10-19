/*
 * hard_mode(): Das Portfolio ist "verschlüsselt" und wird Rätsel für
 * Rätsel freigeschaltet. Jedes Rätsel ist ein Lückencode, dessen Lücken
 * per Drag-and-drop (oder Antippen) mit Bausteinen gefüllt werden.
 * Die Rätsel stehen in hardmode-puzzles.js. Gestartet wird der Modus
 * vom Boot-Screen über das Event "portfolio:hard-mode".
 */
const HARD_PANEL_ORDER = ['hero', 'about', 'skills', 'projects', 'contact'];
const HINT_AFTER_ATTEMPTS = 2;
const NEXT_PUZZLE_DELAY = 900;
const WRONG_MARK_DURATION = 700;
const DRAG_THRESHOLD = 5;

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

function setLocked(puzzle, locked) {
    puzzle.reveals.forEach(selector => {
        document.querySelectorAll(selector).forEach(element => {
            element.classList.toggle('hm-locked', locked);
            element.classList.toggle('hm-unlocking', !locked);

            if (locked) {
                element.setAttribute('aria-hidden', 'true');
                element.setAttribute('inert', '');
            } else {
                element.removeAttribute('aria-hidden');
                element.removeAttribute('inert');
            }
        });
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
    `;

    document.body.append(hardConsole);

    hardConsole.querySelector('.hm-toggle').addEventListener('click', () => {
        hardState.collapsed = !hardState.collapsed;
        hardConsole.classList.toggle('collapsed', hardState.collapsed);
        hardConsole.querySelector('.hm-toggle').setAttribute('aria-expanded', String(!hardState.collapsed));
    });

    hardConsole.querySelector('.hm-exit').addEventListener('click', stopHardMode);
}

function updateProgressBar() {
    const total = HARD_MODE_PUZZLES.length;
    const solved = hardState.solved.size;

    hardConsole.querySelector('.hm-progress').textContent = `${solved}/${total} gelöst`;
    hardConsole.querySelector('.hm-bar span').style.width = `${(solved / total) * 100}%`;
}

function renderConsole() {
    if (!hardState.active) {
        return;
    }

    updateProgressBar();
    updateNavigationLocks();

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
        body.innerHTML = `
            <p class="hm-success">✓ Abschnitt entschlüsselt.</p>
            <button type="button" class="hm-button primary" data-go="${nextPanel(panel)}">Weiter zum nächsten Abschnitt</button>
        `;
        bindGoButtons(body);
        return;
    }

    renderPuzzle(body, puzzle);
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
        <p class="hm-kicker">Aufgabe ${number} · ${puzzle.title}</p>
        <p class="hm-task">${escapeHtml(puzzle.task)}</p>
        <pre class="hm-code">${code}</pre>
        <p class="hm-muted">Ziehe die Bausteine in die Lücken oder tippe erst Baustein, dann Lücke.</p>
        <div class="hm-pool">${tokens}</div>
        <button type="button" class="hm-button primary hm-run" disabled>Ausführen ▶</button>
        <div class="hm-feedback" aria-live="polite"></div>
        <button type="button" class="hm-hint-button" hidden>Hinweis anzeigen</button>
        <p class="hm-hint" hidden></p>
    `;

    setupDragAndDrop(body, puzzle);

    const hintButton = body.querySelector('.hm-hint-button');
    hintButton.hidden = hardState.attempts < HINT_AFTER_ATTEMPTS;
    hintButton.addEventListener('click', () => {
        hardState.hintsUsed++;
        hintButton.hidden = true;
        const hint = body.querySelector('.hm-hint');
        hint.textContent = `# Hinweis: ${puzzle.hint}`;
        hint.hidden = false;
    });
}

function setupDragAndDrop(body, puzzle) {
    const pool = body.querySelector('.hm-pool');
    const slots = [...body.querySelectorAll('.hm-slot')];
    const runButton = body.querySelector('.hm-run');
    let selectedChip = null;

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

    function placeChip(chip, slot) {
        const previous = slot.querySelector('.hm-chip');

        if (previous && previous !== chip) {
            returnToPool(previous);
        }

        slot.append(chip);
        selectChip(null);
        updateState();
    }

    function updateState() {
        slots.forEach(slot => slot.classList.toggle('filled', slot.querySelector('.hm-chip') !== null));
        runButton.disabled = slots.some(slot => !slot.querySelector('.hm-chip'));
    }

    function slotAt(x, y) {
        const element = document.elementFromPoint(x, y);
        return element ? element.closest('.hm-slot') : null;
    }

    body.querySelectorAll('.hm-chip').forEach(chip => {
        chip.addEventListener('pointerdown', event => {
            if (event.button !== 0 || runButton.dataset.done) {
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
                    if (chip.parentElement.classList.contains('hm-slot')) {
                        returnToPool(chip);
                        updateState();
                    } else {
                        selectChip(selectedChip === chip ? null : chip);
                    }
                    return;
                }

                ghost.remove();
                chip.classList.remove('dragging');

                const target = upEvent.type === 'pointerup'
                    ? document.elementFromPoint(upEvent.clientX, upEvent.clientY)
                    : null;
                const slot = target ? target.closest('.hm-slot') : null;

                if (slot) {
                    placeChip(chip, slot);
                } else if (target && pool.contains(target) && chip.parentElement.classList.contains('hm-slot')) {
                    returnToPool(chip);
                    updateState();
                }
            }

            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
            window.addEventListener('pointercancel', onUp);
        });

        // Tastatur: Enter/Leertaste wählt aus bzw. legt zurück
        chip.addEventListener('keydown', event => {
            if (event.key !== 'Enter' && event.key !== ' ') {
                return;
            }

            event.preventDefault();

            if (chip.parentElement.classList.contains('hm-slot')) {
                returnToPool(chip);
                updateState();
            } else {
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

        slot.addEventListener('click', event => {
            if (!event.target.closest('.hm-chip')) {
                fillWithSelected();
            }
        });

        slot.addEventListener('keydown', event => {
            if (event.target === slot && (event.key === 'Enter' || event.key === ' ')) {
                event.preventDefault();
                fillWithSelected();
            }
        });
    });

    runButton.addEventListener('click', () => {
        const wrongSlots = slots.filter(slot =>
            slot.querySelector('.hm-chip').textContent !== puzzle.solution[Number(slot.dataset.slot)]
        );

        if (wrongSlots.length === 0) {
            runButton.dataset.done = 'true';
            slots.forEach(slot => slot.classList.add('correct'));
            solvePuzzle(puzzle);
            return;
        }

        wrongSlots.forEach(slot => slot.classList.add('wrong'));
        runButton.disabled = true;

        window.setTimeout(() => {
            wrongSlots.forEach(slot => {
                slot.classList.remove('wrong');
                returnToPool(slot.querySelector('.hm-chip'));
            });
            updateState();
        }, WRONG_MARK_DURATION);

        failPuzzle(`AssertionError: ${wrongSlots.length} von ${slots.length} Lücken falsch.`);
    });
}

/* Ergebnis eines Versuchs */

function failPuzzle(message) {
    hardState.attempts++;
    hardState.wrongTotal++;

    const feedback = hardConsole.querySelector('.hm-feedback');
    feedback.className = 'hm-feedback hm-error';
    feedback.textContent = message;

    hardConsole.classList.remove('shake');
    void hardConsole.offsetWidth;
    hardConsole.classList.add('shake');

    const hint = hardConsole.querySelector('.hm-hint');

    if (hardState.attempts >= HINT_AFTER_ATTEMPTS && hint.hidden) {
        hardConsole.querySelector('.hm-hint-button').hidden = false;
    }
}

function solvePuzzle(puzzle) {
    hardState.solved.add(puzzle);
    hardState.attempts = 0;

    const feedback = hardConsole.querySelector('.hm-feedback');
    feedback.className = 'hm-feedback hm-success';
    feedback.textContent = '✓ Test bestanden. Entschlüssle ...';

    hardConsole.querySelectorAll('.hm-body button').forEach(button => {
        button.disabled = true;
    });

    setLocked(puzzle, false);
    updateProgressBar();
    window.setTimeout(renderConsole, NEXT_PUZZLE_DELAY);
}

function renderFinish(body) {
    const seconds = Math.round((Date.now() - hardState.startedAt) / 1000);
    const time = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

    body.innerHTML = `
        <p class="hm-success hm-finish-title">✓ Portfolio vollständig entschlüsselt</p>
        <pre class="hm-code">zeit         = "${time} min"
fehlversuche = ${hardState.wrongTotal}
hinweise     = ${hardState.hintsUsed}</pre>
        <p class="hm-task">Danke fürs Durchspielen! Wenn Sie mehr sehen möchten: Ich freue mich über Ihre Nachricht.</p>
        <button type="button" class="hm-button primary hm-close">Konsole schließen</button>
    `;

    body.querySelector('.hm-close').addEventListener('click', stopHardMode);
}

/* Start und Ende */

function startHardMode() {
    hardState.active = true;
    hardState.solved.clear();
    hardState.attempts = 0;
    hardState.wrongTotal = 0;
    hardState.hintsUsed = 0;
    hardState.startedAt = Date.now();

    document.body.classList.add('hard-mode');
    HARD_MODE_PUZZLES.forEach(puzzle => setLocked(puzzle, true));

    createConsole();
    showPanel('hero');
    renderConsole();
}

function stopHardMode() {
    hardState.active = false;
    HARD_MODE_PUZZLES.forEach(puzzle => setLocked(puzzle, false));
    document.body.classList.remove('hard-mode');
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

        hardState.collapsed = false;
        hardConsole.classList.remove('collapsed', 'shake');
        void hardConsole.offsetWidth;
        hardConsole.classList.add('shake');
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
