/* ============================================================
   album.js — pagina dettaglio album
   ============================================================

   COSA DEVI FARE
   1) initPage("home")
   2) Leggi l'id dell'album dalla query string:
        const id = new URLSearchParams(window.location.search).get("id");
   3) Se manca l'id -> messaggio "Album non trovato" e stop.
   4) fetch /lookup?id=ID&entity=song
      - results[0] è la collection (album)
      - results[1..] sono le track
   5) Costruisci #album-hero con:
      - cover grande (bigArt)
      - kicker "ALBUM"
      - titolo album
      - sotto-riga: artista · anno · numero brani · durata totale
      - button "Play" che chiama player.play sulla prima track
      - button "Cuore" (favourite) sulla prima track
   6) Costruisci #tracklist:
      - una riga per track: numero, titolo, durata, cuore
      - click sulla riga -> player.play(track)
      - click sul cuore -> toggleFavourite(track)
*/

const player = initPage("home");

const albumHero = document.querySelector("#album-hero");
const tracklist = document.querySelector("#tracklist");

const loadAlbum = async () => {
  const id = new URLSearchParams(window.location.search).get("id");
  if (!id) {
    albumHero.textContent = "Album non trovato";
    return;
  }
  // TODO: implementare come da elenco sopra
  const dati = await fetchJSON(`${API_BASE}/lookup?id=${id}&entity=song`);

  const albumRaw = dati.results[0];
  const tracksRaw = dati.results.slice(1);

  const album = new Album(albumRaw);
  const tracks = tracksRaw.map((raw) => new Track(raw));

  const cover = document.createElement("div");
  cover.classList.add("album-cover");

  const img = document.createElement("img");
  img.src = bigArt(album.cover);
  img.alt = album.title;

  cover.appendChild(img);

  const meta = document.createElement("div");
  meta.classList.add("hero-meta");

  const kicker = document.createElement("p");
  kicker.classList.add("hero-kicker");
  kicker.textContent = "ALBUM";

  const title = document.createElement("h1");
  title.classList.add("hero-title");
  title.textContent = album.title;

  const sub = document.createElement("p");
  sub.classList.add("hero-sub");
  sub.textContent = `${album.artist} · ${new Date(album.releaseDate).getFullYear()} · ${album.trackCount} brani`;

  meta.appendChild(kicker);
  meta.appendChild(title);
  meta.appendChild(sub);

  //bottone play

  const action = document.createElement("div");
  action.classList.add("hero-actions");

  const btnPlay = document.createElement("button");
  btnPlay.classList.add("btn-play-big");
  btnPlay.textContent = "▶";

  btnPlay.addEventListener("click", () => player.setQueue(tracks, 0));

  //bottone cuore

  const btnFav = document.createElement("button");
  btnFav.classList.add("btn-fav-big");
  const favHeroInit = isFavourite(tracks[0].id);
  btnFav.textContent = favHeroInit ? "♥" : "♡";
  btnFav.classList.toggle("is-fav", favHeroInit);

  btnFav.addEventListener("click", () => {
    toggleFavourite(tracks[0]);
    const fav = isFavourite(tracks[0].id);
    btnFav.textContent = fav ? "♥" : "♡";
    btnFav.classList.toggle("is-fav", fav);
  });

  action.appendChild(btnPlay);
  action.appendChild(btnFav);
  meta.appendChild(action);

  albumHero.appendChild(cover);
  albumHero.appendChild(meta);

  tracks.forEach((track, index) => {
    const row = document.createElement("div");
    row.classList.add("track-row");
    row.dataset.trackId = track.id;

    const num = document.createElement("span");
    num.classList.add("track-num");
    num.textContent = index + 1;

    const titleEl = document.createElement("span");
    titleEl.classList.add("track-title");
    titleEl.textContent = track.title;

    const time = document.createElement("span");
    time.classList.add("track-time");
    time.textContent = formatTime(track.durationMs);

    row.appendChild(num);
    row.appendChild(titleEl);
    row.appendChild(time);

    const btnRowFav = document.createElement("button");
    btnRowFav.classList.add("track-fav");
    // stato iniziale: pieno+rosso se già nei preferiti, vuoto altrimenti
    const favRowInit = isFavourite(track.id);
    btnRowFav.textContent = favRowInit ? "♥" : "♡";
    btnRowFav.classList.toggle("is-fav", favRowInit);

    btnRowFav.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleFavourite(track);
      const fav = isFavourite(track.id);
      btnRowFav.textContent = fav ? "♥" : "♡";
      btnRowFav.classList.toggle("is-fav", fav);
    });
    row.appendChild(btnRowFav);

    tracklist.appendChild(row);

    row.addEventListener("click", () => player.setQueue(tracks, index));
  });
};
loadAlbum();