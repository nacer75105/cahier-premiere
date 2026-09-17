# À vérifier

## Test eleve-adversaire (2026-09-15) — à traiter dans un chantier dédié

Le test à l'aveugle (répondre aux QCM des 3 chapitres sans connaître le
sujet) donne 20/26 questions devinables (77%), très au-dessus du seuil
de 40%. Deux causes :

1. **Biais de position cyclique — corrigé.** La "randomisation" de fin
   de chantier que j'avais appliquée moi-même (redistribuer `bonne`
   entre 0-3) suivait en réalité un cycle fixe 3→0→1→2 répété dans
   chaque chapitre — un biais mécanique tout aussi prévisible que
   "toujours 0", juste déguisé. Reposition aléatoire (vraie, vérifiée
   sans progression arithmétique constante) appliquée aux 26 QCM des
   trois chapitres.
2. **Distracteurs "erreurs partielles" — non corrigé, chantier de
   fond.** Sur la plupart des questions de calcul, les distracteurs
   sont des fragments de l'erreur typique (un signe changé, un
   exposant oublié...), ce qui fait que la bonne réponse est souvent
   la seule à cumuler les caractéristiques majoritaires des autres
   options (repérable par simple comptage de fréquence, sans rien
   calculer). Corriger ça demande de réécrire la formulation de
   nombreux distracteurs (pas juste leur position), question par
   question — un travail de fond distinct des corrections de bugs
   déjà faites. Voir le rapport complet de l'agent pour le détail
   question par question (de13, de15, va9, va15, gr1, gr10, gr12
   notamment cités comme les plus faciles à deviner).
   Bonus signalé : `de9` (Dérivation) et le `check` de la ligne ~1511
   posent exactement la même question avec le même jeu d'options —
   doublon à fusionner ou différencier.

Points signalés par la relecture (`relecteur-maths`) classés comme
« organisationnels » — pas des erreurs de justesse, donc non corrigés
dans l'immédiat, mais à traiter un jour pour la qualité pédagogique.
Les points « BLOQUANT » et les points « À REVOIR » touchant la justesse
(diagnostics faux/intervertis, rendu LaTeX cassé, biais de position des
QCM, cas dégénéré) ont été corrigés directement dans `public/index.html`
(et synchronisés dans `docs/index.html`).

## Suites numériques (chapitre 1)

- Encadré "Deux façons de définir une suite" (L.682) utilise encore "Par
  récurrence" alors que les deux encadrés voisins ("Les deux formules à
  connaître", section arithmétique L.705 et géométrique L.722) ont été
  alignés sur l'étiquette "(relation de récurrence)" lors de la passe
  pédagogique du 2026-09-17 — reste à harmoniser ce troisième encadré.
- Figure `suites-comparaison` tracée avec `graduations:false` : les
  valeurs citées dans le texte qui l'entoure ("elle est déjà à 27",
  "n'est qu'à 15") ne sont lisibles nulle part sur le dessin — l'élève
  doit croire le texte sur parole plutôt que de le vérifier à l'œil.
- `check` "Une population diminue de 5 % par an" (~L.783) : `expl[0]`
  (l'explication censée accompagner la bonne réponse) est une chaîne
  vide. Une élève qui répond juste voit "✓ C'est ça" suivi de rien,
  contrairement à l'autre `check` du même chapitre (~L.693) qui
  explique aussi pourquoi la bonne réponse est bonne.

## Dérivation (chapitre 3)

- Deux pièges "dérivée nulle ≠ extremum" quasi identiques et redondants
  (piège après L.1451 et piège après L.1454 dans le fichier avant
  correction) — à fusionner en un seul.
- Tension entre "un extremum se trouve **toujours** là où $f'$ s'annule"
  et la remarque ultérieure sur les extremums aux bornes d'un intervalle
  — les extremums aux bornes ne sont jamais mentionnés dans la partie
  théorique du cours.
- La dérivabilité des fonctions du programme est utilisée sans jamais
  signaler explicitement qu'on l'admet.
- La figure `fonction-derivee` change de fonction ($x^2$ dans le texte
  qui précède, $x^3/3-x$ dans le modèle réel) sans jamais nommer $f$ ni
  $f'$ sur les deux panneaux.
- La description de la figure `fonction-derivee` ("le graphique de
  droite **ajoute** le point") ne correspond pas exactement au
  comportement du tracé (la courbe s'efface si on recule le curseur).
- Aucune fiche méthode "dresser un tableau de variations", alors que le
  cours la qualifie lui-même d'"aboutissement du chapitre".
- Couverture des exercices : aucun ne demande de dresser un tableau de
  variations, ni ne fait intervenir $\sqrt{x}$, ni ne fait travailler
  "traduire un problème en fonction".
- L.1660 (de13) : l'intervalle de décroissance est donné en ouvert
  ($]-1;1[$) alors que le cours utilise ailleurs des crochets fermés
  aux points où $f'$ s'annule — inconsistance de convention, pas une
  erreur de fond.
- Générateur `de-tangente` : affichage `x − -2` au lieu de `x − (-2)`
  quand $k<0$ (parenthésage manquant dans l'affichage, présent dans le
  corrigé).
- Générateur `de-poly` : distracteur peu crédible (deux constantes non
  réduites affichées côte à côte).
- "Voici les **trois** autres situations du programme" alors que
  quatre formules suivent (produit, quotient, inverse, racine).
- Figure `tangente` : `figNote` non passée par `T(...)` (contrairement
  aux trois autres figures du chapitre) — sans risque actuellement (pas
  de `$` ni `**` dans le texte), mais fragile pour un futur ajout.
- Figure `tangente` : débordement possible du point A en bout de course
  du curseur (visible seulement grâce à `overflow:visible`).
- Figure `sécante` : triangle des accroissements non légendé (segments
  pointillés sans libellé).
- "Les valeurs se resserrent **autour** de 2" (L.1383) : en réalité
  elles décroissent vers 2 par valeurs supérieures uniquement.
- Sur la figure `signe-variation`, pile à $a=-1$ (un des deux
  extremums, atteignable par pas de 0,05 depuis $-2{,}2$), la lecture
  affiche "f′(a) = 0 ... la courbe descend" (effet de bord de
  `zoneDe`), alors que c'est justement le point où la courbe change de
  sens — pas une vraie erreur (l'affichage "0" prime visuellement) mais
  à améliorer.
- Aucune des quatre figures interactives du chapitre n'affiche
  l'expression de $f(x)$ à l'écran ; l'élève doit deviner quelle
  fonction elle manipule (deux figures tracent $f(x)=x^2$ dans le
  texte qui les entoure mais $x^3/3-x$ dans le modèle réel).
- Le bloc "idee" ajouté pour construire l'équation de la tangente
  s'appuie sur la forme "point-pente" $y=m(x-x_0)+y_0$, qui n'est pas
  exactement la forme vue en Seconde ($y=mx+p$) ni justifiée par une
  vérification explicite (pour $x=x_0$ on retrouve $y=y_0$).
- Deux pièges "dérivée nulle n'implique pas extremum" restent
  redondants dans la même section (même contre-exemple $x^3$, même
  conclusion, à cinq blocs d'écart).
- Le diagnostic du `check` "$4x+9$" (L.1442) ne mentionne que l'oubli
  de l'exposant, pas le $+9$ recopié — qui est pourtant la deuxième
  erreur du même distracteur.
- L'intuition du produit (rectangle $u \times v$) ne signale pas
  qu'elle suppose implicitement $u,v>0$, alors que l'intuition du
  quotient le précise désormais pour $v$.

## Variables aléatoires (chapitre 9)

- Le "Récapitulatif : trois nombres pour résumer le hasard" est placé
  avant la section sur la loi binomiale et ferme le chapitre au milieu.
- La figure `loi-binomiale` n'a aucun texte d'accompagnement (contexte
  et manipulation), contrairement aux deux autres figures du chapitre.
- Étiquettes de barres de la figure `loi-binomiale` qui perdent leur
  "0" (affichage ",25" au lieu de "0,25").
- Titre de la figure `dispersion-variance` ("Même espérance,
  dispersions opposées") qui ne correspond pas à ce que montre la
  figure (une seule loi symétrique, écart variable).
- $@f{1}{6}^2$ rendu sans parenthèses (ambigu avec $1/(6^2)$).
- Le raccourci de König-Huygens est présenté comme général après une
  seule vérification numérique, sans dire "on l'admet" (contrairement
  à la remarque sur la valeur absolue, plus haut dans le même chapitre).
- $\sigma$ n'est jamais nommée "sigma" dans le texte.
- Le "jeu du dé à 0,17€" est cité dans le texte avant que l'exercice
  correspondant (`va3`) n'ait été vu.
- La section échantillonnage définit la "moyenne observée" mais tous
  les exemples/exercices autour parlent de "fréquence" sans faire le
  pont entre les deux notions.
- Renvoi au "programme du chapitre 10" présenté comme acquis, alors que
  le chapitre 10 (Algorithmique) est postérieur au chapitre 9.
- Collision de notation : le $n$ du nombre de valeurs de $X$ (loi de
  probabilité) entre en collision avec le $n$ de $\mathcal{B}(n;p)$
  quelques sections plus loin.
- Le passage de l'indépendance de 2 événements (chapitre précédent) à
  $n$ événements (loi binomiale) n'est pas signalé comme un saut.
- "Factorielle" ($k!$) n'est jamais nommée dans le cours, alors que les
  corrigés générés emploient le mot.
- Aucun exercice ni contenu de cours sur les probabilités cumulées
  ($P(X \geq 1) = 1 - P(X=0)$), pourtant fréquentes en contrôle.
- Générateur `va-esperance` : quand $p=0{,}5$ est tiré, le distracteur
  "moyenne simple" coïncide avec la bonne réponse (filtré techniquement
  mais l'exercice perd son objet pédagogique dans ~12,5% des tirages) ;
  même défaut sur `va-manquante` (~19,9% des tirages).
- Figure `balance-esperance` placée avant que $E(X)$ soit formellement
  défini (section suivante) ; le calcul $-1×0{,}5+2×0{,}5=0{,}5$ qu'elle
  affiche n'est jamais montré explicitement dans le texte qui l'entoure.
- Section "L'espérance" : la formule est posée avant l'intuition qui
  l'explique (ordre inverse de la section "Variance", qui elle suit
  l'ordre essai → échec → carré → formule, jugé meilleur).
- Le raccourci de calcul de la variance (moyenne des carrés moins carré
  de la moyenne) est généralisé à partir d'un seul exemple vérifié,
  sans dire explicitement qu'on l'admet.
- `figLecture` de `dispersion-variance` : la parenthèse "(cas
  particulier...)" coupe l'égalité entre deux "=", lecture bancale à
  reformuler (ex. "V(X) = d² = 4 (cas particulier : ...)").
- Générateur `bi-pk` : séparateur décimal anglais (point au lieu de
  virgule) dans les valeurs intermédiaires affichées via `mil(...)`
  sans passer par `fr(...)` — sur 100% des tirages testés.
- Titre "Espérance et écart-type d'une loi binomiale" alors que le
  cadre contient aussi la variance (trois objets, pas deux) ; le bloc
  "idee" ajouté dit "ces deux formules" pour la même raison.
- `va13` : distracteur `v:12` avec message générique, sans identifier
  l'erreur précise de l'élève (contrairement aux autres diag du
  chapitre).
- Aucune fiche méthode "calculer une variance/écart-type d'une loi
  binomiale" dans "Les méthodes du chapitre".

## Géométrie repérée (chapitre 7)

- Le fait porteur du chapitre ($(a;b)$ normal à $ax+by+c=0$) n'a jamais
  de démonstration complète, y compris dans le chapitre 6 (Produit
  scalaire) qui énonce la même chose sans la justifier.
- "Point d'intersection" réduit à "on résout le système" : la
  résolution d'un système 2×2 n'est enseignée dans aucun chapitre du
  cahier, alors qu'elle est nécessaire pour l'exercice gr11.
- gr4 demande le coefficient directeur $m=\frac{y_B-y_A}{x_B-x_A}$ et la
  forme $y=mx+p$, jamais enseignés dans ce chapitre.
- Contradiction : le cours annonce la méthode algébrique de la
  médiatrice comme "plus rapide à contrôler" mais ne la montre jamais
  (exemple guidé et exercice utilisent tous deux la méthode
  géométrique).
- Deux étiquettes de figures fixes mal positionnées, loin de l'objet
  qu'elles nomment (L.3342 "la droite", L.3457 "médiatrice").
- Figure `droite-repere` : notation `x_B − x_A` envoyée en texte brut
  hors du moteur LaTeX (`textContent`, pas `T(...)`).
- Cas dégénéré du cercle (rayon nul) dans la fiche méthode "Reconnaître
  l'équation d'un cercle" : traité comme "ensemble vide" alors que
  c'est le point $\Omega$ lui-même — **corrigé** (voir section
  BLOQUANT/À REVOIR justesse ci-dessus, appliqué directement).
- Rendu cassé de `@r{}` vide dans le récapitulatif (L.3491) : affiche
  "et √ à droite" au lieu d'un message clair sur la racine du membre de
  droite.
- Argument historique/géométrique faux : les angles alternes-internes
  servent au parallélisme, pas à la perpendicularité (L.3319).
- Aucun exercice sur "la recette en quatre lignes" (équation d'une
  droite par deux points), pourtant présentée comme "le cas le plus
  fréquent en contrôle".
- La formule des coordonnées du milieu n'est énoncée nulle part en
  bloc `formule` dans tout le cahier ; elle est utilisée avant d'être
  justifiée (incidemment, dans un exemple).
- Collision de notation $x,y$ utilisés à la fois pour le point courant
  de $ax+by+c=0$ et pour les coordonnées d'un vecteur directeur/normal.
- (Corrigé) Générateur `gr-normal` : les collisions distracteur/réponse
  (~10,6%) et le dispatch de diagnostic fragile par `indexOf` (~16,5%
  de messages faux) ont été corrigés — voir historique de commit.
- Aucun exercice ni fiche méthode sur "tangente à un cercle", pourtant
  citée comme application du vecteur normal (L.3472, avant correction).
- Collision de point d'application des vecteurs sur la figure fixe
  "Les deux vecteurs d'une même droite" : les flèches partent d'un
  point légèrement hors de la droite tracée (~3px d'écart).
- Numérotation "première/seconde" des deux caractérisations de la
  médiatrice qui s'inverse entre le paragraphe (L.3456) et la note de
  la formule (L.3457) — le contenu reste juste (les parenthèses lèvent
  l'ambiguïté), mais la numérotation se contredit à quatre lignes
  d'écart.
- Figure `droite-repere` : la flèche du vecteur normal est dessinée à
  longueur normalisée (2 unités) alors que la lecture affiche ses
  vraies coordonnées — décalage visuel entre dessin et texte, signalé
  seulement en commentaire de code.
- Figure `droite-repere`, fonction `terme()` : cosmétique sans
  incidence sur la justesse (équation toujours vérifiée par A et B) —
  "+ y + 5 = 0" avec un "+" en tête (4,1% des états atteignables),
  "+ 0" pour une constante nulle, coefficients jamais simplifiés (ex.
  "10x − 20 = 0" au lieu de "x − 2 = 0").
- Étiquette "yB − yA = ..." pouvant légèrement déborder du cadre SVG à
  x de B = 5 (maximum du curseur).
- Astuce "La technique pour résoudre un système de deux équations" ne
  couvre que le cas où l'addition/soustraction élimine directement une
  inconnue (coefficients égaux ou opposés) ; le cas général (multiplier
  une équation d'abord) n'est pas mentionné, alors que le titre présente
  la méthode comme générale. Aucun exercice du chapitre n'exige plus
  que le cas simple.
- Numérotation "première/seconde" des deux caractérisations de la
  médiatrice qui s'inverse entre le paragraphe (L.3456) et sa note
  (L.3457) — le fond reste juste grâce aux parenthèses, mais la
  numérotation se contredit à quatre lignes d'écart ; mieux vaudrait
  nommer les deux voies ("voie des distances" / "voie perpendiculaire
  + milieu") plutôt que des ordinaux.
- La "méthode de calcul algébrique" de la médiatrice ($MA=MB$ développé
  directement) est annoncée mais jamais déroulée dans un exemple ; le
  texte la rétrograde aussitôt en simple moyen de contrôle.
- Figure `droite-repere` : équations cartésiennes esthétiquement
  dégradées mais mathématiquement exactes ("+ 0 = 0" quand la droite
  passe par l'origine, "+ y + 5 = 0" avec un "+" en tête, signe moins
  ASCII vs typographique incohérent dans la forme réduite).
- Figure `droite-repere` : la longueur affichée du vecteur normal dans
  la zone de lecture (ex. "n(10 ; -10)") ne correspond pas à la
  longueur du vecteur dessiné (normalisée à 2 unités) — assumé en
  commentaire de code, jamais dit à l'élève dans la figNote.
- Figure `droite-repere` : la figNote n'explique plus le triangle
  orange (écarts xB−xA, yB−yA) ni la longueur AB, qui restent pourtant
  affichés.
- Deux étiquettes de figures fixes toujours mal positionnées (L.3344
  "la droite", L.3470 "médiatrice"), loin de l'objet nommé — antérieur
  aux corrections de ce tour.
- Générateur `gr-normal` : la bonne réponse porte toujours un préfixe
  $@v{n}$/$@v{u}$ alors que deux des trois distracteurs sont des
  couples nus — indice de format qui permet d'éliminer des options
  sans calculer.
- "Toute droite s'écrit $ax+by+c=0$" (L.3347) posé sans dire qu'on
  l'admet (le sens direct et sa réciproque ne sont pas démontrés).
- La formule de distance (norme d'un vecteur) n'est jamais rappelée ni
  renvoyée explicitement au chapitre 6 dans le chapitre 7, bien
  qu'utilisée dès le cours et dans gr6/gr9/gr13.
