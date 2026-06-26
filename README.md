# MusiCode

Web app in stile Spotify realizzata durante la Build Week di Epicode. Permette di cercare brani, album e artisti, ascoltarne le preview audio, salvare i preferiti legati al proprio account e gestire un login/registrazione semplice basato su `localStorage`.

## Funzionalità

- **Home**: caroselli di brani, album e artisti in evidenza
- **Ricerca**: ricerca live di brani/album/artisti
- **Pagine dettaglio**: Album, Artista e Brano con tracklist e player
- **Preferiti**: salvataggio dei brani preferiti, legati all'account loggato
- **Login / Registrazione**: gestione account e sessione via `localStorage`, con refresh dei preferiti al login
- **Player audio**: play/pause, traccia precedente/successiva, shuffle, repeat, barra di avanzamento e volume
- **Profilo**: pagina utente con riepilogo dei preferiti
- **Layout responsive**, con versione mobile dedicata

## Funzionalità in dettaglio

### Home

Caroselli scorrevoli con brani, album e artisti in evidenza, caricati dalle API esterne.

![Home](assets/img/screenshots/home.png)

### Pagine dettaglio (Album)

Visualizzazione della tracklist di un album, con player integrato.

![Dettaglio album](assets/img/screenshots/album.png)

### Login / Registrazione

Modale di accesso e registrazione, con account e sessione salvati in `localStorage` e refresh automatico dei preferiti al login.

![Login](assets/img/screenshots/login.png)
![Registrazione](assets/img/screenshots/register.png)

### Profilo

Pagina utente con dati dell'account e riepilogo dei preferiti.

![Profilo](assets/img/screenshots/profile.png)

## Tecnologie

- HTML, CSS, JavaScript (vanilla, no framework)
- [Bootstrap Icons](https://icons.getbootstrap.com/)
- [iTunes Search API](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/) per brani, album e artisti
- [TheAudioDB API](https://www.theaudiodb.com/) per dati aggiuntivi sugli artisti

## Struttura del progetto

```
.
├── index.html          # Home
├── search.html         # Ricerca
├── album.html          # Dettaglio album
├── artist.html         # Dettaglio artista
├── track.html           # Dettaglio brano
├── favourites.html      # Preferiti
├── profile.html         # Profilo utente
└── assets/
    ├── css/app.css       # Stili
    ├── js/               # Logica per pagina (common, home, search, album, artist, track, favourites, profile)
    └── img/              # Loghi e immagini placeholder
```

## Avvio del progetto

Non essendo presenti dipendenze o build step, basta servire la cartella con un server statico (es. estensione Live Server di VS Code) e aprire `index.html`, oppure aprirlo direttamente nel browser.

## Team

Progetto sviluppato in gruppo durante la Build Week 2 del corso Epicode.

- Manuel
- Kian
- Angelo
- Yhara
- Claudio
