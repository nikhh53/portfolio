/*
 * hard_mode(): Das Portfolio ist "verschlüsselt" und wird Rätsel für
 * Rätsel freigeschaltet. Die Rätsel stehen in hardmode-puzzles.js.
 * Gestartet wird der Modus vom Boot-Screen über das Event
 * "portfolio:hard-mode".
 */
const HARD_PANEL_ORDER = ['hero', 'about', 'skills', 'projects', 'contact'];
const HINT_AFTER_ATTEMPTS = 2;
const NEXT_PUZZLE_DELAY = 900;

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

function normalizeAnswer(value) {
    return value.replace(/\s+/g, '').replace(/"/g, "'").toLowerCase();
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

/* Mini-SQL für die Projekte-Rätsel */

const SQL_CONDITION =
    /^(\w+)\s*(=|!=|<>|>=|<=|>|<|like)\s*(?:'([^']*)'|"([^"]*)"|(-?\d+))$/i;

function sqlCompare(cellValue, operator, expected) {
    const left = typeof cellValue === 'string' ? cellValue.toLowerCase() : cellValue;
    const right = typeof expected === 'string' ? expected.toLowerCase() : expected;

    switch (operator.toLowerCase()) {
        case '=': return left == right;
        case '!=':
        case '<>': return left != right;
        case '>': return left > right;
        case '<': return left < right;
        case '>=': return left >= right;
        case '<=': return left <= right;
        case 'like': {
            const pattern = String(right)
                .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                .replace(/%/g, '.*')
                .replace(/_/g, '.');
            return new RegExp(`^${pattern}$`).test(String(left));
        }
        default: return false;
    }
}

// Unterstützt SELECT ... FROM projekte [WHERE a AND b OR c] [LIMIT n]
function runSql(query) {
    const match = query.trim().replace(/;\s*$/, '').match(
        /^select\s+(.+?)\s+from\s+(\w+)(?:\s+where\s+(.+?))?(?:\s+limit\s+(\d+))?$/i
    );

    if (!match) {
        throw new Error('ERROR 1064: Syntaxfehler. Aufbau: SELECT spalten FROM tabelle WHERE bedingung;');
    }

    const [, columnList, tableName, whereClause, limit] = match;

    if (tableName.toLowerCase() !== SQL_TABLE.name) {
        throw new Error(`ERROR 1146: Table '${tableName}' doesn't exist`);
    }

    const columns = columnList.trim() === '*'
        ? SQL_TABLE.columns
        : columnList.split(',').map(column => column.trim().toLowerCase());

    columns.forEach(column => {
        if (!SQL_TABLE.columns.includes(column)) {
            throw new Error(`ERROR 1054: Unknown column '${column}'`);
        }
    });

    // OR-Gruppen aus AND-Bedingungen
    const orGroups = whereClause
        ? whereClause.split(/\s+or\s+/i).map(group =>
            group.split(/\s+and\s+/i).map(condition => {
                const parts = condition.trim().match(SQL_CONDITION);

                if (!parts || !SQL_TABLE.columns.includes(parts[1].toLowerCase())) {
                    throw new Error(`ERROR 1064: Unklare Bedingung '${condition.trim()}'`);
                }

                const value = parts[5] !== undefined ? Number(parts[5]) : (parts[3] ?? parts[4]);
                return { column: parts[1].toLowerCase(), operator: parts[2], value };
            })
        )
        : [];

    let rows = SQL_TABLE.rows.filter(row =>
        orGroups.length === 0 ||
        orGroups.some(group =>
            group.every(({ column, operator, value }) => sqlCompare(row[column], operator, value))
        )
    );

    if (limit !== undefined) {
        rows = rows.slice(0, Number(limit));
    }

    return { columns, rows, where: whereClause || '' };
}

function renderSqlResult(result) {
    if (result.rows.length === 0) {
        return '<p class="hm-muted">Empty set (0 Zeilen)</p>';
    }

    const head = result.columns.map(column => `<th>${column}</th>`).join('');
    const body = result.rows
        .map(row => `<tr>${result.columns.map(column => `<td>${escapeHtml(String(row[column]))}</td>`).join('')}</tr>`)
        .join('');

    return `<table class="hm-sql-result"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
        <p class="hm-muted">${result.rows.length} Zeile(n)</p>`;
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
        const next = nextPanel(panel);
        body.innerHTML = `
            <p class="hm-success">✓ Abschnitt entschlüsselt.</p>
            <button type="button" class="hm-button primary" data-go="${next}">Weiter zum nächsten Abschnitt</button>
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

function renderPuzzle(body, puzzle) {
    const number = HARD_MODE_PUZZLES.indexOf(puzzle) + 1;
    const code = puzzle.code ? `<pre class="hm-code">${escapeHtml(puzzle.code)}</pre>` : '';

    body.innerHTML = `
        <p class="hm-kicker">Aufgabe ${number} · ${puzzle.title}</p>
        <p class="hm-task">${escapeHtml(puzzle.task)}</p>
        ${code}
        <div class="hm-interaction"></div>
        <div class="hm-feedback" aria-live="polite"></div>
        <button type="button" class="hm-hint-button" hidden>Hinweis anzeigen</button>
        <p class="hm-hint" hidden></p>
    `;

    const interaction = body.querySelector('.hm-interaction');
    const renderers = {
        text: renderTextPuzzle,
        choice: renderChoicePuzzle,
        connect: renderConnectPuzzle,
        sql: renderSqlPuzzle
    };

    renderers[puzzle.type](interaction, puzzle);

    const hintButton = body.querySelector('.hm-hint-button');
    hintButton.hidden = hardState.attempts < HINT_AFTER_ATTEMPTS;
    hintButton.addEventListener('click', () => {
        hardState.hintsUsed++;
        hintButton.hidden = true;
        const hint = body.querySelector('.hm-hint');
        hint.textContent = `# Hinweis: ${puzzle.hint}`;
        hint.hidden = false;
    });

    // Auf dem Handy nicht automatisch die Tastatur öffnen
    const firstInput = interaction.querySelector('input, textarea');

    if (firstInput && window.matchMedia('(pointer: fine)').matches) {
        firstInput.focus({ preventScroll: true });
    }
}

function renderTextPuzzle(container, puzzle) {
    container.innerHTML = `
        <form class="hm-form">
            <span class="hm-prompt">&gt;</span>
            <input class="hm-input" type="text" autocomplete="off" autocapitalize="off"
                spellcheck="false" aria-label="Antwort">
            <button type="submit" class="hm-button primary">Ausführen</button>
        </form>
    `;

    const input = container.querySelector('input');
    input.value = puzzle.prefill || '';
    input.placeholder = puzzle.placeholder || '';

    container.querySelector('form').addEventListener('submit', event => {
        event.preventDefault();
        const answer = normalizeAnswer(input.value);
        const correct = puzzle.pattern
            ? puzzle.pattern.test(answer)
            : puzzle.answers.includes(answer);

        if (correct) {
            solvePuzzle(puzzle);
        } else {
            failPuzzle(answer === '' ? 'SyntaxError: Eingabe ist leer' : 'AssertionError: Das stimmt noch nicht.');
        }
    });
}

function renderChoicePuzzle(container, puzzle) {
    container.innerHTML = `<div class="hm-choices">${puzzle.options
        .map((option, index) => `<button type="button" class="hm-choice" data-index="${index}">${escapeHtml(option)}</button>`)
        .join('')}</div>`;

    container.querySelectorAll('.hm-choice').forEach(button => {
        button.addEventListener('click', () => {
            if (Number(button.dataset.index) === puzzle.correct) {
                button.classList.add('correct');
                solvePuzzle(puzzle);
            } else {
                button.classList.add('wrong');
                button.disabled = true;
                failPuzzle(`AssertionError: ${button.textContent} liegt im Netz.`);
            }
        });
    });
}

function renderConnectPuzzle(container, puzzle) {
    const right = puzzle.rightOrder.map(index => ({ index, label: puzzle.pairs[index][1] }));

    container.innerHTML = `
        <div class="hm-connect">
            <svg class="hm-lines" aria-hidden="true"></svg>
            <div class="hm-column">${puzzle.pairs
                .map(([label], index) => `<button type="button" class="hm-node left" data-index="${index}">${label}</button>`)
                .join('')}</div>
            <div class="hm-column">${right
                .map(({ index, label }) => `<button type="button" class="hm-node right" data-index="${index}">${escapeHtml(label)}</button>`)
                .join('')}</div>
        </div>
        <button type="button" class="hm-button primary hm-check" disabled>Verbindungen prüfen</button>
    `;

    const links = new Map();
    const svg = container.querySelector('.hm-lines');
    const checkButton = container.querySelector('.hm-check');
    let selectedLeft = null;

    function drawLines() {
        if (!container.isConnected) {
            window.removeEventListener('resize', drawLines);
            return;
        }

        const box = container.querySelector('.hm-connect').getBoundingClientRect();
        svg.innerHTML = '';

        links.forEach((rightIndex, leftIndex) => {
            const from = container.querySelector(`.left[data-index="${leftIndex}"]`).getBoundingClientRect();
            const to = container.querySelector(`.right[data-index="${rightIndex}"]`).getBoundingClientRect();
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');

            line.setAttribute('x1', from.right - box.left);
            line.setAttribute('y1', from.top + from.height / 2 - box.top);
            line.setAttribute('x2', to.left - box.left);
            line.setAttribute('y2', to.top + to.height / 2 - box.top);
            svg.append(line);
        });

        container.querySelectorAll('.hm-node').forEach(node => {
            const index = Number(node.dataset.index);
            const linked = node.classList.contains('left')
                ? links.has(index)
                : [...links.values()].includes(index);
            node.classList.toggle('linked', linked);
        });

        checkButton.disabled = links.size < puzzle.pairs.length;
    }

    container.querySelectorAll('.hm-node.left').forEach(node => {
        node.addEventListener('click', () => {
            container.querySelectorAll('.hm-node.left').forEach(other => other.classList.remove('selected'));
            selectedLeft = Number(node.dataset.index);
            node.classList.add('selected');
        });
    });

    container.querySelectorAll('.hm-node.right').forEach(node => {
        node.addEventListener('click', () => {
            if (selectedLeft === null) {
                return;
            }

            const rightIndex = Number(node.dataset.index);

            // Eine rechte Seite kann nur mit einer linken verbunden sein
            links.forEach((value, key) => {
                if (value === rightIndex) {
                    links.delete(key);
                }
            });

            links.set(selectedLeft, rightIndex);
            container.querySelector('.hm-node.left.selected').classList.remove('selected');
            selectedLeft = null;
            drawLines();
        });
    });

    checkButton.addEventListener('click', () => {
        const wrong = [...links].filter(([left, rightIndex]) => left !== rightIndex);

        if (wrong.length === 0) {
            svg.classList.add('correct');
            solvePuzzle(puzzle);
            return;
        }

        wrong.forEach(([left]) => links.delete(left));
        drawLines();
        failPuzzle(`ConnectionError: ${wrong.length} Verbindung(en) falsch, die habe ich getrennt.`);
    });

    window.addEventListener('resize', drawLines);
}

function renderSqlPuzzle(container, puzzle) {
    const header = SQL_TABLE.columns.join(' | ');

    container.innerHTML = `
        <p class="hm-muted">Tabelle <strong>${SQL_TABLE.name}</strong>: ${header}</p>
        <form class="hm-form hm-sql-form">
            <span class="hm-prompt">sql&gt;</span>
            <input class="hm-input" type="text" autocomplete="off" autocapitalize="off"
                spellcheck="false" placeholder="SELECT * FROM projekte WHERE ..." aria-label="SQL-Abfrage">
            <button type="submit" class="hm-button primary">Ausführen</button>
        </form>
        <div class="hm-sql-output"></div>
    `;

    const input = container.querySelector('input');
    const output = container.querySelector('.hm-sql-output');

    container.querySelector('form').addEventListener('submit', event => {
        event.preventDefault();

        let result;

        try {
            result = runSql(input.value);
        } catch (error) {
            output.innerHTML = '';
            failPuzzle(error.message);
            return;
        }

        output.innerHTML = renderSqlResult(result);

        if (puzzle.forbidden && puzzle.forbidden.test(result.where.toLowerCase())) {
            failPuzzle('Fast: Die Aufgabe sagt, ohne die id. Versuch es über den Namen.');
            return;
        }

        const ids = result.rows.map(row => row.id).sort().join(',');

        if (ids === puzzle.targetIds.join(',')) {
            solvePuzzle(puzzle);
        } else {
            failPuzzle('AssertionError: Die Abfrage liefert nicht genau das gesuchte Projekt.');
        }
    });
}

/* Ergebnis eines Versuchs */

function feedbackElement() {
    return hardConsole.querySelector('.hm-feedback');
}

function failPuzzle(message) {
    hardState.attempts++;
    hardState.wrongTotal++;

    const feedback = feedbackElement();
    feedback.className = 'hm-feedback hm-error';
    feedback.textContent = message;

    hardConsole.classList.remove('shake');
    void hardConsole.offsetWidth;
    hardConsole.classList.add('shake');

    if (hardState.attempts >= HINT_AFTER_ATTEMPTS) {
        const hintButton = hardConsole.querySelector('.hm-hint-button');
        const hint = hardConsole.querySelector('.hm-hint');

        if (hintButton && hint.hidden) {
            hintButton.hidden = false;
        }
    }
}

function solvePuzzle(puzzle) {
    hardState.solved.add(puzzle);
    hardState.attempts = 0;

    const feedback = feedbackElement();
    feedback.className = 'hm-feedback hm-success';
    feedback.textContent = '✓ Test bestanden. Entschlüssle ...';

    hardConsole.querySelectorAll('input, button:not(.hm-toggle):not(.hm-exit)').forEach(element => {
        element.disabled = true;
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
        <pre class="hm-code">zeit        = "${time} min"
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
