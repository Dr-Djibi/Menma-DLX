## 2026-10-04 - Accessible Icon-Only Controls & Focus Ring Visual Indicators
**Learning:** Icon-only buttons (such as paste or share buttons) without explicit ARIA labels hide actions from screen reader users, and missing custom `:focus-visible` states make keyboard navigation unclear.
**Action:** Always provide descriptive `aria-label` attributes on icon-only buttons and explicitly style `:focus-visible` to maintain visible visual focus indicators for keyboard navigation.
