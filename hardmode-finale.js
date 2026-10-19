/*
 * Finale von hard_mode(): eine CI-Pipeline läuft sichtbar durch
 * (Jobs, Live-Log, Laufzeit), danach erscheint die Erfolgsseite mit
 * Statistik und Kontaktknöpfen.
 */
const FINALE_LOG_DELAY = 170;
const FINALE_JOB_PAUSE = 260;
const FINALE_COUNT_DURATION = 900;
const BURST_PARTICLES = 90;
const BURST_DURATION = 1600;

function finaleJobs(target) {
    return [
        {
            name: 'lint',
            label: 'Code-Stil',
            log: [
                '$ eslint start.py netzwerk.conf projekte.sql kontakt.js',
                '✓ 0 Fehler, 0 Warnungen'
            ]
        },
        {
            name: 'test',
            label: 'Aufgaben',
            log: [
                '$ npm test',
                ...HARD_MODE_PUZZLES.map((puzzle, index) =>
                    `✓ Aufgabe ${index + 1} · ${puzzle.title} (${puzzle.solution.length}/${puzzle.solution.length} Bausteine)`),
                `✓ ${HARD_MODE_PUZZLES.length} von ${HARD_MODE_PUZZLES.length} bestanden`
            ]
        },
        {
            name: 'build',
            label: 'Portfolio',
            log: [
                '$ npm run build',
                'Kompiliere Start, Über mich, Skills, Projekte, Kontakt ...',
                '✓ dist/portfolio erstellt'
            ]
        },
        {
            name: 'deploy',
            label: target,
            log: [
                `$ deploy --ziel "${target}" --start 07.06.2027`,
                'Rollout 100 %',
                '✓ https://nikhh53.github.io/portfolio'
            ]
        }
    ];
}

function formatRunTime(milliseconds) {
    return `${(milliseconds / 1000).toFixed(1)} s`;
}

function countUp(element, value) {
    if (effectsReduced || typeof value !== 'number') {
        element.textContent = value;
        return;
    }

    const startedAt = performance.now();

    function frame(now) {
        const progress = Math.min(1, (now - startedAt) / FINALE_COUNT_DURATION);
        element.textContent = Math.round(value * progress);

        if (progress < 1) {
            requestAnimationFrame(frame);
        }
    }

    requestAnimationFrame(frame);
}

// Code-Zeichen fliegen vom Haken aus in alle Richtungen
function codeBurst(origin) {
    if (effectsReduced) {
        return;
    }

    const canvas = document.createElement('canvas');
    canvas.className = 'hm-burst';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.append(canvas);

    const context = canvas.getContext('2d');
    const box = origin.getBoundingClientRect();
    const centerX = box.left + box.width / 2;
    const centerY = box.top + box.height / 2;
    const glyphs = '{}<>/;()=01';

    const particles = Array.from({ length: BURST_PARTICLES }, () => {
        const angle = Math.random() * Math.PI * 2;
        const speed = 3 + Math.random() * 7;

        return {
            x: centerX,
            y: centerY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 2,
            glyph: glyphs[Math.floor(Math.random() * glyphs.length)],
            color: Math.random() > 0.3 ? '#00e5cc' : '#e8e8e8'
        };
    });

    const startedAt = performance.now();

    function frame(now) {
        const progress = (now - startedAt) / BURST_DURATION;

        context.clearRect(0, 0, canvas.width, canvas.height);
        context.globalAlpha = Math.max(0, 1 - progress);
        context.font = '15px "JetBrains Mono", monospace';

        particles.forEach(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.18;
            context.fillStyle = particle.color;
            context.fillText(particle.glyph, particle.x, particle.y);
        });

        if (progress < 1) {
            requestAnimationFrame(frame);
        } else {
            canvas.remove();
        }
    }

    requestAnimationFrame(frame);
}

async function showFinale(summary) {
    const target = visitorCompany || 'Ihr Team';
    const jobs = finaleJobs(target);

    const finale = document.createElement('div');
    finale.className = 'hm-finale';
    finale.setAttribute('role', 'dialog');
    finale.setAttribute('aria-label', 'Portfolio entschlüsselt');
    finale.innerHTML = `
        <div class="hm-run">
            <header class="hm-run-header">
                <span class="hm-window-dots" aria-hidden="true"><i></i><i></i><i></i></span>
                <span class="hm-run-title">praktikum.yml <span>· git push origin praktikum</span></span>
                <span class="hm-run-status running">läuft</span>
                <span class="hm-run-time">0.0 s</span>
            </header>
            <ol class="hm-jobs">
                ${jobs.map(job => `
                    <li class="hm-job">
                        <span class="hm-job-icon"></span>
                        <span class="hm-job-name">${job.name}</span>
                        <span class="hm-job-label"></span>
                    </li>
                `).join('')}
            </ol>
            <pre class="hm-run-log" aria-live="polite"></pre>
            <section class="hm-result" hidden>
                <svg class="hm-result-check" viewBox="0 0 52 52" aria-hidden="true">
                    <circle cx="26" cy="26" r="24"></circle>
                    <path d="M15 27 l7 7 l15 -16"></path>
                </svg>
                <p class="hm-result-kicker">Deployment erfolgreich · v2027.06.07</p>
                <h2 class="hm-result-title"></h2>
                <p class="hm-result-meta">Umschulungspraktikum Anwendungsentwicklung · 07.06.2027 – 31.01.2028 · Hamburg</p>
                <dl class="hm-result-stats">
                    <div><dt>Zeit</dt><dd data-stat="time"></dd></div>
                    <div><dt>Fehlversuche</dt><dd data-stat="wrong"></dd></div>
                    <div><dt>Hinweise</dt><dd data-stat="hints"></dd></div>
                </dl>
                <div class="hm-result-actions">
                    <a class="hm-finale-button primary hm-hire"><i class="fas fa-paper-plane"></i> sudo hire niklas</a>
                    <button type="button" class="hm-finale-button hm-cv"><i class="fas fa-file-arrow-down"></i> Lebenslauf</button>
                    <button type="button" class="hm-finale-button ghost hm-finale-close">Portfolio ansehen</button>
                </div>
            </section>
        </div>
    `;

    finale.querySelectorAll('.hm-job-label').forEach((label, index) => {
        label.textContent = jobs[index].label;
    });
    finale.querySelector('.hm-result-title').textContent = `Niklas Bakowsky → ${target}`;
    finale.querySelector('.hm-hire').href = hireMailLink();
    finale.querySelector('.hm-cv').addEventListener('click', downloadCv);
    document.body.append(finale);

    const startedAt = performance.now();
    const timeLabel = finale.querySelector('.hm-run-time');
    const timer = window.setInterval(() => {
        timeLabel.textContent = formatRunTime(performance.now() - startedAt);
    }, 100);

    function close() {
        window.clearInterval(timer);
        finale.classList.add('closing');
        window.setTimeout(() => finale.remove(), 600);
        document.removeEventListener('keydown', closeOnEscape);
    }

    function closeOnEscape(event) {
        if (event.key === 'Escape') {
            close();
        }
    }

    finale.querySelector('.hm-finale-close').addEventListener('click', close);
    document.addEventListener('keydown', closeOnEscape);

    const log = finale.querySelector('.hm-run-log');
    const jobItems = finale.querySelectorAll('.hm-job');

    for (const [index, job] of jobs.entries()) {
        const jobStartedAt = performance.now();
        jobItems[index].classList.add('running');

        for (const line of job.log) {
            const row = document.createElement('div');
            row.className = line.startsWith('$') ? 'command' : line.startsWith('✓') ? 'ok' : '';
            row.textContent = line;
            log.append(row);
            log.scrollTop = log.scrollHeight;
            await effectWait(FINALE_LOG_DELAY);
        }

        await effectWait(FINALE_JOB_PAUSE);
        jobItems[index].classList.replace('running', 'done');
        jobItems[index].querySelector('.hm-job-label').textContent =
            `${job.label} · ${formatRunTime(performance.now() - jobStartedAt)}`;
    }

    window.clearInterval(timer);
    timeLabel.textContent = formatRunTime(performance.now() - startedAt);

    const status = finale.querySelector('.hm-run-status');
    status.textContent = 'erfolgreich';
    status.className = 'hm-run-status done';

    log.hidden = true;
    const success = finale.querySelector('.hm-result');
    success.hidden = false;

    finale.querySelector('[data-stat="time"]').textContent = summary.time;
    countUp(finale.querySelector('[data-stat="wrong"]'), summary.wrong);
    countUp(finale.querySelector('[data-stat="hints"]'), summary.hints);

    codeBurst(finale.querySelector('.hm-result-check'));
    finale.querySelector('.hm-hire').focus({ preventScroll: true });
}
