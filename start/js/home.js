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

const home = document.querySelector(".home");

/*
  renderRow(rowTitle, tracks)
  - crea una <section class="row"> con titolo h2 e griglia .grid di .card per ogni track
  - aggancia click handler che chiamano player.play(track) e toggleFavourite(track)
*/
const renderRow = (rowTitle, tracks) => {
  // TODO
  const section = document.createElement("section");
  section.classList.add("row");

  const h2 = document.createElement("h2");
  h2.textContent = rowTitle;
  const div = document.createElement("div");
  div.classList.add("grid");

  tracks.forEach((track) => {
    const card = document.createElement("div");
    card.classList.add("card");

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

    div.appendChild(card);
  });

  section.appendChild(h2);
  section.appendChild(div);

  home.appendChild(section);
};

/*
  loadHome()
  - chiama Promise.all sulle 3 fetch di suggerimenti
  - costruisce le righe nell'ordine: history, favourites, pop, rock, hits
*/
const loadHome = async () => {
  // TODO
  const [pop, rock, hits] = await Promise.all([
    fetchJSON(`${API_BASE}/search?term=pop&entity=song&limit=12`),
    fetchJSON(`${API_BASE}/search?term=rock&entity=song&limit=12`),
    fetchJSON(`${API_BASE}/search?term=hits&entity=song&limit=12`),
  ]);
  const traccePop = pop.results.map((raw) => new Track(raw));
  const tracceRock = rock.results.map((raw) => new Track(raw));
  const tracceHits = hits.results.map((raw) => new Track(raw));

  const history = getHistory();
  const favourites = getFavourites();

  renderRow("Suggerimenti pop", traccePop);
  renderRow("Suggerimenti rock", tracceRock);
  renderRow("Suggerimenti hits", tracceHits);

  if (history.length > 0) renderRow("Riprodotti di recente", history);
  if (favourites.length > 0) renderRow("I tuoi preferiti", favourites);
};

loadHome();
