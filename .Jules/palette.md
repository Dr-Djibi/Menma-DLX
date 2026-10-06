## 2026-10-04 - Accessible Icon-Only Controls & Focus Ring Visual Indicators
**Learning:** Icon-only buttons (such as paste or share buttons) without explicit ARIA labels hide actions from screen reader users, and missing custom `:focus-visible` states make keyboard navigation unclear.
**Action:** Always provide descriptive `aria-label` attributes on icon-only buttons and explicitly style `:focus-visible` to maintain visible visual focus indicators for keyboard navigation.

## 2026-10-18 - Keyboard Navigation for Dynamic Custom Components
**Learning:** Custom interactive elements (like history items dynamically rendered as `<div>`) without `role="button"`, `tabindex="0"`, and `keydown` handlers are inaccessible to keyboard navigation and screen readers.
**Action:** Always assign `role="button"`, `tabindex="0"`, keyboard handlers (`Enter`/`Space`), and `:focus-visible` styles when building dynamic interactive card or gallery components.
