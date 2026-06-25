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
    const response = await fetch(
      `https://itunes.apple.com/lookup?id=${artistId}&entity=song&limit=15`,
    );

    if (!response.ok) {
      throw new Error("Errore nel recupero dati");
    }

    const data = await response.json();
    const results = data.results;

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
      img.src = "assets/artist-default.jpeg";
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

      btnPlayBig.addEventListener("click", () => {
        player.setQueue(trackObjs, 0);
      });

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

      // Titolo traccia
      const trackTitle = document.createElement("span");
      trackTitle.classList.add("track-title");
      trackTitle.textContent = track.trackName;

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
      trackRow.appendChild(trackTitle);
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
