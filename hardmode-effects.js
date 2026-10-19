/*
 * Effekte für hard_mode(): Texte "entschlüsseln", Programm-Ausgaben
 * eintippen. Das Finale steht in hardmode-finale.js.
 */
const DECODE_DURATION = 900;
const DECODE_GLYPHS = '01<>/{}[]#$%&*+=?';
const OUTPUT_CHAR_DELAY = 14;
const OUTPUT_LINE_PAUSE = 220;

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
