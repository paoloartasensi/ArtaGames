export type GameId =
  | 'connect4'
  | 'checkers'
  | 'battleship'
  | 'go'
  | 'chess'
  | 'tictactoe'
  | 'snakes'
  | 'memory'
  | 'mancala'
  | 'domino'
  | 'reversi'
  | 'morris'
  | 'quarto'
  | 'ludo'
  | 'dotsboxes'
  | 'gomoku'
  | 'nim'
  | 'abalone'
  | 'guesswho'
  | 'goose'
  | 'simon';

export interface GameMetadata {
  id: GameId;
  title: string;
  subtitle: string;
  minAge: string;
  category: 'Classici' | 'Strategia' | 'Rapidi';
  summary: string;
  rulesKidFriendly: {
    title: string;
    steps: string[];
    tip: string;
  };
  boardDescription: string;
  iconName: string;
}

export const GAME_REGISTRY: Record<GameId, GameMetadata> = {
  connect4: {
    id: 'connect4',
    title: 'Forza 4',
    subtitle: 'Allinea 4 gettoni dello stesso colore',
    minAge: '5+ anni',
    category: 'Classici',
    summary: 'Fai cadere i gettoni dall\'alto: il primo che ne mette 4 in fila (orizzontale, verticale o diagonale) vince!',
    rulesKidFriendly: {
      title: 'Come si gioca a Forza 4',
      steps: [
        'A turno, tocca una colonna per far cadere il tuo gettone.',
        'La gravità fa scivolare il gettone in fondo alla colonna.',
        'Il primo che allinea 4 gettoni in fila (orizzontale, verticale o obliquo) fa punto e vince!',
      ],
      tip: 'Consiglio: tieni d\'occhio le mosse dell\'avversario per bloccare le sue file di 3 gettoni!',
    },
    boardDescription: 'Griglia 7x6 con gravità realistica',
    iconName: 'Grid3X3',
  },
  checkers: {
    id: 'checkers',
    title: 'Dama Classica',
    subtitle: 'Salta sopra i pezzi avversari e conquista la Dama',
    minAge: '6+ anni',
    category: 'Classici',
    summary: 'Muovi in diagonale sulle caselle scure. Salta sopra i pezzi avversari per catturarli e raggiungi l\'altro lato per diventare Dama!',
    rulesKidFriendly: {
      title: 'Come si gioca a Dama',
      steps: [
        'I tuoi pezzi avanzano sempre in diagonale di 1 passo sulle caselle scure.',
        'Se un pezzo avversario è vicino e dietro c\'è una casella vuota, saltalo e catturalo!',
        'Quando una tua pedina arriva all\'ultima riga in fondo, diventa una Dama con la corona e può muoversi anche all\'indietro!',
      ],
      tip: 'Consiglio: cerca di proteggere le tue pedine facendole viaggiare insieme in gruppo.',
    },
    boardDescription: 'Scacchiera 8x8 con salti e corone',
    iconName: 'CircleDot',
  },
  battleship: {
    id: 'battleship',
    title: 'Battaglia Navale',
    subtitle: 'Trova e affonda la flotta avversaria',
    minAge: '6+ anni',
    category: 'Strategia',
    summary: 'Posiziona le tue navi sul radar e spara colpi nell\'oceano dell\'avversario. Acqua o Colpito? Trovale tutte per vincere!',
    rulesKidFriendly: {
      title: 'Come si gioca a Battaglia Navale',
      steps: [
        'Posiziona le tue 5 navi sulla tua griglia (oppure premi "Disponi Navi" per fare in automatico).',
        'A turno tocca una casella sul radar nemico per lanciare un colpo.',
        'Se trovi il mare compare uno spruzzo d\'acqua; se becchi una nave vedrai un\'esplosione! Affonda tutte le navi per vincere!',
      ],
      tip: 'Consiglio: quando colpisci una nave, spara nelle caselle subito vicine per trovare il resto!',
    },
    boardDescription: 'Radar 8x8 o 10x10 con flotta navale',
    iconName: 'Compass',
  },
  go: {
    id: 'go',
    title: 'Go Semplificato',
    subtitle: 'Circonda e cattura le pietre avversarie',
    minAge: '6+ anni',
    category: 'Strategia',
    summary: 'Il gioco da tavolo più antico del mondo, semplificato in un mini-tavolo 7x7 o 9x9 per bambini. Circonda le pietre nemiche per catturarle!',
    rulesKidFriendly: {
      title: 'Come si gioca a Go Junior',
      steps: [
        'I giocatori posizionano una pietra nera o bianca sulle intersezioni delle linee.',
        'Le pietre hanno "respiri" (le linee libere vicine). Se circondi completamente una pietra togliendole tutti i respiri, la catturi!',
        'Puoi anche "passare il turno" se non ci sono più mosse buone. Vince chi conquista più territorio e pietre!',
      ],
      tip: 'Consiglio: tieni le tue pietre vicine per creare gruppi forti e con tanti respiri.',
    },
    boardDescription: 'Tavola goban 7x7 / 9x9 con pietre zen',
    iconName: 'Circle',
  },
  chess: {
    id: 'chess',
    title: 'Scacchi Junior',
    subtitle: 'La sfida dei Re, con mosse guidate per imparare',
    minAge: '7+ anni',
    category: 'Strategia',
    summary: 'I pezzi del Reame: Cavalli che saltano a L, Torri come castelli, Alfieri diagonali e la potente Regina. Le caselle si illuminano per guidare ogni mossa!',
    rulesKidFriendly: {
      title: 'Come si gioca a Scacchi Junior',
      steps: [
        'Tocca un tuo pezzo: il gioco illuminerà con puntini verdi tutte le caselle in cui può muoversi!',
        'I Pedoni avanzano diritti, la Torre va dritta, l\'Alfiere in diagonale, il Cavallo salta a L.',
        'L\'obiettivo è mettere sotto scacco il Re avversario senza che possa scappare!',
      ],
      tip: 'Consiglio: gli aiuti visivi ti mostrano sempre le mosse sicure e le catture possibili!',
    },
    boardDescription: 'Scacchiera 8x8 con evidenziatore mosse',
    iconName: 'Crown',
  },
  tictactoe: {
    id: 'tictactoe',
    title: 'Tris Classico',
    subtitle: 'Tre in fila per i più piccoli',
    minAge: '5+ anni',
    category: 'Rapidi',
    summary: 'Il gioco più veloce e intuitivo: metti 3 simboli in fila su una griglia 3x3 prima del tuo avversario.',
    rulesKidFriendly: {
      title: 'Come si gioca a Tris',
      steps: [
        'A turno metti il tuo simbolo (X o O) in una casella vuota.',
        'Cerca di fare 3 in fila in orizzontale, verticale o diagonale.',
        'Se la griglia si riempie senza vincitori, è un pareggio amichevole!',
      ],
      tip: 'Consiglio: inizia mettendo il tuo pezzo al centro se puoi!',
    },
    boardDescription: 'Griglia rapida 3x3',
    iconName: 'Hash',
  },
  snakes: {
    id: 'snakes',
    title: 'Serpenti e Scale',
    subtitle: 'Lancia il dado e corri verso la casella 100',
    minAge: '5+ anni',
    category: 'Classici',
    summary: 'Lancia il dado, avanza e attento a serpenti e scale! Le scale ti fanno salire in fretta, i serpenti ti fanno scivolare giù.',
    rulesKidFriendly: {
      title: 'Come si gioca a Serpenti e Scale',
      steps: [
        'A turno, premi "Lancia il dado" e muovi la tua pedina di tanti passi quanti indica il dado.',
        'Se cadi su una scala, sali fino in cima! Se cadi sulla testa di un serpente, scivoli giù.',
        'Vince chi arriva per primo alla casella 100 (devi arrivarci esattamente!).',
      ],
      tip: 'Consiglio: qui non serve strategia, serve fortuna! Ridete insieme quando il serpente vi fa scivolare.',
    },
    boardDescription: 'Percorso 10x10 con scale e serpenti',
    iconName: 'Dices',
  },
  memory: {
    id: 'memory',
    title: 'Memory',
    subtitle: 'Trova tutte le coppie di animaletti',
    minAge: '5+ anni',
    category: 'Rapidi',
    summary: 'Gira due carte per volta e ricorda dove sono gli animaletti. Chi trova più coppie vince!',
    rulesKidFriendly: {
      title: 'Come si gioca a Memory',
      steps: [
        'A turno, tocca due carte per girarle.',
        'Se mostrano lo stesso animaletto, le tieni e giochi di nuovo!',
        'Se sono diverse, si rigirano e tocca all\'altro. Vince chi trova più coppie!',
      ],
      tip: 'Consiglio: guarda bene dove sono gli animaletti quando si girano, anche durante il turno dell\'altro!',
    },
    boardDescription: 'Griglia 4x4 di carte a coppie',
    iconName: 'Brain',
  },
  mancala: {
    id: 'mancala',
    title: 'Mancala',
    subtitle: 'Semina i semi e raccogli più dell\'avversario',
    minAge: '5+ anni',
    category: 'Classici',
    summary: 'Raccogli i semi da una buca e seminali uno a uno. L\'ultimo seme nella tua riserva ti regala un altro turno!',
    rulesKidFriendly: {
      title: 'Come si gioca a Mancala',
      steps: [
        'Tocca una delle tue 6 buche: tutti i semi vengono seminati uno a uno in senso antiorario.',
        'Se l\'ultimo seme cade nella tua riserva, giochi un altro turno!',
        'Se l\'ultimo seme cade in una tua buca vuota, catturi i semi di fronte. Vince chi ha più semi nella riserva!',
      ],
      tip: 'Consiglio: scegli buche che finiscono nella tua riserva o che catturano i semi dell\'avversario.',
    },
    boardDescription: 'Tavolo con 12 buche e 2 riserve',
    iconName: 'Sprout',
  },
  domino: {
    id: 'domino',
    title: 'Domino Junior',
    subtitle: 'Abbina i numeri e finisci le tue tessere',
    minAge: '5+ anni',
    category: 'Classici',
    summary: 'Appoggia una tessera che combacia con uno dei numeri aperti. Se non puoi giocare, pesca!',
    rulesKidFriendly: {
      title: 'Come si gioca a Domino',
      steps: [
        'A turno, tocca una delle tue tessere che combacia con uno dei due numeri aperti.',
        'Se non hai tessere che vanno bene, premi "Pesca" per prendere una nuova tessera.',
        'Vince chi finisce per primo tutte le sue tessere (o chi ha meno puntini se la partita si blocca)!',
      ],
      tip: 'Consiglio: cerca di giocare prima le tessere con tanti puntini!',
    },
    boardDescription: 'Catena di tessere con puntini',
    iconName: 'LayoutGrid',
  },
  reversi: {
    id: 'reversi',
    title: 'Reversi',
    subtitle: 'Gira i dischi e conquista la scacchiera',
    minAge: '7+ anni',
    category: 'Strategia',
    summary: 'Metti un disco e cattura quelli avversari in mezzo. Alla fine, chi ha più dischi del proprio colore vince!',
    rulesKidFriendly: {
      title: 'Come si gioca a Reversi',
      steps: [
        'A turno, metti il tuo disco in una casella con il puntino luminoso.',
        'Tutti i dischi avversari intrappolati tra il tuo nuovo disco e un tuo altro disco si girano al tuo colore.',
        'Vince chi alla fine ha più dischi. La partita finisce quando la scacchiera è piena!',
      ],
      tip: 'Consiglio: conquista gli angoli! Da lì i dischi non possono più essere girati.',
    },
    boardDescription: 'Scacchiera 8x8 con dischi che si girano',
    iconName: 'Contrast',
  },
  morris: {
    id: 'morris',
    title: 'Mulino',
    subtitle: 'Allinea 3 pezzi e togli un pezzo all\'avversario',
    minAge: '7+ anni',
    category: 'Strategia',
    summary: 'Piazza i pezzi, poi muovili lungo le linee. Ogni volta che fai 3 in fila (un Mulino), togli un pezzo all\'avversario!',
    rulesKidFriendly: {
      title: 'Come si gioca a Mulino',
      steps: [
        'Prima piazza i tuoi 9 pezzi uno alla volta sulle intersezioni.',
        'Ogni volta che fai 3 in fila (un Mulino), togli un pezzo all\'avversario.',
        'Quando tutti i pezzi sono piazzati, muovili lungo le linee. Vince chi lascia l\'avversario con meno di 3 pezzi o senza mosse!',
      ],
      tip: 'Consiglio: cerca di fare un Mulino al centro e muoviti per crearne sempre di nuovi.',
    },
    boardDescription: 'Tavolo a tre quadrati con linee',
    iconName: 'Crosshair',
  },
  quarto: {
    id: 'quarto',
    title: 'Quarto',
    subtitle: 'Fila di 4 pezzi che si somigliano',
    minAge: '7+ anni',
    category: 'Strategia',
    summary: 'Scegli un pezzo per l\'avversario e piazza quello che ti danno. Vinci se fai una fila di 4 pezzi con qualcosa in comune!',
    rulesKidFriendly: {
      title: 'Come si gioca a Quarto',
      steps: [
        'Ogni pezzo è: alto o basso, chiaro o scuro, tondo o quadrato, pieno o bucato.',
        'A turno, scegli un pezzo per l\'avversario; lui lo piazza dove vuole.',
        'Vinci se fai una fila di 4 pezzi che condividono una di queste caratteristiche!',
      ],
      tip: 'Consiglio: guarda tutte e 4 le caratteristiche, non solo il colore!',
    },
    boardDescription: 'Griglia 4x4 con 16 pezzi speciali',
    iconName: 'Shapes',
  },
  ludo: {
    id: 'ludo',
    title: 'Non ti Arrabbiare',
    subtitle: 'Ludo Junior: corri con le pedine fino a casa',
    minAge: '5+ anni',
    category: 'Classici',
    summary: 'Lancia il dado, fai uscire le pedine dalla base e corri verso casa. Se mangi una pedina avversaria, la rimandi in base!',
    rulesKidFriendly: {
      title: 'Come si gioca a Non ti Arrabbiare',
      steps: [
        'Lancia il dado. Con un 6 fai uscire una pedina dalla tua base e lanci ancora.',
        'Tocca la pedina da muovere: quelle che puoi muovere si illuminano di verde.',
        'Se finisci su una pedina avversaria (fuori dalle caselle-stella sicure), la rimandi in base e lanci ancora!',
        'Vinci portando tutte e 4 le pedine nella casa in centro!',
      ],
      tip: 'Consiglio: tieni una pedina sulle caselle-stella (le caselle sicure con la stella), così non può essere mangiata!',
    },
    boardDescription: 'Percorso Ludo 15x15 con dadi e pedine',
    iconName: 'Dice5',
  },
  dotsboxes: {
    id: 'dotsboxes',
    title: 'Punti e Linee',
    subtitle: 'Chiudi i quadratini e colorali del tuo colore',
    minAge: '5+ anni',
    category: 'Strategia',
    summary: 'A turno traccia una linea tra due puntini. Chi chiude un quadratino lo conquista e gioca di nuovo!',
    rulesKidFriendly: {
      title: 'Come si gioca a Punti e Linee',
      steps: [
        'A turno, tocca una linea tratteggiata tra due puntini per disegnarla.',
        'Se con la tua linea chiudi un quadratino, lo conquisti (diventa del tuo colore) e giochi ancora!',
        'Vince chi alla fine ha conquistato più quadratini.',
      ],
      tip: 'Consiglio: attento a non lasciare all\'avversario un quadratino con tre lati già disegnati!',
    },
    boardDescription: 'Griglia 5x5 di puntini con 16 quadratini',
    iconName: 'PenLine',
  },
  gomoku: {
    id: 'gomoku',
    title: 'Gomoku',
    subtitle: 'Cinque pietre in fila sulla griglia',
    minAge: '5+ anni',
    category: 'Strategia',
    summary: 'Metti le tue pietre sulla griglia: il primo che ne allinea 5 in fila (orizzontale, verticale o diagonale) vince!',
    rulesKidFriendly: {
      title: 'Come si gioca a Gomoku',
      steps: [
        'A turno, tocca un incrocio vuoto per posizionare la tua pietra.',
        'Cerca di metterne 5 in fila in orizzontale, verticale o diagonale.',
        'Attenzione: blocca l\'avversario prima che ne faccia 5!',
      ],
      tip: 'Consiglio: le pietre vicine tra loro sono più forti: costruisci file sempre più lunghe.',
    },
    boardDescription: 'Griglia 9x9 con pietre bianche e nere',
    iconName: 'Target',
  },
  nim: {
    id: 'nim',
    title: 'Nim',
    subtitle: 'Togli i bastoncini... ma non l\'ultimo!',
    minAge: '5+ anni',
    category: 'Strategia',
    summary: 'A turno togli 1, 2 o 3 bastoncini dal mucchio. Chi è costretto a prendere l\'ultimo... perde!',
    rulesKidFriendly: {
      title: 'Come si gioca a Nim',
      steps: [
        'A turno, scegli se togliere 1, 2 o 3 bastoncini.',
        'I bastoncini tolti spariscono: il mucchio si fa sempre più piccolo.',
        'Chi prende l\'ultimo bastoncino perde la partita!',
      ],
      tip: 'Consiglio: prova a lasciare all\'avversario un numero "magico" di bastoncini... scopri quale!',
    },
    boardDescription: 'Mucchio di bastoncini da togliere',
    iconName: 'Minus',
  },
  abalone: {
    id: 'abalone',
    title: 'Abalone',
    subtitle: 'Spingi le biglie nemiche fuori dal bordo',
    minAge: '7+ anni',
    category: 'Strategia',
    summary: 'Muovi 1, 2 o 3 biglie in fila per spingere quelle dell\'avversario. Chi butta fuori 6 biglie nemiche vince!',
    rulesKidFriendly: {
      title: 'Come si gioca ad Abalone',
      steps: [
        'Tocca una tua biglia per sceglierla, poi tocca una biglia vicina per formare una fila di 2 o 3.',
        'Tocca una casella vuota per muoverti, o una biglia avversaria per spingerla: ti servono più biglie in fila dell\'avversario!',
        'Chi spinge 6 biglie nemiche fuori dal bordo vince la partita!',
      ],
      tip: 'Consiglio: in gruppo si è più forti! 2 biglie spingono 1, 3 biglie spingono 2.',
    },
    boardDescription: 'Tavola esagonale con biglie',
    iconName: 'Orbit',
  },
  guesswho: {
    id: 'guesswho',
    title: 'Indovina Chi',
    subtitle: 'Trova il personaggio segreto con le domande giuste',
    minAge: '5+ anni',
    category: 'Classici',
    summary: 'Fai domande all\'avversario per scoprire il suo personaggio segreto: ha gli occhiali? Ha la barba? Abbassa le tessere e indovina chi è!',
    rulesKidFriendly: {
      title: 'Come si gioca a Indovina Chi',
      steps: [
        'A inizio partita ricevi un personaggio misterioso segreto che l\'avversario deve indovinare.',
        'A ogni turno fai una domanda (es. "Porta gli occhiali?" o "Ha i capelli chiari?").',
        'In base alla risposta SÌ o NO, abbassa le tessere dei personaggi scartati.',
        'Quando sei sicuro, premi "Indovina!" e seleziona il personaggio segreto dell\'avversario per vincere!',
      ],
      tip: 'Consiglio: fai domande che dividono i personaggi rimasti a metà per escluderne il maggior numero possibile!',
    },
    boardDescription: 'Tabellone 3D con tessere ribaltabili',
    iconName: 'HelpCircle',
  },
  goose: {
    id: 'goose',
    title: "Il Gioco dell'Oca",
    subtitle: 'Lancia il dado e vola verso il Giardino delle Oche',
    minAge: '4+ anni',
    category: 'Classici',
    summary: 'Il grande classico per bambini: lancia il dado, salta da una casella all\'altra, sfrutta le oche fortunate e il ponte magico per arrivare per primo alla coppa!',
    rulesKidFriendly: {
      title: "Come si gioca al Gioco dell'Oca",
      steps: [
        'A turno, tocca il grande dado per lanciarlo e vedere quanti passi fare.',
        'La tua paperella avanza sul prato colorato casella dopo casella.',
        'Se atterri su un\'Oca fortunata fai un salto doppio! Se atterri sul Ponte voli avanti!',
        'Attento alla Locanda e al Pozzo: ti fermi per una merenda e riposi un turno.',
        'Chi arriva esattamente alla casella 30 vince la coppa dorata!',
      ],
      tip: 'Consiglio: tieni le dita incrociate sul dado per fare un salto doppio sull\'Oca fortunata!',
    },
    boardDescription: 'Percorso nel prato a 30 caselle illustrate con grande dado 3D',
    iconName: 'Sparkles',
  },
  simon: {
    id: 'simon',
    title: 'Simon Dice',
    subtitle: 'Ricorda e ripeti la sequenza musicale di colori',
    minAge: '4+ anni',
    category: 'Rapidi',
    summary: 'Il maestro dei suoni accende i colori in sequenza con note musicali: ascolta con attenzione e tocca i tasti nello stesso ordine per superare tutti i livelli!',
    rulesKidFriendly: {
      title: 'Come si gioca a Simon Dice',
      steps: [
        'Premi INIZIA per ascoltare e vedere il primo colore che si illumina.',
        'Tocca lo stesso colore per ripetere la sequenza.',
        'A ogni livello si aggiunge una nuova nota musicale e un nuovo colore!',
        'Cerca di superare il tuo record personale di stelle!',
      ],
      tip: 'Consiglio: canticchia le note dei colori mentre si accendono per ricordarle più facilmente!',
    },
    boardDescription: 'Console circolare a 4 quadranti luminosi con note musicali',
    iconName: 'Music',
  },
};

export const ALL_GAMES: GameMetadata[] = Object.values(GAME_REGISTRY);
