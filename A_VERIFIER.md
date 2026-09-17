# À vérifier

## Chantier "figures" de fin de projet — méthode à appliquer

**Constat du 2026-09-17**, après la relecture de justesse de Dérivation
(4 passes de `relecteur-maths` le même jour) : les bugs de figures ne
sont pas des incidents isolés, ils se répètent selon les **mêmes
classes de défauts** d'un chapitre à l'autre, et chaque fois qu'un
chapitre a été relu en balayage exhaustif (Dérivation ce jour,
Produit scalaire et Probabilités conditionnelles avant lui — voir
la contrainte technique dans CLAUDE.md sur les valeurs arrondies
indépendamment), la relecture a trouvé des bugs qu'une lecture "à
l'œil" du code n'avait pas vus. Rien qui suggère que Dérivation était
un cas particulier plutôt pire que les autres — plutôt qu'il a
simplement été le premier chapitre passé au peigne fin sur ses
figures.

**Classes de défauts déjà rencontrées, par ordre de fréquence
observée :**
1. **Valeurs affichées arrondies indépendamment**, cassant une égalité
   avec "=" sur un sous-ensemble des états atteignables par le
   curseur (souvent 30 à 45% des états) — cf. la règle dédiée dans
   CLAUDE.md. Trouvé sur `signe-variation`, `fonction-derivee`,
   `tangente` (Dérivation), la figure du produit scalaire, l'arbre
   pondéré (probabilités conditionnelles).
2. **Débordements de cadre** aux bornes du curseur (point ou étiquette
   qui sort du quadrillage gradué sans sortir du viewBox — donc
   invisible en relecture de code, seulement visible en le rejouant).
   Trouvé sur `tangente`, `sécante` (Dérivation).
3. **Incohérence entre deux éléments d'une même figure** à un état
   limite (ex. `signe-variation` : la bande de couleur contredisait le
   texte pile aux extremums).
4. **Diagnostics d'exercice imprécis ou mal attribués** (le message
   affiché à l'élève décrit une erreur différente de celle qui produit
   réellement le distracteur), et **affichages arithmétiquement mal
   formés** dans les générateurs paramétrés (signes en dur non
   compatibles avec une valeur qui change de signe selon le tirage,
   ex. `de-tangente`).

**Méthode à appliquer pour ce chantier, chapitre par chapitre :** ne
pas se contenter d'une relecture visuelle du code des figures. Lancer
`relecteur-maths` avec instruction explicite de rejouer **chaque**
figure interactive et **chaque** générateur d'exercice sous Node, en
balayant exhaustivement (ou en échantillonnant densément si l'espace
d'états est trop grand) tous les états atteignables par les curseurs
et tous les tirages aléatoires possibles des générateurs — pas
seulement les valeurs par défaut ou quelques exemples choisis à la
main. C'est ce balayage, et lui seul, qui a débusqué tous les bugs
listés ci-dessus ; aucun n'était visible à la seule lecture du code.

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

## Second degré (chapitre 2)

- La phrase de réassurance ajoutée avant la dérivation de la forme
  canonique (~L.1053, "Tu n'as pas à savoir refaire ce calcul par
  cœur en contrôle") reprend presque mot pour mot celle déjà présente
  en section "Discriminant" (~L.1023, "Tu n'as pas à savoir refaire
  ce calcul"). Pas d'erreur, juste une répétition littérale à varier
  si l'occasion se présente.
- Exemple guidé "Un maximum entre deux entiers" (~L.1157-1165) :
  la conclusion ("plus on s'éloigne du sommet, plus le bénéfice
  diminue") pourrait explicitement se relier à la forme canonique
  construite juste avant dans le chapitre ($B(x)=-2(x-9{,}25)^2+91{,}125$,
  qui ne dépend que de la distance au sommet) — actuellement affirmé
  sans ce lien, correct mais un peu asséné.
- Piège "Oublier les contraintes du problème" (~L.1156) : la phrase
  "comme $α = 10$ dans l'enclos ci-dessus, où la contrainte ne
  change donc rien" est trompeuse — l'exemple de l'enclos n'a
  jamais de contrainte d'entier ($x$ y est une longueur continue
  dans $]0;20[$), donc cette contrainte ne "ne change rien" au sens
  où elle ne s'applique pas du tout à cet exemple. Antérieur à la
  passe pédagogique du 2026-09-17, révélé au passage.

## Dérivation (chapitre 3)

**Corrigés lors de la passe pédagogique du 2026-09-17** (pour mémoire,
ne plus retraiter) : les deux pièges "dérivée nulle ≠ extremum"
quasi identiques ont été fusionnés en un seul ; la tension entre
"un extremum se trouve toujours là où $f'$ s'annule" et le cas des
extremums aux bornes est résolue (le piège "Deux oublis classiques"
relie maintenant explicitement les valeurs de bord à la notion
d'extremum) ; la dérivabilité admise des fonctions du programme est
désormais signalée explicitement en section 1 (avec l'exception de
$\sqrt{x}$ en 0 mentionnée pour rester cohérent avec le tableau des
dérivées).

**Corrigés le même jour, deux bugs de justesse (pas seulement de
présentation)** : sur la figure `signe-variation`, pile aux deux
extremums ($a=-1$ et $a=1$, exactement atteignables par le pas de
curseur de 0,05), la lecture affichait "f′(a) = 0 ... la courbe
monte/descend" — contradictoire, puisqu'une dérivée nulle signale
justement l'arrêt de la montée ou de la descente, pas sa poursuite.
Le texte affiche maintenant "change de sens ici : c'est un extremum
(tangente horizontale)" quand le signe calculé vaut "0" (reformulé une
seconde fois le même jour pour ne pas laisser lire l'implication
générale "f′=0 ⇒ extremum", que le piège juste après contredit), au
lieu de retomber sur le mot de la zone voisine — et la bande de
couleur ne met plus aucune zone en avant à ces deux points précis
(`figNote` mise à jour en conséquence). Et le diagnostic du `check`
"$4x+9$" qui ne mentionnait que l'exposant oublié (donnant $4x$ au
lieu de $8x$) mentionne désormais aussi le $+9$ recopié à tort
(dérivée d'une constante = 0) — le distracteur combine bien les deux
erreurs, son diagnostic les couvre maintenant toutes les deux.

**Corrigés le même jour, trois bloquants préexistants découverts par
la relecture (même classe de bug que ci-dessus — affichage qui ne
correspond pas à un calcul cohérent, cf. règle du projet sur les
figures interactives) :**
- Figure `fonction-derivee` : "f′(a) = " affichait `nb(m)` (2
  décimales) alors que $m=a^2-1$ a besoin de 4 décimales pour être
  exact avec le pas de curseur 0,05 — faux dans 40 des 81 états
  atteignables. Passé à `nb(m,4)`, vérifié exact sur les 81 états.
- Figure `tangente` : "f(a) = " affichait `f(a).toFixed(2)` alors que
  $f(a)=0{,}5a^2-1$ a besoin de 3 décimales pour être exact avec le pas
  de curseur 0,1 — faux dans 36 des 71 états atteignables. Passé à
  `nb(f(a),3)`, vérifié exact sur les 71 états.
- Générateur `de-tangente` : quand $a=-1$ est tiré (1 tirage sur 3),
  les gabarits d'affichage du corrigé et du diagnostic (`v:a*k*k`)
  inséraient un "−"/"+" en dur devant des quantités qui peuvent être
  négatives, produisant des expressions mal formées du type
  "$-8x − -32 + -16$" — pas juste le parenthésage de $k$ déjà
  documenté (voir ci-dessous), mais un affichage arithmétiquement
  incohérent sur l'étape que l'élève est censé suivre pour vérifier
  son calcul. Remplacé par des appels à `sg(...)` (déjà utilisée
  ailleurs dans le fichier pour ce cas), vérifié bien formé sur les 24
  combinaisons $(a,k)$ possibles.

**Chantier contenu à part, non traité ici** (ajout de contenu, pas une
correction de justesse ni de clarté d'un texte existant) :
- Aucune fiche méthode "dresser un tableau de variations", alors que le
  cours la qualifie lui-même d'"aboutissement du chapitre".
- Couverture des exercices : aucun ne demande de dresser un tableau de
  variations, ni ne fait intervenir $\sqrt{x}$, ni ne fait travailler
  "traduire un problème en fonction".
- Le bloc "idee" ajouté pour construire l'équation de la tangente
  s'appuie sur la forme "point-pente" $y=m(x-x_0)+y_0$, qui n'est pas
  exactement la forme vue en Seconde ($y=mx+p$) ni justifiée par une
  vérification explicite (pour $x=x_0$ on retrouve $y=y_0$) — à relier
  explicitement à la forme de Seconde ou à ajouter la vérification.
- Le paragraphe sur la dérivabilité admise (section 1) annonce que
  l'exception $\sqrt{x}$ en 0 est "indiqué plus loin dans le tableau
  des dérivées", mais le tableau ne dit que "dérivable pour $x > 0$" —
  il ne reprend pas littéralement l'expression "tangente verticale".
  À corriger dans la passe de clarté (relecteur-maths, 2026-09-17) :
  soit reformuler l'annonce, soit ajouter la mention dans le tableau.
  Ce même paragraphe est aussi signalé comme une phrase unique trop
  dense (5 lignes, deux incises) à découper en 2-3 phrases.

- **Chantier "figures" à regrouper en fin de projet** — figure
  `fonction-derivee` : change de fonction entre le texte qui l'entoure
  ($x^2$ évoqué) et le modèle réellement tracé ($x^3/3-x$), sans jamais
  nommer $f$ ni $f'$ sur les deux panneaux ; sa description ("le
  graphique de droite **ajoute** le point") ne correspond pas
  exactement au comportement du tracé (la courbe s'efface si on
  recule le curseur). Plus généralement, aucune des quatre figures
  interactives du chapitre n'affiche l'expression de $f(x)$ à l'écran ;
  l'élève doit deviner quelle fonction elle manipule. Défaut réel,
  mais travail sur figure/JS, pas sur le texte — signalé le
  2026-09-17, à traiter avec les autres corrections de figures
  (voir aussi les entrées `droite-repere`, `dispersion-variance`,
  `loi-binomiale` dans les sections suivantes).
- Figure `signe-variation` : aux deux points où aucune zone n'est mise
  en avant (les deux extremums, opacité uniforme 0,25 depuis la
  correction du 2026-09-17), les libellés "+ / − / +" en blanc sur
  fond à 0,25 d'opacité sont peu lisibles en thème clair (contraste
  ~1,4, sous le seuil usuel de 4,5) — préexistant pour les zones
  inactives, mais plus visible maintenant que les trois zones sont
  simultanément à cette opacité. Et la même ligne mélange le signe
  "-" ASCII (issu de `nb()`) et le signe "−" typographique (U+2212,
  utilisé pour `signe`) dans la même phrase — cosmétique.
- Figure `tangente` : aux deux bornes du curseur ($a=\pm3{,}5$),
  $f(a)=5{,}125$ dépasse le haut du repère (vue jusqu'à $y=5$) ; le
  point $A$ et son étiquette restent dans le viewBox mais flottent
  au-dessus du cadre gradué. Pas d'erreur affichée, juste un point
  hors quadrillage — à revoir avec les autres figures (agrandir la
  vue ou réduire l'amplitude du curseur).
- L.1660 (de13) : l'intervalle de décroissance est donné en ouvert
  ($]-1;1[$) alors que le cours utilise ailleurs des crochets fermés
  aux points où $f'$ s'annule — inconsistance de convention, pas une
  erreur de fond.
- Générateur `de-poly` : distracteur peu crédible (deux constantes non
  réduites affichées côte à côte).
- Exercice `de7` (L.1627) : le diagnostic du distracteur "$2x-5$" dit
  "Tu as oublié un terme", alors que l'erreur réelle est une règle de
  puissance mal appliquée ($2x^2$ dérivé en $2x$ au lieu de $4x$) — le
  reste du message (développement, dérivée finale) est correct, seule
  l'étiquette de l'erreur ne correspond pas.
- Exercice `de12` (L.1675) : diagnostic `{v:1}` ("Tu as sans doute
  dérivé le 2 en 1") plausible mais peu précis par rapport aux autres
  diagnostics du chapitre.
- Figure `signe-variation` : la formulation "de signe **0**" (à
  $a=\pm1$) est un peu bancale mathématiquement (0 n'a pas de signe à
  proprement parler) — se défend par la convention du tableau de
  signes, mais "f′(a) = 0 : la dérivée s'annule" serait plus net.
- Figure `sécante` : aux plus grands écarts du curseur (h entre 1,54 et
  1,60), le point B et son étiquette dépassent le haut du repère —
  même défaut cosmétique que celui déjà noté sur `tangente`
  (débordement du cadre gradué, pas d'erreur affichée).
- Générateur `de-tangente` (après correctif du 2026-09-17) : mélange
  du tiret ASCII "-" (`fr`/`terme`) et du signe typographique "−"
  (`sg`) dans une même expression, et écriture un peu lourde "$1 ×
  (1)^2$" quand $a=1$ — cosmétique, convention déjà partagée par tous
  les générateurs du fichier, aucun calcul faux.
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
- L'intuition du produit (rectangle $u \times v$) ne signale pas
  qu'elle suppose implicitement $u,v>0$, alors que l'intuition du
  quotient le précise désormais pour $v$.

## Fonction exponentielle (chapitre 4)

**Corrigé le 2026-09-17, passe pédagogique (grille prof-pedagogue)** :
le paragraphe dense énumérant les 4 cas de solutions de $A=B$ dans
$e^A=e^B$ a été sorti en tableau (3 colonnes), avec un exemple chiffré
par ligne ; l'aparté sur les "règles à calcul" précise maintenant ce
qu'était l'instrument. Deux bloquants trouvés par la relecture de
justesse qui a suivi, tous deux corrigés le même jour :
- Le nouvel exemple du tableau utilisait `{-}`/`{+}` pour échapper des
  signes dans du texte LaTeX — accolades non consommées par
  `mathCore()`, donc affichées en clair à l'écran ("2x{-}1=x{+}5").
  Réécrit sans échappement, au niveau de l'équation exponentielle
  (cohérent avec les 3 autres lignes du tableau).
- Exercice `ex11`, dernière étape du corrigé (contrôle "par l'autre
  chemin") : $200 × 1{,}162^{10} ≈ 897{,}6$, qui arrondit à 898, pas
  896 comme l'affichait le texte — l'arrondi de $e^{0,15}$ à 3
  décimales n'était pas assez précis pour que la vérification tombe
  juste. Passé à 4 décimales ($1{,}1618$), qui redonne bien 896.

**Corrigés le même jour, une deuxième relecture (2 passes au total)
a trouvé deux échos du même défaut, corrigés dans la foulée :**
- Exemple guidé "culture de bactéries" : "$500 × e^{0,2} × 5$
  donnerait 3053" — la vraie valeur est 3053,5, qui arrondit à 3054,
  pas 3053 (l'ancien "3053" venait d'un calcul fait à partir du
  tableau déjà arrondi, pas de la valeur exacte). Passé à "environ
  3054".
- Exercice `ex11`, diag `v:809` : disait "$e^{0,15} ≈ 1{,}162$", la
  même précision insuffisante que celle corrigée dans le corrigé
  juste au-dessus (une élève qui reprend ce 1,162 pour vérifier le
  contrôle du corrigé retombe sur 898, pas 896). Harmonisé à
  $1{,}1618$ comme dans le corrigé.

**À traiter (pas seulement "pour mémoire") :**
- L'intuition "on compte des facteurs" pour justifier l'addition des
  exposants (L.1766-1767) ne vaut littéralement que pour des exposants
  entiers naturels, alors que le chapitre utilise aussitôt après des
  exposants négatifs et décimaux — l'extension est vraie mais jamais
  signalée comme admise, contrairement à d'autres passages du même
  chapitre (ex. L.1790) qui le font explicitement. **Même type
  d'omission que l'admission de dérivabilité corrigée sur le chapitre
  Dérivation** (voir plus haut) — à reprendre en cohérence avec ce
  précédent, pas juste une amélioration facultative.
- Le nouveau tableau des 4 cas utilise l'exemple $e^{2x-1}=e^{x+5}$
  (→ $x=6$), très proche de l'exemple guidé de la section précédente
  $e^{2x-1}=e^{x+4}$ (→ $x=5$) — même famille d'expressions avec une
  réponse différente à un chiffre près : vrai risque de confusion à la
  révision, pas juste un souci de forme. Hérité du paragraphe
  d'origine (pas une régression du jour). À écarter en changeant l'un
  des deux exemples.

Points mineurs relevés par ces deux relectures, chantier figures
(cosmétique, voir la section dédiée en tête de fichier) :
- Figure `expo-k` : le titre annonce "deux comportements" alors que le
  curseur atteint aussi $k=0$ (comportement plat), un troisième cas
  correctement affiché par la figure elle-même — titre à généraliser.
  Même figure : aux valeurs entières du curseur, la `figLecture`
  affiche des exposants collés peu lisibles ("e^1x", "e^0x").
- L'exemple de la ligne 2 et 3 du nouveau tableau des 4 cas
  ($e^{x+1}=e^{x+1}$, $e^{x+1}=e^{x+2}$) reste correct mais pourrait
  gagner à citer un $x$ concret vérifiant/contredisant l'égalité,
  comme le fait la ligne 1 — cohérence de forme, pas une erreur.
- "Tables de logarithmes" (L.1769, dans la parenthèse ajoutée sur les
  règles à calcul) : terme jamais défini dans le cahier (vu seulement
  en Terminale) — aparté culturel, aucune notion du programme n'en
  dépend, mais pourrait gagner un gloss de 3-4 mots comme fait pour la
  règle à calcul elle-même.

## Trigonométrie

**Justesse validée le 2026-09-17** (2 passes de `relecteur-maths`,
balayage exhaustif de 2M d'angles) : 3 bloquants corrigés sur la figure
`cercle-trigo` (angle annoncé comme fraction exacte de π incohérent avec
le cos/sin affiché à côté, "-0,00" affiché pour une valeur quasi nulle,
signe "=" affiché à tort pour une valeur irrationnelle arrondie — voir
commit "Trigonométrie : uniformisation quadrant→quart + justesse figure
cercle trigo"). Tableau des valeurs remarquables vérifié intégralement
juste.

**Chantier "figures" à regrouper en fin de projet** — deux défauts
pédagogiques réels (pas cosmétiques) relevés dans `MODELES["cercle-trigo"]`
lors de cette relecture, non corrigés maintenant :
- Dans les états où l'angle n'est *pas* aimanté sur un multiple de π/12
  (`fracPi` renvoie `exact:false`), les degrés (arrondis à l'unité) et la
  fraction de π (arrondie à 2 décimales) sont deux arrondis indépendants
  de précisions différentes : sur ~12,5% des états non aimantés, l'écart
  entre les deux atteint jusqu'à 1,40° — ex. "angle 283° ≈ 1,58π" alors
  que $1,58π = 284,4°$. Une élève qui vérifie $1,58 × 180$ retombe sur
  284, pas 283. À corriger avec la méthode du chantier (balayage
  exhaustif) : soit augmenter la précision de la fraction affichée dans
  cette branche, soit n'afficher que les degrés quand la fraction n'est
  pas exacte.
- La grille d'aimantation (dénominateurs 1,2,3,4,6,12) fait apparaître
  des fractions comme π/12, 5π/12, 7π/12… qui ne figurent pas dans le
  tableau des valeurs remarquables enseigné dans ce chapitre (seulement
  0, π/6, π/4, π/3, π/2, π). Une élève peut donc voir la figure annoncer
  "= π/12" pour un angle qu'elle n'a jamais appris. À arbitrer : soit
  restreindre la grille d'aimantation aux dénominateurs du programme
  (1,2,3,4,6), soit assumer ces valeurs mais les indiquer comme
  hors-programme dans la figNote.

## Produit scalaire (chapitre 6)

**Passe pédagogique du 2026-09-17** : chapitre déjà abouti (motivation
avant formule, analogie de la luge, dérivations expliquées). Seul défaut
trouvé et corrigé : jargon non expliqué ("colinéaire", "déterminant")
dans les diagnostics de `ps2`/`ps13`, alors que ces notions ne sont
formellement introduites qu'au chapitre suivant (Géométrie repérée) —
courts rappels ajoutés entre parenthèses.

Deux points mineurs relevés au passage par la relecture de confirmation,
non corrigés (aucun des deux ne justifiait de retarder le commit) :
- `ps13`, diag `v:-2.667` (~l.2738) : ponctuation à revoir — les
  deux-points suivant "au lieu du produit scalaire $xx'+yy'$" précèdent
  en fait l'équation du *déterminant*, pas du produit scalaire ; l'ordre
  des mots prête légèrement à confusion (le signe moins la lève).
- Le mot "colinéaire" n'est toujours défini dans aucun bloc de **cours**
  de tout le cahier — les deux seules gloses se trouvent maintenant dans
  ces diagnostics d'exercices (invisibles pour une élève qui répond
  juste), alors que le terme est réutilisé sans gloss en Géométrie
  repérée (~l.3450, 3614, 3616). À traiter lors de la passe pédagogique
  de Géométrie repérée (où le terme est formellement défini) plutôt
  qu'ici.

## Probabilités conditionnelles (chapitre 8)

**Passe pédagogique + justesse du 2026-09-17** : 6 corrections de
clarté intégrées (définir "univers" et ∩ avant emploi, vocabulaire de
l'arbre pondéré, collision de la lettre B corrigée entre l'exemple
usine et la formule des probabilités totales, figure interactive
rendue lisible — curseurs en français, $Ā$ introduit avant usage,
légende faux positifs traduite —, pont comptage↔formule explicité) —
voir historique de commit. Relu ensuite par `relecteur-maths` en
insistant sur ces 3 points : zéro point bloquant.

- **Incohérence corrigée** : le critère "effectifs dans l'énoncé →
  tableau, pourcentages → arbre" (astuce "Passer du tableau à
  l'arbre", ~l.2867) était contredit par l'exemple guidé du tirage
  sans remise juste après (effectifs, traité par l'arbre) et par
  l'exercice pr3. Reformulé : le critère porte maintenant sur "des
  effectifs qui croisent deux critères à la fois" (tableau) vs "des
  pourcentages, ou une situation à deux étapes successives" (arbre),
  en signalant explicitement l'exception du tirage sans remise.

Points mineurs relevés par la relecture de justesse, non corrigés :
- Le mot "réunion" (∪) apparaît une seule fois, dans le tableau de
  traduction (~l.2932), jamais défini, avec une méthode ("passer par
  l'événement contraire") jamais enseignée ni utilisée par un exercice.
- pr3, diagnostic `v:0.6` (~l.2976) : ne correspond à aucune erreur
  plausible identifiée (0,6 = 3/10+3/10 avec remise, alors que le
  message parle de mal composer 3/10×2/9) ; l'erreur naturelle
  3/10+2/9≈0,522 n'a pas de diag dédié.
- Figure `arbre-proba`, cas $P(B)=0$ (~l.5201) : le message affiche
  d'abord "0,6×0=0 et 0,4×0=0" puis "aucun chemin ne mène jamais à B"
  — juste sur le fond, mais les deux phrases se lisent comme
  contradictoires.
- `check` du tableau (~l.2871) : `expl[0]` vide pour la bonne réponse,
  contrairement à l'autre `check` du chapitre (~l.2841) qui explique.
- Étape "Remonter l'arbre" de l'exemple des trois fournisseurs
  (~l.2882) utilise le renversement du conditionnement une section
  avant que sa formule ne soit présentée (~l.2889).

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

**Passe de justesse du 2026-09-17** (deux tours de `relecteur-maths` +
corrections appliquées à la main, chaque tour balayant exhaustivement
la figure `droite-repere` et le générateur `gr-normal`) : tous les
bloquants hérités du tout premier audit du projet (listés ci-dessous,
avant que la méthodologie actuelle n'existe) ont été traités, plus 3
bugs de figure/générateur non documentés découverts par balayage
exhaustif. Confirmé zéro point bloquant au second tour.

- *(Corrigé)* Démonstration du fait porteur ($(a;b)$ normal à
  $ax+by+c=0$) : le sens direct est démontré au chapitre 6 (Produit
  scalaire), la réciproque au chapitre 7 — chaîne complète, déjà en
  place avant ce tour.
- *(Corrigé)* Système 2×2 : enseigné par un exemple guidé + une astuce,
  avant gr11 — déjà en place avant ce tour.
- *(Corrigé)* Coefficient directeur $m$ et forme $y=mx+p$ : enseignés
  par l'astuce "L'autre méthode, vue en Seconde", avant gr4 — déjà en
  place avant ce tour.
- *(Corrigé)* Contradiction "première/seconde" définition de la
  médiatrice, avec sur-promesse d'une méthode algébrique jamais
  déroulée : renommé en "voie géométrique / voie des distances",
  cohérent entre les trois blocs concernés.
- *(Corrigé)* Deux étiquettes de figures fixes mal positionnées ("la
  droite", "médiatrice") : repositionnées, vérifié en pixels qu'elles
  ne chevauchent plus rien et restent proches de l'objet nommé.
- *(Corrigé)* Notation `x_B − x_A` en texte SVG brut hors du moteur
  LaTeX : déjà résolu avant ce tour (plus aucun `$` hors de `T(...)`).
- *(Corrigé)* Cercle de rayon nul dans la fiche méthode : traité comme
  le point $\Omega$ lui-même, pas un ensemble vide.
- *(Corrigé)* `@r{}` vide dans le récapitulatif : plus aucune occurrence.
- *(Corrigé)* Argument faux sur les angles alternes-internes (ils
  servent au parallélisme, pas à la perpendicularité) : remplacé par
  la réciproque de Pythagore / propriété du losange ou du triangle /
  construction au compas.
- *(Corrigé)* Aucun exercice sur "la recette en quatre lignes" : ajout
  de `gr14` (équation cartésienne d'une droite par deux points).
- *(Corrigé)* Formule du milieu jamais énoncée en bloc `formule`, et
  formule de distance jamais rappelée avant usage : ajout d'un rappel
  "vecteur, longueur, milieu" en fin de première section, avant toute
  utilisation dans le chapitre.
- *(Corrigé)* Collision de notation $x,y$ (point de $ax+by+c=0$ vs
  coordonnées d'un vecteur) : signalée explicitement dans la note du
  bloc "Les deux critères", qui introduit aussi $\vec u,\vec u'$ et
  définit "colinéaire"/"déterminant" avant de les utiliser (ces deux
  mots étaient jusqu'ici employés sans définition).
- *(Corrigé, avant ce tour)* Générateur `gr-normal` : collisions
  distracteur/réponse et dispatch fragile par `indexOf`.
- *(Corrigé)* Critère utilisé par gr12 ("leurs vecteurs normaux
  perpendiculaires") jamais énoncé pour les normaux, seulement pour
  les directeurs : phrase ajoutée à l'astuce "Retenir lequel est
  lequel".
- *(Corrigé, découvert par balayage exhaustif, non documenté avant ce
  tour)* Figure `droite-repere` : équation cartésienne affichée mal
  formée dans ~9% des états atteignables (« + y + 5 = 0 », « x − y +
  0 = 0 ») — reconstruction de `eqCart` corrigée, 0 état fautif sur
  14 520 après correction.
- *(Corrigé, idem)* Figure `droite-repere` : étiquettes des écarts
  ($x_B-x_A$, $y_B-y_A$) débordant du `viewBox` dans ~9% des états —
  bornées, 0 débordement après correction.
- *(Corrigé, idem)* Générateur `gr-normal` : étape de contrôle
  d'orthogonalité mal formée dans 51,9% des tirages (« 12 + -12 = 0 »)
  — signe géré par `sg()`, vérifié sur les 5 068 tirages.
- *(Corrigé)* Figure `droite-repere` : la `figNote` ne disait pas que
  la flèche du vecteur normal est dessinée à longueur réduite (donc
  visuellement incohérente avec les coordonnées affichées) — précisé
  dans le texte.
- Aucun exercice ni fiche méthode sur "tangente à un cercle", pourtant
  citée comme application du vecteur normal : **différé**, contenu à
  ajouter (pas une correction de justesse d'un texte existant) — à
  traiter dans un chantier de contenu séparé si souhaité.

Points mineurs relevés par la relecture de justesse, non corrigés
(différés, aucun n'est bloquant) :
- La réciproque du fait porteur ("toute équation $ax+by+c=0$ décrit
  une droite") n'est jamais signalée comme admise, alors que toute la
  recette du chapitre s'appuie dessus.
- Figure `droite-repere` : forme réduite parfois écrite "y ≈ 0x + 0"
  au lieu de "y = 0", et "≈"/"(arrondie)" affichés même quand la
  valeur est exacte (~75% des états).
- Figure `droite-repere` : collision possible entre une étiquette
  d'écart et les graduations de l'axe, ou le point B, dans des cas
  particuliers ($y_A=0$, $y_A=y_B$) — lisibilité, pas une erreur.
- L.3387 : "une multiplication et une addition" alors que le chapitre
  6 dit (correctement) "deux multiplications et une addition" pour le
  même test.
- La forme réduite $y=mx+p$ apparaît dans la légende de la figure
  avant d'être rappelée dans le texte du chapitre (astuce plus loin).
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
