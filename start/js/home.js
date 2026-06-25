/* ============================================================
   home.js — costruzione della Home
   ============================================================

   COSA DEVI FARE
   1) initPage("home")  // monta sidebar + player
   2) Costruisci queste righe (sezioni) nella .home:
        - "Riprodotti di recente" (da getHistory())  -- mostra solo se non vuota
        - "I tuoi preferiti"       (da getFavourites()) -- mostra solo se non vuota
        - "Suggerimenti pop"       (fetch search term=pop entity=song limit=12)
        - "Suggerimenti rock"      (fetch search term=rock entity=song limit=12)
        - "Suggerimenti hits"   (fetch search term=hits pop entity=song limit=12)
   3) Le tre fetch dei suggerimenti vanno in PARALLELO con Promise.all
   4) Ogni card è una Track: cover, titolo, artista, button play, button cuore (favourite)
   5) Click card -> window.player.play(track)
   6) Click cover senza play -> link a album.html?id=albumId (opzionale)
*/

const player = initPage("home");

const getTopArtists = () => {
  const all = [...getHistory(), ...getFavourites()];
  const counts = {};

  all.forEach((track) => {
    if (!track.artist) return;
    counts[track.artist] = (counts[track.artist] || 0) + 1;
  });

  return Object.keys(counts)
    .sort((a, b) => counts[b] - counts[a])
    .slice(0, 3);
};

const home = document.querySelector(".home");

/*
  makeCard(track)
  - crea e restituisce una singola .card (cover, titolo, artista, play, cuore)
  - il cuore riflette lo stato reale dei preferiti e si aggiorna al click
*/
const makeCard = (track, index, tracks) => {
  const card = document.createElement("div");
  card.classList.add("card");
  card.dataset.trackId = track.id;

  const imgWrap = document.createElement("div");
  imgWrap.classList.add("card-image-wrap");
  const img = document.createElement("img");
  img.src = track.cover;
  img.alt = track.title;
  imgWrap.appendChild(img);

  const pTitle = document.createElement("p");
  pTitle.classList.add("card-title");
  pTitle.textContent = track.title;

  const pArtist = document.createElement("p");
  pArtist.classList.add("card-sub");
  pArtist.textContent = track.artist;

  card.appendChild(imgWrap);
  card.appendChild(pTitle);
  card.appendChild(pArtist);

  card.addEventListener("click", () => player.setQueue(tracks, index));

  const btnPlay = document.createElement("button");
  btnPlay.classList.add("card-play");
  btnPlay.textContent = "▶";
  btnPlay.addEventListener("click", (e) => {
    e.stopPropagation();
    if (player.currentTrack && player.currentTrack.id === track.id) {
      player.togglePlay();
      btnPlay.textContent = player.isPlaying ? "⏸" : "▶";
    } else {
      document
        .querySelectorAll(".card-play")
        .forEach((btn) => (btn.textContent = "▶"));
      player.setQueue(tracks, index);
      btnPlay.textContent = "⏸";
    }
  });
  card.appendChild(btnPlay);

  const btnFav = document.createElement("button");
  btnFav.classList.add("card-fav");
  btnFav.textContent = "♥"; // sempre ♥: il CSS lo nasconde se non è preferito
  btnFav.dataset.trackId = track.id; // serve per aggiornare TUTTI i cuori dello stesso brano
  // stato iniziale: rosso e visibile se già nei preferiti
  btnFav.classList.toggle("is-fav", isFavourite(track.id));

  btnFav.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleFavourite(track); // -> library:changed -> refreshAllHearts aggiorna ogni cuore
    // inline opacity batte :hover -> questa card sparisce SUBITO anche col mouse sopra
    if (!isFavourite(track.id)) btnFav.style.opacity = "0";
  });
  // mouse fuori dalla card -> ridai il controllo al CSS (hover ri-mostra ♥ per aggiungere)
  card.addEventListener("mouseleave", () => {
    btnFav.style.opacity = "";
  });
  card.appendChild(btnFav);

  return card;
};

/*
  makeRow(rowTitle)
  - crea una <section class="row"> con titolo h2 e griglia .grid vuota
  - restituisce { section, grid } per poterla riempire/aggiornare dopo
*/
const makeRow = (rowTitle) => {
  const section = document.createElement("section");
  section.classList.add("row");

  const h2 = document.createElement("h2");
  h2.textContent = rowTitle;

  const grid = document.createElement("div");
  grid.classList.add("grid");

  section.appendChild(h2);
  section.appendChild(grid);

  return { section, grid };
};

const makeAlbumCard = (album) => {
  const card = document.createElement("div");
  card.classList.add("card");

  const imgWrap = document.createElement("div");
  imgWrap.classList.add("card-image-wrap");
  const img = document.createElement("img");
  img.src = album.cover;
  img.alt = album.title;
  imgWrap.appendChild(img);

  const pTitle = document.createElement("p");
  pTitle.classList.add("card-title");
  pTitle.textContent = album.title;

  const pArtist = document.createElement("p");
  pArtist.classList.add("card-sub");
  pArtist.textContent = album.artist;

  card.appendChild(imgWrap);
  card.appendChild(pTitle);
  card.appendChild(pArtist);

  card.addEventListener("click", () => {
    window.location.href = `album.html?id=${album.id}`;
  });

  return card;
};

/* Righe dinamiche (si aggiornano senza ricaricare la pagina) */
const historyRow = makeRow("Riprodotti di recente");
const favouritesRow = makeRow("I tuoi preferiti");

/*
  renderDynamicRows()
  - ridisegna SOLO le griglie di history e preferiti con replaceChildren (no innerHTML)
  - nasconde la sezione se vuota
*/
const renderDynamicRows = () => {
  const history = getHistory();
  const favourites = getFavourites();

  historyRow.section.hidden = history.length === 0;
  historyRow.grid.replaceChildren(...history.map(makeCard));

  favouritesRow.section.hidden = favourites.length === 0;
  favouritesRow.grid.replaceChildren(...favourites.map(makeCard));
};

const loadHome = async () => {
  home.appendChild(historyRow.section);
  home.appendChild(favouritesRow.section);
  renderDynamicRows();

  const topArtists = getTopArtists();

  if (topArtists.length > 0) {
    const fetches = topArtists.flatMap((artist) => [
      fetchJSON(`${API_BASE}/search?term=${encodeURIComponent(artist)}&entity=song&limit=12`),
      fetchJSON(`${API_BASE}/search?term=${encodeURIComponent(artist)}&entity=album&limit=8`),
    ]);

    const results = await Promise.all(fetches);

    topArtists.forEach((artist, i) => {
      const songs = results[i * 2].results.map((raw) => new Track(raw));
      const albums = results[i * 2 + 1].results.map((raw) => new Album(raw));

      if (songs.length > 0) {
        const rowSongs = makeRow(`Brani di ${artist}`);
        rowSongs.grid.replaceChildren(...songs.map(makeCard));
        home.appendChild(rowSongs.section);
      }

      if (albums.length > 0) {
        const rowAlbums = makeRow(`Album di ${artist}`);
        albums.forEach((album) => rowAlbums.grid.appendChild(makeAlbumCard(album)));
        home.appendChild(rowAlbums.section);
      }
    });

  } else {
    const [pop, rock, hits] = await Promise.all([
      fetchJSON(`${API_BASE}/search?term=pop&entity=song&limit=12`),
      fetchJSON(`${API_BASE}/search?term=rock&entity=song&limit=12`),
      fetchJSON(`${API_BASE}/search?term=hits&entity=song&limit=12`),
    ]);

    const rowPop = makeRow("Suggerimenti pop");
    rowPop.grid.replaceChildren(...pop.results.map((r) => new Track(r)).map(makeCard));
    home.appendChild(rowPop.section);

    const rowRock = makeRow("Suggerimenti rock");
    rowRock.grid.replaceChildren(...rock.results.map((r) => new Track(r)).map(makeCard));
    home.appendChild(rowRock.section);

    const rowHits = makeRow("Suggerimenti hits");
    rowHits.grid.replaceChildren(...hits.results.map((r) => new Track(r)).map(makeCard));
    home.appendChild(rowHits.section);
  }
};

/*
  refreshAllHearts()
  - allinea OGNI cuore in pagina allo stato reale dei preferiti
  - serve perché lo stesso brano può comparire in più righe contemporaneamente
*/
const refreshAllHearts = () => {
  document.querySelectorAll(".card-fav").forEach((btn) => {
    const fav = isFavourite(Number(btn.dataset.trackId));
    btn.classList.toggle("is-fav", fav);
    btn.style.opacity = ""; // ridai il controllo al CSS (hover/is-fav)
  });
};

// ogni volta che cambia la libreria (play o toggle preferito):
// 1) ridisegna history/preferiti  2) allinea tutti i cuori
document.addEventListener("library:changed", () => {
  renderDynamicRows();
  refreshAllHearts();
});

loadHome();
