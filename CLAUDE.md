# Site-QualiHouse

## Skills "taste" installées (depuis github.com/Leonxlnx/taste-skill)

Ces skills sont disponibles dans `.claude/skills/` et doivent être utilisées
quand on travaille sur le design/front du site QualiHouse. Invoquer via le
tool `Skill` avec le `name` (pas le nom de dossier).

| Skill (name)               | Quand l'utiliser                                                    |
|----------------------------|---------------------------------------------------------------------|
| `design-taste-frontend`    | Design front premium tout-usage (skill principale)                  |
| `gpt-taste`                | Variante stricte, motion GSAP, randomisation layout                 |
| `redesign-existing-projects` | Upgrader/refondre un site existant sans casser le fonctionnel    |
| `high-end-visual-design`   | Look "agence haut de gamme" (soft-skill)                            |
| `minimalist-ui`            | Style éditorial minimaliste, monochrome chaud                       |
| `industrial-brutalist-ui`  | Style brutaliste / terminal militaire / Swiss print                 |
| `image-to-code`            | Pipeline image → code, génère puis implémente                       |
| `imagegen-frontend-web`    | Génération d'images de référence pour sections web                  |
| `imagegen-frontend-mobile` | Génération de maquettes mobiles                                     |
| `brandkit`                 | Planches d'identité de marque / logos                               |
| `stitch-design-taste`      | DESIGN.md pour Google Stitch                                        |
| `full-output-enforcement`  | Forcer une sortie de code complète, sans placeholders               |

### Workflow recommandé pour un nouveau site
1. `brandkit` → planches d'identité
2. `imagegen-frontend-web` → images de référence par section
3. `design-taste-frontend` (ou `minimalist-ui` / `industrial-brutalist-ui` selon style)
   → implémentation du code front

### Workflow pour améliorer un site existant
1. `redesign-existing-projects` → audit + plan
2. `design-taste-frontend` ou `high-end-visual-design` → application
