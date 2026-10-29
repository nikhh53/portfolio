/*
 * Rätsel für hard_mode()
 * Jedes Rätsel ist ein Lückencode: [[n]] markiert Lücke n, die mit
 * einem Baustein aus "tokens" gefüllt wird. "solution" nennt pro Lücke
 * den richtigen Baustein. Jeder richtige Baustein deckt einen Teil von
 * "reveals" auf, "output" erscheint, wenn der Code fertig ist.
 */
const HARD_MODE_PUZZLES = [
    {
        panel: 'hero',
        title: 'Python',
        task: 'Vervollständige die Funktion, damit "Hallo, Niklas!" ausgegeben wird.',
        code: 'def begruessung(name)[[0]]\n    [[1]] f"Hallo, {name}!"\n\nprint([[2]]("Niklas"))\n# Ausgabe: Hallo, Niklas!',
        tokens: ['return', ';', 'begruessung', 'echo', ':', 'print'],
        solution: [':', 'return', 'begruessung'],
        output: ['$ python3 begruessung.py', 'Hallo, Niklas!'],
        hint: 'Eine Funktionskopfzeile endet in Python mit einem Doppelpunkt, und Werte gibt man mit return zurück.',
        reveals: [
            '#hero .eyebrow',
            '#hero h1',
            '#typing-subtitle',
            '.hero-image',
            '.hero-description',
            '.hero-meta',
            '.hero-buttons',
            '#about .about-content',
            '#about .internship-card'
        ]
    },
    {
        panel: 'skills',
        title: 'Netzwerk',
        task: 'Richte den Laptop im Heimnetz 192.168.1.0/24 ein.',
        code: 'laptop       = [[0]]\nsubnetzmaske = [[1]]  # /24\ngateway      = [[2]]  # Router, endet meist auf .1\nlocalhost    = [[3]]',
        tokens: ['255.255.255.0', '8.8.8.8', '192.168.1.1', '127.0.0.1', '192.168.2.40', '192.168.1.23'],
        solution: ['192.168.1.23', '255.255.255.0', '192.168.1.1', '127.0.0.1'],
        output: [
            '$ ping -c 1 192.168.1.1',
            '64 bytes from 192.168.1.1: icmp_seq=1 ttl=64 time=0.8 ms',
            '1 packets transmitted, 1 received, 0% packet loss'
        ],
        hint: 'Bei /24 müssen die ersten drei Zahlen gleich sein (192.168.1.x). 127.0.0.1 zeigt immer auf den eigenen Rechner.',
        reveals: ['#skills .skill-card']
    },
    {
        panel: 'projects',
        title: 'SQL',
        task: 'Lade alle Projekte aus der Datenbank, sortiert nach Name.',
        code: '[[0]] name, status\n[[1]] projekte\n[[2]] BY name;',
        tokens: ['WHERE', 'INSERT', 'FROM', 'SELECT', 'INTO', 'ORDER'],
        solution: ['SELECT', 'FROM', 'ORDER'],
        output: [
            'mysql> SELECT name, status FROM projekte ORDER BY name;',
            'Huddl             | in Betrieb',
            'Klassenbot        | in Betrieb',
            'Python-Projekte   | fertig',
            '3 rows in set (0.01 sec)'
        ],
        hint: 'Eine Abfrage beginnt mit SELECT ... FROM ..., sortiert wird mit ORDER BY.',
        reveals: ['.projects-grid > *']
    },
    {
        panel: 'contact',
        title: 'JavaScript · Endgegner',
        task: 'Die Funktion soll die E-Mail-Adresse zurückgeben.',
        code: '[[0]] kontakt() {\n    const user = "nikhh53";\n    [[1]] user + [[2]] + "gmail.com";\n}',
        tokens: ['"#"', 'def', 'return', 'console.log', '"@"', 'function'],
        solution: ['function', 'return', '"@"'],
        output: ['> kontakt()', "'nikhh53@gmail.com'"],
        hint: 'In JavaScript beginnt eine Funktion mit function, und zwischen Name und Domain gehört ein @.',
        reveals: ['#contact .contact-copy', '#contact .contact-options']
    }
];
