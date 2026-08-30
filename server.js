/* =====================================================================
   Cahier de Première — serveur de la couche IA
   ---------------------------------------------------------------------
   Sert l'application ET expose trois endpoints qui appellent Claude.
   La clé API ne quitte jamais cette machine : le navigateur ne la voit
   jamais, il parle uniquement à ce serveur.

   Démarrage :  npm start
   ===================================================================== */

import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";
// Zod 4 obligatoire : le helper du SDK fait `import * as z from 'zod'` puis
// appelle z.toJSONSchema(), qui n'existe pas en Zod 3. Voir package.json.
import { z } from "zod";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";

const ICI = path.dirname(fileURLToPath(import.meta.url));

/* ---------------------------- réglages ---------------------------- */
const PORT = Number(process.env.PORT || 3000);
const CODE_ACCES = process.env.CODE_ACCES || "";
const MODELE = process.env.MODELE || "claude-opus-5";
const PLAFOND_JOUR = Number(process.env.PLAFOND_JOUR || 150);

if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
  console.error(
    "\n  Aucune clé API trouvée.\n" +
      "  Copie .env.example en .env, renseigne ANTHROPIC_API_KEY, puis relance.\n",
  );
  process.exit(1);
}

// En ligne, le site est joignable par n'importe qui. Sans code d'accès,
// la clé API serait consommée par des inconnus : on refuse de démarrer.
const EN_LIGNE = !!(process.env.RENDER || process.env.CAHIER_PUBLIC);
if (EN_LIGNE && !CODE_ACCES) {
  console.error(
    "\n  CODE_ACCES est vide alors que le serveur est exposé publiquement.\n" +
      "  N'importe qui pourrait alors dépenser ta clé API.\n" +
      "  Ajoute la variable CODE_ACCES dans les réglages de l'hébergeur, puis relance.\n",
  );
  process.exit(1);
}

const claude = new Anthropic();
const app = express();
app.use(express.json({ limit: "12mb" })); // les photos arrivent en base64

/* ------------------ garde-fou : plafond d'appels / jour ------------------ */
/* Le plafond doit survivre à un redémarrage : sur une offre gratuite, le
   service s'endort et repart plusieurs fois par jour. Un compteur gardé en
   mémoire se remettrait à zéro à chaque réveil et ne protégerait rien.
   On l'écrit donc dans l'entrepôt, avec une opération atomique. */
let compteurMemoire = { jour: "", n: 0 };
function cleQuota() {
  return "cahier-premiere:quota:" + new Date().toISOString().slice(0, 10);
}
function enteteKV() {
  return { Authorization: `Bearer ${KV_TOKEN}` };
}

/* incrémente et renvoie le nouveau total, ou null si pas d'entrepôt */
async function incrementerQuota() {
  if (!KV_URL || !KV_TOKEN) return null;
  const cle = cleQuota();
  const r = await fetch(`${KV_URL}/incr/${cle}`, { headers: enteteKV() });
  if (!r.ok) throw new Error(`entrepôt injoignable (${r.status})`);
  const j = await r.json();
  if (j.error) throw new Error(`entrepôt : ${j.error}`);
  const n = Number(j.result);
  // première écriture de la journée : on programme l'effacement automatique
  if (n === 1) {
    fetch(`${KV_URL}/expire/${cle}/172800`, { headers: enteteKV() }).catch(() => {});
  }
  return n;
}

async function litQuota() {
  if (!KV_URL || !KV_TOKEN) {
    return compteurMemoire.jour === new Date().toDateString() ? compteurMemoire.n : 0;
  }
  try {
    const r = await fetch(`${KV_URL}/get/${cleQuota()}`, { headers: enteteKV() });
    const j = await r.json();
    return Number(j.result) || 0;
  } catch {
    return 0;
  }
}

async function consommer() {
  try {
    const n = await incrementerQuota();
    if (n !== null) return n <= PLAFOND_JOUR;
  } catch (e) {
    console.warn("[quota] entrepôt indisponible, repli en mémoire :", e.message);
  }
  // repli : sans entrepôt, ou s'il ne répond pas
  const aujourdhui = new Date().toDateString();
  if (compteurMemoire.jour !== aujourdhui) compteurMemoire = { jour: aujourdhui, n: 0 };
  if (compteurMemoire.n >= PLAFOND_JOUR) return false;
  compteurMemoire.n++;
  return true;
}

/* Limite par minute et par adresse : empêche qu'un clic répété ou une boucle
   dans le navigateur ne vide le plafond de la journée en quelques secondes. */
const PAR_MINUTE = Number(process.env.PAR_MINUTE || 6);
const recents = new Map();
function tropRapide(req) {
  const ip = (req.headers["x-forwarded-for"] || req.ip || "?").split(",")[0].trim();
  const t = Date.now();
  const liste = (recents.get(ip) || []).filter((x) => t - x < 60000);
  liste.push(t);
  recents.set(ip, liste);
  if (recents.size > 500) recents.clear(); // garde-fou mémoire
  return liste.length > PAR_MINUTE;
}

/* ------------------------- code d'accès ------------------------- */
function autorise(req, res, next) {
  if (!CODE_ACCES) return next(); // pas de code configuré = usage local seul
  if (req.get("X-Code") === CODE_ACCES) return next();
  return res.status(401).json({ erreur: "code d'accès invalide ou absent" });
}

/* --------------------- appel Claude, en texte --------------------- */
const SYSTEME_TUTEUR = `Tu es professeur de mathématiques en classe de Première (spécialité maths, programme français). Tu aides une élève débutante qui a besoin d'explications simples.

Règles de rédaction :
- Tutoie-la. Sois encourageante, jamais condescendante.
- Vise l'explication, pas la performance : phrases courtes, une idée à la fois.
- Nomme l'erreur de raisonnement quand tu en repères une, avant de donner la bonne méthode.
- Notation : encadre les maths par des dollars. Fractions @f{haut}{bas}, racines @r{contenu}, exposants ^{...}, indices _{...}, vecteurs @v{AB}. Exemple : "On calcule $x = @f{-b + @r{Δ}}{2a}$."
- Pas de titres markdown, pas de tableaux. Des paragraphes séparés par une ligne vide, et des listes avec des tirets si besoin.
- Vérifie chacun de tes calculs avant de l'écrire. Une correction fausse est pire que pas de correction.`;

// Streaming systématique : avec un raisonnement adaptatif et un effort élevé,
// une requête peut tourner plusieurs minutes. En non-streaming, la connexion
// finit par être coupée avant la fin (constaté à 182 s sur la génération de fiche).
async function demander({ system, content, maxTokens = 3000 }) {
  const flux = claude.beta.messages.stream({
    model: MODELE,
    max_tokens: maxTokens,
    thinking: { type: "adaptive" },
    output_config: { effort: "high" },
    system,
    messages: [{ role: "user", content }],
  });
  const reponse = await flux.finalMessage();
  if (reponse.stop_reason === "refusal") {
    throw new Error("Claude a refusé de répondre à cette demande.");
  }
  return reponse.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

/* décompose une image en dataURL vers le format attendu par l'API */
function blocImage(dataUrl) {
  const m = /^data:(image\/(?:png|jpe?g|webp|gif));base64,(.+)$/i.exec(
    String(dataUrl || ""),
  );
  if (!m) throw new Error("format d'image non reconnu (png, jpeg ou webp attendu)");
  return {
    type: "image",
    source: { type: "base64", media_type: m[1].toLowerCase(), data: m[2] },
  };
}

/* ============================ endpoints ============================ */

app.get("/api/ping", async (req, res) => {
  res.json({
    ok: true,
    modele: MODELE,
    restant: Math.max(0, PLAFOND_JOUR - (await litQuota())),
    codeRequis: !!CODE_ACCES,
    codeOk: !CODE_ACCES || req.get("X-Code") === CODE_ACCES,
  });
});

/* Écrit puis relit un témoin sur une clé séparée. La progression n'est
   jamais touchée : un diagnostic ne doit rien pouvoir casser. */
async function testerEcriture() {
  const marque = "diag-" + Date.now();
  if (KV_URL && KV_TOKEN) {
    const cle = "cahier-premiere:diag";
    const w = await fetch(`${KV_URL}/set/${cle}?EX=300`, {
      method: "POST", headers: enteteKV(), body: marque,
    });
    if (!w.ok) throw new Error(`écriture refusée par l'entrepôt (${w.status})`);
    const jw = await w.json().catch(() => ({}));
    if (jw.error) throw new Error(`entrepôt : ${jw.error}`);
    const r = await fetch(`${KV_URL}/get/${cle}`, { headers: enteteKV() });
    const j = await r.json();
    if (j.error) throw new Error(`entrepôt : ${j.error}`);
    return j.result === marque ? "ok" : "échec : la valeur relue ne correspond pas";
  }
  const f = path.join(DOSSIER_DONNEES, "diag.tmp");
  fs.writeFileSync(f, marque);
  const relu = fs.readFileSync(f, "utf8");
  fs.unlinkSync(f);
  return relu === marque ? "ok" : "échec : la valeur relue ne correspond pas";
}

/* Auto-test : une seule adresse à ouvrir après la mise en ligne pour savoir
   si le stockage fonctionne réellement. Ne consomme aucun appel à l'API. */
app.get("/api/diag", autorise, async (_req, res) => {
  const bilan = { stockage: STOCKAGE, lecture: null, ecriture: null, erreur: null };
  try {
    const avant = await lireEtat();
    bilan.lecture = avant ? `ok (maj ${new Date(avant.maj).toLocaleString("fr-FR")})` : "ok (vide)";
    // L'aller-retour d'écriture se fait sur une clé dédiée : le diagnostic
    // ne doit jamais toucher à la progression de l'élève, même vide.
    bilan.ecriture = await testerEcriture();
  } catch (e) {
    bilan.erreur = e.message;
  }
  res.status(bilan.erreur ? 503 : 200).json(bilan);
});

/* --- 0. progression partagée entre les appareils ---------------------
   Un seul cahier, stocké dans un fichier. Pas de compte, pas de mot de
   passe : le code d'accès du serveur suffit. Le champ maj (horodatage)
   empêche un appareil resté en arrière-plan d'écraser un travail plus
   récent fait ailleurs.
   ------------------------------------------------------------------- */
/* Deux stockages possibles, choisis automatiquement :
   - un fichier local, quand le serveur tourne à la maison ;
   - un entrepôt Upstash Redis, quand il tourne chez un hébergeur dont le
     disque est effacé à chaque redémarrage (Render, Vercel, Koyeb…).
   Il suffit de renseigner les deux variables Upstash pour basculer. */
const KV_URL = (process.env.UPSTASH_REDIS_REST_URL || "").replace(/\/+$/, "");
const KV_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || "";
const KV_CLE = "cahier-premiere:etat";
const STOCKAGE = KV_URL && KV_TOKEN ? "entrepôt Upstash" : "fichier local";

const DOSSIER_DONNEES = path.join(ICI, "donnees");
const FICHIER_ETAT = path.join(DOSSIER_DONNEES, "etat.json");
if (STOCKAGE === "fichier local") fs.mkdirSync(DOSSIER_DONNEES, { recursive: true });

async function lireEtat() {
  if (KV_URL && KV_TOKEN) {
    const r = await fetch(`${KV_URL}/get/${KV_CLE}`, {
      headers: { Authorization: `Bearer ${KV_TOKEN}` },
    });
    if (!r.ok) throw new Error(`entrepôt injoignable (${r.status})`);
    const j = await r.json();
    // Upstash signale ses erreurs dans le corps, parfois avec un HTTP 200
    if (j.error) throw new Error(`entrepôt : ${j.error}`);
    return j.result ? JSON.parse(j.result) : null;
  }
  try {
    return JSON.parse(fs.readFileSync(FICHIER_ETAT, "utf8"));
  } catch {
    return null;
  }
}

async function ecrireEtat(o) {
  if (KV_URL && KV_TOKEN) {
    const r = await fetch(`${KV_URL}/set/${KV_CLE}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${KV_TOKEN}` },
      body: JSON.stringify(o),
    });
    if (!r.ok) throw new Error(`écriture refusée par l'entrepôt (${r.status})`);
    const j = await r.json().catch(() => ({}));
    if (j.error) throw new Error(`entrepôt : ${j.error}`);
    return;
  }
  const tmp = FICHIER_ETAT + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(o));
  fs.renameSync(tmp, FICHIER_ETAT); // écriture atomique : jamais de fichier à moitié écrit
}

app.get("/api/etat", autorise, async (_req, res) => {
  try {
    res.json((await lireEtat()) || { maj: 0, etat: null });
  } catch (e) {
    console.error("[etat/lecture]", e.message);
    res.status(503).json({ erreur: messageLisible(e) });
  }
});

app.put("/api/etat", autorise, async (req, res) => {
  const { maj, etat } = req.body || {};
  if (!etat || typeof etat !== "object")
    return res.status(400).json({ erreur: "état manquant" });
  try {
    const actuel = await lireEtat();
    if (actuel && actuel.maj > (maj || 0)) {
      // le serveur détient plus récent : on ne l'écrase pas, on le renvoie
      return res.status(409).json({ erreur: "version plus récente sur le serveur", ...actuel });
    }
    const horodatage = maj || Date.now();
    await ecrireEtat({ maj: horodatage, etat });
    res.json({ ok: true, maj: horodatage });
  } catch (e) {
    console.error("[etat/ecriture]", e.message);
    res.status(503).json({ erreur: messageLisible(e) });
  }
});

/* --- 1. réexpliquer un exercice du cahier --- */
app.post("/api/expliquer", autorise, async (req, res) => {
  if (tropRapide(req))
    return res.status(429).json({ erreur: "trop de demandes d'affilée — attends une minute" });
  const { enonce, correction, question, reussi } = req.body || {};
  if (!enonce) return res.status(400).json({ erreur: "énoncé manquant" });
  // le quota se consomme seulement une fois la requête reconnue valide
  if (!(await consommer()))
    return res.status(429).json({ erreur: "plafond d'appels du jour atteint" });
  try {

    const texte = await demander({
      system: SYSTEME_TUTEUR,
      maxTokens: 2500,
      content: [
        {
          type: "text",
          text:
            `Exercice :\n${enonce}\n\n` +
            `Correction officielle du cahier :\n` +
            (Array.isArray(correction) ? correction.join("\n") : String(correction || "")) +
            `\n\nL'élève ${reussi ? "a réussi" : "s'est trompée"}.\n\n` +
            `Sa demande : ${question || "Explique-moi autrement."}\n\n` +
            `Reste cohérente avec la correction officielle ci-dessus : elle est vérifiée. ` +
            `Ton rôle est de la rendre compréhensible, pas de proposer un autre résultat.`,
        },
      ],
    });
    res.json({ texte });
  } catch (e) {
    console.error("[expliquer]", e.message);
    res.status(502).json({ erreur: messageLisible(e) });
  }
});

/* --- 2. corriger une photo de travail manuscrit --- */
app.post("/api/photo", autorise, async (req, res) => {
  if (tropRapide(req))
    return res.status(429).json({ erreur: "trop de demandes d'affilée — attends une minute" });
  const { image, question } = req.body || {};
  if (!image) return res.status(400).json({ erreur: "image manquante" });
  if (!(await consommer()))
    return res.status(429).json({ erreur: "plafond d'appels du jour atteint" });
  try {

    const texte = await demander({
      system: SYSTEME_TUTEUR,
      maxTokens: 3000,
      content: [
        blocImage(image),
        {
          type: "text",
          text:
            `Voici la photo du travail de l'élève.\n\n` +
            (question ? `Sa question : ${question}\n\n` : "") +
            `Procède dans cet ordre :\n` +
            `1. Dis ce que tu lis (l'énoncé et ce qu'elle a écrit). Si un passage est illisible, dis-le franchement plutôt que de deviner.\n` +
            `2. Indique si le raisonnement est juste. Si non, cite la première ligne où ça dérape et explique l'erreur de raisonnement qui l'a produite.\n` +
            `3. Donne la méthode correcte, étape par étape.\n` +
            `4. Termine par une phrase sur le réflexe à prendre pour éviter cette erreur la prochaine fois.`,
        },
      ],
    });
    res.json({ texte });
  } catch (e) {
    console.error("[photo]", e.message);
    res.status(502).json({ erreur: messageLisible(e) });
  }
});

/* --- 3. fabriquer une fiche complète à partir d'un cours --- */
const Formule = z.object({ titre: z.string(), x: z.string(), note: z.string() });
const Etape = z.object({ q: z.string(), r: z.string() });
const Exemple = z.object({
  titre: z.string(),
  enonce: z.string(),
  etapes: z.array(Etape),
});
const Section = z.object({
  titre: z.string(),
  idee: z.string(),
  explication: z.string(),
  formules: z.array(Formule),
  exemple: Exemple,
  piege: z.string(),
});
const ExoQcm = z.object({
  type: z.literal("qcm"),
  niveau: z.number(),
  enonce: z.string(),
  choix: z.array(z.string()),
  bonne: z.number(),
  diag: z.array(z.string()),
  corr: z.array(z.string()),
  indice: z.string(),
});
const ExoNum = z.object({
  type: z.literal("num"),
  niveau: z.number(),
  enonce: z.string(),
  rep: z.number(),
  tol: z.number(),
  diag: z.array(z.object({ v: z.number(), m: z.string() })),
  corr: z.array(z.string()),
  indice: z.string(),
});
const FicheSchema = z.object({
  titre: z.string(),
  resume: z.string(),
  prerequis: z.array(z.string()),
  sections: z.array(Section),
  exercices: z.array(z.union([ExoQcm, ExoNum])),
});

const SYSTEME_FICHE = `Tu es professeur de mathématiques en Première (spécialité maths, programme français). Tu transformes un cours en fiche pédagogique pour une élève débutante.

- Tutoie-la, explique simplement, une idée à la fois.
- Pour CHAQUE mauvaise réponse d'un QCM, le champ diag doit expliquer l'erreur de raisonnement qui y mène, pas seulement dire que c'est faux. C'est le cœur de la fiche.
- Le champ diag de la bonne réponse doit être une chaîne vide.
- Le champ bonne est l'indice (0, 1, 2 ou 3) de la bonne réponse dans le tableau choix.
- Pour les exercices num, aucune valeur du tableau diag ne doit être égale à rep.
- Notation : maths entre dollars, fractions @f{haut}{bas}, racines @r{contenu}, exposants ^{...}, indices _{...}, vecteurs @v{AB}.
- 3 à 6 sections, 6 à 10 exercices du plus simple au plus complet.
- Vérifie tes calculs. Un exercice dont la réponse est fausse est pire qu'un exercice absent.`;

app.post("/api/fiche", autorise, async (req, res) => {
  if (tropRapide(req))
    return res.status(429).json({ erreur: "trop de demandes d'affilée — attends une minute" });
  const { titre, texte, image } = req.body || {};
  if (!texte && !image)
    return res.status(400).json({ erreur: "aucun contenu à traiter" });
  if (!(await consommer()))
    return res.status(429).json({ erreur: "plafond d'appels du jour atteint" });
  try {

    const content = [];
    if (image) content.push(blocImage(image));
    content.push({
      type: "text",
      text:
        (titre ? `Titre indiqué par l'élève : ${titre}\n\n` : "") +
        (image ? "Le cours est sur l'image ci-dessus.\n\n" : "") +
        (texte ? `Cours à traiter :\n\n${texte}` : ""),
    });

    const flux = claude.beta.messages.stream({
      model: MODELE,
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      output_config: {
        effort: "high",
        format: betaZodOutputFormat(FicheSchema),
      },
      system: SYSTEME_FICHE,
      messages: [{ role: "user", content }],
    });
    const reponse = await flux.finalMessage();

    if (reponse.stop_reason === "refusal")
      throw new Error("Claude a refusé de traiter ce document.");

    // Le SDK remplit parsed_output quand il a pu valider lui-même. Sinon on
    // relit le texte brut : la sortie structurée est du JSON, donc récupérable.
    let brut = reponse.parsed_output;
    if (!brut) {
      const texte = reponse.content
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("")
        .trim();
      console.warn(
        `[fiche] parsed_output vide — stop_reason=${reponse.stop_reason}, ` +
          `${texte.length} caractères de texte`,
      );
      if (reponse.stop_reason === "max_tokens")
        throw new Error(
          "la réponse a été tronquée avant la fin — importe le cours en plusieurs morceaux plus courts",
        );
      try {
        brut = FicheSchema.parse(JSON.parse(texte));
      } catch (e2) {
        console.warn("[fiche] début du texte reçu :", texte.slice(0, 300));
        throw new Error(
          `la fiche renvoyée n'a pas pu être validée (${reponse.stop_reason}, ${texte.length} caractères)`,
        );
      }
    }

    const fiche = verifier(brut);
    res.json({ fiche });
  } catch (e) {
    console.error("[fiche]", e.message);
    res.status(502).json({ erreur: messageLisible(e) });
  }
});

/* ---------------------------------------------------------------------
   Garde-fou déterministe : quoi que renvoie le modèle, on écarte tout
   exercice incohérent avant de le servir à l'élève. Le code a le dernier
   mot sur ce qui est présenté comme un exercice corrigé.
   --------------------------------------------------------------------- */
function verifier(fiche) {
  const gardes = [];
  const exercices = (fiche.exercices || []).filter((x, i) => {
    if (x.type === "qcm") {
      if (!Array.isArray(x.choix) || x.choix.length < 2) return rejeter(i, "choix manquants");
      if (!(x.bonne >= 0 && x.bonne < x.choix.length)) return rejeter(i, "bonne réponse hors bornes");
      if (new Set(x.choix).size !== x.choix.length) return rejeter(i, "choix en double");
      if (!Array.isArray(x.diag) || x.diag.length !== x.choix.length)
        return rejeter(i, "diagnostics désalignés");
      for (let k = 0; k < x.choix.length; k++)
        if (k !== x.bonne && !String(x.diag[k] || "").trim())
          return rejeter(i, "diagnostic vide");
      x.diag[x.bonne] = "";
    } else {
      if (!Number.isFinite(x.rep)) return rejeter(i, "réponse non numérique");
      // Le modèle renvoie souvent tol = 0, ce qui rejetterait 0,333 pour 1/3.
      // On impose un plancher : une tolérance nulle n'a pas de sens ici.
      const tol = Number.isFinite(x.tol) && Math.abs(x.tol) > 0 ? Math.abs(x.tol) : 0.001;
      x.tol = tol;
      // un distracteur qui vaut la bonne réponse déclarerait fausse une réponse juste
      x.diag = (x.diag || []).filter((d) => Number.isFinite(d.v) && Math.abs(d.v - x.rep) > tol);
    }
    if (!Array.isArray(x.corr) || !x.corr.length) return rejeter(i, "correction vide");
    if (!String(x.indice || "").trim()) x.indice = "Relis la partie du cours qui traite de cette notion.";
    return true;
  });

  function rejeter(i, raison) {
    gardes.push(`exercice ${i + 1} écarté : ${raison}`);
    return false;
  }
  if (gardes.length) console.warn("[fiche] " + gardes.join(" · "));

  return {
    titreSuggere: fiche.titre,
    resume: fiche.resume,
    prerequis: fiche.prerequis || [],
    auto: false,
    sections: fiche.sections || [],
    exercices: exercices.map((x, i) => ({
      ...x,
      id: "ia" + i + "_" + Math.random().toString(36).slice(2, 6),
    })),
  };
}

function messageLisible(e) {
  const m = String(e && e.message ? e.message : e);
  if (/401|authentication/i.test(m)) return "clé API refusée — vérifie ANTHROPIC_API_KEY dans .env";
  if (/429|rate.?limit/i.test(m)) return "trop de demandes d'affilée, réessaie dans une minute";
  if (/timeout|ETIMEDOUT|ENOTFOUND|ECONNREFUSED/i.test(m)) return "le serveur n'a pas pu joindre l'API — vérifie ta connexion";
  return m;
}

/* --------------------------- l'application --------------------------- */
app.use(express.static(path.join(ICI, "public")));

app.listen(PORT, () => {
  console.log(`\n  Cahier de Première — http://localhost:${PORT}`);
  console.log(`  Modèle : ${MODELE}`);
  console.log(`  Plafond : ${PLAFOND_JOUR} appels par jour`);
  console.log(`  Progression : ${STOCKAGE}`);
  console.log(CODE_ACCES ? "  Code d'accès : activé\n" : "  Code d'accès : désactivé (usage local)\n");
});
