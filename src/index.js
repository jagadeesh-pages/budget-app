let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
let chart = null;

const categoryColors = {
    Food: '#FF8C00',
    Transport: '#0288D1',
    Entertainment: '#7B1FA2',
    Shopping: '#C2185B',
    Bills: '#F57C00',
    Health: '#388E3C',
    Other: '#546E7A'
};

document.getElementById('expenseForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const expense = {
        id: Date.now(),
        amount: parseFloat(document.getElementById('amount').value),
        category: document.getElementById('category').value,
        product: document.getElementById('product').value,
        paymentMethod: document.getElementById('paymentMethod').value,
        date: new Date().toLocaleDateString()
    };
    
    expenses.push(expense);
    saveExpenses();
    updateUI();
    e.target.reset();
});

document.getElementById('filterCategory').addEventListener('change', updateTable);
document.getElementById('filterProduct').addEventListener('input', updateTable);

document.getElementById('exportBtn').addEventListener('click', exportToExcel);
document.getElementById('clearBtn').addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all data?')) {
        expenses = [];
        saveExpenses();
        updateUI();
    }
});

function saveExpenses() {
    localStorage.setItem('expenses', JSON.stringify(expenses));
}

function updateUI() {
    updateTable();
    updateChart();
    updateTotal();
}

function updateTable() {
    const filterCat = document.getElementById('filterCategory').value;
    const filterProd = document.getElementById('filterProduct').value.toLowerCase();
    
    const filtered = expenses.filter(exp => {
        const matchCategory = !filterCat || exp.category === filterCat;
        const matchProduct = !filterProd || exp.product.toLowerCase().includes(filterProd);
        return matchCategory && matchProduct;
    });
    
    const tbody = document.getElementById('expenseBody');
    tbody.innerHTML = filtered.map(exp => `
        <tr>
            <td>₹${exp.amount.toFixed(2)}</td>
            <td><span class="category-badge category-${exp.category}">${exp.category}</span></td>
            <td>${exp.product}</td>
            <td>${exp.paymentMethod}</td>
            <td><button class="delete-btn" onclick="deleteExpense(${exp.id})">Delete</button></td>
        </tr>
    `).join('');
    
    const filteredTotal = filtered.reduce((sum, exp) => sum + exp.amount, 0);
    document.getElementById('filteredAmount').textContent = filteredTotal.toFixed(2);
}

function updateChart() {
    const categoryTotals = {};
    expenses.forEach(exp => {
        categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
    });
    
    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);
    const colors = labels.map(cat => categoryColors[cat]);
    
    const ctx = document.getElementById('expenseChart').getContext('2d');
    
    if (chart) chart.destroy();
    
    chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: { size: 14 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ₹${value.toFixed(2)} (${percentage}%)`;
                        }
                    }
                },
                datalabels: {
                    color: '#fff',
                    font: {
                        weight: 'bold',
                        size: 14
                    },
                    formatter: (value, context) => {
                        return context.chart.data.labels[context.dataIndex];
                    }
                }
            }
        },
        plugins: [{
            afterDatasetsDraw: function(chart) {
                const ctx = chart.ctx;
                chart.data.datasets.forEach((dataset, i) => {
                    const meta = chart.getDatasetMeta(i);
                    meta.data.forEach((element, index) => {
                        const data = dataset.data[index];
                        const total = dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = ((data / total) * 100).toFixed(0);
                        
                        if (percentage > 5) {
                            const {x, y} = element.tooltipPosition();
                            ctx.fillStyle = '#fff';
                            ctx.font = 'bold 13px Arial';
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';
                            ctx.fillText(chart.data.labels[index], x, y - 8);
                            ctx.fillText(percentage + '%', x, y + 8);
                        }
                    });
                });
            }
        }]
    });
}

function updateTotal() {
    const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    document.getElementById('totalAmount').textContent = total.toFixed(2);
}

function deleteExpense(id) {
    expenses = expenses.filter(exp => exp.id !== id);
    saveExpenses();
    updateUI();
}

function exportToExcel() {
    if (expenses.length === 0) {
        alert('No data to export!');
        return;
    }
    
    const data = expenses.map(exp => ({
        Amount: exp.amount,
        Category: exp.category,
        Product: exp.product,
        'Payment Method': exp.paymentMethod,
        Date: exp.date
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Expenses');
    
    XLSX.writeFile(wb, `Budget_${new Date().toISOString().split('T')[0]}.xlsx`);
}

// Add sample data if no expenses exist
if (expenses.length === 0) {
    expenses = [
        { id: 1, amount: 45.50, category: 'Food', product: 'Grocery Shopping - Walmart', paymentMethod: 'Credit Card', date: '1/15/2024' },
        { id: 2, amount: 12.99, category: 'Food', product: 'Pizza Delivery', paymentMethod: 'Bank', date: '1/16/2024' },
        { id: 3, amount: 65.00, category: 'Transport', product: 'Gas Station Fill-up', paymentMethod: 'Credit Card', date: '1/16/2024' },
        { id: 4, amount: 25.00, category: 'Transport', product: 'Uber Ride to Airport', paymentMethod: 'Bank', date: '1/17/2024' },
        { id: 5, amount: 89.99, category: 'Entertainment', product: 'Concert Tickets', paymentMethod: 'Credit Card', date: '1/17/2024' },
        { id: 6, amount: 15.50, category: 'Entertainment', product: 'Movie Theater', paymentMethod: 'Bank', date: '1/18/2024' },
        { id: 7, amount: 120.00, category: 'Shopping', product: 'Nike Shoes', paymentMethod: 'Credit Card', date: '1/18/2024' },
        { id: 8, amount: 35.75, category: 'Shopping', product: 'Amazon Order - Books', paymentMethod: 'Bank', date: '1/19/2024' },
        { id: 9, amount: 150.00, category: 'Bills', product: 'Electric Bill', paymentMethod: 'Bank', date: '1/19/2024' },
        { id: 10, amount: 80.00, category: 'Bills', product: 'Internet Service', paymentMethod: 'Credit Card', date: '1/20/2024' },
        { id: 11, amount: 45.00, category: 'Health', product: 'Pharmacy - Prescription', paymentMethod: 'Bank', date: '1/20/2024' },
        { id: 12, amount: 200.00, category: 'Health', product: 'Dental Checkup', paymentMethod: 'Credit Card', date: '1/21/2024' },
        { id: 13, amount: 28.50, category: 'Food', product: 'Restaurant - Dinner', paymentMethod: 'Credit Card', date: '1/21/2024' },
        { id: 14, amount: 50.00, category: 'Other', product: 'Gift for Friend', paymentMethod: 'Bank', date: '1/22/2024' }
    ];
    saveExpenses();
}

updateUI();
