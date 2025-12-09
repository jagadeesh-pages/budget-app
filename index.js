let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
let chart = null;
let userId = localStorage.getItem('budgetUserId');

if (!userId) {
    userId = 'budget_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('budgetUserId', userId);
}

const categoryColors = {
    Food: '#FF8C00',
    Transport: '#0288D1',
    Entertainment: '#7B1FA2',
    Shopping: '#C2185B',
    Bills: '#F57C00',
    Health: '#388E3C',
    Other: '#546E7A'
};

// Initialize form month/year with current date
function updateFormDate() {
    const now = new Date();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const currentYear = now.getFullYear();
    
    document.getElementById('expenseMonth').value = currentMonth;
    document.getElementById('expenseYear').value = currentYear;
}

// Populate expense year dropdown
const now = new Date();
const currentYear = now.getFullYear();
const expenseYearSelect = document.getElementById('expenseYear');
for (let year = currentYear - 2; year <= currentYear + 2; year++) {
    expenseYearSelect.innerHTML += `<option value="${year}">${year}</option>`;
}
updateFormDate();

// Auto-update month/year at midnight
setInterval(() => {
    const now = new Date();
    if (now.getHours() === 0 && now.getMinutes() === 0) {
        updateFormDate();
    }
}, 60000); // Check every minute

// Sync form month/year with filter month/year
document.getElementById('expenseMonth').addEventListener('change', () => {
    document.getElementById('filterMonth').value = document.getElementById('expenseMonth').value;
    updateTable();
    updateChart();
    updateTotal();
});

document.getElementById('expenseYear').addEventListener('change', () => {
    document.getElementById('filterYear').value = document.getElementById('expenseYear').value;
    updateTable();
    updateChart();
    updateTotal();
});

document.getElementById('expenseForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const month = document.getElementById('expenseMonth').value;
    const year = document.getElementById('expenseYear').value;
    const expenseDate = new Date(year, parseInt(month) - 1, 1);
    
    const expense = {
        id: Date.now(),
        amount: parseFloat(document.getElementById('amount').value),
        category: document.getElementById('category').value,
        product: document.getElementById('product').value,
        paymentMethod: document.getElementById('paymentMethod').value,
        date: expenseDate.toLocaleDateString()
    };
    
    expenses.push(expense);
    saveExpenses();
    updateUI();
    e.target.reset();
});

document.getElementById('filterCategory').addEventListener('change', updateTable);
document.getElementById('filterPayment').addEventListener('change', updateTable);
document.getElementById('filterProduct').addEventListener('input', updateTable);
document.getElementById('filterMonth').addEventListener('change', () => { updateTable(); updateChart(); updateTotal(); });
document.getElementById('filterYear').addEventListener('change', () => { updateTable(); updateChart(); updateTotal(); });
document.getElementById('chartViewType').addEventListener('change', updateChart);

// Populate year dropdown
function populateYears() {
    const years = [...new Set(expenses.map(exp => {
        const date = new Date(exp.date);
        return date.getFullYear();
    }))].sort((a, b) => b - a);
    
    const yearSelect = document.getElementById('filterYear');
    yearSelect.innerHTML = '<option value="">All Years</option>';
    years.forEach(year => {
        yearSelect.innerHTML += `<option value="${year}">${year}</option>`;
    });
}

populateYears();

document.getElementById('driveBackupBtn').addEventListener('click', () => {
    if (typeof backupToDrive === 'function') {
        backupToDrive();
    } else {
        alert('Google Drive is loading. Please wait a moment and try again.');
    }
});

document.getElementById('driveRestoreBtn').addEventListener('click', () => {
    if (typeof restoreFromDrive === 'function') {
        restoreFromDrive();
    } else {
        alert('Google Drive is loading. Please wait a moment and try again.');
    }
});

document.getElementById('exportBtn').addEventListener('click', exportToExcel);
document.getElementById('importBtn').addEventListener('click', () => {
    document.getElementById('importFile').click();
});
document.getElementById('importFile').addEventListener('change', importFromExcel);
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
    const filterMonth = document.getElementById('filterMonth').value;
    const filterYear = document.getElementById('filterYear').value;
    
    const filtered = expenses.filter(exp => {
        const expDate = new Date(exp.date);
        const expMonth = String(expDate.getMonth() + 1).padStart(2, '0');
        const expYear = String(expDate.getFullYear());
        
        const matchCategory = !filterCat || exp.category === filterCat;
        const matchPayment = !filterPay || exp.paymentMethod === filterPay;
        const matchProduct = !filterProd || exp.product.toLowerCase().includes(filterProd);
        const matchMonth = !filterMonth || expMonth === filterMonth;
        const matchYear = !filterYear || expYear === filterYear;
        
        return matchCategory && matchPayment && matchProduct && matchMonth && matchYear;
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
    const viewType = document.getElementById('chartViewType').value;
    const filterMonth = document.getElementById('filterMonth').value;
    const filterYear = document.getElementById('filterYear').value;
    const totals = {};
    
    const filtered = expenses.filter(exp => {
        const expDate = new Date(exp.date);
        const expMonth = String(expDate.getMonth() + 1).padStart(2, '0');
        const expYear = String(expDate.getFullYear());
        const matchMonth = !filterMonth || expMonth === filterMonth;
        const matchYear = !filterYear || expYear === filterYear;
        return matchMonth && matchYear;
    });
    
    filtered.forEach(exp => {
        const key = viewType === 'category' ? exp.category : exp.paymentMethod;
        totals[key] = (totals[key] || 0) + exp.amount;
    });
    
    const labels = Object.keys(totals);
    const data = Object.values(totals);
    const colors = viewType === 'category' 
        ? labels.map(cat => categoryColors[cat] || '#999')
        : labels.map((_, i) => `hsl(${i * 360 / labels.length}, 70%, 60%)`);
    
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
    const filterMonth = document.getElementById('filterMonth').value;
    const filterYear = document.getElementById('filterYear').value;
    
    const filtered = expenses.filter(exp => {
        const expDate = new Date(exp.date);
        const expMonth = String(expDate.getMonth() + 1).padStart(2, '0');
        const expYear = String(expDate.getFullYear());
        const matchMonth = !filterMonth || expMonth === filterMonth;
        const matchYear = !filterYear || expYear === filterYear;
        return matchMonth && matchYear;
    });
    
    const total = filtered.reduce((sum, exp) => sum + exp.amount, 0);
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

function importFromExcel(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        
        jsonData.forEach(row => {
            if (row.Amount && row.Category && row.Product && row['Payment Method']) {
                expenses.push({
                    id: Date.now() + Math.random(),
                    amount: parseFloat(row.Amount),
                    category: row.Category,
                    product: row.Product,
                    paymentMethod: row['Payment Method'],
                    date: row.Date || new Date().toLocaleDateString()
                });
            }
        });
        
        saveExpenses();
        populateYears();
        updateUI();
        alert(`Imported ${jsonData.length} expenses successfully!`);
        e.target.value = '';
    };
    reader.readAsArrayBuffer(file);
}
