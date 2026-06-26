const player = initPage("favourites");

const hero = document.querySelector("#fav-hero");
const tracklist = document.querySelector("#tracklist");

const renderFavourites = () => {
  const favs = getFavourites();

  // --- Hero ---
  hero.replaceChildren();

  const meta = document.createElement("div");
  meta.classList.add("hero-meta");

  const kicker = document.createElement("p");
  kicker.classList.add("hero-kicker");
  kicker.textContent = "PREFERITI";

  const title = document.createElement("h1");
  title.classList.add("hero-title");
  const heartIcon = document.createElement("i");
  heartIcon.className = "bi bi-heart-fill";
  heartIcon.style.color = "var(--danger)";
  title.appendChild(heartIcon);
  title.append(" I tuoi preferiti");

  const sub = document.createElement("p");
  sub.classList.add("hero-sub");
  sub.textContent =
    favs.length === 0
      ? "Nessun brano nei preferiti"
      : `${favs.length} bran${favs.length === 1 ? "o" : "i"}`;

  const actions = document.createElement("div");
  actions.classList.add("hero-actions");

  if (favs.length > 0) {
    const btnPlay = document.createElement("button");
    btnPlay.classList.add("btn-play-big");
    btnPlay.textContent = ICON_PLAY;
    btnPlay.addEventListener("click", () => player.setQueue(favs, 0));
    actions.appendChild(btnPlay);
  }

  meta.appendChild(kicker);
  meta.appendChild(title);
  meta.appendChild(sub);
  meta.appendChild(actions);
  hero.appendChild(meta);

  // --- Tracklist ---
  tracklist.replaceChildren();

  if (favs.length === 0) {
    const empty = document.createElement("p");
    empty.classList.add("empty");
    empty.textContent =
      "Aggiungi brani ai preferiti premendo ♡ su qualsiasi brano.";
    tracklist.appendChild(empty);
    return;
  }

  favs.forEach((track, index) => {
    const row = document.createElement("div");
    row.classList.add("track-row");
    row.dataset.trackId = track.id;

    const num = document.createElement("span");
    num.classList.add("track-num");
    num.textContent = index + 1;

    const titleWrap = document.createElement("div");
    titleWrap.classList.add("track-title-wrap");

    const coverImg = document.createElement("img");
    coverImg.classList.add("track-cover");
    coverImg.src = track.cover || "";
    coverImg.alt = "";

    const titleEl = document.createElement("span");
    titleEl.classList.add("track-title");
    titleEl.textContent = track.title;

    titleWrap.appendChild(coverImg);
    titleWrap.appendChild(titleEl);

    const time = document.createElement("span");
    time.classList.add("track-time");
    time.textContent = formatTime(track.durationMs);

    const btnFav = document.createElement("button");
    btnFav.classList.add("track-fav", "is-fav");
    btnFav.textContent = "♥";
    btnFav.setAttribute("aria-label", "Rimuovi dai preferiti");
    btnFav.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleFavourite(track);
    });

    row.appendChild(num);
    row.appendChild(titleWrap);
    row.appendChild(time);
    row.appendChild(btnFav);

    row.addEventListener("click", () => player.setQueue(favs, index));

    tracklist.appendChild(row);
  });
};

// Ridisegna la lista ogni volta che un preferito viene aggiunto/rimosso
document.addEventListener("library:changed", renderFavourites);

renderFavourites();