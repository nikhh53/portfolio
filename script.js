// Partikel-Hintergrund
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');

// Canvas dauerhaft direkt im Body platzieren
if (canvas.parentElement !== document.body) {
    document.body.prepend(canvas);
}

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let particles = [];

const pointer = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    active: false
};

class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;

        this.size =
            Math.random() * 2 + 0.5;

        this.speedX =
            Math.random() * 0.5 - 0.25;

        this.speedY =
            Math.random() * 0.5 - 0.25;
    }

    update() {
        // Partikel reagieren auf die Maus
        if (pointer.active) {
            const dx =
                this.x - pointer.x;

            const dy =
                this.y - pointer.y;

            const distanceSquared =
                dx * dx + dy * dy;

            const influenceRadius = 150;

            if (
                distanceSquared <
                    influenceRadius *
                    influenceRadius &&
                distanceSquared > 0
            ) {
                const distance =
                    Math.sqrt(distanceSquared);

                const force =
                    (
                        1 -
                        distance /
                        influenceRadius
                    ) * 0.045;

                this.x +=
                    (dx / distance) * force;

                this.y +=
                    (dy / distance) * force;
            }
        }

        this.x += this.speedX;
        this.y += this.speedY;

        // An den seitlichen Rändern abprallen
        if (
            this.x < 0 ||
            this.x > canvas.width
        ) {
            this.speedX *= -1;
        }

        // Am oberen und unteren Rand abprallen
        if (
            this.y < 0 ||
            this.y > canvas.height
        ) {
            this.speedY *= -1;
        }
    }

    draw() {
        ctx.fillStyle =
            'rgba(126, 165, 156, 0.58)';

        ctx.beginPath();

        ctx.arc(
            this.x,
            this.y,
            this.size,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }
}

function initParticles() {
    particles = [];

    // Anzahl abhängig von der Fenstergröße
    const particleCount = Math.min(
        150,
        Math.max(
            95,
            Math.floor(
                (
                    canvas.width *
                    canvas.height
                ) / 12500
            )
        )
    );

    for (
        let index = 0;
        index < particleCount;
        index++
    ) {
        particles.push(
            new Particle()
        );
    }
}

function animateParticles() {
    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    particles.forEach(particle => {
        particle.update();
        particle.draw();
    });

    requestAnimationFrame(
        animateParticles
    );
}

// Canvas bei Änderung der Fenstergröße aktualisieren
window.addEventListener(
    'resize',
    () => {
        canvas.width =
            window.innerWidth;

        canvas.height =
            window.innerHeight;

        initParticles();
    }
);

// Schreibmaschinen-Effekt
function typeWriter(
    element,
    text,
    speed = 45
) {
    if (!element) {
        return;
    }

    let index = 0;

    element.textContent = '';

    function type() {
        if (index >= text.length) {
            return;
        }

        element.textContent +=
            text.charAt(index);

        index++;

        window.setTimeout(
            type,
            speed
        );
    }

    type();
}

/* Navigation */
const panels =
    document.querySelectorAll(
        '[data-panel]'
    );

const navigationButtons =
    document.querySelectorAll(
        '[data-target]'
    );

const progressSteps =
    document.querySelectorAll(
        '.progress-step'
    );

const progressIndicator =
    document.querySelector(
        '.progress'
    );

const navLinks =
    document.querySelectorAll(
        '.nav-links [data-target]'
    );

const navbar =
    document.querySelector(
        '.navbar'
    );

// Reihenfolge aller Seiten
const panelOrder = [
    'hero',
    'about',
    'skills',
    'projects',
    'contact'
];

// Reihenfolge der vertikalen Navigation
const progressOrder = [
    'about',
    'skills',
    'projects',
    'contact'
];

/*
 * Tatsächliche Höhe der Navbar an CSS übergeben.
 * Dadurch bleibt die Position auch bei anderen
 * Bildschirmgrößen korrekt.
 */
function updateNavbarHeight() {
    if (!navbar) {
        return;
    }

    document.documentElement.style.setProperty(
        '--navbar-height',
        `${navbar.offsetHeight}px`
    );
}

// Änderungen der Navbar-Größe beobachten
if (
    navbar &&
    'ResizeObserver' in window
) {
    const navbarObserver =
        new ResizeObserver(
            updateNavbarHeight
        );

    navbarObserver.observe(
        navbar
    );
}

// Navigation beim Scrollen stärker hervorheben
function updateProgressAppearance() {
    if (!progressIndicator) {
        return;
    }

    progressIndicator.classList.toggle(
        'scrolled-away',
        window.scrollY > 24
    );
}

window.addEventListener(
    'scroll',
    updateProgressAppearance,
    {
        passive: true
    }
);

/*
 * Vertikale Fortschrittsnavigation aktualisieren
 */
function updateProgress(target) {
    const activeIndex =
        progressOrder.indexOf(target);

    progressSteps.forEach(step => {
        const stepTarget =
            step.dataset.target;

        const stepIndex =
            progressOrder.indexOf(
                stepTarget
            );

        const isActive =
            stepTarget === target;

        const isCompleted =
            activeIndex > -1 &&
            stepIndex < activeIndex;

        step.classList.toggle(
            'active',
            isActive
        );

        step.classList.toggle(
            'completed',
            isCompleted
        );

        if (isActive) {
            step.setAttribute(
                'aria-current',
                'step'
            );
        } else {
            step.removeAttribute(
                'aria-current'
            );
        }
    });
}

/*
 * Hauptnavigation oben rechts aktualisieren
 */
function updateMainNavigation(target) {
    navLinks.forEach(link => {
        const isActive =
            link.dataset.target === target;

        link.classList.toggle(
            'active',
            isActive
        );

        if (isActive) {
            link.setAttribute(
                'aria-current',
                'page'
            );
        } else {
            link.removeAttribute(
                'aria-current'
            );
        }
    });
}

/*
 * Gewählten Bereich anzeigen
 */
function showPanel(target) {
    const nextPanel =
        document.querySelector(
            `[data-panel="${target}"]`
        );

    if (!nextPanel) {
        return;
    }

    // Alle Bereiche ausblenden
    panels.forEach(panel => {
        panel.classList.remove(
            'active-panel'
        );
    });

    // Ausgewählten Bereich einblenden
    nextPanel.classList.add(
        'active-panel'
    );

    const isIntro =
        target === 'hero';

    // Startseiten-Zustand setzen
    document.body.classList.toggle(
        'intro-active',
        isIntro
    );

    // Navigationen aktualisieren
    updateProgress(target);
    updateMainNavigation(target);

    // Adresse im Browser aktualisieren
    history.replaceState(
        null,
        '',
        isIntro
            ? '#hero'
            : `#${target}`
    );

    // Nach Bereichswechsel nach oben
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });

    window.setTimeout(
        updateProgressAppearance,
        350
    );
}

/*
 * Klicks auf:
 * - obere Navigation
 * - vertikale Zahlen
 * - Vor- und Zurück-Buttons
 */
navigationButtons.forEach(button => {
    button.addEventListener(
        'click',
        event => {
            event.preventDefault();

            const target =
                button.dataset.target;

            if (!target) {
                return;
            }

            showPanel(target);
        }
    );
});

/* Mausposition für die Partikel */
window.addEventListener(
    'pointermove',
    event => {
        pointer.x =
            event.clientX;

        pointer.y =
            event.clientY;

        pointer.active = true;
    }
);

// Mausinteraktion zurücksetzen
document.addEventListener(
    'pointerleave',
    () => {
        pointer.active = false;
    }
);

/*
 * Kontaktformular
 * Wird nur ausgeführt, wenn ein Formular
 * mit der ID contactForm vorhanden ist.
 */
const contactForm =
    document.getElementById(
        'contactForm'
    );

if (contactForm) {
    contactForm.addEventListener(
        'submit',
        function (event) {
            event.preventDefault();

            alert(
                'Vielen Dank! Deine Nachricht wurde gesendet. (Demo)'
            );

            this.reset();
        }
    );
}

/*
 * Seite starten
 */
window.addEventListener(
    'load',
    () => {
        updateNavbarHeight();

        typeWriter(
            document.getElementById(
                'typing-subtitle'
            ),
            'Anwendungsentwickler in der Umschulung'
        );

        initParticles();
        animateParticles();
        updateProgressAppearance();

        // Direkte Links zu Bereichen erlauben
        const requestedPanel =
            window.location.hash
                .replace('#', '');

        const availablePanels = [
            'hero',
            'about',
            'skills',
            'projects',
            'contact'
        ];

        if (
            availablePanels.includes(
                requestedPanel
            )
        ) {
            showPanel(
                requestedPanel
            );
        } else {
            updateProgress('hero');
            updateMainNavigation('hero');
        }
    }
);

/*
 * Navigation mit der Tastatur:
 * Pfeil rechts = nächster Bereich
 * Pfeil links = vorheriger Bereich
 * Escape = zurück zur Startseite
 */
document.addEventListener(
    'keydown',
    event => {
        const activePanel =
            document.querySelector(
                '[data-panel].active-panel'
            );

        if (!activePanel) {
            return;
        }

        // Pfeiltasten nicht beim Schreiben verwenden
        const activeElement =
            document.activeElement;

        const isWriting =
            activeElement &&
            (
                activeElement.tagName ===
                    'INPUT' ||
                activeElement.tagName ===
                    'TEXTAREA' ||
                activeElement.isContentEditable
            );

        if (isWriting) {
            return;
        }

        const currentIndex =
            panelOrder.indexOf(
                activePanel.dataset.panel
            );

        if (
            event.key ===
                'ArrowRight' &&
            currentIndex <
                panelOrder.length - 1
        ) {
            event.preventDefault();

            showPanel(
                panelOrder[
                    currentIndex + 1
                ]
            );
        }

        if (
            event.key ===
                'ArrowLeft' &&
            currentIndex > 0
        ) {
            event.preventDefault();

            showPanel(
                panelOrder[
                    currentIndex - 1
                ]
            );
        }

        if (event.key === 'Escape') {
            event.preventDefault();
            showPanel('hero');
        }
    }
);