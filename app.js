// Réglages
const EMAIL = "zertoproduction@gmail.com";
const PAR_PAGE = 24;

let beats = [];
let filtres = [];
let affiches = PAR_PAGE;
let courant = null;

const $ = (id) => document.getElementById(id);
const mois = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const dateFr = (d) => { const [a, m, j] = d.split("-"); return `${+j} ${mois[+m - 1]} ${a}`; };
const artistesTexte = (b) => b.artistes.length ? `${b.artistes.join(" x ")} type beat` : "";
const sansAccents = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function mailto(sujet) {
  return `mailto:${EMAIL}?subject=${encodeURIComponent(sujet)}`;
}

function choisir(b, lancer) {
  courant = b;
  document.documentElement.style.setProperty("--image-beat", `url(https://i.ytimg.com/vi/${b.id}/hqdefault.jpg)`);
  const params = lancer ? "?autoplay=1&rel=0" : "?rel=0";
  $("player").src = `https://www.youtube-nocookie.com/embed/${b.id}${params}`;
  $("p-etiquette").textContent = b === beats[0] ? "Dernière sortie" : "En écoute";
  $("p-nom").textContent = b.nom;
  $("p-artistes").textContent = artistesTexte(b);
  $("p-meta").textContent = [b.ambiance, dateFr(b.date)].filter(Boolean).join(" · ");
  $("p-youtube").href = `https://www.youtube.com/watch?v=${b.id}`;
  $("l-mail").href = mailto(`Licence - ${b.nom}`);
  document.querySelectorAll(".beat").forEach((el) => el.classList.toggle("actif", el.dataset.id === b.id));
}

function carte(b) {
  const el = document.createElement("button");
  el.className = "beat";
  el.dataset.id = b.id;
  el.innerHTML = `
    <div class="vignette">
      <img loading="lazy" alt="" src="https://i.ytimg.com/vi/${b.id}/mqdefault.jpg">
      ${b.free ? '<span class="badge">FREE</span>' : ""}
      <div class="play"><span></span></div>
    </div>
    <div class="beat-texte">
      <p class="beat-nom"></p>
      <p class="beat-art"></p>
    </div>
    <p class="beat-meta"></p>
    <span class="beat-cta">Écouter</span>`;
  el.querySelector(".beat-meta").textContent = [b.ambiance, dateFr(b.date)].filter(Boolean).join(" · ");
  el.querySelector(".beat-nom").textContent = b.nom;
  el.querySelector(".beat-art").textContent = artistesTexte(b) || dateFr(b.date);
  if (courant && courant.id === b.id) el.classList.add("actif");
  el.addEventListener("click", () => {
    choisir(b, true);
    const lecteur = $("lecteur").getBoundingClientRect();
    if (lecteur.top < -10 || lecteur.top > innerHeight / 2) $("lecteur").scrollIntoView({ behavior: "smooth" });
  });
  return el;
}

function afficher() {
  const grille = $("grille");
  grille.replaceChildren(...filtres.slice(0, affiches).map(carte));
  $("vide").hidden = filtres.length > 0;
  $("voir-plus").hidden = affiches >= filtres.length;
  $("compteur").textContent = `(${filtres.length})`;
}

function filtrer() {
  const q = sansAccents($("recherche").value.trim());
  filtres = q ? beats.filter((b) => sansAccents(`${b.titre} ${b.nom} ${b.artistes.join(" ")}`).includes(q)) : beats;
  affiches = PAR_PAGE;
  afficher();
}

$("recherche").addEventListener("input", filtrer);
$("voir-plus").addEventListener("click", () => { affiches += PAR_PAGE; afficher(); });
$("c-mail").href = mailto("Contact depuis le site");
$("l-mail").href = mailto("Licence");

fetch("data/beats.json", { cache: "no-cache" })
  .then((r) => r.json())
  .then((data) => {
    beats = data;
    filtres = beats;
    if (beats.length) choisir(beats[0], false);
    afficher();
  })
  .catch(() => { $("vide").hidden = false; $("vide").textContent = "Impossible de charger les instrus."; });
