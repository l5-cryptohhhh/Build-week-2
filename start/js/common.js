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
// const per login
const STORAGE_KEY_USER = "musicode_account";
// creo un array per tenere più account
const STORAGE_KEY_ACCOUNTS = "musicode_accounts";
// costante di sessione attiva per mantenere il login e fare il logout
const STORAGE_KEY_SESSION = "musicode_active_session";

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
    this.genre = raw.primaryGenreName;

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
    this.elProgressSlider = null;
    this.elTimeCurrent = null;
    this.elTimeTotal = null;
    this.elVolumeFill = null;

    this.audio.addEventListener("timeupdate", () => {
      if (!this.audio.duration || this._isSeeking) return;
      const percent = (this.audio.currentTime / this.audio.duration) * 100;
      if (this.elProgressSlider) {
        this.elProgressSlider.value = percent;
        this.elProgressSlider.style.setProperty("--percent", `${percent}%`);
      }
      if (this.elTimeCurrent)
        this.elTimeCurrent.textContent = formatTime(
          this.audio.currentTime * 1000,
        );
    });

    this.audio.addEventListener("ended", () => {
      if (this.isRepeating) {
        this.audio.currentTime = 0;
        this.audio.play();
      } else {
        this.playNext();
      }
    });

    this.previousVolume = 0.8;
    this.isShuffling = false;
    this.isRepeating = false;
    this.queue = [];
    this.currentIndex = -1;
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
          <button class="btn-ctrl" id="btn-shuffle" aria-label="Shuffle"><i class="bi bi-shuffle"></i></button>
          <button class="btn-ctrl" id="btn-prev"    aria-label="Precedente">⏮</button>
          <button class="btn-play" id="btn-toggle"  aria-label="Play/Pausa">▶</button>
          <button class="btn-ctrl" id="btn-next"    aria-label="Successivo">⏭</button>
          <button class="btn-ctrl" id="btn-repeat"  aria-label="Ripeti"><i class="bi bi-repeat"></i></button>
        </div>
        <div class="player-progress">
          <span id="time-current">0:00</span>
          <input type="range" id="progress-slider" class="progress-slider" min="0" max="100" step="0.1" value="0" aria-label="Avanzamento brano"/>
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
    this.elProgressSlider = document.querySelector("#progress-slider");
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

    const btnShuffle = document.querySelector("#btn-shuffle");
    const btnRepeat = document.querySelector("#btn-repeat");

    if (btnShuffle)
      btnShuffle.addEventListener("click", () => {
        this.isShuffling = !this.isShuffling;
        btnShuffle.classList.toggle("btn-active", this.isShuffling);
      });

    if (btnRepeat)
      btnRepeat.addEventListener("click", () => {
        this.isRepeating = !this.isRepeating;
        btnRepeat.classList.toggle("btn-active", this.isRepeating);
      });

    if (this.elProgressSlider) {
      const progressTooltip = document.createElement("div");
      progressTooltip.classList.add("progress-tooltip");
      this.elProgressSlider.parentElement.appendChild(progressTooltip);

      this.elProgressSlider.addEventListener("mousemove", (e) => {
        if (!this.audio.duration) return;
        const sliderRect = this.elProgressSlider.getBoundingClientRect();
        const containerRect =
          this.elProgressSlider.parentElement.getBoundingClientRect();
        const percent = Math.min(
          1,
          Math.max(0, (e.clientX - sliderRect.left) / sliderRect.width),
        );
        progressTooltip.textContent = formatTime(
          percent * this.audio.duration * 1000,
        );
        progressTooltip.style.display = "block";
        progressTooltip.style.left = `${e.clientX - containerRect.left}px`;
      });

      this.elProgressSlider.addEventListener("mouseleave", () => {
        progressTooltip.style.display = "none";
      });

      this.elProgressSlider.addEventListener("pointerdown", () => {
        this._isSeeking = true;
        this._wasPlaying = !this.audio.paused;
        this.audio.pause();
      });
      this.elProgressSlider.addEventListener("input", (e) => {
        this.elProgressSlider.style.setProperty(
          "--percent",
          `${e.target.value}%`,
        );
      });
      this.elProgressSlider.addEventListener("change", (e) => {
        this._isSeeking = false;
        this.seek(parseFloat(e.target.value) / 100);
        if (this._wasPlaying) {
          this.audio.play().catch(() => {});
          this.isPlaying = true;
          if (this.elBtnToggle) this.elBtnToggle.textContent = "⏸";
        }
      });
    }

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

    // Swipe sul player footer: sinistra = avanti, destra = indietro
    let playerSwipeStartX = 0;
    footer.addEventListener("touchstart", (e) => {
      playerSwipeStartX = e.touches[0].clientX;
    }, { passive: true });
    footer.addEventListener("touchend", (e) => {
      const deltaX = e.changedTouches[0].clientX - playerSwipeStartX;
      if (Math.abs(deltaX) < 60) return;
      if (deltaX < 0) this.playNext();
      else this.playPrev();
    }, { passive: true });

    // Swipe su mobile: sinistra = traccia avanti, destra = traccia indietro
    const mainEl = document.querySelector(".main");
    if (mainEl) {
      let swipeStartX = 0;
      let swipeStartY = 0;
      mainEl.addEventListener("touchstart", (e) => {
        swipeStartX = e.touches[0].clientX;
        swipeStartY = e.touches[0].clientY;
      }, { passive: true });
      mainEl.addEventListener("touchend", (e) => {
        const deltaX = e.changedTouches[0].clientX - swipeStartX;
        const deltaY = e.changedTouches[0].clientY - swipeStartY;
        // ignora se il gesto è più verticale che orizzontale
        if (Math.abs(deltaY) > Math.abs(deltaX)) return;
        // ignora swipe troppo corti
        if (Math.abs(deltaX) < 60) return;
        // ignora se il touch è su un carousel orizzontale
        if (e.target.closest(".grid")) return;
        if (deltaX < 0) this.playNext();
        else this.playPrev();
      }, { passive: true });
    }
  }

  async play(track, auto = false) {
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
    document
      .querySelectorAll(`.card[data-track-id="${track.id}"]`)
      .forEach((c) => c.classList.add("is-playing"));

    // pannello laterale col brano IN RIPRODUZIONE (non quello cliccato):
    // click utente -> apri; auto-advance -> aggiorna solo se già aperto
    if (window.nowPlaying) {
      if (auto) window.nowPlaying.render(this.currentTrack);
      else if (window.innerWidth > 576) window.nowPlaying.show(this.currentTrack);
    }
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
    if (!this.queue || !this.queue.length) return;
    if (this.isShuffling) {
      this.currentIndex = Math.floor(Math.random() * this.queue.length);
    } else {
      this.currentIndex = (this.currentIndex + 1) % this.queue.length;
    }
    this.play(this.queue[this.currentIndex], true);
  }

  playPrev() {
    if (!this.queue.length) return;
    if (this.audio.currentTime > 3) {
      this.seek(0);
      return;
    }
    this.currentIndex =
      (this.currentIndex - 1 + this.queue.length) % this.queue.length;
    this.play(this.queue[this.currentIndex], true);
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
// funzione per capire se l'utente è loggato
const getCurrentUser = () => {
  const username = localStorage.getItem(STORAGE_KEY_SESSION);
  if (username === null) {
    return null;
  } else {
    return getAccounts().find((account) => account.username === username);
  }
};
// funziona fi lettura dell'array di accounts
const getAccounts = () => {
  const thisAccount = localStorage.getItem(STORAGE_KEY_ACCOUNTS);
  return JSON.parse(thisAccount) || [];
};
// funzione di registrazione
const registerUser = (datiUtente) => {
  let objectUser = {
    nome: datiUtente.name,
    cognome: datiUtente.surname,
    username: datiUtente.username,
    email: datiUtente.email,
    password: datiUtente.password,
  };
  // aggiunta di lettura dell'array di account, con salvataggio di nuovo account in oggetto e nell'array
  const array = getAccounts();
  const nuovoArray = [...array, objectUser];
  const nuovaLista = localStorage.setItem(
    STORAGE_KEY_ACCOUNTS,
    JSON.stringify(nuovoArray),
  );
  return localStorage.setItem(STORAGE_KEY_SESSION, objectUser.username);
};
// login dell'utente
const loginUser = (username, password) => {
  const accounts = getAccounts();
  const account = accounts.find((account) => {
    return account.username === username && account.password === password;
  });
  if (account === undefined) {
    return null;
  }
  localStorage.setItem(STORAGE_KEY_SESSION, account.username);
  return account;
};
//funzione di logout
const logoutUser = () => {
  return localStorage.removeItem(STORAGE_KEY_SESSION);
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
    li.style.display = "flex"; // Allinea immagine e testo sulla stessa riga
    li.style.alignItems = "center"; // Centra verticalmente l'immagine rispetto al testo
    li.style.gap = "8px"; // Spazio tra l'immagine e il testo
    li.style.marginBottom = "8px"; // Spazio tra un brano e l'altro
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
    <a href="index.html" class="brand">
      <img src="assets/Nuovo_Logo.png" alt="EpiTunes Logo" class="brand-logo" />
      <span class="brand-text">usiCode</span>
    </a>
    <nav class="sidebar-nav">
      <a href="index.html"  data-page="home"   ${activePage === "home" ? 'class="active"' : ""}><span class="ico"><i class="bi bi-house-door-fill"></i></span><span>Home</span></a>
      <a href="search.html" data-page="search" ${activePage === "search" ? 'class="active"' : ""}><span class="ico"><i class="bi bi-search"></i></span><span>Cerca</span></a>
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

/* ============================ 6c. Pannello "In riproduzione" ============================ */

/*
  createNowPlayingPanel()
  - Crea un pannello laterale a destra che mostra info sul brano IN RIPRODUZIONE
    (non quello cliccato) e sull'artista (fetch lookup iTunes).
  - Niente innerHTML / textContent: si usano createElement + append(stringa)
    (append con stringa crea automaticamente un nodo di testo) e replaceChildren.
  - API: { show(track), open(), close(), toggle() }
*/

// imposta il testo di un elemento senza usare textContent/innerHTML
const setText = (el, str) => {
  el.replaceChildren();
  el.append(str == null ? "" : String(str));
};

/*
  getArtistInfo(name) -> { photo, bio, genre, formedYear }
  - Cerca l'artista su TheAudioDB (foto + bio reali, non presenti su iTunes)
  - Cache condivisa: usata sia dal pannello "In riproduzione" sia dalle card artista
  - In caso di artista non trovato ritorna campi vuoti
*/
const audioDbCache = new Map();
const getArtistInfo = async (name) => {
  if (!name) return { photo: "", bio: "", genre: "", formedYear: "" };
  if (audioDbCache.has(name)) return audioDbCache.get(name);

  const photoOf = (a) => a.strArtistThumb || a.strArtistFanart || "";

  const searchArtists = async (q) => {
    const data = await fetchJSON(
      `https://www.theaudiodb.com/api/v1/json/2/search.php?s=${encodeURIComponent(
        q,
      )}`,
    );
    return (data && data.artists) || [];
  };

  // nome ripulito da featuring/collaborazioni: "Snoop Dogg feat. Dr. Dre" -> "Snoop Dogg"
  const cleanName = name
    .split(/\s*(?:feat\.?|ft\.?|featuring|&|,|\/|\bx\b|with)\s+/i)[0]
    .trim();

  let artists = await searchArtists(name);
  if (!artists.length && cleanName && cleanName !== name) {
    artists = await searchArtists(cleanName);
  }
  // tra più risultati scegli il primo CHE HA una foto (evita duplicati vuoti);
  // se nessuno ha foto, ripiega sul primo
  const raw = artists.find((a) => photoOf(a)) || artists[0] || null;
  const info = raw
    ? {
        photo: photoOf(raw),
        bio: raw.strBiographyEN || "",
        genre: raw.strGenre || "",
        formedYear: raw.intFormedYear || "",
      }
    : { photo: "", bio: "", genre: "", formedYear: "" };
  audioDbCache.set(name, info);
  return info;
};

const createNowPlayingPanel = () => {
  // evita doppioni se initPage viene chiamato più volte
  const existing = document.querySelector("#now-playing");
  if (existing) existing.remove();

  const panel = document.createElement("aside");
  panel.classList.add("now-playing");
  panel.id = "now-playing";

  // --- Header: nome artista + chiudi ---
  const header = document.createElement("div");
  header.classList.add("np-header");

  const headerTitle = document.createElement("span");
  headerTitle.classList.add("np-header-title");
  setText(headerTitle, "In riproduzione");

  const btnClose = document.createElement("button");
  btnClose.classList.add("np-close");
  btnClose.setAttribute("aria-label", "Chiudi");
  setText(btnClose, "✕");

  header.appendChild(headerTitle);
  header.appendChild(btnClose);

  // --- Cover grande ---
  const coverWrap = document.createElement("div");
  coverWrap.classList.add("np-cover");
  const coverImg = document.createElement("img");
  coverImg.alt = "";
  coverWrap.appendChild(coverImg);

  // --- Controlli player mobile (visibili solo su ≤576px via CSS) ---
  const npControls = document.createElement("div");
  npControls.classList.add("np-player-controls");

  const npProgress = document.createElement("div");
  npProgress.classList.add("player-progress");

  const npTimeCurrent = document.createElement("span");
  setText(npTimeCurrent, "0:00");
  const npSlider = document.createElement("input");
  npSlider.type = "range";
  npSlider.className = "progress-slider";
  npSlider.min = "0";
  npSlider.max = "100";
  npSlider.step = "0.1";
  npSlider.value = "0";
  npSlider.setAttribute("aria-label", "Avanzamento brano");
  const npTimeTotal = document.createElement("span");
  setText(npTimeTotal, "0:00");

  npProgress.appendChild(npTimeCurrent);
  npProgress.appendChild(npSlider);
  npProgress.appendChild(npTimeTotal);

  const npCtrlRow = document.createElement("div");
  npCtrlRow.classList.add("player-controls");

  const npBtnShuffle = document.createElement("button");
  npBtnShuffle.className = "btn-ctrl";
  npBtnShuffle.setAttribute("aria-label", "Shuffle");
  npBtnShuffle.innerHTML = '<i class="bi bi-shuffle"></i>';

  const npBtnPrev = document.createElement("button");
  npBtnPrev.className = "btn-ctrl";
  npBtnPrev.setAttribute("aria-label", "Precedente");
  npBtnPrev.textContent = "⏮";

  const npBtnToggle = document.createElement("button");
  npBtnToggle.className = "btn-play";
  npBtnToggle.setAttribute("aria-label", "Play/Pausa");
  npBtnToggle.textContent = "▶";

  const npBtnNext = document.createElement("button");
  npBtnNext.className = "btn-ctrl";
  npBtnNext.setAttribute("aria-label", "Successivo");
  npBtnNext.textContent = "⏭";

  const npBtnRepeat = document.createElement("button");
  npBtnRepeat.className = "btn-ctrl";
  npBtnRepeat.setAttribute("aria-label", "Ripeti");
  npBtnRepeat.innerHTML = '<i class="bi bi-repeat"></i>';

  npCtrlRow.append(npBtnShuffle, npBtnPrev, npBtnToggle, npBtnNext, npBtnRepeat);
  npControls.appendChild(npCtrlRow);
  npControls.appendChild(npProgress);

  // Wiring: usa window.player (già impostato da initPage prima di questa chiamata)
  const p = window.player;
  const npAudio = p.audio;

  const syncNpPlay = () => {
    npBtnToggle.textContent = npAudio.paused ? "▶" : "⏸";
  };

  npAudio.addEventListener("timeupdate", () => {
    if (!npAudio.duration || p._isSeeking) return;
    const pct = (npAudio.currentTime / npAudio.duration) * 100;
    npSlider.value = pct;
    npSlider.style.setProperty("--percent", `${pct}%`);
    setText(npTimeCurrent, formatTime(npAudio.currentTime * 1000));
  });
  npAudio.addEventListener("play", syncNpPlay);
  npAudio.addEventListener("pause", syncNpPlay);
  npAudio.addEventListener("ended", syncNpPlay);

  npBtnToggle.addEventListener("click", () => p.togglePlay());
  npBtnPrev.addEventListener("click", () => p.playPrev());
  npBtnNext.addEventListener("click", () => p.playNext());

  npBtnShuffle.addEventListener("click", () => {
    p.isShuffling = !p.isShuffling;
    npBtnShuffle.classList.toggle("btn-active", p.isShuffling);
    const f = document.querySelector("#btn-shuffle");
    if (f) f.classList.toggle("btn-active", p.isShuffling);
  });

  npBtnRepeat.addEventListener("click", () => {
    p.isRepeating = !p.isRepeating;
    npBtnRepeat.classList.toggle("btn-active", p.isRepeating);
    const f = document.querySelector("#btn-repeat");
    if (f) f.classList.toggle("btn-active", p.isRepeating);
  });

  npSlider.addEventListener("pointerdown", () => {
    p._isSeeking = true;
    p._wasPlaying = !npAudio.paused;
    npAudio.pause();
  });
  npSlider.addEventListener("input", (e) => {
    npSlider.style.setProperty("--percent", `${e.target.value}%`);
  });
  npSlider.addEventListener("change", (e) => {
    p._isSeeking = false;
    p.seek(parseFloat(e.target.value) / 100);
    if (p._wasPlaying) {
      npAudio.play().catch(() => {});
      p.isPlaying = true;
      npBtnToggle.textContent = "⏸";
    }
  });

  // --- Titolo + artista ---
  const title = document.createElement("h2");
  title.classList.add("np-title");

  const artist = document.createElement("p");
  artist.classList.add("np-artist");

  // --- Info brano (album, durata) ---
  const trackInfo = document.createElement("div");
  trackInfo.classList.add("np-info");

  const makeInfoRow = (label) => {
    const row = document.createElement("div");
    row.classList.add("np-info-row");
    const k = document.createElement("span");
    k.classList.add("np-info-key");
    setText(k, label);
    const v = document.createElement("span");
    v.classList.add("np-info-val");
    row.appendChild(k);
    row.appendChild(v);
    trackInfo.appendChild(row);
    return v;
  };

  const valAlbum = makeInfoRow("Album");
  const valYear = makeInfoRow("Anno");
  const valGenre = makeInfoRow("Genere");
  const valDuration = makeInfoRow("Durata");

  // --- Sezione artista ---
  const about = document.createElement("section");
  about.classList.add("np-about");

  const aboutTitle = document.createElement("h3");
  setText(aboutTitle, "Sull'artista");

  const aboutImg = document.createElement("img");
  aboutImg.classList.add("np-about-img");
  aboutImg.alt = "";
  aboutImg.hidden = true;

  const aboutName = document.createElement("p");
  aboutName.classList.add("np-about-name");

  const aboutGenre = document.createElement("p");
  aboutGenre.classList.add("np-about-genre");

  const aboutBio = document.createElement("p");
  aboutBio.classList.add("np-about-bio");

  about.appendChild(aboutTitle);
  about.appendChild(aboutImg);
  about.appendChild(aboutName);
  about.appendChild(aboutGenre);
  about.appendChild(aboutBio);

  panel.appendChild(header);
  panel.appendChild(coverWrap);
  panel.appendChild(npControls);
  panel.appendChild(title);
  panel.appendChild(artist);
  panel.appendChild(trackInfo);
  panel.appendChild(about);
  document.body.appendChild(panel);

  // cache per non rifetchare gli stessi dati
  const itunesCache = new Map(); // chiave: trackId  -> { year, genre }

  // brano corrente ancora valido? (evita di scrivere dati di un brano vecchio)
  const stillCurrent = (track) =>
    window.player && window.player.currentTrack === track;

  // --- iTunes: anno + genere del brano (lookup per trackId) ---
  const enrichItunes = async (track) => {
    setText(valYear, "—");
    setText(valGenre, "—");
    if (!track.id) return;

    if (itunesCache.has(track.id)) {
      const c = itunesCache.get(track.id);
      setText(valYear, c.year || "—");
      setText(valGenre, c.genre || "—");
      return;
    }

    const data = await fetchJSON(`${API_BASE}/lookup?id=${track.id}`);
    const raw = (data.results || []).find((r) => r.trackId);
    const info = {
      year: raw && raw.releaseDate ? raw.releaseDate.slice(0, 4) : "",
      genre: raw ? raw.primaryGenreName : "",
    };
    itunesCache.set(track.id, info);

    if (stillCurrent(track)) {
      setText(valYear, info.year || "—");
      setText(valGenre, info.genre || "—");
    }
  };

  // --- TheAudioDB: foto + bio artista (search per nome) ---
  const enrichArtist = async (track) => {
    aboutImg.hidden = true;
    setText(aboutName, track.artist || "—");
    setText(aboutGenre, "");
    setText(aboutBio, "Caricamento info artista…");
    setText(headerTitle, track.artist || "In riproduzione");

    const name = track.artist;
    if (!name) {
      setText(aboutBio, "");
      return;
    }

    const applyInfo = (info) => {
      if (!stillCurrent(track)) return;
      setText(aboutName, name);
      aboutImg.hidden = false;
      if (info.photo) {
        aboutImg.src = info.photo;
        aboutImg.classList.remove("is-default");
      } else {
        aboutImg.src = "assets/artist-default.jpeg";
        aboutImg.classList.add("is-default");
      }
      const meta = [info.genre, info.formedYear].filter(Boolean).join(" · ");
      setText(aboutGenre, meta);
      setText(aboutBio, info.bio || "Nessuna biografia disponibile.");
    };

    const info = await getArtistInfo(name);
    applyInfo(info);
  };

  const render = (track) => {
    if (!track) return;
    coverImg.src = bigArt(track.cover) || track.cover || "";
    coverImg.alt = track.title || "";
    setText(title, track.title || "—");
    setText(artist, track.artist || "—");
    setText(valAlbum, track.album || "—");
    setText(valDuration, formatTime(track.durationMs));
    setText(headerTitle, track.artist || "In riproduzione");
    enrichItunes(track);
    enrichArtist(track);
    // sync controlli mobile
    setText(npTimeTotal, formatTime(track.durationMs));
    setText(npTimeCurrent, "0:00");
    npSlider.value = 0;
    npSlider.style.setProperty("--percent", "0%");
    syncNpPlay();
    npBtnShuffle.classList.toggle("btn-active", p.isShuffling);
    npBtnRepeat.classList.toggle("btn-active", p.isRepeating);
  };

  const open = () => panel.classList.add("is-open");
  const close = () => panel.classList.remove("is-open");
  const toggle = () => panel.classList.toggle("is-open");

  const show = (track) => {
    render(track);
    open();
  };

  btnClose.addEventListener("click", close);

  return { show, open, close, toggle, render };
};
/* ============================ 6c. Pannello "In riproduzione" ============================ */

/*
  createNowPlayingPanel()
  - Crea un pannello laterale a destra che mostra info sul brano IN RIPRODUZIONE
    (non quello cliccato) e sull'artista (fetch lookup iTunes).
  - Niente innerHTML / textContent: si usano createElement + append(stringa)
    (append con stringa crea automaticamente un nodo di testo) e replaceChildren.
  - API: { show(track), open(), close(), toggle() }
*/

// imposta il testo di un elemento senza usare textContent/innerHTML

const pillDropdown = () => {
  const userLogged = document.querySelector(".logged-user");
  const pillUtente = userLogged.querySelector(".user-pill");
  const dropdown = document.querySelector(".user-dropdown");
  const [profilo, esci] = dropdown.querySelectorAll("li");

  pillUtente.addEventListener("click", (e) => {
    dropdown.classList.toggle("open");
    e.stopPropagation();
  });

  document.addEventListener("click", (e) => {
    dropdown.classList.remove("open");
  });

  esci.addEventListener("click", (e) => {
    logoutUser();
    renderUserPill();
  });
};
// render della pill in base al'account
const renderUserPill = () => {
  const userLogged = document.querySelector(".logged-user");
  const noLogged = document.querySelector(".no-logged");
  const account = getCurrentUser();
  if (account === null) {
    noLogged.style.display = "flex";
    userLogged.style.display = "none";
  } else {
    noLogged.style.display = "none";
    userLogged.style.display = "flex";

    const nomeUtente = document.querySelector(".user-pill-name");
    nomeUtente.textContent = account.username;
  }
};
// mostra/nascondi modale
const modal = () => {
  const noLoggedpill = document.querySelector(".no-logged");
  const registrati = noLoggedpill.querySelector(".user-pill");
  const overlayModal = document.getElementById("register-modal");
  const closeBtn = document.querySelector(".register-close");

  registrati.addEventListener("click", (e) => {
    e.stopPropagation();
    document.getElementById("login-modal").classList.remove("open");
    overlayModal.classList.add("open");
  });

  closeBtn.addEventListener("click", (e) => {
    overlayModal.classList.remove("open");
  });

  overlayModal.addEventListener("click", (e) => {
    if (e.target === overlayModal) {
      overlayModal.classList.remove("open");
    }
  });
  // registrazione dei dati nel form, submit, salvataggio e cambio pill
  const form = document.getElementById("register-form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const nomeRegistrato = document.getElementById("register-name").value;
    const cognomeRegistrato = document.getElementById("register-surname").value;
    const usernameRegistrato =
      document.getElementById("register-username").value;
    const emailRegistrato = document.getElementById("register-email").value;
    const passwordRegistrato =
      document.getElementById("register-password").value;

    const datiUtente = {
      name: nomeRegistrato,
      surname: cognomeRegistrato,
      username: usernameRegistrato,
      email: emailRegistrato,
      password: passwordRegistrato,
    };

    registerUser(datiUtente);
    renderUserPill();
    overlayModal.classList.remove("open");
    form.reset();
  });
};
// funzione di login nella modale di login
const loginModal = () => {
  const noLoggedpill = document.querySelector(".no-logged");
  const [registrati, accedi] = noLoggedpill.querySelectorAll(".user-pill");
  const loginOverlay = document.getElementById("login-modal");
  const closeBtn = loginOverlay.querySelector(".register-close");
  const loginForm = document.getElementById("login-form");

  accedi.addEventListener("click", (e) => {
    e.stopPropagation();
    document.getElementById("register-modal").classList.remove("open");
    loginOverlay.classList.add("open");
  });

  closeBtn.addEventListener("click", (e) => {
    loginOverlay.classList.remove("open");
  });
  loginOverlay.addEventListener("click", (e) => {
    if (e.target === loginOverlay) {
      loginOverlay.classList.remove("open");
    }
  });
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const usernameLogin = document.getElementById("login-username").value;
    const passwordLogin = document.getElementById("login-password").value;

    const datiLogin = loginUser(usernameLogin, passwordLogin);
    if (datiLogin === null) {
      alert("Credenziali errate");
      return;
    }

    renderUserPill();
    loginOverlay.classList.remove("open");
    loginForm.reset();
  });
};
/* ============================ 7. Inizializzazione ============================ */

/*
  initPage(activePage)
  - Chiamata da home.js / search.js / album.js / artist.js
  - Monta sidebar, monta player, restituisce il player per essere usato.
*/
const initSidebarResize = () => {
  const sidebar = document.querySelector(".sidebar");
  const app = document.querySelector(".app");
  if (!sidebar || !app) return;

  const resizer = document.createElement("div");
  resizer.className = "sidebar-resizer";
  sidebar.appendChild(resizer);

  let isResizing = false;

  resizer.addEventListener("mousedown", () => {
    isResizing = true;
    resizer.classList.add("dragging");
    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";
  });

  document.addEventListener("mousemove", (e) => {
    if (!isResizing) return;
    const newWidth = Math.min(Math.max(e.clientX, 60), 400);
    app.style.gridTemplateColumns = `${newWidth}px 1fr`;
    sidebar.classList.toggle("sidebar--collapsed", newWidth < 120);
  });

  document.addEventListener("mouseup", () => {
    if (!isResizing) return;
    isResizing = false;
    resizer.classList.remove("dragging");
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  });
};

const initPage = (activePage) => {
  renderSidebar(activePage);
  const player = new Player();
  player.mount();
  window.player = player;

  // pannello laterale "In riproduzione"
  window.nowPlaying = createNowPlayingPanel();

  // solo cover e meta del brano in basso a sinistra -> apre/chiude il pannello
  const playerCover = document.querySelector(".player-cover");
  const playerMeta = document.querySelector(".player-meta");
  [playerCover, playerMeta].forEach((el) => {
    if (!el) return;
    el.style.cursor = "pointer";
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      if (player.currentTrack) window.nowPlaying.render(player.currentTrack);
      window.nowPlaying.toggle();
    });
  });

  // Click su tutto il player footer (solo mobile ≤576px) → apre il pannello
  // Esclusi: barra di riproduzione, tasto play e controlli secondari
  const playerFooter = document.querySelector(".player");
  if (playerFooter) {
    playerFooter.addEventListener("click", (e) => {
      if (window.innerWidth > 576) return;
      if (
        e.target.closest(".player-progress") ||
        e.target.closest(".btn-play") ||
        e.target.closest(".btn-ctrl") ||
        e.target.closest(".player-right")
      ) return;
      e.stopPropagation();
      if (player.currentTrack) window.nowPlaying.render(player.currentTrack);
      window.nowPlaying.toggle();
    });
  }

  // chiusura del pannello cliccando in un punto qualsiasi della pagina
  // che non sia il pannello stesso o gli elementi che lo aprono
  const nowPlayingPanel = document.querySelector("#now-playing");
  document.addEventListener("click", (e) => {
    if (
      nowPlayingPanel &&
      !nowPlayingPanel.contains(e.target) &&
      !(playerCover && playerCover.contains(e.target)) &&
      !(playerMeta && playerMeta.contains(e.target))
    ) {
      window.nowPlaying.close();
    }
  });

  const [btnBack, btnForward] = document.querySelectorAll(".nav-btn");
  if (btnBack) btnBack.addEventListener("click", () => history.back());
  if (btnForward) btnForward.addEventListener("click", () => history.forward());

  // Barra di navigazione mobile (visibile solo su ≤576px via CSS)
  const appEl = document.querySelector(".app");
  if (appEl) {
    const mobileNav = document.createElement("nav");
    mobileNav.className = "mobile-nav";
    mobileNav.innerHTML = `
      <a href="index.html" ${activePage === "home" ? 'class="active"' : ""}>
        <span class="ico"><i class="bi bi-house-door-fill"></i></span>
        <span>Home</span>
      </a>
      <a href="search.html" ${activePage === "search" ? 'class="active"' : ""}>
        <span class="ico"><i class="bi bi-search"></i></span>
        <span>Cerca</span>
      </a>
      <a href="favourites.html" ${activePage === "favourites" ? 'class="active"' : ""}>
        <span class="ico"><i class="bi bi-heart-fill"></i></span>
        <span>Preferiti</span>
      </a>
    `;
    appEl.appendChild(mobileNav);
  }

  setupCarousels();
  pillDropdown();
  renderUserPill();
  modal();
  loginModal();
  initSidebarResize();

  return player;
};