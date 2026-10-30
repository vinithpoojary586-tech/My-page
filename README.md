# Ember & Crust Pizza

A responsive pizza storefront built with HTML, CSS, and vanilla JavaScript. The site presents the restaurant, menu, offers, customer reviews, and contact information, with an interactive menu and shopping cart.

## Project files

- `index.html` - page structure and content
- `style.css` - layout, responsive styling, and light/dark themes
- `script.js` - menu rendering, filtering, cart, theme toggle, and form interactions

## Run locally

Open `index.html` in a browser. The project does not require a build step or package installation. Google Fonts, food photography, and the map are loaded from external services, so those elements require an internet connection.

## Current functionality

- Responsive navigation and section links
- Menu items with category filters and add-to-cart controls
- Cart drawer with quantity controls, totals, and local storage persistence
- Light/dark theme toggle with saved preference
- Contact form and interactive feedback

Checkout is a demo; orders are not submitted to a payment or ordering service.

## UI redesign direction

The following is a design specification for the next iteration, not a claim that every feature has already been implemented.

### Visual system

Use a warm, food-inspired palette with restrained accents and clear contrast:

| Purpose | Color |
| --- | --- |
| Primary action - tomato red | `#B83227` |
| Secondary accent - burnt orange | `#D96B27` |
| Highlight - saffron | `#F2B84B` |
| Page background - warm cream | `#FFF9F2` |
| Card and dialog surface | `#FFFFFF` |
| Main text - charcoal | `#24211E` |
| Secondary text - muted brown-grey | `#6D665E` |
| Vegetarian label - herb green | `#3E7352` |

Use **Inter** for body text, prices, and controls, and **Playfair Display** sparingly for prominent headings. Keep large surfaces light and calm; reserve red and orange for actions, prices, and small highlights.

### Page structure

1. **Home:** compact header, appetizing hero image, clear "Order Now" and "View Menu" actions, then delivery/takeaway and postcode selection.
2. **Menu:** search and horizontally scrollable category filters above a responsive product grid. Include Veg, Non-Veg, Bestsellers, Sides, and Drinks.
3. **Customization:** a focused dialog with Size -> Crust -> Toppings -> Extra cheese. Show the running price and add-to-cart action together.
4. **Cart:** show selected items, quantities, and total; on mobile, keep a compact cart action fixed at the bottom of the screen.
5. **Supporting content:** offers, reviews, restaurant information, and contact details.

## Pizza card and customizer examples

These are standalone starting points for the proposed interface. Wire the add action to the cart logic in `script.js` when implementing them.

### HTML

```html
<article class="pizza-card">
  <img
    class="pizza-card__image"
    src="pizza-photo.jpg"
    alt="Margherita pizza topped with fresh basil"
    loading="lazy"
  />
  <div class="pizza-card__body">
    <div class="pizza-card__heading">
      <h3>Garden Margherita</h3>
      <span class="pizza-card__tag">Bestseller</span>
    </div>
    <p>Tomato, mozzarella, and fresh basil.</p>
    <div class="pizza-card__footer">
      <span class="pizza-card__price">From $12.50</span>
      <button
        class="button button--primary"
        type="button"
        data-customize
        data-name="Garden Margherita"
        data-base-price="12.50"
      >
        Customize
      </button>
    </div>
  </div>
</article>

<dialog class="customizer" id="customizer" aria-labelledby="customizer-title">
  <form class="customizer__content" method="dialog">
    <button class="customizer__close" value="cancel" aria-label="Close">Close</button>
    <p class="eyebrow">Make it yours</p>
    <h2 id="customizer-title">Garden Margherita</h2>

    <fieldset class="option-group">
      <legend>1. Choose your size</legend>
      <label class="option">
        <span><input type="radio" name="size" data-price="0" checked /> Regular, 9 inch</span>
        <strong>Included</strong>
      </label>
      <label class="option">
        <span><input type="radio" name="size" data-price="3" /> Large, 12 inch</span>
        <strong>+$3.00</strong>
      </label>
    </fieldset>

    <fieldset class="option-group">
      <legend>2. Choose your crust</legend>
      <label class="option">
        <span><input type="radio" name="crust" data-price="0" checked /> Classic</span>
        <strong>Included</strong>
      </label>
      <label class="option">
        <span><input type="radio" name="crust" data-price="1.5" /> Stuffed crust</span>
        <strong>+$1.50</strong>
      </label>
    </fieldset>

    <fieldset class="option-group">
      <legend>3. Add toppings <small>Optional</small></legend>
      <label class="option">
        <span><input type="checkbox" data-price="1.25" /> Mushrooms</span>
        <strong>+$1.25</strong>
      </label>
      <label class="option">
        <span><input type="checkbox" data-price="1.5" /> Extra mozzarella</span>
        <strong>+$1.50</strong>
      </label>
    </fieldset>

    <div class="customizer__footer">
      <div>Total <output id="customizer-total" aria-live="polite">$12.50</output></div>
      <button class="button button--primary" type="button" id="add-pizza">
        Add to cart - $12.50
      </button>
    </div>
  </form>
</dialog>
```

### CSS

```css
:root {
  --tomato: #b83227;
  --orange: #d96b27;
  --saffron: #f2b84b;
  --cream: #fff9f2;
  --ink: #24211e;
  --muted: #6d665e;
  --line: #eee5db;
  --green: #3e7352;
}

body {
  color: var(--ink);
  background: var(--cream);
  font-family: Inter, system-ui, sans-serif;
}

h1,
h2,
h3 {
  font-family: "Playfair Display", Georgia, serif;
}

.button {
  min-height: 48px;
  padding: 0.75rem 1rem;
  border: 0;
  border-radius: 12px;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.button--primary {
  color: #fff;
  background: var(--tomato);
}

.pizza-card {
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 8px 24px rgb(36 33 30 / 7%);
}

.pizza-card__image {
  display: block;
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
}

.pizza-card__body {
  padding: 1rem;
}

.pizza-card__heading,
.pizza-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.pizza-card__tag {
  color: var(--green);
  font-size: 0.8rem;
  font-weight: 700;
}

.customizer {
  width: min(540px, calc(100% - 24px));
  max-height: min(88dvh, 760px);
  padding: 0;
  border: 0;
  border-radius: 20px;
  color: var(--ink);
  background: #fff;
  box-shadow: 0 24px 80px rgb(0 0 0 / 25%);
}

.customizer::backdrop {
  background: rgb(25 20 16 / 60%);
}

.customizer__content {
  padding: 1.5rem;
  overflow-y: auto;
}

.option-group {
  display: grid;
  gap: 0.5rem;
  margin: 1.25rem 0;
  padding: 0;
  border: 0;
}

.option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  min-height: 52px;
  padding: 0.7rem 0.8rem;
  border: 1px solid var(--line);
  border-radius: 12px;
}

.customizer__footer {
  position: sticky;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 0 0.25rem;
  border-top: 1px solid var(--line);
  background: #fff;
}

@media (max-width: 600px) {
  .customizer__content {
    padding: 1.25rem;
  }

  .customizer__footer .button {
    flex: 1;
  }
}
```

## Mobile usability checklist

- Make buttons, category filters, and option rows easy to tap (about 44-48px minimum height).
- Keep category filters horizontally scrollable rather than squeezing them into multiple rows.
- Use a sticky bottom cart bar on small screens and add enough page bottom padding to avoid covering content.
- Keep the customization total and primary action visible while scrolling the dialog.
- Provide visible keyboard focus, descriptive image alt text, and labels for all form controls.
- Use a clear default size and crust so customers can add a pizza without unnecessary steps.

## Next implementation steps

1. Add delivery/takeaway selection and postcode entry to the home/menu flow.
2. Extend menu categories and product data for sides and drinks.
3. Implement the customization dialog and connect its selected options and calculated price to the existing cart.
4. Add a mobile sticky cart summary that opens the existing cart drawer.
5. Test the order flow at mobile and desktop widths, including keyboard navigation and both theme modes.
