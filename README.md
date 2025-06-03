# Pokémon EV Calculator & Inventory Optimizer

## What It Does

This web application helps you plan optimal EV (Effort Value) training for your Pokémon. You enter your desired EV spread, current EVs, and your inventory of Vitamins, Mochi, and Feathers. The app calculates the most efficient way to reach your goals, using your inventory first and optionally simulating purchases with your available funds.

## Features

- **EV Configuration** – set target EVs, input current EVs, parse EV strings, and see warnings if totals exceed 510 or 252 per stat.
- **Inventory Management** – track quantities of Vitamins, Feathers, and Mochi with quick updates, OCR scanning, and voice input. Inventory is saved in local storage.
- **Player Funds** – specify League Points and Poké Dollars so the calculator can simulate purchasing Vitamins if needed.
- **Optimal Item Calculation** – uses items from your inventory first, then determines any purchases required to hit your targets.
- **"Subtract Items After Calculation" Toggle** – choose whether to deduct used items from your saved inventory.
- **Detailed Results** – shows overall status, warnings, global EV summary, purchase summary, and per-stat breakdown of items used.
- **Export Options** – copy the full plan, copy Showdown-style EVs, or download a text or JSON file.
- **Responsive and Accessible** – designed for both desktop and mobile with keyboard-navigable elements.

## Details

### How to Use
1. **Set EV Goals** – adjust the sliders or number inputs for each stat, or paste an EV string in the Parse field.
2. **Manage Your Inventory** – enter quantities manually or use quick update, OCR scan, or voice input. You can reset any category to zero.
3. **Enter Player Funds** – add your League Points and Poké Dollars to allow the app to simulate Vitamin purchases.
4. **Enable or Disable Subtract Items** – decide if you want items deducted from your saved inventory after each calculation.
5. **Calculate** – click **Calculate Optimal Item Usage & Purchases**.
6. **Review Results** – read the overall status, per-stat details, and purchase summary. Warnings link back to the relevant stat card.
7. **Export Your Plan** – copy the text, copy Showdown EVs, or download a plan file.

### Local Storage
Your inventory data is stored in your browser's `localStorage`. It persists across sessions and never leaves your device. Clear your browser site data or reset categories in the app if you want to remove it.

## Technical Notes

- **Frontend:** React, TypeScript, and Tailwind CSS
- **OCR:** Tesseract.js
- **State Management:** React Hooks (`useState`, `useCallback`, `useMemo`, `useEffect`)
- **Speech Recognition:** Web Speech API (browser dependent)

## Deploying to GitHub Pages

This repo includes a GitHub Actions workflow that builds the Vite project and publishes the `dist` folder to GitHub Pages.
1. Push changes to the `main` branch.
2. In repository settings, enable **GitHub Pages** and choose **GitHub Actions** as the source.
3. After the workflow finishes, your app will be available at `https://<your-user>.github.io/<your-repo>/`.

---

*Pokémon and Pokémon character names are trademarks of Nintendo.*
*This is a fan-made tool and is not affiliated with Nintendo or The Pokémon Company.*
