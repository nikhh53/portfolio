/*
 * Willkommensbildschirm vor dem Portfolio.
 * Erklärt in wenigen Sätzen, was einen erwartet, und lässt die Wahl
 * zwischen dem normalen Portfolio und den beiden Spielarten. Wer nichts
 * mit Technik zu tun hat, kommt mit einem Klick direkt ans Ziel.
 * Von hier aus startet der Boot-Screen aus boot.js.
 */
const WELCOME_FADE = 500;

const WELCOME_CHOICES = [
    {
        mode: 'portfolio',
        icon: 'fa-file-lines',
        title: 'Portfolio ansehen',
        hint: 'Empfohlen',
        text: 'Der normale Weg: Lebenslauf, Projekte, Kenntnisse und Kontakt, ganz ohne Spielerei.',
        action: 'Direkt starten'
    },
    {
        mode: 'hard',
        icon: 'fa-code',
        title: 'Mitprogrammieren',
        text: 'Die Seite ist verschlüsselt. Sie setzen vier kleine Code-Aufgaben per Ziehen zusammen und schalten das Portfolio Stück für Stück frei.',
        action: 'Etwa 5 Minuten'
    },
    {
        mode: 'os',
        icon: 'fa-desktop',
        title: 'NIK OS ausprobieren',
        text: 'Mein Portfolio als kleines Betriebssystem mit Fenstern, Dateien und Terminal. Selbst programmiert, einfach anklicken.',
        action: 'Zum Stöbern'
    }
];

const welcomeScreen = document.createElement('div');
welcomeScreen.className = 'welcome';
welcomeScreen.setAttribute('role', 'dialog');
welcomeScreen.setAttribute('aria-label', 'Willkommen');
welcomeScreen.innerHTML = `
    <div class="welcome-box">
        <p class="welcome-kicker"></p>
        <h1>Hallo, ich bin Niklas Bakowsky</h1>
        <p class="welcome-text">
            Ich mache eine Umschulung zum Fachinformatiker für Anwendungsentwicklung
            und suche ein Praktikum in Hamburg. Diese Seite habe ich selbst
            programmiert. Sie können sie ganz normal lesen oder sich ansehen,
            was sonst noch darin steckt.
        </p>
        <div class="welcome-choices">
            ${WELCOME_CHOICES.map(choice => `
                <button type="button" class="welcome-choice" data-mode="${choice.mode}">
                    ${choice.hint ? `<span class="welcome-hint">${choice.hint}</span>` : ''}
                    <i class="fas ${choice.icon}"></i>
                    <span class="welcome-choice-title">${choice.title}</span>
                    <span class="welcome-choice-text">${choice.text}</span>
                    <span class="welcome-choice-action">${choice.action}</span>
                </button>
            `).join('')}
        </div>
        <p class="welcome-note">
            Die beiden Extras können Sie jederzeit beenden und landen dann im normalen Portfolio.
        </p>
    </div>
`;

welcomeScreen.querySelector('.welcome-kicker').textContent = visitorCompany
    ? `Schön, dass Sie da sind, ${visitorCompany}!`
    : 'Willkommen';

document.body.prepend(welcomeScreen);
document.body.classList.add('welcome-active');

function closeWelcome(then) {
    welcomeScreen.classList.add('closing');
    document.body.classList.remove('welcome-active');

    window.setTimeout(() => {
        welcomeScreen.remove();
        then();
    }, WELCOME_FADE);
}

welcomeScreen.addEventListener('click', event => {
    const choice = event.target.closest('[data-mode]');

    if (!choice) {
        return;
    }

    const mode = choice.dataset.mode;

    closeWelcome(() => {
        if (mode === 'portfolio') {
            return;
        }

        startBootScreen(mode);
    });
});
