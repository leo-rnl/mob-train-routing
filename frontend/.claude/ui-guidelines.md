# UI Guidelines - MOB Design System

> Référence design basée sur l'analyse de [mob.ch](https://www.mob.ch)

---

## Couleurs

### Palette principale

| Rôle        | Hex       | RGB             | Usage                                         |
| ----------- | --------- | --------------- | --------------------------------------------- |
| **Primary** | `#001f78` | `0, 31, 120`    | Bleu foncé - couleur principale, headers, CTA |
| **Accent**  | `#d9c89e` | `217, 200, 158` | Or/beige chaud - accents, highlights          |
| **Dark**    | `#2f3137` | `47, 49, 55`    | Texte principal, titres                       |

### Couleurs sémantiques

| Rôle        | Hex       | Usage                          |
| ----------- | --------- | ------------------------------ |
| **Success** | `#78a136` | Confirmations, validations     |
| **Danger**  | `#a6142a` | Erreurs, suppressions          |
| **Warning** | `#e8871e` | Alertes, avertissements        |
| **Neutral** | `#8a8e99` | Texte secondaire, placeholders |

### Backgrounds

| Rôle        | Hex       | Usage                          |
| ----------- | --------- | ------------------------------ |
| **Light**   | `#ffffff` | Fond principal                 |
| **Surface** | `#f5f5f5` | Cartes, sections (à confirmer) |

---

## Typographie

### Police originale

- **Larsseit** - Police commerciale utilisée par MOB
- Poids disponibles : 300, 400, 500, 600, 700, 800

### Alternative gratuite retenue

- **Inter** - Police open source similaire (Google Fonts)
- Excellente lisibilité, large gamme de poids
- [Google Fonts - Inter](https://fonts.google.com/specimen/Inter)

### Hiérarchie typographique

MOB utilise la variation de **poids** plutôt que de taille pour créer la hiérarchie :

| Élément           | Poids   | Usage                      |
| ----------------- | ------- | -------------------------- |
| Titres principaux | 700-800 | H1, H2                     |
| Sous-titres       | 600     | H3, H4                     |
| Corps             | 400     | Texte courant              |
| Léger             | 300     | Texte secondaire, captions |

---

## Border Radius

**Aucun border radius** - Coins carrés partout.

```css
border-radius: 0px;
```

Cela s'applique à :

- Boutons
- Cartes
- Inputs
- Modals
- Tous les composants

---

## Spacing

### Grille de base

| Contexte | Valeur | Rem        |
| -------- | ------ | ---------- |
| Mobile   | `20px` | `1.25rem`  |
| Desktop  | `30px` | `1.875rem` |

### Gaps

| Contexte               | Valeur |
| ---------------------- | ------ |
| Entre cartes (mobile)  | `24px` |
| Entre cartes (desktop) | `30px` |

---

## Boutons

### Style

- Coins carrés (0px border radius)
- Fond primary (`#001f78`) pour CTA principaux
- Texte blanc sur fond primary
- États hover avec légère variation de couleur

### Variantes à implémenter

| Variante  | Background    | Text      |
| --------- | ------------- | --------- |
| Primary   | `#001f78`     | `#ffffff` |
| Secondary | `transparent` | `#001f78` |
| Danger    | `#a6142a`     | `#ffffff` |

---

## Composants spécifiques

### Timeline / Visualisation trajet

- Marqueurs circulaires pour les stations
- Lignes de connexion verticales
- Indicateurs de transport avec icônes

### Cartes

- Pas de shadow (ou très subtile)
- Séparateurs avec `border` plutôt que shadow
- Padding interne : 20-30px

---

## Icônes

MOB utilise une police d'icônes custom. Pour notre projet :

- Utiliser **Material Design Icons** (inclus dans Vuetify)
- Ou **Lucide Icons** si besoin d'alternatives

---

## Notes d'implémentation

### Vuetify

Configurer le thème Vuetify avec :

- Désactiver les border-radius globaux
- Définir la palette de couleurs
- Importer Inter depuis Google Fonts

### CSS Variables à définir

```css
:root {
  --mob-primary: #001f78;
  --mob-accent: #d9c89e;
  --mob-dark: #2f3137;
  --mob-success: #78a136;
  --mob-danger: #a6142a;
  --mob-warning: #e8871e;
  --mob-neutral: #8a8e99;
}
```

---

## Références

- Site principal : https://www.mob.ch
- Page routing : https://www.mob.ch/fr/routing
- Google Fonts Inter : https://fonts.google.com/specimen/Inter
