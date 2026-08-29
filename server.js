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

const claude = new Anthropic();
const app = express();
app.use(express.json({ limit: "12mb" })); // les photos arrivent en base64

/* ------------------ garde-fou : plafond d'appels / jour ------------------ */
let compteur = { jour: new Date().toDateString(), n: 0 };
function consommer() {
  const aujourdhui = new Date().toDateString();
  if (compteur.jour !== aujourdhui) compteur = { jour: aujourdhui, n: 0 };
  if (compteur.n >= PLAFOND_JOUR) return false;
  compteur.n++;
  return true;
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

app.get("/api/ping", (_req, res) => {
  res.json({ ok: true, modele: MODELE, restant: PLAFOND_JOUR - compteur.n });
});

/* --- 0. progression partagée entre les appareils ---------------------
   Un seul cahier, stocké dans un fichier. Pas de compte, pas de mot de
   passe : le code d'accès du serveur suffit. Le champ maj (horodatage)
   empêche un appareil resté en arrière-plan d'écraser un travail plus
   récent fait ailleurs.
   ------------------------------------------------------------------- */
const DOSSIER_DONNEES = path.join(ICI, "donnees");
const FICHIER_ETAT = path.join(DOSSIER_DONNEES, "etat.json");
fs.mkdirSync(DOSSIER_DONNEES, { recursive: true });

function lireEtat() {
  try {
    return JSON.parse(fs.readFileSync(FICHIER_ETAT, "utf8"));
  } catch {
    return null;
  }
}
function ecrireEtat(o) {
  const tmp = FICHIER_ETAT + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(o));
  fs.renameSync(tmp, FICHIER_ETAT); // écriture atomique : jamais de fichier à moitié écrit
}

app.get("/api/etat", autorise, (_req, res) => {
  res.json(lireEtat() || { maj: 0, etat: null });
});

app.put("/api/etat", autorise, (req, res) => {
  const { maj, etat } = req.body || {};
  if (!etat || typeof etat !== "object")
    return res.status(400).json({ erreur: "état manquant" });
  const actuel = lireEtat();
  if (actuel && actuel.maj > (maj || 0)) {
    // le serveur détient plus récent : on ne l'écrase pas, on le renvoie
    return res.status(409).json({ erreur: "version plus récente sur le serveur", ...actuel });
  }
  const horodatage = maj || Date.now();
  ecrireEtat({ maj: horodatage, etat });
  res.json({ ok: true, maj: horodatage });
});

/* --- 1. réexpliquer un exercice du cahier --- */
app.post("/api/expliquer", autorise, async (req, res) => {
  if (!consommer())
    return res.status(429).json({ erreur: "plafond d'appels du jour atteint" });
  try {
    const { enonce, correction, question, reussi } = req.body || {};
    if (!enonce) return res.status(400).json({ erreur: "énoncé manquant" });

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
  if (!consommer())
    return res.status(429).json({ erreur: "plafond d'appels du jour atteint" });
  try {
    const { image, question } = req.body || {};
    if (!image) return res.status(400).json({ erreur: "image manquante" });

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
  if (!consommer())
    return res.status(429).json({ erreur: "plafond d'appels du jour atteint" });
  try {
    const { titre, texte, image } = req.body || {};
    if (!texte && !image)
      return res.status(400).json({ erreur: "aucun contenu à traiter" });

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
  console.log(CODE_ACCES ? "  Code d'accès : activé\n" : "  Code d'accès : désactivé (usage local)\n");
});
