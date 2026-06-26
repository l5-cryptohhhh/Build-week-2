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
}
