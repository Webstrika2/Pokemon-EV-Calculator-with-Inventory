
# Pokémon EV Calculator with Inventory & Purchase Planner

An interactive web application to calculate Pokémon EV (Effort Value) distribution based on your desired stats, available items (Vitamins, Mochi, Feathers), and in-game currencies. It helps optimize item usage and plan purchases to reach your EV goals efficiently.

![Placeholder for a screenshot of the EV Calculator in action - consider adding one!](https://via.placeholder.com/800x450.png?text=Pok%C3%A9mon+EV+Calculator+Screenshot)

## 🌟 Key Features

*   **Comprehensive EV Configuration:**
    *   Set Current EVs for your Pokémon.
    *   Define Target EVs for each stat (HP, Attack, Defense, Sp. Attack, Sp. Defense, Speed) using intuitive sliders.
    *   Visual progress bar for Total Target EVs, preventing allocation beyond the 510 maximum.
    *   Individual stat cap of 252 EVs enforced.
    *   "Reset All Target EVs" button for quick clearing.
*   **Inventory Management:**
    *   Input quantities for owned Vitamins, Mochi, and Feathers.
    *   Collapsible sections for easy organization.
    *   Quick increment/decrement buttons (+/-) for item quantities.
*   **Currency Tracking:**
    *   Enter your available Poké Dollars and League Points.
    *   Vitamins are priced at 10,000 (Poké Dollars or LP).
*   **Smart Item Optimization & Purchase Planning:**
    *   The calculator first utilizes your existing inventory (Vitamins, then Mochi, then Feathers) to meet EV goals.
    *   If owned items are insufficient, it suggests purchasing the required Vitamins.
    *   **Granular Purchase Logic:**
        *   Calculates the exact number of Vitamins needed per stat.
        *   Checks affordability against your combined currencies (Poké Dollars prioritized).
        *   If you can't afford all suggested Vitamins for a stat, it tells you how many you *can* buy with remaining funds.
        *   Clearly indicates any partial purchases and the remaining quantity/cost needed for that specific item.
*   **Detailed & User-Friendly Results:**
    *   **Overall Status:** Clear message indicating if EV goals were met (with owned items, with purchases, or partially).
    *   **Purchase Overview:** Summarizes total ideal cost, actual amount spent, and total additional currency needed if goals aren't fully met.
    *   **Per-Stat Breakdown:**
        *   Displays Target EV, Current EV, and Initial EV Need.
        *   Lists items used from your inventory with quantities and EVs gained.
        *   Lists Vitamins "To Purchase" with:
            *   Quantity to buy (full or partial based on funds).
            *   Cost of the purchase.
            *   EVs gained from the purchase.
            *   If a partial purchase, details the remaining quantity and its additional cost.
            *   Clear indication if a suggested purchase is entirely unaffordable.
        *   Shows the final EV total for the stat and any EVs still needed.
    *   **Important Notes & Warnings:** Highlights any shortfalls or issues.
*   **Visual Appeal:**
    *   Uses item sprites from PokeAPI where available, with emoji fallbacks.
    *   Themed colors for stats and UI elements.
    *   Responsive design for various screen sizes.

## 🛠️ Tech Stack

*   **React 19** (via ESM.sh, no build step)
*   **TypeScript**
*   **Tailwind CSS** (via CDN)

This project is designed to run directly in the browser without a complex build process, making it easy to get started.

## 🚀 How to Use / Run

1.  **Clone the repository (or download the files):**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```
2.  **Open `index.html`:**
    Simply open the `index.html` file in a modern web browser (like Chrome, Firefox, Edge, Safari).

That's it! The application is entirely client-side and will run directly.

## 📁 File Structure

```
.
├── README.md                 // This file
├── index.html                // Main HTML entry point
├── index.tsx                 // React application entry (mounts App)
├── App.tsx                   // Main React application component (state logic, layout)
├── types.ts                  // TypeScript type definitions
├── constants.ts              // Application constants (item data, EV limits, initial states)
├── metadata.json             // Application metadata (name, description)
├── components/               // Directory for React UI components
│   ├── CollapsibleSection.tsx
│   ├── CurrencyInputs.tsx
│   ├── InventoryItemInput.tsx
│   ├── ItemIcon.tsx
│   ├── ResultsDisplay.tsx
│   ├── StatInput.tsx
│   └── TotalEVBar.tsx
└── (No node_modules or package.json as it's a direct browser app for now)
```

## ℹ️ Item Information

The calculator uses the following EV-enhancing items:

*   **🧪 Vitamins** (+10 EVs per item)
    *   HP Up, Protein, Iron, Carbos, Calcium, Zinc
    *   Cost: 10,000 Poké Dollars or League Points each.
*   **🍡 Mochi** (+10 EVs per item)
    *   Health Mochi, Muscle Mochi, Resist Mochi, Genius Mochi, Clever Mochi, Swift Mochi
*   **🪶 Feathers** (+1 EV per item)
    *   Health Feather, Muscle Feather, Resist Feather, Genius Feather, Clever Feather, Swift Feather

## ✨ Potential Future Enhancements

*   Saving/Loading EV spreads, inventory, and currency.
*   Support for EV-reducing berries.
*   Integration of Pokémon base stats to show total stats.
*   Option to select a specific Pokémon to pre-fill current EVs (if level 1 and untouched).
*   More advanced theming options.

##🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME/issues) (if you plan to host this on GitHub).

## 📜 License

Consider adding a license file (e.g., MIT License) to your repository. If you do, mention it here. For example:

Distributed under the MIT License. See `LICENSE` for more information.
(You would need to create a `LICENSE` file, typically containing the MIT license text).

---

*Pokémon and Pokémon character names are trademarks of Nintendo.*
*This project is a fan-made tool and is not affiliated with Nintendo or The Pokémon Company.*
```

This README provides a solid overview of your project. Remember to:
1.  Replace `<repository-url>` and `<repository-directory>` if you guide users to clone.
2.  **Crucially, add a screenshot!** A visual makes a huge difference.
3.  Update the "Contributing" and "License" sections if you host this on GitHub and want to formalize those aspects (e.g., link to the actual issues page: `https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME/issues`).
4.  If you add a `LICENSE` file, make sure to reference it correctly.

This should serve as an excellent starting point for your repository!