
# Pokémon EV Calculator & Inventory Optimizer

An interactive web application to calculate Pokémon EV (Effort Value) distribution based on your desired stats, available items (Vitamins, Mochi, Feathers), and player funds. It helps optimize item usage to reach your EV goals and simulates purchases if necessary.

## Features

*   **EV Configuration:**
    *   Set target EVs for each stat (HP, Attack, Defense, Sp. Attack, Sp. Defense, Speed).
    *   Input current EVs for your Pokémon.
    *   Parse EV strings in common formats (e.g., "252 HP / 4 Def / 252 Spe").
    *   Visual feedback for total EVs, ensuring they don't exceed the 510 limit or 252 per stat.
*   **Inventory Management:**
    *   Manually input quantities for Vitamins, Feathers, and Mochi.
    *   **Local Storage Persistence:** Your inventory is automatically saved in your browser and will be loaded when you revisit the app.
    *   **Quick Update:** Enter a space-separated or comma-separated list of numbers to quickly update quantities for an entire item category. Supports number words (e.g., "five", "two fifty two").
    *   **OCR (Optical Character Recognition):** Scan screenshots of your in-game inventory using Tesseract.js to automatically update item counts for a category.
    *   **Voice Input:** Use your microphone to dictate item quantities for a category sequentially.
    *   Reset entire categories of items to zero.
*   **Player Funds:**
    *   Input your available League Points (LP) and Poké Dollars.
    *   The calculator will use these funds to simulate purchasing Vitamins if your current inventory isn't sufficient.
*   **Optimal Item Calculation:**
    *   Prioritizes using items from your existing inventory first (most effective items like Vitamins, then Mochi, then Feathers).
    *   If inventory items are insufficient and Vitamins can cover the remaining EVs, it calculates the number of Vitamins to purchase.
    *   Considers your available LP and Poké Dollars for purchases.
*   **"Subtract Items After Calculation" Toggle:**
    *   A toggle switch allows you to choose whether the items used in a calculation should be automatically deducted from your saved inventory.
    *   **ON:** Ideal for planning sequential EV training, as your inventory updates after each Pokémon.
    *   **OFF (default):** Allows for "what-if" scenarios without affecting your saved inventory.
*   **Detailed Results Display:**
    *   Overall status message indicating success or issues.
    *   Warnings for any unmet EV goals or funding shortfalls.
    *   Global EV summary (total achieved, remaining to cap, total items used).
    *   Purchase summary (items bought, cost, remaining funds, or shortfall details).
    *   Per-stat breakdown:
        *   Target, current, gained, and achieved EVs.
        *   Progress bars with target markers.
        *   List of specific items used (from inventory or purchased) with quantities and EVs gained.
        *   Clickable warnings for "Still Need EVs" that scroll to the relevant stat and expand item details.
*   **Export Options (Dropdown Menu):**
    *   **Copy Full Plan:** Copies a detailed text summary of the EV plan to the clipboard.
    *   **Copy Showdown EVs:** Copies the target EV spread in Pokémon Showdown format (e.g., "252 HP / 4 Atk / 252 Spe") to the clipboard.
    *   **Export as .txt:** Downloads the full EV plan as a text file.
    *   **Export as .json:** Downloads the complete calculation result, current/target EVs, and plan summary as a JSON file.
*   **Responsive Design:** Adapts to various screen sizes for usability on desktop and mobile devices.
*   **Accessibility Considerations:** Includes ARIA attributes and keyboard-navigable elements where appropriate.

## How to Use

1.  **Set EV Goals:**
    *   **Target EVs:** Use the sliders or number inputs in the "EV Configuration" section for each stat (HP, Attack, etc.) to set your desired EV spread. The total EVs cannot exceed 510, and individual stats cap at 252.
    *   **Current EVs:** Input the current EVs your Pokémon already has in each stat.
    *   **Parse EV String:** Alternatively, type or paste an EV spread (e.g., "252 Atk / 252 Spe / 4 HP") into the "Parse EV String" field and click "Parse & Apply".

2.  **Manage Your Inventory:**
    *   Your inventory is automatically saved in your browser.
    *   **Manual Input:** Expand the "Vitamins", "Feathers", or "Mochi" sections and enter the quantity for each item you own.
    *   **Quick Update:** For faster entry, use the "Quick update for [Category]" field. Type numbers separated by spaces or commas (e.g., "10 5 0 0 0 12" for the 6 Vitamins). You can also use number words (e.g., "ten five zero"). Click "Apply".
    *   **OCR Scan:**
        *   Click the "Scan (OCR)" button within a category's collapsible section (e.g., Vitamins).
        *   A modal will appear. Upload or paste a screenshot of your in-game inventory for that item category.
        *   Click "Start OCR". The app will attempt to read the item quantities and update your inventory.
    *   **Voice Input:**
        *   Click the microphone icon next to the "Quick Update" apply button for a category.
        *   Grant microphone permission if prompted.
        *   The app will highlight the first item (or first item with 0 quantity). Say the quantity for that item (e.g., "five", "20").
        *   It will automatically move to the next item. Say "stop" or "cancel" to end voice input for the category.
    *   **Reset Category:** Click the "Reset Category" button in a collapsible section header to set all items in that category to 0.

3.  **Enter Player Funds:**
    *   In the "Player Resources" section, input your current League Points (LP) and Poké Dollars. This is used to determine if you can afford to buy necessary Vitamins.

4.  **"Subtract Items After Calculation" Toggle:**
    *   Locate the checkbox below the inventory sections / above the main calculate button.
    *   Check this box if you want the items used in the calculation to be automatically deducted from your inventory. This is useful if you plan to EV train multiple Pokémon and want your inventory to reflect usage.
    *   Leave it unchecked (default) for planning without altering your saved inventory.

5.  **Calculate:**
    *   Click the "Calculate Optimal Item Usage & Purchases" button.

6.  **Review Results:**
    *   The "Calculation Results" section will appear.
    *   **Overall Status & Warnings:** Check the main message and any warnings (e.g., if you still need EVs or are short on funds).
    *   **Global Summary:** See total EVs achieved and items used.
    *   **Purchase Summary:** If purchases were necessary, review what was bought, the cost, and your remaining funds. If you couldn't afford items, it will show the shortfall.
    *   **EV Status per Stat:** For each stat, see:
        *   How many EVs were gained and the new total.
        *   A progress bar indicating current vs. max EVs for the stat, with a marker for your target.
        *   A list of items used (from inventory or purchased), their quantities, and the EVs they provided. You can expand/collapse this list.
        *   If a warning says "Still need X EVs for STAT", you can click the warning text to jump to that stat card and see its details.

7.  **Export Your Plan:**
    *   Click the "Export Plan" button in the results section.
    *   A dropdown menu will appear with options:
        *   `Copy Full Plan`: Copies a text summary to your clipboard.
        *   `Copy Showdown EVs`: Copies EVs in a format like "252 Atk / 4 Def / 252 Spe".
        *   `Export as .txt`: Downloads a text file of the full plan.
        *   `Export as .json`: Downloads a JSON file with detailed results data.

## Local Storage for Inventory

This application uses your browser's `localStorage` to save your item inventory (Vitamins, Feathers, Mochi). This means:

*   **Persistence:** Your inventory data will remain available even if you close the browser tab or window and reopen it later on the same browser and device.
*   **Automatic Saving:** Any changes you make to your inventory (manual input, quick updates, OCR scans, voice input, or automatic subtraction after calculation if the toggle is enabled) are automatically saved.
*   **Privacy:** The data is stored only in *your* browser. It is not sent to any server.
*   **Clearing Data:** If you wish to clear your saved inventory, you can do so by clearing your browser's site data for this application, or by manually setting all inventory items to zero within the app.

## Technical Notes

*   **Frontend:** React, TypeScript, Tailwind CSS
*   **OCR:** Tesseract.js
*   **State Management:** React Hooks (`useState`, `useCallback`, `useMemo`, `useEffect`)
*   **Speech Recognition:** Web Speech API (browser dependent)

## Deploying to GitHub Pages

This repository includes a GitHub Actions workflow that builds the application
using Vite and publishes the `dist` folder to GitHub Pages. To deploy:

1. Push your changes to the `main` branch.
2. In the repository settings, enable **GitHub Pages** and choose `GitHub
   Actions` as the source.
3. After the workflow completes, the app will be available at
   `https://<your-user>.github.io/<your-repo>/`.

---

*Pokémon and Pokémon character names are trademarks of Nintendo.*
*This is a fan-made tool and is not affiliated with Nintendo or The Pokémon Company.*
    