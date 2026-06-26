const player = initPage("home");
const trackHero = document.querySelector("#track-hero");

const loadTrack = async () => {
  const id = new URLSearchParams(window.location.search).get("id");
  if (!id) {
    trackHero.textContent = "Brano non trovato";
    return;
  }
  const dati = await fetchJSON(`${API_BASE}/lookup?id=${id}`);
  const raw = dati.results[0];
  if (!raw) {
    trackHero.textContent = "brano non trovato";
    return;
  }
  const track = new Track(raw);

  const cover = document.createElement("div");
  cover.classList.add("album-cover");
  const img = document.createElement("img");
  img.src = bigArt(track.cover);
  img.alt = track.title;
  cover.appendChild(img);

  const meta = document.createElement("div");
  meta.classList.add("hero-meta");

  const kicker = document.createElement("p");
  kicker.classList.add("hero-kicker");
  kicker.textContent = "BRANO";

  const title = document.createElement("h1");
  title.classList.add("hero-title");
  title.textContent = track.title;

  const sub = document.createElement("p");
  sub.classList.add("hero-sub");
  sub.textContent = `${track.artist} · ${track.album || "singolo"} · ${formatTime(track.durationMs)}`;

  const action = document.createElement("div");
  action.classList.add("hero-actions");

  const btnPlay = document.createElement("button");
  btnPlay.classList.add("btn-play-big");
  btnPlay.textContent = ICON_PLAY;
  btnPlay.addEventListener("click", () => player.setQueue([track], 0));

  const btnFav = document.createElement("button");
  btnFav.classList.add("btn-fav-big");

  btnFav.textContent = isFavourite(track.id) ? "♥" : "♡";
  btnFav.classList.toggle("is-fav", isFavourite(track.id));
  btnFav.addEventListener("click", () => {
    toggleFavourite(track);
    const fav = isFavourite(track.id);
    btnFav.textContent = fav ? "♥" : "♡";
    btnFav.classList.toggle("is-fav", fav);
  });

  action.appendChild(btnPlay);
  action.appendChild(btnFav);

  meta.appendChild(kicker);
  meta.appendChild(title);
  meta.appendChild(sub);
  meta.appendChild(action);

  trackHero.appendChild(cover);
  trackHero.appendChild(meta);
};

loadTrack();