# Système de Design — OmniDL (Impeccable)

Ce document définit les règles ergonomiques, graphiques et d'accessibilité du frontend d'OmniDL selon les standards de qualité **Impeccable**.

---

## 🎨 1. Palette de Couleurs & Contraste

Toutes les combinaisons texte/arrière-plan respectent le standard **WCAG AA** (ratio minimum **4.5:1** pour le texte standard et **3:1** pour les grands titres).

### Mode Sombre (Défaut)
* **Arrière-plan principal (`--bg`)** : `#0b0f19` (Noir bleuté profond, sans fatigue visuelle)
* **Cartes / Conteneurs (`--card-bg`)** : `rgba(18, 24, 38, 0.85)` avec flou de surface `backdrop-filter: blur(16px)`
* **Bordures de surface (`--border`)** : `rgba(255, 255, 255, 0.10)`
* **Texte principal (`--text`)** : `#ffffff` (Ratio 15.8:1 sur fond sombre)
* **Texte secondaire (`--text-muted`)** : `#94a3b8` (Ratio 6.4:1 sur fond sombre)
* **Accent primaire (`--primary`)** : `#4f46e5` (Indigo vif, ratio 5.9:1 avec texte blanc)
* **Accent succès / Action (`--accent`)** : `#e11d48` (Rose carmin soutenu, ratio 4.6:1 avec texte blanc)
* **Bordures d'alerte / Erreur (`--error`)** : `#ef4444` sur fond `rgba(239, 68, 68, 0.12)`

### Mode Clair
* **Arrière-plan (`--bg`)** : `#f8fafc`
* **Cartes (`--card-bg`)** : `rgba(255, 255, 255, 0.92)`
* **Texte principal (`--text`)** : `#0f172a` (Ratio 15.4:1)
* **Texte secondaire (`--text-muted`)** : `#475569` (Ratio 5.8:1)
* **Bordures (`--border`)** : `rgba(15, 23, 42, 0.10)`

---

## ✍️ 2. Typographie & Hiérarchie

* **Police** : `'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
* **Couleurs de texte** : Couleurs pleines à fort contraste (**aucun texte en dégradé / background-clip: text**, conformément aux règles anti-clichés d'Impeccable).
* **Hiérarchie sémantique des titres** :
  * `<h1>` : Marque OmniDL (taille 2rem à 2.25rem, poids 800)
  * `<h2>` : Titres de sections (ex: "Récents", taille 1.1rem, poids 600)
  * `<h3>` / `<p>` : Sous-titres et étiquettes

---

## 📐 3. Élévations, Ombres & Espacements

* **Ombres naturelles** : Pas de halos lumineux colorés ("neon / dark-glow"). Utilisation d'élévations neutres physiques :
  * `box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.2);`
  * Au survol : `box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -4px rgba(0, 0, 0, 0.3);`
* **Espacements (Insets)** : Tout conteneur avec bordure ou fond distinct possède un rembourrage intérieur (`padding`) de minimum 12px à 16px pour éviter tout texte collé aux bordures (`cramped-padding`).

---

## ⚡ 4. Mouvements & Animations

* **Courbes d'accélération** : Aucune animation avec rebond artificiel (`bounce-easing`). Utilisation stricte de courbes d'amortissement exponentielles :
  * Décélération naturelle : `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out-expo)
  * Transition standard : `cubic-bezier(0.4, 0, 0.2, 1)` (ease-in-out)
* **Durées** : 150ms pour les micros-interactions (boutons, focus), 250ms à 350ms pour les apparitions de cartes et modales.
* **Accessibilité** : Respect de `@media (prefers-reduced-motion: reduce)`.

---

## ♿ 5. Accessibilité & Clavier

* Indicateurs de focus explicites via `:focus-visible` avec anneau de contraste élevé (`outline: 2px solid var(--primary); outline-offset: 2px;`).
* Tous les boutons sans texte explicite possèdent un attribut `aria-label` descriptif.
* Zones d'état en direct (`aria-live="polite"` pour les statuts et `role="alert"` pour les erreurs).
