// Réglages
const EMAIL = "zertoproduction@gmail.com";
const PAR_PAGE = 24;
const PAYPAL = "zertoproduction@gmail.com";   // adresse du compte PayPal Pro
const LICENCES = [
  { nom: "MP3", prix: 25, points: ["Fichier MP3 sans tag", "10 000 streams", "1 son, crédit (prod. Zerto)"] },
  { nom: "WAV", prix: 45, points: ["Fichiers WAV + MP3", "100 000 streams", "Clip YouTube monétisable"], top: true },
  { nom: "Pistes", prix: 90, points: ["WAV + pistes séparées", "500 000 streams", "Clip YouTube monétisable"] },
  { nom: "Exclusive", prix: null, points: ["Tous les fichiers", "Streams illimités", "Instru retirée de la vente"] },
];

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
  afficherLicences(b);
  document.querySelectorAll(".beat").forEach((el) => el.classList.toggle("actif", el.dataset.id === b.id));
}

function lienPaypal(licence, b) {
  const p = new URLSearchParams({
    cmd: "_xclick",
    business: PAYPAL,
    item_name: `Licence ${licence.nom} - ${b.nom.toUpperCase()} (prod. Zerto)`,
    item_number: b.id,
    amount: licence.prix.toFixed(2),
    currency_code: "EUR",
    no_shipping: "1",
    lc: "FR",
    return: location.origin + location.pathname + "#merci",
    cancel_return: location.origin + location.pathname + "#licences",
  });
  return `https://www.paypal.com/cgi-bin/webscr?${p}`;
}

function afficherLicences(b) {
  $("l-beat").textContent = b.nom.toUpperCase();
  $("offres").replaceChildren(...LICENCES.map((l) => {
    const el = document.createElement("div");
    el.className = "offre" + (l.top ? " top" : "");
    el.innerHTML = `<p class="offre-nom"></p><p class="offre-prix"></p><ul></ul><a class="btn"></a>`;
    el.querySelector(".offre-nom").textContent = l.nom;
    el.querySelector(".offre-prix").textContent = l.prix ? `${l.prix} €` : "Sur devis";
    el.querySelector("ul").replaceChildren(...l.points.map((t) => { const li = document.createElement("li"); li.textContent = t; return li; }));
    const a = el.querySelector("a");
    if (l.prix) {
      a.textContent = "Acheter";
      a.href = lienPaypal(l, b);
      a.target = "_blank";
      a.rel = "noopener";
      if (l.top) a.classList.add("btn-plein");
    } else {
      a.textContent = "Me contacter";
      a.href = mailto(`Exclusive - ${b.nom.toUpperCase()}`);
    }
    return el;
  }));
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
if (location.hash === "#merci") $("merci").hidden = false;

fetch("data/beats.json", { cache: "no-cache" })
  .then((r) => r.json())
  .then((data) => {
    beats = data;
    filtres = beats;
    if (beats.length) choisir(beats[0], false);
    afficher();
  })
  .catch(() => { $("vide").hidden = false; $("vide").textContent = "Impossible de charger les instrus."; });
