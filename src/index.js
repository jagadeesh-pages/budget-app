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
document.getElementById('filterPayment').addEventListener('change', updateTable);
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
    const filterPay = document.getElementById('filterPayment').value;
    const filterProd = document.getElementById('filterProduct').value.toLowerCase();
    
    const filtered = expenses.filter(exp => {
        const matchCategory = !filterCat || exp.category === filterCat;
        const matchPayment = !filterPay || exp.paymentMethod === filterPay;
        const matchProduct = !filterProd || exp.product.toLowerCase().includes(filterProd);
        return matchCategory && matchPayment && matchProduct;
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

updateUI();
