# Exercice 2.1 — Réponses

Dépôt : `depot-jetable/`, créé par le `rebase-setup.sh` fourni (lancé dans ce dossier plutôt que dans `/tmp`, avec mon identité Git au lieu d'« Apprenant CDA »).
Les SHA ne sont pas ceux de l'énoncé (ils dépendent de l'heure et de l'auteur), mais l'historique est le même.

## Partie A — Nettoyer et rebaser

### 1. Inspection

```bash
git log --stat main..feature/tri-taches
git log -p -3 feature/tri-taches~2      # wip, tri, fix typo
git rev-list --count feature/tri-taches..main   # → 1
```

| Commit | Contenu | Verdict |
|---|---|---|
| `wip` | `const tasks = …` + `// TODO tri` | base du commit `feat(api)` → `reword` |
| `tri des taches par statut (non terminées d'abord)` | `tasks.sort((a, b) => a.done - b.done)` | même intention → `fixup` |
| `fix typo` | en fait `Number(a.done) - Number(b.done)` (le message ment !) | même intention → `fixup` |
| `docs: documente le tri dans le README` | README | inchangé → `pick` |
| `oups, fichier de debug` | ajoute `debug.js` | **n'aurait jamais dû exister** → `drop` |

- Retard sur main : **1 commit** (`feat(front): client API fetchTasks`).
- Une seule intention : `wip` + `tri…` + `fix typo` (les 3 dans `api/src/app.js`).

### 2. Le rebase (une seule commande)

```bash
git rebase -i --exec "node --check api/src/app.js" main
```

Liste enregistrée (le plus ancien en haut) :

```
reword 54bcd13 wip                  # message → feat(api): trie les tâches par statut
fixup  164e153 tri des taches par statut (non terminées d'abord)
fixup  2ae948d fix typo
exec node --check api/src/app.js
pick   0164de9 docs: documente le tri dans le README
exec node --check api/src/app.js
drop   03a74ff oups, fichier de debug   # (ou supprimer la ligne)
```

- `fixup` fusionne et **jette** le message ; `squash` fusionne et propose de garder les messages.
- `reword` ouvre l'éditeur pour changer le message.
- `--exec` ajoute ses lignes `exec` dans la liste proposée par Git : j'ai gardé un `exec` après le groupe `feat` et un après `docs`.

### 3. Vérifier chaque commit

`--exec <cmd>` ajoute une ligne `exec` après chaque commit de la liste. Si la commande échoue, le rebase s'arrête sur ce commit.
Ici `node --check` passe sur les deux commits. Il ne vérifie que la syntaxe, il n'exécute pas le code : pas besoin d'installer Express.

### 4. Fusion dans main

```bash
git switch main
git merge feature/tri-taches     # → Fast-forward
```

C'est un **fast-forward** : après le rebase, la branche part du bout de main. Git avance juste l'étiquette `main`, sans commit de fusion.

**Squash and merge sur GitHub** : les 2 commits deviennent **un seul** commit sur main (message = titre de la PR). Le README et le tri se retrouvent dans le même commit, et les SHA de la branche n'apparaissent pas sur main.

### Résultat

```
* a3badd9 (HEAD -> main, tag: v1.4.0, feature/tri-taches) docs: documente le tri dans le README
* ad8efc5 feat(api): trie les tâches par statut
* fd2cbe2 feat(front): client API fetchTasks
* c3e83c2 chore: ajoute le .gitignore
* 0c10596 feat(api): liste des tâches
```

`git log --all -- debug.js` ne renvoie plus rien. Les anciens commits restent dans `git reflog`, en général pendant 90 jours.

## Partie B — Versionner

### SemVer

Nouvelle fonctionnalité compatible → on monte le MINOR et on remet le PATCH à 0 : **v1.3.2 → v1.4.0**.

```bash
git tag -a v1.4.0 -m "v1.4.0 — tri des tâches par statut

Ajouté : GET /api/tasks renvoie les tâches non terminées d'abord.
Compatible avec v1.3.2 : aucune route ni réponse cassée."
git show --no-patch v1.4.0
```

Annoté (`-a`) = un vrai objet avec auteur, date et message. Un tag léger n'est qu'un pointeur.

### CHANGELOG

Voir `CHANGELOG.md` (section `[1.4.0]`, sans date).

### Tag, release GitHub, CHANGELOG : qui lit quoi ?

| | Ce que c'est | Où | Qui le lit |
|---|---|---|---|
| **Tag** | un nom sur un commit précis | dans Git (`git push origin v1.4.0`) | les devs et les outils (CI, `git checkout v1.4.0`, déploiement) |
| **Release GitHub** | une page GitHub liée à un tag : notes, binaires, liste des PR (`--generate-notes`) | GitHub seulement | les utilisateurs et intégrateurs qui téléchargent ou suivent le projet |
| **CHANGELOG.md** | l'historique des versions écrit pour des humains, versionné avec le code | dans le dépôt | tout le monde, même hors GitHub. Il explique les changements qui comptent pour l'utilisateur, pas la liste des commits |

Les notes générées listent les PR. Le CHANGELOG, écrit à la main, dit ce qui change pour l'utilisateur.

## Bonus — fixup! et --autosquash

Fait sur une branche à part `bonus/fixup`, pour laisser intact le résultat attendu de main.

```bash
# modification : const sortedTasks = await repository.list(); sortedTasks.sort(...); res.json(sortedTasks);
git commit -a --fixup=ad8efc5
# → message : "fixup! feat(api): trie les tâches par statut"
git rebase -i --autosquash fd2cbe2
```

- Le message `fixup! <titre du commit visé>` permet à `--autosquash` de retrouver le commit visé.
- Git a déjà rangé la liste : `pick feat` / `fixup fixup!…` / `pick docs`. Il suffit d'enregistrer.
- Résultat : il reste 2 commits, et `sortedTasks` est dans `feat(api)`.
- Remarque : ici `main` contient déjà la branche, donc `git rebase -i --autosquash main` ne trouverait rien à rejouer. J'ai pris la base `fd2cbe2` (= `main~2`). Dans le vrai flux, le bonus se fait **avant** la fusion, et `main` est alors la bonne base.

### Bonus du bonus

```bash
git config --global rebase.autoSquash true   # --autosquash appliqué à chaque rebase -i
git config --global rerere.enabled true
```

(Je les ai mises en config **locale** dans `depot-jetable`, pour ne pas toucher ta config globale.)

**rerere** = *reuse recorded resolution*. Git retient comment tu as résolu un conflit. Si le même conflit revient (rebase refait, branche remise à jour plusieurs fois, merge de test annulé), Git applique la même résolution tout seul.

## Questions de justification

### 1. Branche déjà récupérée par le binôme

Le rebase crée de **nouveaux commits**, avec de nouveaux SHA. La branche distante et celle du binôme pointent encore sur les anciens.
- `git push` est refusé (non fast-forward).
- Chez le binôme, un `git pull` mélangerait anciens et nouveaux commits : doublons, conflits, et `debug.js` qui revient.
- Le binôme doit faire `git fetch` puis `git reset --hard origin/feature/tri-taches`, ou `git rebase` s'il a ses propres commits dessus.

Pour pousser :

```bash
git push --force-with-lease origin feature/tri-taches
```

`--force` écrase la branche distante, même si le binôme a poussé entre-temps : son travail est perdu.
`--force-with-lease` n'écrase que si la branche distante est **encore** là où tu l'as vue au dernier fetch. Sinon le push est refusé, tu récupères son travail, puis tu recommences.

### 2. Pourquoi un rebase -i si main est en « Squash and merge » ?

- **Le relecteur** lit les commits de la PR pendant la revue. « feat » puis « docs », c'est plus facile à suivre que « wip / debug / fix typo ». On peut relire un commit à la fois.
- **`--exec`** : chaque commit est vérifié (syntaxe, tests). Ça aide pendant la revue et pour un `git bisect` sur la branche.
- **Le conflit avec main** se règle **sur ta branche**, par toi, commit par commit, avant le merge. Pas dans l'interface de GitHub.
- **Pas de fuite** : `debug.js` ne doit pas passer dans le diff de la PR ni dans le commit squashé.
- Le squash a lieu de toute façon. Mais le message de la PR et la revue sont meilleurs avec un historique propre.

**Rebase and merge** est préférable quand on veut **garder plusieurs commits atomiques** sur main : grosse PR découpée en étapes, `git bisect` et `git revert` plus fins, refactor puis feature séparés. Cela suppose que l'équipe soigne déjà ses commits. Ici, `docs` pourrait être annulé à part avec `git revert`.

### 3. « Require branches to be up to date »

C'est ce qu'on vient de faire : remettre la branche au-dessus du main actuel (rebase, ou merge de main) avant de fusionner. Ce qui est testé par la CI est alors exactement ce qui arrivera sur main.

**Coût pour 10 personnes** : à chaque merge sur main, toutes les autres PR ouvertes ne sont plus à jour. Chacune doit être mise à jour, relancer la CI, parfois être re-relue. Les merges se font l'un après l'autre, c'est une course où le dernier refait le travail plusieurs fois, avec beaucoup de minutes de CI. Les solutions : une **merge queue** GitHub, des PR petites et courtes, et `rerere` pour les conflits qui reviennent.
