export interface AnzanLesson {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  icon: string;
  badge: string;
  description: string;
  keyRule: string;
  fingersTip: string;
  examples: {
    title: string;
    action: string;
    result: string;
    explanation: string;
  }[];
  table?: {
    num: string;
    rule: string;
    formula: string;
  }[];
}

export const ANZAN_LESSONS: AnzanLesson[] = [
  {
    id: 'lesson-1-anatomy',
    number: 1,
    title: 'Anatomia e Regola delle Dita',
    subtitle: 'Come si impugnano le pedine senza guardare',
    icon: '👋',
    badge: 'Fondamenta',
    description:
      'Nel Soroban e nell\'Anzan non si usano tutte le dita a caso: si usano SOLO il POLLICE e l\'INDICE della mano destra, come una pinza rapida e precisa!',
    keyRule: 'La barra orizzontale al centro è la Barra dei Calcoli: una pedina HA VALORE solo quando è a contatto con la barra!',
    fingersTip:
      '👍 POLLICE: spinge in SU le pedine inferiori (+1).\n👆 INDICE: abbassa la pedina superiore (+5) e ALLONTANA tutte le pedine dalla barra (-1 e -5).',
    examples: [
      {
        title: 'Posizione di Zero',
        action: 'Tutte le pedine lontane dalla barra',
        result: '0',
        explanation: 'Il Soroban è pulito quando il Cielo è tutto in alto e la Terra è tutta in basso.',
      },
      {
        title: 'Aggiungere 1 con il pollice',
        action: 'Spingi 1 pedina verde in su verso la barra col pollice',
        result: '1',
        explanation: 'La prima pedina tocca la barra: valore = 1.',
      },
      {
        title: 'Aggiungere 5 con l\'indice',
        action: 'Abbassa la pedina blu del Cielo verso la barra con l\'indice',
        result: '5',
        explanation: 'La pedina blu tocca la barra: valore = 5.',
      },
    ],
  },
  {
    id: 'lesson-2-numbers',
    number: 2,
    title: 'Comporre i Numeri da 0 a 9',
    subtitle: 'La visualizzazione a colpo d\'occhio',
    icon: '🎯',
    badge: 'Numeri 0-9',
    description:
      'Ogni colonna può rappresentare esattamente una cifra da 0 a 9. Per arrivare ad Anzan devi saper "vedere" il numero all\'istante senza contare le singole pedine.',
    keyRule: 'Cielo (blu) = 5. Ognuna delle 4 pedine della Terra (verde, giallo, arancio, rosso) = 1.',
    fingersTip:
      'Per i numeri da 6 a 9 si fa il gesto a "pizzico" (Gassho): indice e pollice si chiudono insieme verso la barra contemporaneamente!',
    examples: [
      {
        title: 'Numero 3',
        action: 'Alza verde, gialla e arancione',
        result: '3',
        explanation: 'Tre pedine inferiori toccano la barra.',
      },
      {
        title: 'Numero 7',
        action: 'Abbassa la blu (5) + alza verde e gialla (2)',
        result: '7',
        explanation: '5 + 2 = 7. Il classico "pizzico" a 7.',
      },
      {
        title: 'Numero 9 (Tutto attivo)',
        action: 'Abbassa la blu (5) + alza tutte e 4 le inferiori',
        result: '9',
        explanation: '5 + 4 = 9. La colonna è al suo valore massimo.',
      },
    ],
  },
  {
    id: 'lesson-3-friends-of-5',
    number: 3,
    title: 'Gli Amici del 5 (Complementi)',
    subtitle: 'Cosa fare quando le pedine inferiori non bastano',
    icon: '🤝',
    badge: 'Amici del 5',
    description:
      'Se hai già 2 pedine alzate e vuoi aggiungere 4, in basso ne hai solo 2 libere! Come fai? Usi la pedina del Cielo da 5 e togli la differenza.',
    keyRule: 'Per aggiungere un numero quando mancano pedine inferiori: AGGIUNGI 5 e TOGLI L\'AMICO!',
    fingersTip:
      'Le coppie di amici del 5 sono: 1 e 4 (1+4=5), 2 e 3 (2+3=5).',
    table: [
      { num: '+4', rule: 'Abbassa 5, togli 1', formula: '+5 - 1' },
      { num: '+3', rule: 'Abbassa 5, togli 2', formula: '+5 - 2' },
      { num: '+2', rule: 'Abbassa 5, togli 3', formula: '+5 - 3' },
      { num: '+1', rule: 'Abbassa 5, togli 4', formula: '+5 - 4' },
      { num: '-4', rule: 'Togli 5, aggiungi 1', formula: '-5 + 1' },
      { num: '-3', rule: 'Togli 5, aggiungi 2', formula: '-5 + 2' },
      { num: '-2', rule: 'Togli 5, aggiungi 3', formula: '-5 + 3' },
      { num: '-1', rule: 'Togli 5, aggiungi 4', formula: '-5 + 4' },
    ],
    examples: [
      {
        title: '2 + 4 = 6',
        action: 'Hai 2. Per fare +4: abbassa il 5 e togli 1',
        result: '6',
        explanation: '2 + 5 - 1 = 6. Hai mosso solo due pedine!',
      },
      {
        title: '7 - 3 = 4',
        action: 'Hai 7 (5+2). Per togliere 3: togli il 5 e rimetti 2',
        result: '4',
        explanation: '7 - 5 + 2 = 4. Il complemento speculare.',
      },
    ],
  },
  {
    id: 'lesson-4-friends-of-10',
    number: 4,
    title: 'Gli Amici del 10 (Il Riporto)',
    subtitle: 'Il passaggio alla colonna delle Decine',
    icon: '🔟',
    badge: 'Amici del 10',
    description:
      'Quando una colonna è satura o non ha abbastanza spazio, scatta il riporto sulla colonna di sinistra (le decine).',
    keyRule: 'Per aggiungere un numero usando la decina: AGGIUNGI 1 A SINISTRA (+10) e TOGLI L\'AMICO A DESTRA!',
    fingersTip:
      'Coppie di amici del 10: 9 e 1, 8 e 2, 7 e 3, 6 e 4, 5 e 5.',
    table: [
      { num: '+9', rule: '+10 decine, -1 unità', formula: '+10 - 1' },
      { num: '+8', rule: '+10 decine, -2 unità', formula: '+10 - 2' },
      { num: '+7', rule: '+10 decine, -3 unità', formula: '+10 - 3' },
      { num: '+6', rule: '+10 decine, -4 unità', formula: '+10 - 4' },
      { num: '+5', rule: '+10 decine, -5 unità', formula: '+10 - 5' },
      { num: '-9', rule: '-10 decine, +1 unità', formula: '-10 + 1' },
      { num: '-8', rule: '-10 decine, +2 unità', formula: '-10 + 2' },
      { num: '-7', rule: '-10 decine, +3 unità', formula: '-10 + 3' },
    ],
    examples: [
      {
        title: '8 + 5 = 13',
        action: 'Hai 8 sulle unità. Per fare +5: alzi 1 sulla decina (+10) e togli 5 sull\'unità',
        result: '13',
        explanation: 'Decina = 1, Unità = 3. Totale = 13.',
      },
      {
        title: '14 - 8 = 6',
        action: 'Togli 1 dalla decina (-10) e aggiungi 2 sull\'unità (+2)',
        result: '6',
        explanation: '14 - 10 + 2 = 6.',
      },
    ],
  },
  {
    id: 'lesson-5-anzan-mental',
    number: 5,
    title: 'Il Metodo Anzan: Abaco Mentale',
    subtitle: 'Come visualizzare le pedine dietro le palpebre',
    icon: '🧠',
    badge: 'Anzan Secret',
    description:
      'Anzan (暗算) significa letteralmente "calcolo nell\'oscurità" o calcolo mentale. Non si fanno conti a memoria con le cifre: si proietta l\'immagine visiva del telaio nella mente!',
    keyRule: 'Non ripetere i numeri a parole: immagina le pedine colorate che scattano sulla barra di legno nera!',
    fingersTip:
      'Gesto segreto dei campioni: muovi leggermente il pollice e l\'indice nell\'aria mentre i numeri scorrono. Il corpo aiuta il cervello a visualizzare il movimento esatto!',
    examples: [
      {
        title: 'Fase 1: Abaco Fantasma (Ghost)',
        action: 'Guarda l\'abaco semitrasparente mentre scorrono i numeri',
        result: 'Fase Visiva',
        explanation: 'L\'abaco fantasma ti aiuta a mantenere allineate le colonne.',
      },
      {
        title: 'Fase 2: Flash Anzan',
        action: 'I numeri appaiono a schermo: muovi le dita e aggiorna la foto mentale',
        result: 'Fase Mentale',
        explanation: 'Quando hai finito la sequenza, leggi semplicemente la foto mentale finale delle pedine!',
      },
    ],
  },
];
