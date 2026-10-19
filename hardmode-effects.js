/*
 * Effekte für hard_mode(): Texte "entschlüsseln", Programm-Ausgaben
 * eintippen und das Deploy-Finale am Ende.
 */
const DECODE_DURATION = 900;
const DECODE_GLYPHS = '01<>/{}[]#$%&*+=?';
const OUTPUT_CHAR_DELAY = 14;
const OUTPUT_LINE_PAUSE = 220;
const PIPELINE_STEP_DURATION = 650;

const effectsReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function effectWait(milliseconds) {
    return new Promise(resolve => window.setTimeout(resolve, effectsReduced ? 0 : milliseconds));
}

function randomGlyph() {
    return DECODE_GLYPHS[Math.floor(Math.random() * DECODE_GLYPHS.length)];
}

// Zeichen werden von links nach rechts aus Zufallszeichen "entschlüsselt"
function decodeText(element) {
    if (effectsReduced) {
        return;
    }

    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
        acceptNode: node => (node.textContent.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT)
    });

    const nodes = [];

    while (walker.nextNode()) {
        nodes.push({ node: walker.currentNode, original: walker.currentNode.textContent });
    }

    if (nodes.length === 0) {
        return;
    }

    const startedAt = performance.now();

    function frame(now) {
        const progress = Math.min(1, (now - startedAt) / DECODE_DURATION);

        nodes.forEach(({ node, original }) => {
            const resolved = Math.floor(original.length * progress);

            node.textContent = original.slice(0, resolved) + original
                .slice(resolved)
                .replace(/\S/g, randomGlyph);
        });

        if (progress < 1) {
            requestAnimationFrame(frame);
        }
    }

    requestAnimationFrame(frame);
}

// Ausgabe eines "Programms" Zeile für Zeile eintippen
async function typeOutput(container, lines) {
    const output = document.createElement('pre');
    output.className = 'hm-output';
    container.append(output);

    for (const line of lines) {
        const row = document.createElement('div');
        row.className = line.startsWith('$') || line.startsWith('>') || line.startsWith('mysql>')
            ? 'hm-output-command'
            : '';
        output.append(row);

        for (const character of line) {
            row.textContent += character;
            await effectWait(OUTPUT_CHAR_DELAY);
        }

        output.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        await effectWait(OUTPUT_LINE_PAUSE);
    }
}

// Großes Finale: eine CI-Pipeline läuft durch, danach der Kontaktknopf
async function showDeployPipeline(stats) {
    const target = visitorCompany || 'Ihr Team';
    const steps = [
        ['lint', 'Code-Stil geprüft'],
        ['test', `${HARD_MODE_PUZZLES.length}/${HARD_MODE_PUZZLES.length} Aufgaben bestanden`],
        ['build', 'Portfolio kompiliert'],
        ['deploy', `ausgeliefert an ${target}`]
    ];

    const banner = document.createElement('div');
    banner.className = 'hm-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Portfolio entschlüsselt');
    banner.innerHTML = `
        <div class="hm-banner-box">
            <p class="hm-pipeline-command">$ git push origin praktikum</p>
            <ul class="hm-pipeline"></ul>
            <div class="hm-pipeline-result" hidden>
                <p class="hm-banner-title">BUILD SUCCESSFUL</p>
                <p class="hm-banner-target"></p>
                <pre></pre>
                <div class="hm-banner-actions">
                    <a class="hm-button primary hm-hire">sudo hire niklas</a>
                    <button type="button" class="hm-button hm-banner-close">Portfolio ansehen</button>
                </div>
            </div>
        </div>
    `;

    banner.querySelector('.hm-banner-target').textContent =
        `Niklas → ${target}: bereit fürs Praktikum ab 07.06.2027`;
    banner.querySelector('pre').textContent = stats.join('\n');
    banner.querySelector('.hm-hire').href = hireMailLink();
    document.body.append(banner);

    function close() {
        banner.classList.add('closing');
        window.setTimeout(() => banner.remove(), 600);
        document.removeEventListener('keydown', closeOnEscape);
    }

    function closeOnEscape(event) {
        if (event.key === 'Escape') {
            close();
        }
    }

    banner.querySelector('.hm-banner-close').addEventListener('click', close);
    document.addEventListener('keydown', closeOnEscape);

    const list = banner.querySelector('.hm-pipeline');

    for (const [name, label] of steps) {
        const step = document.createElement('li');
        step.className = 'running';
        step.innerHTML = '<span class="hm-step-icon"></span><span class="hm-step-name"></span><span class="hm-step-label"></span>';
        step.querySelector('.hm-step-name').textContent = name;
        step.querySelector('.hm-step-label').textContent = label;
        list.append(step);

        await effectWait(PIPELINE_STEP_DURATION);
        step.className = 'done';
    }

    await effectWait(PIPELINE_STEP_DURATION / 2);
    banner.querySelector('.hm-pipeline-result').hidden = false;
    banner.querySelector('.hm-hire').focus({ preventScroll: true });
}
