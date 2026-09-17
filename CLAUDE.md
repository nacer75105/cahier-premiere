## cahier-premiere

Cahier de maths (Première, spécialité) — une page unique `public/index.html`
contenant le cours, les exercices et les figures interactives (SVG dessiné
à la main en JS, pas de framework, pas de bibliothèque de rendu maths — les
macros `@f{}` `@r{}` `@v{}` etc. sont gérées par `mathCore()` dans le fichier).

## Méthode : un chapitre n'est fini qu'après DEUX contrôles, dans cet ordre

**Adoptée le 2026-09-17**, après un audit qui a montré que la clarté
pédagogique et la justesse mathématique sont deux défauts complètement
indépendants : un chapitre peut lire admirablement bien (motivation avant
la formule, exemples concrets, pièges explicités) et contenir des erreurs
de calcul, des diagnostics d'exercice qui ne correspondent à aucune erreur
réelle, ou des figures interactives qui affichent des égalités fausses —
rien de tout ça ne se voit à la seule lecture pédagogique.

**Ordre impératif pour reprendre un chapitre :**

1. **Justesse d'abord** (agent `relecteur-maths`) : refaire tous les
   calculs du cours, des exemples guidés, des exercices, de leurs
   corrections et de leurs diagnostics d'erreur, sous Node quand c'est
   possible plutôt qu'« à l'œil ». Corriger chaque bloquant trouvé, puis
   **refaire relire** — une correction peut en réintroduire un autre
   (vu plusieurs fois : une reformulation change un exemple numérique
   sans mettre à jour un diagnostic qui s'y réfère, ou une deuxième
   passe de relecture, plus poussée, débusque un bloquant préexistant
   que la première n'avait pas vu). Recommencer jusqu'à ce qu'un passage
   de relecture confirme explicitement **zéro** point bloquant restant —
   ne pas s'arrêter au premier passage propre en apparence.
2. **Clarté pédagogique ensuite**, seulement une fois la justesse validée
   (grille : jargon non expliqué, abstraction sèche, formule tombée du
   ciel, saut trop raide, manque de « pourquoi » — avec reformulation
   concrète pour chaque point trouvé). Chaque reformulation ajoutée à ce
   stade doit elle-même repasser par `relecteur-maths` avant validation :
   une correction pédagogique peut, comme une correction de justesse,
   introduire une erreur de calcul ou une référence fausse (vu sur
   Produit scalaire et Second degré : une dérivation ajoutée pour
   « expliquer le pourquoi » peut développer la mauvaise identité, ou
   renvoyer vers un exemple ou une section qui ne dit pas ce qu'on croit).

Un chapitre n'est « fini » que lorsque les deux contrôles ont chacun reçu
une confirmation explicite sans réserve. Traiter les chapitres dans
l'ordre de gravité (le plus de points bloquants trouvés d'abord), un
chapitre à la fois, avec un commit dédié à la fin de chacun — ne pas
grouper plusieurs chapitres dans un même commit, pour garder un historique
qui isole ce qui a changé et pourquoi.

## Contrainte technique : figures interactives — jamais de valeurs arrondies indépendamment

**Cause identifiée le 2026-09-17**, lors d'un audit de justesse mathématique
chapitre par chapitre (agent `relecteur-maths`, calculs refaits sous Node).
La figure manipulable du produit scalaire (`MODELES["produit-scalaire"]`)
affichait des égalités qui ne s'additionnaient pas — par exemple
« u · v = 3,8 + 3,8 = 7,5 » — sur environ 13 % des états atteignables par
le curseur. Le même défaut, en pire, touchait la figure de l'arbre pondéré
des probabilités conditionnelles (jusqu'à 38 % des états), et une variante
touchait plusieurs générateurs d'exercices (`pr-totales`, `al-while`,
`sd-sommet`...).

**Cause réelle :** chaque terme affiché (un produit partiel, une somme,
un résultat) était arrondi **séparément** à l'affichage (`toFixed(1)` ou
équivalent) à partir de sa propre valeur exacte, au lieu d'être dérivé
d'un seul calcul cohérent avec les autres termes affichés à côté de lui.
Deux arrondis indépendants, même corrects chacun pris isolément, ne
s'additionnent pas forcément à l'arrondi du total exact — l'élève voit
alors, dans la figure censée le lui apprendre, une égalité fausse.

**Règle impérative pour toute figure interactive ou tout générateur
d'exercice qui affiche une décomposition d'un calcul** (« a + b = total »,
un produit le long d'un chemin d'arbre, une somme de plusieurs termes,
une valeur réutilisée dans une étape suivante...) :

- **Choisir une précision d'affichage qui rend chaque valeur exacte**, pas
  seulement « assez précise ». Si les grandeurs manipulées sont quantifiées
  (curseur à pas de 0,5, de 0,05...), calculer combien de décimales sont
  nécessaires pour que chaque produit/somme intermédiaire s'affiche sans
  aucun arrondi, et ne jamais descendre en dessous de ce nombre.
- Si une précision exacte est impossible (curseurs à pas irrationnel, ou
  grandeurs qui ne tombent jamais rond), **ne pas afficher une égalité
  avec `=`** entre des termes arrondis et un total : soit afficher `≈`,
  soit calculer le total affiché en additionnant les **mêmes valeurs déjà
  arrondies pour l'affichage** — jamais un total recalculé séparément à
  partir des valeurs exactes puis arrondi de son côté.
- Dans un générateur d'exercice, la valeur utilisée pour une étape
  ultérieure (ou pour construire un `diag`) doit être la même variable
  que celle affichée à l'étape précédente — jamais une valeur ré-arrondie
  indépendamment, même si l'écart semble négligeable : c'est justement ce
  qui casse silencieusement l'égalité affichée.
- Avant de committer une figure ou un générateur de ce type, **vérifier
  par un balayage exhaustif (ou un échantillonnage dense) des états
  atteignables** — via un script Node qui rejoue le code de la figure —
  que le texte affiché s'additionne toujours correctement. C'est ce test
  qui a débusqué les deux cas ci-dessus ; une relecture visuelle du code
  ne les aurait pas vus.
- **Distinguer un état réellement indéfini d'un cas limite simplement mal
  classé.** Un vecteur nul n'a pas de direction, une division par une
  probabilité nulle n'a pas de résultat : ce sont des états indéfinis, à
  exclure **à la source** en contraignant le curseur ou le geste plutôt
  qu'en les rattrapant après coup par un message d'exception (exemple en
  place : `pointe()` dans `MODELES["produit-scalaire"]` refuse que les
  coordonnées arrondies tombent sur `(0;0)` et retombe sur la
  demi-graduation la plus proche dans la direction du geste réel).
  Un angle de 0° ou 180° (deux vecteurs colinéaires), en revanche, est
  parfaitement défini : le bug n'est pas leur existence, c'est un
  classement à trois cas (aigu/droit/obtus) qui les range silencieusement
  dans la mauvaise case. Là, la bonne correction est d'ajouter le cas
  manquant et de le nommer correctement (exemple : détecter la
  colinéarité par un produit vectoriel exactement nul), pas de
  l'empêcher.
