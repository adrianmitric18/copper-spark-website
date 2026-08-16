# CLAUDE.md

Instructions de projet pour Claude Code (copper-spark-website).

## 🧠 Mémoire persistante — À LIRE EN DÉBUT DE SESSION

Au **début de chaque session**, avant de commencer à travailler, lis les fichiers
du dossier `memory/` pour retrouver le contexte accumulé :

- `memory/user.md` — qui est l'utilisateur (rôle, contexte, expertise, langue)
- `memory/preferences.md` — comment travailler (style, conventions, ton, workflow)
- `memory/people.md` — personnes pertinentes pour le projet
- `memory/decisions.md` — décisions durables et leur raison

Applique ce que ces fichiers contiennent comme si l'utilisateur venait de te le dire.

## ✍️ Mise à jour — À FAIRE EN FIN DE SESSION

Avant de conclure une session (ou dès qu'un fait durable apparaît), **mets à jour**
le fichier concerné :

- Nouveau fait stable sur l'utilisateur → `memory/user.md`
- Nouvelle préférence de travail / convention → `memory/preferences.md`
- Nouvelle personne ou changement de rôle → `memory/people.md`
- Décision durable prise pendant la session → `memory/decisions.md`

Règles de mise à jour :
1. **Une info = un endroit.** Mets à jour la ligne existante plutôt que de dupliquer.
2. **Durable seulement.** N'enregistre pas ce qui est propre à une seule session ni
   ce que le code/git documente déjà (structure, historique, corrections passées).
3. **Date les décisions** (format `AAAA-MM-JJ`) et note toujours le *pourquoi*.
4. **Supprime** ce qui s'avère faux ou obsolète.
5. Convertis les dates relatives (« la semaine prochaine ») en dates absolues.

## Projet

- Site vitrine **copper-spark-website** — secteur chantiers/BTP, contenu en français.
- Commits : convention française avec scope (`feat(seo): …`, `fix(form): …`).
