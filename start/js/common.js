/* ============================================================
   common.js — codice condiviso tra tutte le pagine
   ============================================================

   REGOLE GENERALI
   - Solo const e let (mai var)
   - DOM: querySelector / querySelectorAll
   - Eventi: addEventListener (mai onclick inline)
   - fetch + async/await + try/catch
   - localStorage: setItem / getItem / removeItem (salva sempre stringhe)
   - Pattern OOP: classi Track, Album, Artist, Player

   COSA CONTIENE QUESTO FILE
   1) Costanti (URL base API, chiavi localStorage)
   2) Helpers (fetchJSON, formatTime, bigArt, debounce)
   3) Classi modello: Track, Album, Artist
   4) Classe Player (gestisce <audio>)
   5) localStorage helpers (history, favourites)
   6) Render sidebar e player footer
   7) Inizializzazione al DOMContentLoaded

   ESEMPIO USO DELL'ELEMENTO <audio>
   --------------------------------
     const audio = document.querySelector("#audio-element");
     audio.src = "https://...preview.m4a"; // URL della preview MP3
     audio.play();                         // avvia la riproduzione
     audio.pause();                        // mette in pausa
     audio.currentTime = 10;               // salta a 10 secondi
     audio.duration;                       // durata in secondi
     audio.volume = 0.5;                   // volume tra 0 e 1

     audio.addEventListener("timeupdate", () => {
       // chiamato continuamente durante la riproduzione
       const percent = (audio.currentTime / audio.duration) * 100;
     });

     audio.addEventListener("ended", () => {
       // brano finito
     });

   ESEMPIO USO DELL'API iTunes
   ---------------------------
     // Ricerca brani
     fetch("https://itunes.apple.com/search?term=eminem&entity=song&limit=10")

     // Ricerca album
     fetch("https://itunes.apple.com/search?term=pink+floyd&entity=album&limit=10")

     // Ricerca artisti
     fetch("https://itunes.apple.com/search?term=jovanotti&entity=musicArtist&limit=5")

     // Dettagli album (con tracce)
     fetch("https://itunes.apple.com/lookup?id=1440831203&entity=song")

     // Top tracks artista
     fetch("https://itunes.apple.com/lookup?id=909253&entity=song&limit=10")
*/

/* ============================ 1. Costanti ============================ */

const API_BASE = "https://itunes.apple.com";
const STORAGE_KEY_HISTORY = "epitunes_history";
const STORAGE_KEY_FAVOURITES = "epitunes_favourites";
const STORAGE_KEY_LAST_SEARCH = "epitunes_last_search";
const MAX_HISTORY = 12;

/* ============================ 2. Helpers ============================ */

/*
  fetchJSON(url)
  - Fa una richiesta GET e ritorna i dati JSON
  - Gestisce errori HTTP e di rete con try/catch
  - In caso di errore ritorna { results: [], resultCount: 0 } per semplificare i chiamanti
*/
const fetchJSON = async (url) => {
  // TODO: implementare con try/catch + await response.json()
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Qualcosa  e andato storto...");
    const dati = await res.json();
    return dati;
  } catch (errore) {
    console.error(errore);
  }
  // - Se response.ok è false, lancia un Error
  // - Se la chiamata fallisce per rete, ritorna oggetto vuoto e logga l'errore
  return { results: [], resultCount: 0 };
};

/*
  bigArt(url)
  - L'API iTunes ritorna artwork 100x100 (artworkUrl100)
  - Sostituisce "100x100bb" con "600x600bb" per avere una cover più grande
*/
const bigArt = (url) => {
  if (!url) return "";
  return url.replace("100x100", "600x600");
};

/*
  formatTime(ms)
  - Converte millisecondi in stringa "m:ss"
  - Esempio: 65000 -> "1:05"
*/
const formatTime = (ms) => {
  if (!ms) return "0:00";
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${String(sec).padStart(2, "0")}`;
};

/*
  debounce(fn, ms)
  - Restituisce una nuova funzione che chiama fn solo dopo "ms" millisecondi
    di pausa rispetto all'ultima chiamata. Usata per la ricerca al type.
*/
const debounce = (fn, ms) => {
  let timerId = null;
  return (...args) => {
    clearTimeout(timerId);
    timerId = setTimeout(() => fn(...args), ms);
  };
};

/* ============================ 3. Classi modello ============================ */

/*
  Classe Track
  Modella un brano restituito dall'API iTunes (wrapperType === "track").
  Campi utili dell'API: trackId, trackName, artistName, collectionName,
  collectionId, artistId, artworkUrl100, previewUrl, trackTimeMillis.
*/
class Track {
  constructor(raw) {
    this.id = raw.trackId;
    this.title = raw.trackName;
    this.artist = raw.artistName;
    this.album = raw.collectionName;
    this.albumId = raw.collectionId;
    this.artistId = raw.artistId;
    this.cover = raw.artworkUrl100;
    this.previewUrl = raw.previewUrl;
    this.durationMs = raw.trackTimeMillis;

    // TODO: assegna alle property di this i valori da raw
    // (id, title, artist, album, albumId, artistId, cover, previewUrl, durationMs)
  }
}

/*
  Classe Album
  Modella un album (wrapperType === "collection").
  Campi utili: collectionId, collectionName, artistName, artworkUrl100,
  releaseDate, trackCount.
*/
class Album {
  constructor(raw) {
    this.id = raw.collectionId;
    this.title = raw.collectionName;
    this.artist = raw.artistName;
    this.cover = raw.artworkUrl100;
    this.releaseDate = raw.releaseDate;
    this.trackCount = raw.trackCount;

    // TODO: come sopra
  }
}

/*
  Classe Artist
  Modella un artista (wrapperType === "artist").
  Campi utili: artistId, artistName, primaryGenreName.
*/
class Artist {
  constructor(raw) {
    this.id = raw.artistId;
    this.name = raw.artistName;
    this.genre = raw.primaryGenreName;
    // TODO: come sopra
  }
}

/* ============================ 4. Classe Player ============================ */

/*
  Classe Player
  Gestisce la riproduzione audio e la UI del player footer.

  Stato interno:
    - currentTrack: Track corrente (null se nessun brano)
    - isPlaying: true/false

  Metodi pubblici:
    - mount()        -> rende la UI del player nel footer (.player)
    - play(track)    -> imposta currentTrack, src audio, avvia, salva in history
    - togglePlay()   -> alterna play/pause sul brano corrente
    - setVolume(v)   -> v tra 0 e 1
    - seek(percent)  -> sposta currentTime a percent% della durata

  Eventi audio da agganciare:
    - "timeupdate" per aggiornare la progress bar
    - "ended" per fermarsi a fine brano
*/
class Player {
  //Da fare
  constructor() {
    this.audio = document.querySelector("#audio-element");
    this.currentTrack = null;
    this.isPlaying = false;

    // riferimenti agli elementi del footer (popolati in mount(), dopo l'innerHTML)
    this.elCoverImg = null;
    this.elTitle = null;
    this.elArtist = null;
    this.elBtnToggle = null;
    this.elProgressFill = null;
    this.elTimeCurrent = null;
    this.elTimeTotal = null;
    this.elVolumeFill = null;

    this.audio.addEventListener("timeupdate", () => {
      if (!this.audio.duration) return;
      const percent = (this.audio.currentTime / this.audio.duration) * 100;
      if (this.elProgressFill) this.elProgressFill.style.width = `${percent}%`;
      if (this.elTimeCurrent)
        this.elTimeCurrent.textContent = formatTime(
          this.audio.currentTime * 1000,
        );
    });

    this.audio.addEventListener("ended", () => {
      this.isPlaying = false;
      if (this.elBtnToggle) this.elBtnToggle.textContent = "▶";
    });

    this.previousVolume = 0.8;
  }

  mount() {
    const footer = document.querySelector(".player");
    if (!footer) return;
    footer.innerHTML = `
      <div class="player-track">
        <div class="player-cover"><img id="player-cover-img" alt="" /></div>
        <div class="player-meta">
          <p class="player-title" id="player-title">Seleziona un brano</p>
          <p class="player-artist" id="player-artist">—</p>
        </div>
      </div>

      <div class="player-center">
        <div class="player-controls">
          <button class="btn-ctrl" id="btn-shuffle" aria-label="Shuffle">⇄</button>
          <button class="btn-ctrl" id="btn-prev"    aria-label="Precedente">⏮</button>
          <button class="btn-play" id="btn-toggle"  aria-label="Play/Pausa">▶</button>
          <button class="btn-ctrl" id="btn-next"    aria-label="Successivo">⏭</button>
          <button class="btn-ctrl" id="btn-repeat"  aria-label="Ripeti">↻</button>
        </div>
        <div class="player-progress">
          <span id="time-current">0:00</span>
          <div class="progress-bar" id="progress-bar">
            <div class="progress-fill" id="progress-fill"></div>
          </div>
          <span id="time-total">0:00</span>
        </div>
      </div>

      <div class="player-right">
      <span>🔊</span>
      <input type="range" 
        id="volume-slider" class="volume-slider" min="0" max="1" step="0.01" value="0.8" aria-label="Volume"/>
      </div>
    `;
    this.elCoverImg = document.querySelector("#player-cover-img");
    this.elTitle = document.querySelector("#player-title");
    this.elArtist = document.querySelector("#player-artist");
    this.elBtnToggle = document.querySelector("#btn-toggle");
    this.elProgressFill = document.querySelector("#progress-fill");
    this.elTimeCurrent = document.querySelector("#time-current");
    this.elTimeTotal = document.querySelector("#time-total");
    this.elVolumeSlider = document.querySelector("#volume-slider");

    // Click play/pausa
    this.elBtnToggle.addEventListener("click", () => this.togglePlay());
    // Click sulla progress bar → seek

    const btnPrev = document.querySelector("#btn-prev");
    const btnNext = document.querySelector("#btn-next");
    if (btnPrev) btnPrev.addEventListener("click", () => this.playPrev());
    if (btnNext) btnNext.addEventListener("click", () => this.playNext());

    const progressBar = document.querySelector("#progress-bar");
    progressBar.addEventListener("click", (e) => {
      const percent = e.offsetX / progressBar.clientWidth; // 0..1 dove clicchi
      this.seek(percent);
    });

    // Slider volume → setVolume
    if (this.elVolumeSlider) {
      this.elVolumeSlider.addEventListener("input", (e) => {
        this.setVolume(parseFloat(e.target.value));
      });
    }

    const volumeIcon = document.querySelector(".player-right span");
    if (volumeIcon) {
      volumeIcon.style.cursor = "pointer";
      volumeIcon.addEventListener("click", () => {
        if (this.audio.volume > 0) {
          // Se l'audio è attivo, muto e va a 0
          this.setVolume(0);
        } else {
          // Se è già muto, ripristiniamo l'ultimo volume utile memorizzato
          this.setVolume(this.previousVolume);
        }
      });
    }
    // --

    this.setVolume(0.3);
  }

  async play(track) {
    if (!track || !track.previewUrl) return; // niente brano o niente preview -> esci

    // 1) salva brano corrente
    this.currentTrack = track;

    // 2) sorgente audio = preview del brano
    this.audio.src = track.previewUrl;

    // 3) avvia (play() ritorna una Promise: gestisci con try/catch)
    try {
      await this.audio.play();
      this.isPlaying = true;
    } catch (errore) {
      console.error("Impossibile riprodurre il brano:", errore);
      this.isPlaying = false;
      this.queue = [];
      this.currentIndex = -1;
    }

    // 4) aggiorna UI footer
    if (this.elCoverImg) this.elCoverImg.src = track.cover;
    if (this.elTitle) this.elTitle.textContent = track.title;
    if (this.elArtist) this.elArtist.textContent = track.artist;
    if (this.elTimeTotal)
      this.elTimeTotal.textContent = formatTime(track.durationMs);
    if (this.elBtnToggle)
      this.elBtnToggle.textContent = this.isPlaying ? "⏸" : "▶";

    // 5) salva in cronologia
    addToHistory(track);

    // 6) marca la riga in riproduzione (se siamo in una tracklist)
    document
      .querySelectorAll(".track-row.is-playing")
      .forEach((row) => row.classList.remove("is-playing"));
    const row = document.querySelector(
      `.track-row[data-track-id="${track.id}"]`,
    );
    if (row) row.classList.add("is-playing");

    document
      .querySelectorAll(".card.is-playing")
      .forEach((c) => c.classList.remove("is-playing"));
    document.querySelectorAll(`.card[data-track-id="${track.id}"]`)
      .forEach(c => c.classList.add("is-playing"));
  }

  togglePlay() {
    if (!this.currentTrack) return;

    if (this.audio.paused) {
      this.audio
        .play()
        .catch((err) => console.warn("Riproduzione bloccata:", err));
      this.isPlaying = true;
    } else {
      this.audio.pause();
      this.isPlaying = false;
    }
    if (this.elBtnToggle)
      this.elBtnToggle.textContent = this.isPlaying ? "⏸" : "▶";
    // TODO: alterna play/pause + aggiorna icona del button
  }

  setVolume(v) {
    const vol = Math.min(1, Math.max(0, v));
    this.audio.volume = vol;

    const volumeSlider = document.querySelector("#volume-slider");
    if (volumeSlider) {
      volumeSlider.value = vol;
      const percent = vol * 100;
      volumeSlider.style.setProperty("--percent", `${percent}%`);
    }

    const volumeIcon = document.querySelector(".player-right span");
    if (volumeIcon) {
      if (vol === 0) {
        volumeIcon.textContent = "🔇"; // Muto (X)
      } else if (vol < 0.3) {
        volumeIcon.textContent = "🔈"; // Volume basso (una sola onda)
      } else if (vol < 0.7) {
        volumeIcon.textContent = "🔉"; // Volume medio (due onde)
      } else {
        volumeIcon.textContent = "🔊"; // Volume alto (tre onde)
      }
    }

    if (vol > 0) {
      this.previousVolume = vol;
    }

  }

  seek(percent) {
    if (!this.audio.duration) return;
    this.audio.currentTime =
      this.audio.duration * Math.min(1, Math.max(0, percent));
  }
  setQueue(tracks, startIndex) {
    this.queue = tracks;
    this.currentIndex = startIndex;
    this.play(tracks[startIndex]);
  }

  playNext() {
    if (!this.queue.length) return;
    this.currentIndex = (this.currentIndex + 1) % this.queue.length;
    this.play(this.queue[this.currentIndex]);
  }

  playPrev() {
    if (!this.queue.length) return;
    if (this.audio.currentTime > 3) {
      this.seek(0);
      return;
    }
    this.currentIndex =
      (this.currentIndex - 1 + this.queue.length) % this.queue.length;
    this.play(this.queue[this.currentIndex]);
  }
}

/* ============================ 5. localStorage helpers ============================ */

/*
  getHistory() -> array di Track (al più MAX_HISTORY)
  addToHistory(track) -> aggiunge in testa, rimuove duplicati, taglia a MAX_HISTORY
  getFavourites() -> array di Track
  isFavourite(trackId) -> bool
  toggleFavourite(track) -> aggiunge o rimuove
*/
const getHistory = () => {
  const cronologia = localStorage.getItem(STORAGE_KEY_HISTORY);
  return JSON.parse(cronologia) || [];
};

const addToHistory = (track) => {
  const history = getHistory();

  const noCopy = history.filter((t) => t.id !== track.id);

  const newArray = [track, ...noCopy];

  const tagliato = newArray.slice(0, MAX_HISTORY);
  localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(tagliato));

  // avvisa la pagina che la libreria è cambiata (la home si ridisegna)
  document.dispatchEvent(new CustomEvent("library:changed"));

  // TODO: array = getHistory(); rimuovi eventuale duplicato (per id);
  //       metti track in testa; tronca a MAX_HISTORY; salva
};

const getFavourites = () => {
  const preferiti = localStorage.getItem(STORAGE_KEY_FAVOURITES);
  return JSON.parse(preferiti) || [];
  // TODO: come getHistory ma con STORAGE_KEY_FAVOURITES
};

const isFavourite = (trackId) => {
  // TODO: return getFavourites().some(t => t.id === trackId)
  return getFavourites().some((t) => t.id === trackId);
};

const toggleFavourite = (track) => {
  const array = getFavourites();
  let nuovoArray;
  if (isFavourite(track.id)) {
    nuovoArray = array.filter((t) => t.id !== track.id);
  } else nuovoArray = [track, ...array];

  localStorage.setItem(STORAGE_KEY_FAVOURITES, JSON.stringify(nuovoArray));

  // aggiorna subito la sidebar, senza ricaricare la pagina
  renderSidebarFavs();
  // avvisa la pagina che la libreria è cambiata (la home si ridisegna)
  document.dispatchEvent(new CustomEvent("library:changed"));
};

/* ============================ 6. Render sidebar ============================ */

/*
  renderSidebar(activePage)
  - activePage: "home" | "search" | "library" (per evidenziare il link attivo)
*/
/*
  renderSidebarFavs()
  - Ridisegna SOLO la lista #sidebar-favs (senza ricaricare tutta la sidebar)
  - Si chiama ogni volta che si aggiunge/rimuove un preferito
*/
const renderSidebarFavs = () => {
  const favsList = document.querySelector("#sidebar-favs");
  if (!favsList) return;
  favsList.replaceChildren(); // svuota la lista senza innerHTML

  const favs = getFavourites();
  if (favs.length === 0) {
    const li = document.createElement("li");
    li.textContent = "Nessun preferito";
    li.style.fontStyle = "italic";
    favsList.appendChild(li);
    return;
  }

  favs.forEach((track, index) => {
    const li = document.createElement("li");
    li.style.cursor = "pointer";
    li.style.display = "flex";         // Allinea immagine e testo sulla stessa riga
    li.style.alignItems = "center";     // Centra verticalmente l'immagine rispetto al testo
    li.style.gap = "8px";               // Spazio tra l'immagine e il testo
    li.style.marginBottom = "8px";      // Spazio tra un brano e l'altro
    li.title = `${track.title || "Brano"} — ${track.artist || "Artista"}`;

    const img = document.createElement("img");
    img.src = track.cover || "https://placehold.co/30x30?text=🎵"; // placeholder se non c'è immagine dispo
    img.alt = track.album || "Album";
    img.style.width = "30px";          
    img.style.height = "30px";
    img.style.borderRadius = "4px";     
    img.style.objectFit = "cover";

   /* evita che il testo vada a capo, taglia il testo se troppo lungo e aggiunge i puntini di sospensione */

    const textSpan = document.createElement("span");
    textSpan.textContent = track.title || "—";
    textSpan.style.whiteSpace = "nowrap";   
    textSpan.style.overflow = "hidden";      
    textSpan.style.textOverflow = "ellipsis";

    li.appendChild(img);
    li.appendChild(textSpan);

    li.addEventListener("click", () => {
      if (window.player) window.player.setQueue(favs, index);
    });
    favsList.appendChild(li);
  });
};

const renderSidebar = (activePage) => {
  const sidebar = document.querySelector(".sidebar");
  if (!sidebar) return;
  sidebar.innerHTML = `
    <div class="brand">
      <img src="assets/Nuovo_Logo.png" alt="EpiTunes Logo" class="brand-logo" />
      <span class="brand-text">usiCode</span>
    </div>
    <nav class="sidebar-nav">
      <a href="index.html"  data-page="home"   ${activePage === "home" ? 'class="active"' : ""}><span class="ico">🏠</span><span>Home</span></a>
      <a href="search.html" data-page="search" ${activePage === "search" ? 'class="active"' : ""}><span class="ico">🔍</span><span>Cerca</span></a>
    </nav>
    <p class="sidebar-section-title">I tuoi preferiti</p>
    <ul class="sidebar-list" id="sidebar-favs"></ul>
  `;
  renderSidebarFavs();
};

/* ============================ 6b. Carousel righe ============================ */

/*
  decorateRow(row)
  - aggiunge due freccette (◀ ▶) sul lato destro della riga
  - le freccette scorrono la .grid (riga unica) a sinistra/destra
  - si auto-disabilitano a inizio/fine scroll e si nascondono se non c'è da scorrere
*/
const ROW_SCROLL_STEP = 600;

const decorateRow = (row) => {
  if (row.dataset.carousel === "1") return;
  const grid = row.querySelector(".grid");
  if (!grid) return;
  row.dataset.carousel = "1";

  const arrows = document.createElement("div");
  arrows.classList.add("row-arrows");

  const btnPrev = document.createElement("button");
  btnPrev.type = "button";
  btnPrev.classList.add("row-arrow");
  btnPrev.setAttribute("aria-label", "Scorri indietro");
  btnPrev.textContent = "‹";

  const btnNext = document.createElement("button");
  btnNext.type = "button";
  btnNext.classList.add("row-arrow");
  btnNext.setAttribute("aria-label", "Scorri avanti");
  btnNext.textContent = "›";

  const updateArrows = () => {
    const maxScroll = grid.scrollWidth - grid.clientWidth;
    btnPrev.disabled = grid.scrollLeft <= 0;
    btnNext.disabled = grid.scrollLeft >= maxScroll - 1;
    arrows.style.display = maxScroll <= 1 ? "none" : "flex";
  };

  btnPrev.addEventListener("click", () =>
    grid.scrollBy({ left: -ROW_SCROLL_STEP, behavior: "smooth" }),
  );
  btnNext.addEventListener("click", () =>
    grid.scrollBy({ left: ROW_SCROLL_STEP, behavior: "smooth" }),
  );

  grid.addEventListener("scroll", updateArrows);
  window.addEventListener("resize", updateArrows);

  arrows.appendChild(btnPrev);
  arrows.appendChild(btnNext);
  row.appendChild(arrows);

  updateArrows();
  // le card possono arrivare dopo (fetch async / ricerca): ricontrolla
  new MutationObserver(updateArrows).observe(grid, { childList: true });
};

/*
  setupCarousels()
  - decora le righe già presenti e quelle aggiunte dopo (es. Home async)
*/
const setupCarousels = () => {
  document.querySelectorAll(".row").forEach(decorateRow);
  new MutationObserver(() => {
    document.querySelectorAll(".row").forEach(decorateRow);
  }).observe(document.body, { childList: true, subtree: true });
};

/* ============================ 7. Inizializzazione ============================ */

/*
  initPage(activePage)
  - Chiamata da home.js / search.js / album.js / artist.js
  - Monta sidebar, monta player, restituisce il player per essere usato.
*/
const initPage = (activePage) => {
  renderSidebar(activePage);
  const player = new Player();
  player.mount();
  window.player = player;

  const [btnBack, btnForward] = document.querySelectorAll(".nav-btn");
  if (btnBack) btnBack.addEventListener("click", () => history.back());
  if (btnForward) btnForward.addEventListener("click", () => history.forward());

  setupCarousels();

  return player;
};
