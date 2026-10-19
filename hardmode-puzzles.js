/*
 * Rätsel für hard_mode()
 * Jedes Rätsel gehört zu einem Bereich (panel) und deckt mit
 * "reveals" Teile davon auf. Die Reihenfolge ist die Spielreihenfolge.
 */

// Kleine Tabelle für die SQL-Rätsel im Projekte-Bereich
const SQL_TABLE = {
    name: 'projekte',
    columns: ['id', 'name', 'sprache', 'status'],
    rows: [
        { id: 1, name: 'Ticketsystem', sprache: 'Python', status: 'fertig' },
        { id: 2, name: 'Pokémon Minigame', sprache: 'Python', status: 'fertig' },
        { id: 3, name: 'API-Dashboard', sprache: 'Python', status: 'geplant' },
        { id: 4, name: 'hello_world', sprache: 'Python', status: 'archiviert' },
        { id: 5, name: 'todo_liste', sprache: 'JavaScript', status: 'archiviert' }
    ]
};

const HARD_MODE_PUZZLES = [
    {
        panel: 'hero',
        title: 'Python · Ausgabe vorhersagen',
        task: 'Was gibt dieses Programm aus?',
        code: 'name = "Niklas"\nprint(len(name) * 2)',
        type: 'text',
        placeholder: 'Ausgabe',
        answers: ['12'],
        hint: 'len() zählt die Buchstaben in "Niklas". Das Ergebnis wird verdoppelt.',
        reveals: ['#hero .eyebrow', '#hero h1', '#typing-subtitle', '.hero-image']
    },
    {
        panel: 'hero',
        title: 'Python · Bug fixen',
        task: 'Die Funktion startet nicht. Repariere die erste Zeile.',
        code: 'def begruessung(name)\n    return f"Hallo, {name}!"',
        type: 'text',
        prefill: 'def begruessung(name)',
        answers: ['defbegruessung(name):'],
        hint: 'In Python endet die Kopfzeile einer Funktion immer mit einem Doppelpunkt.',
        reveals: ['.hero-description', '.hero-meta', '.hero-buttons']
    },
    {
        panel: 'about',
        title: 'Python · Listen slicen',
        task: 'Was gibt print() hier aus?',
        code: 'skills = ["Python", "JavaScript", "SQL", "Lua"]\nprint(skills[1:3])',
        type: 'text',
        placeholder: "['...', '...']",
        answers: ["['javascript','sql']"],
        hint: 'Der Index beginnt bei 0. [1:3] nimmt Index 1 und 2, die 3 ist nicht mehr dabei.',
        reveals: ['#about .about-content', '#about .internship-card']
    },
    {
        panel: 'skills',
        title: 'Netzwerk · IP-Adressen verknüpfen',
        task: 'Verbinde jede Adresse mit ihrer Bedeutung. Erst links tippen, dann rechts.',
        type: 'connect',
        pairs: [
            ['127.0.0.1', 'Eigener Rechner (localhost)'],
            ['192.168.1.1', 'Router im Heimnetz'],
            ['8.8.8.8', 'Öffentlicher DNS-Server'],
            ['255.255.255.0', 'Subnetzmaske eines /24-Netzes']
        ],
        // Reihenfolge der rechten Spalte, damit sie nicht direkt gegenüber stehen
        rightOrder: [2, 0, 3, 1],
        hint: '127.x.x.x zeigt immer auf den eigenen Rechner. 192.168.x.x ist ein privates Netz, 8.8.8.8 gehört Google.',
        reveals: ['#skills .skill-card:nth-child(1)', '#skills .skill-card:nth-child(2)']
    },
    {
        panel: 'skills',
        title: 'Netzwerk · Wer ist nicht im Netz?',
        task: 'Welche Adresse liegt nicht im Netz 192.168.1.0/24?',
        type: 'choice',
        options: ['192.168.1.17', '192.168.1.254', '192.168.2.5', '192.168.1.100'],
        correct: 2,
        hint: 'Bei /24 müssen die ersten drei Zahlen gleich sein: 192.168.1.',
        reveals: ['#skills .skill-card:nth-child(3)', '#skills .skill-card:nth-child(4)']
    },
    {
        panel: 'skills',
        title: 'Netzwerk · Hosts zählen',
        task: 'Wie viele Geräte (Hosts) kann man in einem /24-Netz adressieren?',
        type: 'text',
        placeholder: 'Anzahl',
        answers: ['254'],
        hint: '/24 lässt 8 Bit für Hosts, also 256 Adressen. Netzadresse und Broadcast gehen ab.',
        reveals: ['#skills .skill-card:nth-child(5)', '#skills .skill-card:nth-child(6)']
    },
    {
        panel: 'projects',
        title: 'SQL · Erstes Projekt laden',
        task: 'Hol genau das Projekt mit der id 1 aus der Tabelle.',
        type: 'sql',
        targetIds: [1],
        hint: "SELECT * FROM projekte WHERE id = 1;",
        reveals: ['.projects-grid > :nth-child(1)']
    },
    {
        panel: 'projects',
        title: 'SQL · Mit LIKE suchen',
        task: 'Hol das Projekt, dessen Name mit "Pok" beginnt, ohne die id zu benutzen.',
        type: 'sql',
        targetIds: [2],
        forbidden: /\bid\b/,
        hint: "LIKE mit Platzhalter: WHERE name LIKE 'Pok%'",
        reveals: ['.projects-grid > :nth-child(2)']
    },
    {
        panel: 'projects',
        title: 'SQL · Nach Status filtern',
        task: 'Hol alle Projekte, die noch geplant sind.',
        type: 'sql',
        targetIds: [3],
        hint: "WHERE status = 'geplant'",
        reveals: ['.projects-grid > :nth-child(3)']
    },
    {
        panel: 'contact',
        title: 'JavaScript · Endgegner',
        task: 'Die Funktion soll die E-Mail-Adresse liefern, gibt aber "nikhh53#gmail.com" zurück. Repariere die return-Zeile.',
        code: 'function kontakt() {\n    const user = "nikhh53";\n    const domain = "gmail.com";\n    return user + "#" + domain;\n}',
        type: 'text',
        prefill: 'return user + "#" + domain;',
        pattern: /^return(user\+["'`]@["'`]\+domain|`\$\{user\}@\$\{domain\}`);?$/,
        hint: 'Zwischen Name und Domain gehört ein @ statt #.',
        reveals: ['#contact .contact-copy', '#contact .contact-options']
    }
];
