// costanti globali
const player = initPage("profile");
const account = getCurrentUser();

// caso utente non loggato
if (account === null) {
  window.location.href = "index.html";
  console.error("Utente non loggato");
  // utente loggato
} else {
  const hero = document.getElementById("profile-hero");
  const divImmagine = document.createElement("div");
  divImmagine.classList.add("profile-foto");
  const iconaProfilo = document.createElement("i");
  iconaProfilo.classList.add("bi", "bi-person");

  divImmagine.appendChild(iconaProfilo);

  const divInfo = document.createElement("div");
  divInfo.classList.add("div-info");

  const profileP = document.createElement("p");
  profileP.textContent = "Profilo";
  const profileName = document.createElement("h1");
  profileName.textContent = `${account.username}`;
  const profileSubtitle = document.createElement("p");
  profileSubtitle.textContent = `${account.nome} ${account.cognome}`;

  divInfo.appendChild(profileP);
  divInfo.appendChild(profileName);
  divInfo.appendChild(profileSubtitle);

  hero.appendChild(divImmagine);
  hero.appendChild(divInfo);
  // render dei preferiti
  const renderFavs = () => {
    // funzione per mostrare lista randomica di preferiti
    // shuffle che randomizza
    const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);
    // const per i preferiti sul profilo
    const preferitiRandom = shuffle(getFavourites()).slice(0, 5);

    console.log(preferitiRandom);

    const favsContainer = document.getElementById("profile-favs");

    favsContainer.replaceChildren();

    preferitiRandom.forEach((track, index) => {
      // creazione elementi preferiti
      const trackRow = document.createElement("div");
      trackRow.classList.add("track-row");

      const trackNum = document.createElement("span");
      trackNum.classList.add("track-num");
      trackNum.textContent = index + 1;

      trackRow.appendChild(trackNum);
      favsContainer.appendChild(trackRow);

      const trackCover = document.createElement("img");
      trackCover.classList.add("track-cover");
      trackCover.src = track.cover || "https://placehold.co/30x30?text=🎵";
      trackCover.alt = track.album;

      trackRow.appendChild(trackCover);

      const trackTitleWrap = document.createElement("div");
      trackTitleWrap.classList.add("track-title-wrap");

      const trackTitle = document.createElement("span");
      trackTitle.classList.add("track-title");
      trackTitle.textContent = track.title;

      const trackArtist = document.createElement("span");
      trackArtist.classList.add("track-artist");
      trackArtist.textContent = track.artist;

      trackTitleWrap.appendChild(trackTitle);
      trackTitleWrap.appendChild(trackArtist);
      trackRow.appendChild(trackTitleWrap);

      const trackAlbum = document.createElement("span");
      trackAlbum.classList.add("track-album");
      trackAlbum.textContent = track.album;

      trackRow.appendChild(trackAlbum);

      const trackTime = document.createElement("span");
      trackTime.classList.add("track-time");

      const minuti = Math.floor(track.durationMs / 60000);

      const secondi = ((track.durationMs % 60000) / 1000).toFixed(0);

      trackTime.textContent = `${minuti}:${secondi.padStart(2, "0")}`;

      trackRow.appendChild(trackTime);

      const trackFav = document.createElement("button");
      trackFav.classList.add("track-fav", "is-fav");
      trackFav.textContent = "♥";

      trackFav.addEventListener("click", (e) => {
        toggleFavourite(track);
        renderFavs();
      });

      trackRow.appendChild(trackFav);
    });
  };

  renderFavs();
  // carosello di consigli randomici
  const generi = ["pop", "rock", "jazz", "latin", "metal", "indie"];

  // regola fissa Math
  // Math.floor(Math.random() * array.length)
  const renderSuggestions = async () => {
    const indiceRandom = Math.floor(Math.random() * generi.length);
    const genereRandom = generi[indiceRandom];

    const dati = await fetchJSON(
      `${API_BASE}/search?term=${genereRandom}&entity=song&limit=12`,
    );

    const brani = dati.results.map((raw) => new Track(raw));

    // creazione grafica carosello nuovo
    const profileSugg = document.getElementById("profile-suggestions");
    const suggestionsCarousel = document.createElement("section");
    suggestionsCarousel.classList.add("row");

    const carouselH2 = document.createElement("h2");
    carouselH2.textContent = "I tuoi suggeriti";

    suggestionsCarousel.appendChild(carouselH2);

    const divCarousel = document.createElement("div");
    divCarousel.classList.add("grid");

    suggestionsCarousel.appendChild(divCarousel);

    brani.forEach((track) => {
      const card = document.createElement("div");
      card.classList.add("card");

      const imageWrap = document.createElement("div");
      imageWrap.classList.add("card-image-wrap");

      const img = document.createElement("img");
      img.src = track.cover;
      img.alt = track.title;
      imageWrap.appendChild(img);
      card.appendChild(imageWrap);

      const titolo = document.createElement("p");
      titolo.classList.add("card-title");
      titolo.textContent = track.title;
      card.appendChild(titolo);

      const artista = document.createElement("p");
      artista.classList.add("card-sub");
      artista.textContent = track.artist;
      card.appendChild(artista);

      divCarousel.appendChild(card);
    });

    profileSugg.appendChild(suggestionsCarousel);
  };
  renderSuggestions();
}
