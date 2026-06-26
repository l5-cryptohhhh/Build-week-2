/* ============================================================
   artist.js — pagina dettaglio artista
   ============================================================

   COSA DEVI FARE
   1) initPage("home")
   2) Leggi l'id dell'artista dalla query string (URLSearchParams).
   3) Se manca l'id -> messaggio "Artista non trovato" e stop.
   4) fetch /lookup?id=ID&entity=song&limit=15
      - results[0] è l'artist
      - results[1..] sono le top track
   5) Costruisci #artist-hero:
      - kicker "ARTISTA"
      - nome artista grande
      - genere (primaryGenreName) + numero ascoltatori (random, es. Math.random() * 5_000_000)
      - button "Play" -> player.play(prima track)
   6) Costruisci #top-tracks come tracklist (uguale a album).
    - una riga per track: numero, titolo, durata, cuore
      - click sulla riga -> player.play(track)
      - click sul cuore -> toggleFavourite(track)
*/

const player = initPage("home");

const artistHero = document.querySelector("#artist-hero");
const topTracks = document.querySelector("#top-tracks");

const loadArtist = async () => {
  try {
    /* Leggi l'id dell'artista dalla query string passo 2 */

    const urlParams = new URLSearchParams(window.location.search);
    const artistId = urlParams.get("id");

    //Se manca l'id -> messaggio "Artista non trovato" e stop passo 3 */
    if (!artistId) {
      artistHero.innerHTML = `<h2>Artista non trovato</h2>`;
      return;
    }

    /* Fetch dei dati dall'API passo 4 */
    const [songData, albumData] = await Promise.all([
      fetchJSON(`${API_BASE}/lookup?id=${artistId}&entity=song&limit=15`),
      fetchJSON(`${API_BASE}/lookup?id=${artistId}&entity=album&limit=12`),
    ]);

    const data = songData;
    const results = data.results;
    const albumResults = albumData.results.filter(r => r.wrapperType === "collection");

    if (!results || results.length === 0) {
      const errorTitle = document.createElement("h2");
      errorTitle.textContent = "Artista non trovato";
      artistHero.appendChild(errorTitle);
      return;
    }

    // results[0] è l'artista, i successivi sono i brani
    const artist = results[0];
    const tracks = results.slice(1);
    // converti i dati raw in istanze Track (servono .id, .title, .cover, .previewUrl)
    const trackObjs = tracks.map((raw) => new Track(raw));

    /* Costruisci #artist-hero passo 5 */
    artistHero.textContent = ""; // Svuota il contenitore in modo sicuro

    const coverWrap = document.createElement("div");
    coverWrap.classList.add("album-cover");
    artistHero.appendChild(coverWrap);

    const img = document.createElement("img");
    img.alt = artist.artistName;
    // entity=musicArtist non dà artwork: usa la cover del primo brano se c'è,
    // altrimenti l'immagine di default (solo iTunes, niente nuova API qui)
    if (tracks.length > 0 && tracks[0].artworkUrl100) {
      img.src = bigArt(tracks[0].artworkUrl100);
    } else {
      img.src = "assets/img/artist-default.jpeg";
      img.classList.add("artist-default-img");
    }
    coverWrap.appendChild(img);

    const heroContent = document.createElement("div");
    heroContent.classList.add("hero-meta");

    const kicker = document.createElement("span");
    kicker.classList.add("hero-kicker");
    kicker.textContent = "ARTISTA";

    const artistName = document.createElement("h1");
    artistName.classList.add("hero-title");
    artistName.textContent = artist.artistName;

    const listeners = Math.floor(Math.random() * 5_000_000).toLocaleString();
    const subInfo = document.createElement("p");
    subInfo.classList.add("hero-sub");
    subInfo.textContent = `${artist.primaryGenreName} • ${listeners} ascoltatori mensili`;

    heroContent.appendChild(kicker);
    heroContent.appendChild(artistName);
    heroContent.appendChild(subInfo);

    /* Button play se ci sono tracce */
    if (tracks.length > 0) {
      const heroActions = document.createElement("div");
      heroActions.classList.add("hero-actions");

      const btnPlayBig = document.createElement("button");
      btnPlayBig.classList.add("btn-play-big");
      btnPlayBig.textContent = "▶";

      const audioEl = document.querySelector("#audio-element");

      const syncBtnPlay = () => {
        const isThisArtist = trackObjs.some(
          (t) => t.id === player.currentTrack?.id,
        );
        btnPlayBig.textContent =
          isThisArtist && !audioEl.paused ? "⏸" : "▶";
      };

      btnPlayBig.addEventListener("click", () => {
        const isThisArtist = trackObjs.some(
          (t) => t.id === player.currentTrack?.id,
        );
        if (isThisArtist) {
          player.togglePlay();
        } else {
          player.setQueue(trackObjs, 0);
        }
      });

      audioEl.addEventListener("play", syncBtnPlay);
      audioEl.addEventListener("pause", syncBtnPlay);
      audioEl.addEventListener("ended", syncBtnPlay);

      heroActions.appendChild(btnPlayBig);
      heroContent.appendChild(heroActions);
    }

    artistHero.appendChild(heroContent);

    /* Costruisci #top-tracks come tracklist passo 6 */
    topTracks.textContent = "";

    tracks.forEach((track, index) => {
      const trackRow = document.createElement("div");
      trackRow.classList.add("track-row");
      trackRow.dataset.trackId = track.trackId; // Aggiunta così il player evidenzia automaticamente il brano in riproduzione

      // Numero traccia
      const trackNum = document.createElement("span");
      trackNum.classList.add("track-num");
      trackNum.textContent = index + 1;

      // Cover + titolo traccia
      const trackTitleWrap = document.createElement("div");
      trackTitleWrap.classList.add("track-title-wrap");

      const trackCover = document.createElement("img");
      trackCover.classList.add("track-cover");
      trackCover.src = track.artworkUrl100 || "";
      trackCover.alt = "";

      const trackTitle = document.createElement("span");
      trackTitle.classList.add("track-title");
      trackTitle.textContent = track.trackName;

      trackTitleWrap.appendChild(trackCover);
      trackTitleWrap.appendChild(trackTitle);

      // Durata approssimativa o fissa (visto che trackTimeMillis potrebbe non esserci sempre)
      const trackTime = document.createElement("span");
      trackTime.classList.add("track-time");

      if (track.trackTimeMillis) {
        const minutes = Math.floor(track.trackTimeMillis / 60000);
        const seconds = ((track.trackTimeMillis % 60000) / 1000).toFixed(0); //arrotonda
        trackTime.textContent = `${minutes}:${seconds.padStart(2, "0")}`;
      } else {
        trackTime.textContent = "3:30"; // Fallback standard
      }

      // Bottone cuoricino preferiti
      const trackModel = trackObjs[index];

      const btnFav = document.createElement("button");
      btnFav.classList.add("track-fav");
      // stato iniziale letto dal localStorage
      const favInit = isFavourite(trackModel.id);
      btnFav.textContent = favInit ? "♥" : "♡";
      btnFav.classList.toggle("is-fav", favInit);

      btnFav.addEventListener("click", (e) => {
        e.stopPropagation(); // Evita che cliccando il cuore parta la canzone
        toggleFavourite(trackModel);
        const fav = isFavourite(trackModel.id);
        btnFav.classList.toggle("is-fav", fav); // .is-fav cambia il colore in rosso
        btnFav.textContent = fav ? "♥" : "♡";
      });

      trackRow.appendChild(trackNum);
      trackRow.appendChild(trackTitleWrap);
      trackRow.appendChild(trackTime);
      trackRow.appendChild(btnFav);

      // Cliccando su qualsiasi punto della riga, la traccia viene riprodotta
      trackRow.addEventListener("click", () => {
        document
          .querySelectorAll(".track-row")
          .forEach((row) => row.classList.remove("is-playing"));
        trackRow.classList.add("is-playing");

        player.setQueue(trackObjs, index);
      });

      topTracks.appendChild(trackRow);
    });
    if (albumResults.length > 0) {
      const albumSection = document.createElement("section");
      albumSection.classList.add("row");

      const h2 = document.createElement("h2");
      h2.textContent = "Discografia";
      albumSection.appendChild(h2);

      const grid = document.createElement("div");
      grid.classList.add("grid");

      albumResults.forEach((raw) => {
        const album = new Album(raw);

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

        const pYear = document.createElement("p");
        pYear.classList.add("card-sub");
        pYear.textContent = new Date(album.releaseDate).getFullYear();

        card.appendChild(imgWrap);
        card.appendChild(pTitle);
        card.appendChild(pYear);

        card.addEventListener("click", () => {
          window.location.href = `album.html?id=${album.id}`;
        });

        grid.appendChild(card);
      });

      albumSection.appendChild(grid);
      document.querySelector(".artist-page").appendChild(albumSection);
    }

  } catch (error) {
    console.error(error);
    artistHero.textContent = "";
    const errorMsg = document.createElement("h2");
    errorMsg.textContent =
      "Si è verificato un errore durante il caricamento della pagina.";
    artistHero.appendChild(errorMsg);
  }
};

loadArtist();