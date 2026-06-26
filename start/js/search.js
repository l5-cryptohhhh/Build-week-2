/* ============================================================
   search.js — ricerca con debounce
   ============================================================

   COSA DEVI FARE
   1) initPage("search")
   2) Recupera l'ultima query da localStorage (STORAGE_KEY_LAST_SEARCH).
      Se presente, popola l'input e lancia la ricerca.
   3) Aggancia l'evento "input" all'input #search-input con debounce 400ms.
   4) doSearch(term):
      - se term è vuoto -> nascondi i 3 row e svuota i grid
      - altrimenti fetch in PARALLELO (Promise.all):
          - tracks   = search?term=...&entity=song&limit=12
          - albums   = search?term=...&entity=album&limit=8
          - artists  = search?term=...&entity=musicArtist&limit=8
      - mostra ciascuna sezione solo se i risultati sono > 0
      - salva l'ultima query in localStorage
   5) Per ogni risultato crea una card:
      - track  -> click = player.play(track)
      - album  -> click = window.location.href = "album.html?id=" + albumId
      - artist -> click = window.location.href = "artist.html?id=" + artistId
*/

const player = initPage("search");

const input = document.querySelector("#search-input");
const rowTracks = document.querySelector("#row-tracks");
const rowAlbums = document.querySelector("#row-albums");
const rowArtists = document.querySelector("#row-artists");
const gridTracks = document.querySelector("#grid-tracks");
const gridAlbums = document.querySelector("#grid-albums");
const gridArtists = document.querySelector("#grid-artists");

// Si aspetta un'istanza di Track con: id, title, artist, cover, previewUrl (contratto definito in common.js)
const renderTrackCard = (track) => {
  const cardDiv = document.createElement("div");
  cardDiv.classList.add("card");

  const imageWrap = document.createElement("div");
  imageWrap.classList.add("card-image-wrap");
  const img = document.createElement("img");
  img.src = track.cover;
  img.alt = "Cover di " + track.title;

  imageWrap.appendChild(img);

  const cardTitle = document.createElement("p");
  cardTitle.classList.add("card-title");
  cardTitle.textContent = track.title;

  const cardSub = document.createElement("p");
  cardSub.classList.add("card-sub");
  cardSub.textContent = track.artist;

  const cardPlay = document.createElement("button");
  cardPlay.textContent = "▶";
  cardPlay.classList.add("card-play");

  // Click su tutta la card (non solo sul bottone ▶) per riprodurre il brano:
  // cardPlay non ha un suo listener separato, l'evento sale (bubbling) da lui a cardDiv.
  cardDiv.addEventListener("click", () => {
    if (track.albumId) {
      window.location.href = `album.html?id=${track.albumId}`;
    } else {
      window.location.href = `track.html?id=${track.id}`;
    }
  });

  cardPlay.addEventListener("click", (e) => {
    e.stopPropagation();
    player.play(track);
  });

  cardDiv.appendChild(imageWrap);

  cardDiv.appendChild(cardTitle);
  cardDiv.appendChild(cardSub);
  cardDiv.appendChild(cardPlay);

  return cardDiv;
};

// Si aspetta un'istanza di Album con: id, title, artist, cover (contratto definito in common.js)
// Niente bottone play: un album si apre, non si riproduce direttamente.
const renderAlbumCard = (album) => {
  const cardDiv = document.createElement("div");
  cardDiv.classList.add("card");

  const imageWrap = document.createElement("div");
  imageWrap.classList.add("card-image-wrap");
  const img = document.createElement("img");
  img.src = album.cover;
  img.alt = "Cover di " + album.title;

  imageWrap.appendChild(img);

  const cardTitle = document.createElement("p");
  cardTitle.classList.add("card-title");
  cardTitle.textContent = album.title;

  const cardSub = document.createElement("p");
  cardSub.classList.add("card-sub");
  cardSub.textContent = album.artist;

  // Click sulla card -> naviga alla pagina di dettaglio album (passa l'id via query string)
  cardDiv.addEventListener("click", (e) => {
    e.preventDefault();
    window.location.href = "album.html?id=" + album.id;
  });

  cardDiv.appendChild(imageWrap);

  cardDiv.appendChild(cardTitle);
  cardDiv.appendChild(cardSub);

  return cardDiv;
};
// Si aspetta un'istanza di Artist con: id, name, genre (contratto definito in common.js)
// Niente bottone play e niente <img>: l'API iTunes per entity=musicArtist non fornisce
// un artworkUrl, quindi card-image-wrap resta vuoto (cerchio nero "round") solo per
// mantenere la stessa altezza delle card di brani/album nella griglia.
const renderArtistCard = (artist) => {
  const cardDiv = document.createElement("div");
  cardDiv.classList.add("card");

  const imageWrap = document.createElement("div");
  imageWrap.classList.add("card-image-wrap", "round");

  // L'API iTunes (entity=musicArtist) non fornisce artwork: partiamo con un'immagine
  // di default (viso centrato, vedi CSS) e poi la sostituiamo con la foto reale
  // dell'artista presa da TheAudioDB (getArtistInfo in common.js), se disponibile.
  const img = document.createElement("img");
  img.src = "assets/artist-default.jpeg";
  img.alt = "Artista " + artist.name;
  img.classList.add("artist-default-img");
  imageWrap.appendChild(img);

  getArtistInfo(artist.name).then((info) => {
    if (info && info.photo) {
      img.src = info.photo;
      img.classList.remove("artist-default-img"); // niente zoom sul default: foto reale intera
    }
  });

  const cardTitle = document.createElement("p");
  cardTitle.classList.add("card-title");
  cardTitle.textContent = artist.name;

  const cardSub = document.createElement("p");
  cardSub.classList.add("card-sub");
  cardSub.textContent = artist.genre;

  // Click sulla card -> naviga alla pagina di dettaglio artista (passa l'id via query string)
  cardDiv.addEventListener("click", (e) => {
    e.preventDefault();
    window.location.href = "artist.html?id=" + artist.id;
  });

  cardDiv.appendChild(imageWrap);

  cardDiv.appendChild(cardTitle);
  cardDiv.appendChild(cardSub);

  return cardDiv;
};

const doSearch = async (term) => {
  if (term === "") {
    rowTracks.hidden = true;
    rowAlbums.hidden = true;
    rowArtists.hidden = true;

    gridTracks.innerHTML = "";
    gridAlbums.innerHTML = "";
    gridArtists.innerHTML = "";
  } else {
    const urlTracks =
      API_BASE +
      "/search?term=" +
      encodeURIComponent(term) +
      "&entity=song&limit=12";

    const urlAlbums =
      API_BASE +
      "/search?term=" +
      encodeURIComponent(term) +
      "&entity=album&limit=8";

    const urlArtists =
      API_BASE +
      "/search?term=" +
      encodeURIComponent(term) +
      "&entity=musicArtist&limit=8";

    const [dataTracks, dataAlbums, dataArtists] = await Promise.all([
      fetchJSON(urlTracks),
      fetchJSON(urlAlbums),
      fetchJSON(urlArtists),
    ]);

    // I dati di iTunes sono "grezzi" (trackName, artistName, ...): li trasformiamo
    // nei modelli Track/Album/Artist (definiti in common.js) che le render*Card si aspettano.
    const newTrack = dataTracks.results.map((raw) => {
      return new Track(raw);
    });

    const newAlbum = dataAlbums.results.map((raw) => {
      return new Album(raw);
    });

    const newArtist = dataArtists.results.map((raw) => {
      return new Artist(raw);
    });

    // Svuotiamo le grid prima di ridisegnarle, altrimenti i risultati della ricerca
    // precedente resterebbero visibili insieme ai nuovi.
    gridTracks.innerHTML = "";
    gridAlbums.innerHTML = "";
    gridArtists.innerHTML = "";

    // Per ogni modello creiamo la card (render*Card ritorna un <div>, non lo inserisce
    // da sola nella pagina) e la attacchiamo alla grid con appendChild.
    newTrack.forEach((track) => {
      gridTracks.appendChild(renderTrackCard(track));
    });

    newAlbum.forEach((album) => {
      gridAlbums.appendChild(renderAlbumCard(album));
    });

    newArtist.forEach((artist) => {
      gridArtists.appendChild(renderArtistCard(artist));
    });

    // Mostriamo ogni row solo se ci sono risultati per quella categoria.
    if (newTrack.length === 0) {
      rowTracks.hidden = true;
    } else {
      rowTracks.hidden = false;
    }

    if (newAlbum.length === 0) {
      rowAlbums.hidden = true;
    } else {
      rowAlbums.hidden = false;
    }

    if (newArtist.length === 0) {
      rowArtists.hidden = true;
    } else {
      rowArtists.hidden = false;
    }

    // Salviamo la query corrente così al prossimo caricamento della pagina
    // possiamo riproporla in automatico (vedi blocco sotto).
    localStorage.setItem(STORAGE_KEY_LAST_SEARCH, term);
  }
};

const debouncedSearch = debounce(doSearch, 400);

// Si attiva solo quando l'utente digita (evento "input"): non basta per ripristinare
// l'ultima ricerca al caricamento della pagina, perché in quel momento nessun
// evento "input" è ancora scattato.
input.addEventListener("input", (event) => {
  debouncedSearch(event.target.value.trim());
});

// Eseguito una sola volta al caricamento dello script (non dentro un evento):
// se in localStorage c'è una ricerca precedente, la rimettiamo nell'input
// e rilanciamo doSearch con quel valore, così l'utente la ritrova subito.
if (localStorage.getItem(STORAGE_KEY_LAST_SEARCH) !== null) {
  const lastSearch = localStorage.getItem(STORAGE_KEY_LAST_SEARCH);
  input.value = lastSearch;
  doSearch(lastSearch);
}