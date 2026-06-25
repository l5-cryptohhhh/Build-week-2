# 🎵 EpiTunes

EpiTunes è una **web app di streaming musicale** ispirata a Spotify, sviluppata come progetto di gruppo (Build Week 2 – Epicode). Permette di cercare brani, album e artisti, ascoltarne l'anteprima audio, salvare i preferiti e consultare lo storico di ascolto — il tutto senza alcun framework, usando solo **HTML, CSS e JavaScript puro (Vanilla JS)**.

I dati musicali provengono in tempo reale da API pubbliche: **iTunes Search API** per brani/album/artisti e **TheAudioDB** per foto e biografie degli artisti.

---

## 📑 Indice

- [Che tipo di sito è](#-che-tipo-di-sito-è)
- [Funzionalità principali](#-funzionalità-principali)
- [Tecnologie utilizzate](#-tecnologie-utilizzate)
- [API utilizzate](#-api-utilizzate)
- [Struttura del progetto](#-struttura-del-progetto)
- [Pagine](#-pagine)
- [Documentazione delle funzioni](#-documentazione-delle-funzioni)
- [Come avviare il progetto](#-come-avviare-il-progetto)

---

## 🌐 Che tipo di sito è

EpiTunes è una **Single-purpose web app multi-pagina** (MPA) di tipo **music player / streaming**. Replica l'esperienza di un servizio di streaming:

- Layout a 3 zone: **sidebar** (navigazione + preferiti), **main** (contenuto della pagina), **player footer** (controlli di riproduzione sempre visibili).
- Pannello laterale **"In riproduzione"** con dettagli del brano e dell'artista.
- Persistenza dei dati lato client tramite **localStorage** (preferiti, cronologia, ultima ricerca) — nessun backend, nessun database.
- Riproduce le **anteprime audio (preview ~30s)** fornite da iTunes.

È un progetto **frontend-only**, didattico, pensato per esercitare DOM, fetch, async/await, classi (OOP) e gestione dello stato lato client.

---

## ✨ Funzionalità principali

### Riproduzione audio
- Player footer con **play/pausa, precedente, successivo, shuffle, repeat**.
- **Barra di avanzamento** trascinabile con tooltip del tempo al passaggio del mouse (seek).
- **Controllo volume** con slider + icona dinamica (muto / basso / medio / alto) e click per mutare/ripristinare.
- **Coda di riproduzione** (queue) con auto-avanzamento al brano successivo a fine traccia.
- Evidenziazione del brano in riproduzione nelle liste e nelle card.

### Ricerca
- Ricerca live con **debounce (400ms)** mentre si digita.
- Risultati divisi in tre sezioni: **Brani, Album, Artisti** (fetch in parallelo).
- Salvataggio e ripristino dell'**ultima ricerca** da localStorage.

### Libreria personale
- **Preferiti**: aggiunta/rimozione con il cuore, visibili nella sidebar e nella home, sincronizzati su tutta la pagina in tempo reale.
- **Cronologia**: ultimi 12 brani riprodotti (senza duplicati).

### Home personalizzata
- Righe **"Riprodotti di recente"** e **"I tuoi preferiti"** dinamiche.
- Suggerimenti **personalizzati** in base agli artisti più ascoltati (da cronologia + preferiti), oppure fallback su righe generiche **pop / rock / hits** per i nuovi utenti.
- **Caroselli** orizzontali con frecce di scorrimento auto-disabilitanti.

### Pagine di dettaglio
- **Album**: cover grande, metadati (artista, anno, n° brani), play dell'intero album, tracklist completa.
- **Artista**: foto, genere, n° ascoltatori, top tracks.
- **Brano**: dettaglio del singolo brano con play e preferito.

### Pannello "In riproduzione"
- Dettagli del brano (album, anno, genere, durata da iTunes).
- Sezione **"Sull'artista"** con foto e biografia reali da TheAudioDB (con cache).

---

## 🛠 Tecnologie utilizzate

| Tecnologia | Uso |
|-----------|-----|
| **HTML5** | Struttura delle pagine, elemento `<audio>` per la riproduzione |
| **CSS3** | Layout responsive, stile in `css/app.css` |
| **JavaScript (ES6+)** | Tutta la logica applicativa (Vanilla JS, nessun framework) |
| **Fetch API + async/await** | Chiamate HTTP alle API esterne, con `try/catch` |
| **localStorage** | Persistenza di preferiti, cronologia, ultima ricerca |
| **Bootstrap Icons** | Icone (shuffle, repeat, home, search…) via CDN |
| **Git / GitHub** | Versionamento e collaborazione di gruppo |

### Pattern e tecniche JS impiegate
- **OOP / classi**: `Track`, `Album`, `Artist`, `Player`.
- **DOM API moderna**: `createElement`, `append`, `replaceChildren` (evitato `innerHTML` dove possibile).
- **Eventi**: `addEventListener` (nessun `onclick` inline).
- **`MutationObserver`** per decorare elementi aggiunti dinamicamente (caroselli).
- **`CustomEvent`** (`library:changed`) per sincronizzare la UI tra moduli.
- **`Promise.all`** per fetch in parallelo.
- **Debounce** per la ricerca live.
- **Caching in memoria** (`Map`) per ridurre le chiamate API.
- Solo `const` / `let` (mai `var`).

---

## 🔌 API utilizzate

### 1. iTunes Search API — `https://itunes.apple.com`
Sorgente principale di brani, album, artisti e anteprime audio.

| Endpoint | Scopo |
|----------|-------|
| `/search?term=...&entity=song` | Ricerca brani |
| `/search?term=...&entity=album` | Ricerca album |
| `/search?term=...&entity=musicArtist` | Ricerca artisti |
| `/lookup?id=...&entity=song` | Dettaglio album/artista con relative tracce |
| `/lookup?id=...` | Dettaglio singolo brano |

> Nota: l'artwork (`artworkUrl100`) viene ingrandito da 100×100 a 600×600 con la funzione `bigArt`.

### 2. TheAudioDB — `https://www.theaudiodb.com/api/v1/json/2`
Usata per arricchire i dati artista (iTunes non fornisce foto/bio).

| Endpoint | Scopo |
|----------|-------|
| `/search.php?s=NOME_ARTISTA` | Foto, biografia, genere, anno di formazione |

---

## 📂 Struttura del progetto

```
Build-week-2/
└── start/
    ├── index.html        # Home
    ├── search.html       # Ricerca
    ├── album.html        # Dettaglio album
    ├── artist.html       # Dettaglio artista
    ├── track.html        # Dettaglio brano
    ├── css/
    │   └── app.css       # Tutti gli stili
    ├── js/
    │   ├── common.js     # Codice condiviso: classi, Player, helpers, sidebar, player footer, pannello "In riproduzione"
    │   ├── home.js       # Logica della Home
    │   ├── search.js     # Logica della Ricerca
    │   ├── album.js      # Logica pagina Album
    │   ├── artist.js     # Logica pagina Artista
    │   └── track.js      # Logica pagina Brano
    └── assets/           # Logo e immagini di default
```

`common.js` è incluso in **tutte** le pagine prima dello script specifico della pagina.

---

## 📄 Pagine

| Pagina | File | Descrizione |
|--------|------|-------------|
| Home | `index.html` + `home.js` | Suggerimenti personalizzati, recenti, preferiti |
| Ricerca | `search.html` + `search.js` | Ricerca live di brani/album/artisti |
| Album | `album.html` + `album.js` | Tracklist e info album |
| Artista | `artist.html` + `artist.js` | Top tracks e info artista |
| Brano | `track.html` + `track.js` | Dettaglio singolo brano |

---

## 🧩 Documentazione delle funzioni

### `common.js` (codice condiviso)

**Helpers**
- `fetchJSON(url)` — GET con `try/catch`; ritorna il JSON o un oggetto vuoto in caso di errore.
- `bigArt(url)` — sostituisce `100x100` con `600x600` nell'URL della cover.
- `formatTime(ms)` — converte millisecondi in stringa `m:ss`.
- `debounce(fn, ms)` — rinvia l'esecuzione di `fn` fino alla pausa di digitazione.
- `setText(el, str)` — imposta testo in modo sicuro senza `innerHTML`.

**Classi modello**
- `Track(raw)` — normalizza un brano iTunes (id, title, artist, album, cover, previewUrl, durationMs…).
- `Album(raw)` — normalizza un album (id, title, artist, cover, releaseDate, trackCount).
- `Artist(raw)` — normalizza un artista (id, name, genre).

**Classe `Player`** — gestisce l'elemento `<audio>` e la UI del footer.
- `mount()` — costruisce la UI del player e collega gli eventi.
- `play(track, auto)` — imposta sorgente, avvia, aggiorna UI, salva in cronologia.
- `togglePlay()` — alterna play/pausa.
- `setVolume(v)` — imposta il volume (0–1) e l'icona.
- `seek(percent)` — sposta la riproduzione a una percentuale.
- `setQueue(tracks, startIndex)` — imposta la coda e parte da un indice.
- `playNext()` / `playPrev()` — naviga la coda (con supporto shuffle/repeat).

**localStorage**
- `getHistory()` / `addToHistory(track)` — cronologia (max 12, senza duplicati).
- `getFavourites()` / `isFavourite(id)` / `toggleFavourite(track)` — preferiti.

**Render & UI**
- `renderSidebar(activePage)` / `renderSidebarFavs()` — sidebar e lista preferiti.
- `setupCarousels()` / `decorateRow(row)` — caroselli con frecce.
- `getArtistInfo(name)` — foto/bio artista da TheAudioDB (con cache).
- `createNowPlayingPanel()` — pannello laterale "In riproduzione".
- `initPage(activePage)` — inizializza sidebar + player + pannello; ritorna il `Player`.

### `home.js`
- `getTopArtists()` — artisti più ascoltati da cronologia + preferiti.
- `makeCard(track, i, tracks)` / `makeAlbumCard(album)` — card brano/album.
- `makeRow(title)` — sezione con titolo e griglia.
- `renderDynamicRows()` — aggiorna righe recenti/preferiti.
- `loadHome()` — costruisce la home (suggerimenti personalizzati o fallback).
- `refreshAllHearts()` — sincronizza tutti i cuori in pagina.

### `search.js`
- `renderTrackCard` / `renderAlbumCard` / `renderArtistCard` — card dei risultati.
- `doSearch(term)` — fetch parallela di brani/album/artisti e render.
- ricerca live con `debounce(doSearch, 400)` + ripristino ultima query.

### `album.js` — `loadAlbum()`
Legge l'`id` dalla query string, fetch dell'album + tracce, costruisce hero e tracklist.

### `artist.js` — `loadArtist()`
Legge l'`id`, fetch artista + top tracks, costruisce hero e lista brani (con gestione errori).

### `track.js` — `loadTrack()`
Legge l'`id`, fetch del singolo brano, costruisce l'hero con play e preferito.

---

## 👥 Progetto

Sviluppato come **Build Week 2** del corso **Epicode**, in gruppo, con workflow Git/GitHub a branch per ciascun membro e merge tramite Pull Request.
