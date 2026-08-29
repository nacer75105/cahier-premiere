# Cahier de Première — version connectée

L'application de maths, servie depuis ton PC, avec trois fonctions qui appellent Claude :

- **Expliquer autrement** — sous chaque exercice corrigé, un bouton qui reprend l'explication différemment
- **Corriger une photo** — photographier un exercice fait à la main et se faire dire où le raisonnement dérape
- **Fiche automatique** — importer un cours (texte, PDF, photo) et obtenir directement une fiche complète, sans copier-coller

La clé API reste sur cette machine. Le navigateur ne la voit jamais : il parle uniquement à ce serveur.

---

## Installation, une seule fois

1. **Node.js 20.6 ou plus** doit être installé — vérifie avec :

```bash
node --version
```

2. **Installer les dépendances** (déjà fait si tu lis ce fichier depuis le dossier livré) :

```bash
npm install
```

3. **Créer le fichier `.env`** à partir du modèle :

```bash
copy .env.example .env
```

4. **Ouvrir `.env`** et coller ta clé API à la place de `sk-ant-...`. Tu la crées sur
   https://console.anthropic.com → *API keys*.

---

## Démarrer

```bash
npm start
```

Puis ouvrir **http://localhost:3000** dans le navigateur.

Pour arrêter : `Ctrl + C` dans le terminal.

---

## Depuis le téléphone

Tant que le téléphone est sur le **même Wi-Fi** que le PC :

1. Trouver l'adresse locale du PC :

```bash
ipconfig
```

Repérer la ligne « Adresse IPv4 », par exemple `192.168.1.24`.

2. Sur le téléphone, ouvrir `http://192.168.1.24:3000`

3. Ajouter la page à l'écran d'accueil — elle s'ouvrira comme une application.

Le PC doit rester allumé et le serveur démarré. Le pare-feu Windows demandera
l'autorisation au premier lancement : il faut l'accorder pour le réseau privé.

> **Si tu ouvres le serveur au-delà de ton Wi-Fi** (redirection de port, tunnel,
> hébergement), renseigne `CODE_ACCES` dans `.env`. Sans lui, n'importe qui
> connaissant l'adresse pourrait consommer ta clé API.

---

## Réglages (`.env`)

| Variable | Rôle |
|---|---|
| `ANTHROPIC_API_KEY` | Ta clé API. Obligatoire. |
| `MODELE` | `claude-opus-5` par défaut — le plus fiable en calcul. `claude-sonnet-5` coûte environ 2,5 fois moins cher, avec un peu plus de risque d'erreur. |
| `PLAFOND_JOUR` | Nombre maximum d'appels par jour (150 par défaut). Garde-fou contre une facture qui s'emballe. Se remet à zéro chaque jour. |
| `PORT` | Port du serveur (3000 par défaut). |
| `CODE_ACCES` | Laisse vide en usage local. À renseigner dès que le serveur est joignable depuis l'extérieur. |

---

## Ce qui protège des erreurs de l'IA

Un modèle de langage peut se tromper sur un calcul. Trois garde-fous :

1. **Les 91 exercices des chapitres ne passent jamais par l'IA.** Leurs corrections
   et leurs diagnostics d'erreur sont écrits et vérifiés. L'IA ne peut que les
   reformuler, jamais les remplacer — le serveur le lui dit explicitement.

2. **Les fiches générées sont validées avant d'être servies.** Le serveur vérifie
   la structure (schéma strict), puis écarte tout exercice incohérent : bonne
   réponse hors bornes, choix en double, diagnostic manquant, réponse non
   numérique, ou distracteur égal à la bonne réponse — ce dernier cas déclarerait
   fausse une réponse juste. Les exercices écartés sont signalés dans la console.

3. **La correction de photo est signalée comme telle** dans l'interface : utile
   pour comprendre, mais en cas de désaccord avec le cahier, c'est le cahier
   qui a raison.

---

## Durées et coûts réels (mesurés)

| Action | Durée | Coût |
|---|---|---|
| Expliquer autrement / approfondir | ~20 à 40 s | ~0,03 à 0,05 $ |
| Corriger une photo | ~30 à 60 s | ~0,05 $ |
| Générer une fiche complète | **~2 minutes** | ~0,15 $ |

La génération de fiche est longue parce qu'elle rédige cinq parties et une
dizaine d'exercices avec leurs diagnostics d'erreur. C'est normal : l'interface
affiche « Claude travaille… » pendant ce temps. Ne relance pas, attends.

`PLAFOND_JOUR` borne le pire cas. À 150 appels, le plafond théorique est
d'environ 8 $ par jour — mets-le à 30 pour la première semaine, le temps de voir
l'usage réel sur https://console.anthropic.com → *Usage*.

## Progression partagée entre les appareils

Quand la page est servie par ce serveur, la progression n'est plus stockée dans
le navigateur mais dans `donnees/etat.json`. Concrètement : les exercices
validés, les cartes de révision, les contrôles et les fiches importées suivent
d'un appareil à l'autre.

- Au chargement, l'application adopte la version du serveur si elle est plus récente.
- Ensuite, chaque changement y est renvoyé automatiquement (1,5 s après le dernier).
- Un appareil resté ouvert en arrière-plan ne peut pas écraser un travail plus
  récent fait ailleurs : le serveur refuse (code 409) et lui renvoie la bonne version.

**Le dossier `donnees/` contient tout le travail de l'élève.** Sauvegarde-le de
temps en temps. Il est exclu de Git, comme `.env`.

## Notes techniques

- **Zod 4 est obligatoire.** Le helper de sortie structurée du SDK appelle
  `z.toJSONSchema()`, qui n'existe pas en Zod 3. Ne redescends pas en `zod@3`.
- **Les trois appels passent en streaming.** En non-streaming, la génération de
  fiche coupait la connexion au bout de ~180 s.
- **`parsed_output` reste vide sur le chemin streaming** du SDK : le serveur
  relit alors le texte brut et le valide lui-même avec le schéma Zod. Les deux
  chemins sont couverts, il n'y a rien à faire.

---

## Structure

```
cahier-premiere/
  server.js        le serveur : 3 endpoints + les garde-fous
  public/
    index.html     l'application complète (autonome, un seul fichier)
  .env             ta clé API — jamais versionné
  .env.example     le modèle à copier
```

L'application dans `public/` **fonctionne aussi sans serveur** : ouverte
directement, elle détecte l'absence de `/api/ping` et masque les fonctions IA.
Les 10 chapitres, les 91 exercices, l'entraînement généré, le mode contrôle et
la révision espacée fonctionnent hors ligne, sans rien coûter.
