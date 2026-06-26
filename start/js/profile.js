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
}
