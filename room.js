/*
 * Einstieg ins Portfolio als Zimmer: ein dunkler Schreibtisch mit drei
 * hellen Bildschirmen. Links NIK OS, in der Mitte das Portfolio, rechts der
 * Code-Editor mit den Rätseln. Die Kamera fährt von weit weg an den Tisch
 * heran, ein Klick auf einen Bildschirm fährt bis an das Display.
 *
 * Die Bildschirme sind dieselbe Seite noch einmal in einem iframe
 * (?embed=portfolio|os|hard), die den Modus ohne Willkommensbildschirm startet.
 * Auf kleinen Bildschirmen bleibt der Willkommensbildschirm.
 */
const ROOM_PERSPECTIVE = 1600;
const ROOM_DESK_Y = 300;
const ROOM_FRAME_PAD = 10;
const ROOM_FRAME_CHIN = 30;
const ROOM_INTRO_MS = 5600;
const ROOM_FOCUS_MS = 2400;
const ROOM_FOCUS_EASING = 'cubic-bezier(0.5, 0, 0.15, 1)';
const ROOM_FRAME_LOGICAL = { width: 1440, height: 900 };

const ROOM_MONITORS = [
    { embed: 'os', title: 'NIK OS', hint: 'Mein Portfolio als Betriebssystem', x: -690, z: -50, yaw: 18, width: 560, height: 350 },
    { embed: 'portfolio', title: 'Portfolio', hint: 'Lebenslauf, Projekte, Kontakt', x: 0, z: -110, yaw: 0, width: 720, height: 450 },
    { embed: 'hard', title: 'Programmieren', hint: 'Vier Aufgaben schalten die Seite frei', x: 690, z: -50, yaw: -18, width: 560, height: 350 }
];

const roomParams = new URLSearchParams(window.location.search);
const roomEmbed = roomParams.get('embed');

window.portfolioEntry = (() => {
    if (['portfolio', 'os', 'hard'].includes(roomEmbed)) {
        return 'embed';
    }

    const wideScreen = window.matchMedia('(min-width: 900px) and (min-height: 520px)').matches;

    return wideScreen ? 'room' : 'welcome';
})();

/* In einem Bildschirm: Modus sofort starten, ohne Willkommen und Boot-Screen */
function startEmbeddedMode() {
    document.documentElement.classList.remove('pre-welcome');
    document.body.classList.remove('desk');
    document.body.classList.add('embedded');

    // Escape im Bildschirm führt zurück an den Tisch, wenn die Seite die Taste nicht selbst braucht
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && window.parent !== window) {
            window.parent.postMessage({ type: 'room-escape' }, window.location.origin);
        }
    });

    window.addEventListener('load', () => {
        if (roomEmbed === 'os') {
            document.dispatchEvent(new CustomEvent('portfolio:os-mode'));
        }

        if (roomEmbed === 'hard') {
            document.dispatchEvent(new CustomEvent('portfolio:hard-mode'));
        }
    });
}

function roomUrl(embed) {
    const params = new URLSearchParams();
    params.set('embed', embed);

    if (roomParams.get('firma')) {
        params.set('firma', roomParams.get('firma'));
    }

    return `index.html?${params}`;
}

function createMonitor(config, index) {
    const neckHeight = ROOM_DESK_Y - (config.height + ROOM_FRAME_PAD + ROOM_FRAME_CHIN) / 2;
    const scale = (config.width / ROOM_FRAME_LOGICAL.width).toFixed(4);

    const monitor = document.createElement('div');
    monitor.className = 'room-monitor';
    monitor.dataset.index = String(index);
    monitor.style.cssText = `
        width: ${config.width + ROOM_FRAME_PAD * 2}px;
        height: ${config.height + ROOM_FRAME_PAD + ROOM_FRAME_CHIN}px;
        margin: -${(config.height + ROOM_FRAME_PAD + ROOM_FRAME_CHIN) / 2}px 0 0 -${config.width / 2 + ROOM_FRAME_PAD}px;
        transform: translate3d(${config.x}px, 0, ${config.z}px) rotateY(${config.yaw}deg);
    `;

    monitor.innerHTML = `
        <div class="room-frame">
            <div class="room-screen" style="width:${config.width}px;height:${config.height}px">
                <iframe
                    title="${config.title}"
                    tabindex="-1"
                    style="width:${ROOM_FRAME_LOGICAL.width}px;height:${ROOM_FRAME_LOGICAL.height}px;transform:scale(${scale})"
                ></iframe>
                <button type="button" class="room-hit" aria-label="${config.title} öffnen"></button>
            </div>
            <span class="room-chin"><b></b>${config.title}</span>
        </div>
        <div class="room-neck" style="height:${neckHeight}px"></div>
        <div class="room-base" style="top:calc(100% + ${neckHeight - 70}px)"></div>
    `;

    return monitor;
}

function startRoom() {
    document.documentElement.classList.remove('pre-welcome');
    document.body.classList.add('room-active');

    const room = document.createElement('div');
    room.className = 'room';
    room.innerHTML = `
        <div class="room-stage">
            <div class="room-rig">
                <div class="room-wall"><i></i><i></i><i></i></div>
                <div class="room-desk">
                    <div class="room-mat"></div>
                    <div class="room-notebook"></div>
                    <div class="room-keyboard"></div>
                    <div class="room-mouse"></div>
                    <div class="room-mug"></div>
                </div>
            </div>
        </div>
        <button type="button" class="room-back" hidden>
            <i class="fas fa-arrow-left"></i> Zurück zum Schreibtisch
        </button>
        <p class="room-caption" hidden></p>
        <p class="room-hint" hidden>Klicke einen Bildschirm an</p>
    `;

    const rig = room.querySelector('.room-rig');
    const back = room.querySelector('.room-back');
    const caption = room.querySelector('.room-caption');
    const hint = room.querySelector('.room-hint');

    const monitors = ROOM_MONITORS.map((config, index) => {
        const monitor = createMonitor(config, index);
        rig.append(monitor);
        monitor.querySelector('iframe').src = roomUrl(config.embed);
        return monitor;
    });

    document.body.append(room);

    let state = 'intro';
    let osWelcomed = false;
    let focusTimer = 0;

    function rigTransform(z, rotateX, rotateY, offset) {
        return `translate3d(0, 0, ${z}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translate3d(${offset[0]}px, ${offset[1]}px, ${offset[2]}px)`;
    }

    function overviewScale() {
        return Math.min(window.innerWidth / 2120, window.innerHeight / 780);
    }

    function overviewTransform(extraYaw = 0, extraPitch = 0) {
        const z = ROOM_PERSPECTIVE * (1 - 1 / overviewScale());
        return rigTransform(z, -14 + extraPitch, extraYaw, [0, 35, 0]);
    }

    function introTransform() {
        const z = ROOM_PERSPECTIVE * (1 - 1 / overviewScale()) - 1500;
        return rigTransform(z, -68, 0, [0, 35, 0]);
    }

    function focusTransform(config) {
        const scale = Math.min(
            (window.innerWidth * 0.97) / config.width,
            (window.innerHeight * 0.92) / config.height
        );
        const z = ROOM_PERSPECTIVE * (1 - 1 / scale);

        return rigTransform(z, 0, -config.yaw, [-config.x, (ROOM_FRAME_CHIN - ROOM_FRAME_PAD) / 2, -config.z]);
    }

    function setTransition(milliseconds, easing) {
        rig.style.transitionDuration = `${milliseconds}ms`;
        rig.style.transitionTimingFunction = easing;
    }

    function showOverview(animate = true) {
        window.clearTimeout(focusTimer);
        leaveFlat();
        state = 'overview';
        room.classList.remove('focused');
        back.hidden = true;
        caption.hidden = true;
        hint.hidden = false;

        setTransition(animate ? ROOM_FOCUS_MS : 0, ROOM_FOCUS_EASING);
        look.x = 0;
        look.y = 0;
        look.targetX = 0;
        look.targetY = 0;
        rig.style.transform = overviewTransform();
        monitors.forEach(monitor => monitor.classList.remove('active'));

        const frame = document.activeElement;

        if (frame && frame.tagName === 'IFRAME') {
            frame.blur();
        }
    }

    /*
     * Nach der Anfahrt wird der Bildschirm flach vor die Szene gelegt: Der Browser
     * trifft Klicks in einem 3D-Kontext nicht zuverlässig, so bleibt der Inhalt bedienbar.
     */
    function enterFlat(index) {
        const config = ROOM_MONITORS[index];
        const monitor = monitors[index];
        const rect = monitor.querySelector('.room-screen').getBoundingClientRect();
        const scale = rect.width / config.width;

        monitor.dataset.css = monitor.style.cssText;
        monitor.style.cssText = `
            position: fixed;
            top: ${rect.top - ROOM_FRAME_PAD * scale}px;
            left: ${rect.left - ROOM_FRAME_PAD * scale}px;
            width: ${config.width + ROOM_FRAME_PAD * 2}px;
            height: ${config.height + ROOM_FRAME_PAD + ROOM_FRAME_CHIN}px;
            margin: 0;
            transform: scale(${scale});
            transform-origin: 0 0;
        `;
        // Ohne Übergang umschalten, sonst gleitet die Szene noch einmal zur Seite
        setTransition(0, 'linear');
        room.classList.add('flat');
        rig.offsetWidth;
    }

    function leaveFlat() {
        if (!room.classList.contains('flat')) {
            return;
        }

        setTransition(0, 'linear');
        room.classList.remove('flat');
        monitors.forEach(monitor => {
            if (monitor.dataset.css) {
                monitor.style.cssText = monitor.dataset.css;
                delete monitor.dataset.css;
            }
        });
        rig.offsetWidth;
    }

    function focusMonitor(index) {
        if (state !== 'overview') {
            return;
        }

        const config = ROOM_MONITORS[index];

        state = 'zooming';
        hint.hidden = true;
        monitors[index].classList.add('active');
        caption.textContent = `${config.title}: ${config.hint}`;

        setTransition(ROOM_FOCUS_MS, ROOM_FOCUS_EASING);
        rig.style.transform = focusTransform(config);

        focusTimer = window.setTimeout(() => {
            enterFlat(index);
            state = 'focused';
            room.classList.add('focused');
            back.hidden = false;
            caption.hidden = false;
            const frame = monitors[index].querySelector('iframe');

            frame.focus();

            if (config.embed === 'os' && !osWelcomed) {
                osWelcomed = true;
                frame.contentWindow.postMessage({ type: 'room-first-focus' }, window.location.origin);
            }
        }, ROOM_FOCUS_MS + 120);
    }

    // Kamerafahrt von weit weg: erst Startposition setzen, dann zum Tisch fahren
    setTransition(0, 'linear');
    rig.style.transform = introTransform();

    window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
        state = 'intro-running';
        setTransition(ROOM_INTRO_MS, 'cubic-bezier(0.45, 0.05, 0.2, 1)');
        rig.style.transform = overviewTransform();
        room.classList.add('lit');

        focusTimer = window.setTimeout(() => {
            state = 'overview';
            hint.hidden = false;
        }, ROOM_INTRO_MS);
    }));

    // Treffer per Koordinaten: Das Browser-Hit-Testing in 3D trifft die Knöpfe nicht zuverlässig
    function monitorAt(x, y) {
        return monitors.findIndex(monitor => {
            const rect = monitor.querySelector('.room-frame').getBoundingClientRect();
            return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
        });
    }

    room.addEventListener('click', event => {
        // Ein Klick während der Anfahrt springt direkt zum Tisch
        if (state === 'intro-running') {
            window.clearTimeout(focusTimer);
            state = 'overview';
            setTransition(500, 'ease-out');
            rig.style.transform = overviewTransform();
            hint.hidden = false;
            return;
        }

        // Enter oder Leertaste auf dem versteckten Knopf liefern keine Koordinaten
        const hit = event.target.closest('.room-hit');
        const index = hit && event.detail === 0
            ? monitors.indexOf(hit.closest('.room-monitor'))
            : monitorAt(event.clientX, event.clientY);

        if (index >= 0) {
            focusMonitor(index);
        }
    });

    window.addEventListener('mousemove', event => {
        if (state !== 'overview') {
            return;
        }

        const index = monitorAt(event.clientX, event.clientY);

        monitors.forEach((monitor, position) => monitor.classList.toggle('hover', position === index));
        room.style.cursor = index >= 0 ? 'pointer' : '';
    });

    back.addEventListener('click', event => {
        event.stopPropagation();
        showOverview();
    });

    window.addEventListener('message', event => {
        if (event.origin === window.location.origin && event.data && event.data.type === 'room-escape' && state === 'focused') {
            showOverview();
        }
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && (state === 'focused' || state === 'zooming')) {
            showOverview();
        }
    });

    // Leichte Bewegung der Kamera mit der Maus, solange man den Tisch überblickt.
    // Ohne CSS-Übergang, sonst treffen Klicks mitten in der Bewegung ins Leere.
    const look = { targetX: 0, targetY: 0, x: 0, y: 0, running: false };

    function stepLook() {
        look.x += (look.targetX - look.x) * 0.08;
        look.y += (look.targetY - look.y) * 0.08;

        if (state === 'overview') {
            setTransition(0, 'linear');
            rig.style.transform = overviewTransform(look.x, look.y);
        }

        const settled = Math.abs(look.targetX - look.x) < 0.005 && Math.abs(look.targetY - look.y) < 0.005;

        if (settled || state !== 'overview') {
            look.running = false;
            return;
        }

        window.requestAnimationFrame(stepLook);
    }

    window.addEventListener('mousemove', event => {
        if (state !== 'overview') {
            return;
        }

        look.targetX = (event.clientX / window.innerWidth - 0.5) * 5;
        look.targetY = (event.clientY / window.innerHeight - 0.5) * -2;

        if (!look.running) {
            look.running = true;
            window.requestAnimationFrame(stepLook);
        }
    });

    window.addEventListener('resize', () => {
        if (state === 'overview') {
            setTransition(0, 'linear');
            rig.style.transform = overviewTransform();
        }

        if (state === 'focused') {
            setTransition(0, 'linear');
            rig.style.transform = focusTransform(ROOM_MONITORS[monitors.findIndex(m => m.classList.contains('active'))]);
        }
    });
}

if (window.portfolioEntry === 'embed') {
    startEmbeddedMode();
}

if (window.portfolioEntry === 'room') {
    startRoom();
}
