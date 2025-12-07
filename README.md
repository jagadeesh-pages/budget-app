# Budget Calculator

A simple and elegant budget tracking web application with visual analytics and Excel export functionality.

## Features

- **Add Expenses**: Track amount, category, and product details
- **Visual Analytics**: Interactive donut chart showing spending by category
- **Excel Export**: Download all expenses as Excel spreadsheet
- **Local Storage**: Data persists in browser
- **Responsive Design**: Works on desktop and mobile devices
- **Category Tracking**: 7 predefined categories (Food, Transport, Entertainment, Shopping, Bills, Health, Other)

## Tech Stack

- HTML5, CSS3, JavaScript (Vanilla)
- Chart.js for donut chart visualization
- SheetJS (xlsx) for Excel export
- LocalStorage for data persistence

## Getting Started

1. Open `src/index.html` in your browser
2. Add expenses using the form
3. View spending breakdown in the donut chart
4. Export data to Excel anytime

## Usage

### Add Expense
1. Enter amount in dollars
2. Select category from dropdown
3. Enter product/details description
4. Click "Save Expense"

### Export to Excel
- Click "📊 Export to Excel" button
- File downloads as `Budget_YYYY-MM-DD.xlsx`
- Contains all expenses with Amount, Category, Product, and Date columns

### Clear Data
- Click "🗑️ Clear All Data" to reset all expenses

## Categories

- 🍔 Food
- 🚗 Transport
- 🎬 Entertainment
- 🛍️ Shopping
- 💡 Bills
- 🏥 Health
- 📦 Other

## Project Structure

```
budget-app/
├── src/
│   ├── index.html
│   ├── index.js
│   └── styles/
│       └── style.css
└── README.md
```

## License

MIT License
