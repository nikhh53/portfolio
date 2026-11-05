// Schreibmaschinen-Effekt
function typeWriter(element, text, speed = 45) {
    if (!element) {
        return;
    }

    let index = 0;

    element.textContent = '';

    function type() {
        if (index >= text.length) {
            return;
        }

        element.textContent += text.charAt(index);
        index++;

        window.setTimeout(type, speed);
    }

    type();
}

/* Navigation */
const panels = document.querySelectorAll('[data-panel]');
const navigationButtons = document.querySelectorAll('[data-target]');
const navLinks = document.querySelectorAll('.nav-links [data-target]');
const navbar = document.querySelector('.navbar');

// Reihenfolge aller Seiten
const panelOrder = ['hero', 'about', 'skills', 'projects', 'contact'];

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

if (navbar && 'ResizeObserver' in window) {
    new ResizeObserver(updateNavbarHeight).observe(navbar);
}

// Hauptnavigation oben aktualisieren
function updateMainNavigation(target) {
    navLinks.forEach(link => {
        const isActive = link.dataset.target === target;

        link.classList.toggle('active', isActive);

        if (isActive) {
            link.setAttribute('aria-current', 'page');
        } else {
            link.removeAttribute('aria-current');
        }
    });
}

// Gewählten Bereich anzeigen
function showPanel(target) {
    const nextPanel = document.querySelector(`[data-panel="${target}"]`);

    if (!nextPanel) {
        return;
    }

    panels.forEach(panel => {
        panel.classList.remove('active-panel');
    });

    nextPanel.classList.add('active-panel');

    const isIntro = target === 'hero';

    // Startseiten-Zustand setzen
    document.body.classList.toggle('intro-active', isIntro);

    updateMainNavigation(target);

    // Adresse im Browser aktualisieren
    history.replaceState(null, '', isIntro ? '#hero' : `#${target}`);

    // Nach Bereichswechsel nach oben
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Klicks auf Navigation und Knöpfe mit Ziel
navigationButtons.forEach(button => {
    button.addEventListener('click', event => {
        event.preventDefault();

        const target = button.dataset.target;

        if (!target) {
            return;
        }

        showPanel(target);
    });
});

// Seite starten
window.addEventListener('load', () => {
    updateNavbarHeight();

    typeWriter(
        document.getElementById('typing-subtitle'),
        'Anwendungsentwickler in der Umschulung'
    );

    // Direkte Links zu Bereichen erlauben
    const requestedPanel = window.location.hash.replace('#', '');

    if (panelOrder.includes(requestedPanel)) {
        showPanel(requestedPanel);
    } else {
        updateMainNavigation('hero');
    }
});

/*
 * Navigation mit der Tastatur:
 * Pfeil rechts = nächster Bereich
 * Pfeil links = vorheriger Bereich
 * Escape = zurück zur Startseite
 */
document.addEventListener('keydown', event => {
    const activePanel = document.querySelector('[data-panel].active-panel');

    if (!activePanel) {
        return;
    }

    // Pfeiltasten nicht beim Schreiben verwenden
    const activeElement = document.activeElement;

    const isWriting =
        activeElement &&
        (
            activeElement.tagName === 'INPUT' ||
            activeElement.tagName === 'TEXTAREA' ||
            activeElement.isContentEditable
        );

    if (isWriting) {
        return;
    }

    const currentIndex = panelOrder.indexOf(activePanel.dataset.panel);

    if (event.key === 'ArrowRight' && currentIndex < panelOrder.length - 1) {
        event.preventDefault();
        showPanel(panelOrder[currentIndex + 1]);
    }

    if (event.key === 'ArrowLeft' && currentIndex > 0) {
        event.preventDefault();
        showPanel(panelOrder[currentIndex - 1]);
    }

    // Im Schreibtisch-Bildschirm führt Escape zurück an den Tisch, die Seite bleibt, wie sie ist
    if (event.key === 'Escape' && window.portfolioEntry !== 'embed') {
        event.preventDefault();
        showPanel('hero');
    }
});

// Bildvorschau der Projekte: Klick vergrößert, Escape und Klick daneben schließen
const zoomDialog = document.getElementById('zoom-dialog');

if (zoomDialog) {
    const zoomImage = zoomDialog.querySelector('img');

    document.addEventListener('click', (event) => {
        const trigger = event.target.closest('[data-zoom]');

        if (trigger) {
            zoomImage.src = trigger.dataset.zoom;
            zoomImage.alt = trigger.querySelector('img')?.alt ?? '';
            zoomDialog.showModal();
            return;
        }

        if (
            event.target === zoomDialog ||
            event.target.closest('.zoom-close')
        ) {
            zoomDialog.close();
        }
    });

    // Solange die Vorschau offen ist, bedienen Tasten nicht das Portfolio dahinter
    document.addEventListener(
        'keydown',
        (event) => {
            if (!zoomDialog.open) {
                return;
            }

            event.stopImmediatePropagation();
        },
        true
    );
}
