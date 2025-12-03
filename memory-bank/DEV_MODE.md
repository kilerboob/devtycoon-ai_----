# Dev Mode Notes

- Date: 2025-12-03
- Enabled unlimited money for development using localStorage key `dev-unlimited-money = '1'`.
- Editors honoring dev mode:
  - `components/FurnitureEditor3D.tsx`
  - `components/AdvancedFurnitureEditor.tsx`
- Behavior:
  - Bypass purchase cost checks.
  - Skip money deduction on purchase or template apply.
  - UI still displays current money; functional checks use `effectiveMoney`.

To toggle:
- In browser console: `localStorage.setItem('dev-unlimited-money', '1')` to enable.
- `localStorage.removeItem('dev-unlimited-money')` to disable.
