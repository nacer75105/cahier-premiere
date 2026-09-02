# Cahier de Première — version connectée

## Nouveautés

- **Une zone vidéo par chapitre.** Un bouton ouvre la recherche YouTube déjà
  remplie avec le titre du chapitre ; on copie l'adresse de la vidéo choisie et
  on la colle. Elle est rangée avec la progression et suit d'un appareil à
  l'autre. YouTube (par son domaine sans cookie), Vimeo, Dailymotion et les
  fichiers `.mp4` sont acceptés, le reste est refusé avec une explication.
  Aucun lien n'est fourni d'avance : une adresse inventée mène à une page morte,
  ce qui serait pire que pas de vidéo du tout.
- **Vingt-et-une fiches « la méthode, pas à pas »** (deux par chapitre, trois pour
  les variables aléatoires depuis l'ajout de la loi binomiale), chacune suivie
  de son application sur un exemple chiffré. L'aide-mémoire a désormais deux
  onglets : les formules pour réviser, les méthodes pour savoir par où commencer.
- **Deux défauts d'affichage corrigés** : les nombres décimaux montraient leurs
  accolades (« 1{,}05 »), et les formules à exposant comme la somme d'une suite
  géométrique ne s'affichaient pas du tout — seulement leur code.

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

1. **Les 96 exercices des chapitres ne passent jamais par l'IA.** Leurs corrections
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

## Mettre en ligne (Render + Upstash, gratuit)

Une fois en ligne, l'application est joignable de partout, iPhone compris,
PC éteint — avec l'IA et la progression synchronisée.

### 1. L'entrepôt de progression (Upstash)

Le disque des hébergeurs gratuits est effacé à chaque redémarrage. La
progression va donc dans un entrepôt externe.

1. Créer un compte sur https://upstash.com (gratuit, connexion GitHub possible)
2. **Create Database** → un nom, la région la plus proche (Europe), **Free**
3. Dans l'onglet **REST API** de la base, relever les deux valeurs
   `UPSTASH_REDIS_REST_URL` et `UPSTASH_REDIS_REST_TOKEN`

### 2. L'hébergement (Render)

1. Créer un compte sur https://render.com et le connecter à GitHub
2. **New → Blueprint** (et non « Web Service » : seul le Blueprint lit `render.yaml`)
3. Choisir le dépôt `cahier-premiere` → **Connect**
4. Render lit `render.yaml` et demande la valeur des variables marquées
   `sync: false`. Renseigner les quatre :

| Variable | Valeur |
|---|---|
| `ANTHROPIC_API_KEY` | ta clé API |
| `CODE_ACCES` | un mot de passe simple, à donner à l'élève |
| `UPSTASH_REDIS_REST_URL` | relevée à l'étape 1 |
| `UPSTASH_REDIS_REST_TOKEN` | relevée à l'étape 1 |

5. **Create Web Service**. Le premier démarrage prend 2 à 3 minutes.

> **`CODE_ACCES` est obligatoire en ligne.** Le serveur refuse de démarrer sans
> lui et l'écrit dans les journaux : sans code, n'importe qui pourrait dépenser
> ta clé API. L'élève le saisit une seule fois par appareil.

### 3. Vérifier que le stockage marche

Ouvrir l'adresse fournie par Render, saisir le code, puis visiter :

```
https://<ton-adresse>.onrender.com/api/diag
```

La réponse attendue :

```json
{"stockage":"entrepôt Upstash","lecture":"ok (vide)","ecriture":"ok","erreur":null}
```

Si `erreur` n'est pas `null`, le message dit ce qui coince (jeton refusé,
entrepôt injoignable…). Cet auto-test ne consomme aucun appel à l'API Claude.

### Ce qu'il faut savoir de l'offre gratuite Render

- **Mise en veille** après 15 minutes sans visite : le réveil prend 30 à 50 s
  à la première ouverture, puis tout est fluide.
- **Le disque est effacé** à chaque redémarrage — d'où Upstash. Si tu ne
  renseignes pas les deux variables Upstash, le serveur retombe sur le fichier
  local et la progression sera perdue à chaque redéploiement. Il l'annonce au
  démarrage : `Progression : fichier local`.

## Garde-fous sur les coûts

Trois protections se cumulent :

- `CODE_ACCES` : sans lui, le serveur refuse de démarrer en ligne.
- `PAR_MINUTE` (6 par défaut) : nombre maximum de demandes par minute et par
  adresse. Empêche qu'un clic répété ou une boucle vide le plafond du jour.
- `PLAFOND_JOUR` : nombre maximum d'appels par jour. **Il est stocké dans
  Upstash**, pas en mémoire : un redémarrage de l'hébergeur ne le remet pas à
  zéro. Sans entrepôt configuré, il retombe sur un compteur en mémoire, qui ne
  protège que tant que le service ne redémarre pas.

Une requête mal formée ne consomme aucun quota : la validation passe avant.

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
Les 10 chapitres, les 96 exercices, l'entraînement généré, le mode contrôle et
la révision espacée fonctionnent hors ligne, sans rien coûter.
