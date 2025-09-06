// Expense Tracker JavaScript
// This file handles all the functionality for adding, displaying, and managing expenses

// Global variables
let expenses = [];
const STORAGE_KEY = 'expenseTrackerData';

// DOM elements
const expenseForm = document.getElementById('expenseForm');
const expenseNameInput = document.getElementById('expenseName');
const expenseAmountInput = document.getElementById('expenseAmount');
const expenseCurrencySelect = document.getElementById('expenseCurrency');
const expenseCategorySelect = document.getElementById('expenseCategory');
const totalAmountDisplay = document.getElementById('totalAmount');
const totalCountDisplay = document.getElementById('totalCount');
const expensesTableBody = document.getElementById('expensesTableBody');
const expensesTable = document.getElementById('expensesTable');
const noExpensesMsg = document.getElementById('noExpensesMsg');
const clearAllBtn = document.getElementById('clearAllBtn');

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    loadExpensesFromStorage();
    updateDisplay();
    setupEventListeners();
});

// Set up event listeners for form submission and clear button
function setupEventListeners() {
    // Handle form submission
    expenseForm.addEventListener('submit', handleFormSubmit);
    
    // Handle clear all button
    clearAllBtn.addEventListener('click', handleClearAll);
    
    // Handle currency selection change to update total display
    expenseCurrencySelect.addEventListener('change', updateSummaryForSelectedCurrency);
}

// Handle form submission to add new expense
function handleFormSubmit(e) {
    e.preventDefault();
    
    // Get form values
    const name = expenseNameInput.value.trim();
    const amount = parseFloat(expenseAmountInput.value);
    const currency = expenseCurrencySelect.value;
    const category = expenseCategorySelect.value;
    
    // Validate inputs
    if (!name || !amount || amount <= 0 || !currency || !category) {
        alert('Please fill in all fields with valid data.');
        return;
    }
    
    // Create new expense object
    const newExpense = {
        id: generateUniqueId(),
        name: name,
        amount: amount,
        currency: currency,
        category: category,
        date: new Date().toISOString().split('T')[0], // Format: YYYY-MM-DD
        timestamp: new Date().getTime()
    };
    
    // Add expense to array
    expenses.push(newExpense);
    
    // Save to localStorage
    saveExpensesToStorage();
    
    // Update display
    updateDisplay();
    
    // Reset form
    expenseForm.reset();
    
    // Focus back to first input for better UX
    expenseNameInput.focus();
}

// Generate unique ID for each expense
function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Load expenses from localStorage
function loadExpensesFromStorage() {
    try {
        const storedData = localStorage.getItem(STORAGE_KEY);
        if (storedData) {
            expenses = JSON.parse(storedData);
        }
    } catch (error) {
        console.error('Error loading expenses from storage:', error);
        expenses = [];
    }
}

// Save expenses to localStorage
function saveExpensesToStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
    } catch (error) {
        console.error('Error saving expenses to storage:', error);
        alert('Error saving data. Please try again.');
    }
}

// Update the display with current expenses
function updateDisplay() {
    updateSummary();
    updateExpensesList();
}

// Update summary cards (total amount and count)
function updateSummary() {
    // Check if we should show total for selected currency only
    const selectedCurrency = expenseCurrencySelect.value;
    if (selectedCurrency) {
        updateSummaryForSelectedCurrency();
        return;
    }
    
    // Group expenses by currency and calculate totals
    const currencyTotals = expenses.reduce((totals, expense) => {
        const currency = expense.currency || 'USD'; // Default to USD for old entries
        if (!totals[currency]) {
            totals[currency] = 0;
        }
        totals[currency] += expense.amount;
        return totals;
    }, {});
    
    const totalCount = expenses.length;
    
    // Display totals for each currency
    let totalDisplay = '';
    if (Object.keys(currencyTotals).length === 0) {
        totalDisplay = formatCurrency(0, 'USD');
    } else if (Object.keys(currencyTotals).length === 1) {
        const currency = Object.keys(currencyTotals)[0];
        totalDisplay = formatCurrency(currencyTotals[currency], currency);
    } else {
        // Multiple currencies - show each
        totalDisplay = Object.entries(currencyTotals)
            .map(([currency, amount]) => formatCurrency(amount, currency))
            .join('<br>');
    }
    
    // Update total amount with currency formatting
    totalAmountDisplay.innerHTML = totalDisplay;
    
    // Update total count
    totalCountDisplay.textContent = totalCount;
}

// Update summary to show total for selected currency
function updateSummaryForSelectedCurrency() {
    const selectedCurrency = expenseCurrencySelect.value;
    if (!selectedCurrency) {
        updateSummary();
        return;
    }
    
    // Filter expenses by selected currency
    const currencyExpenses = expenses.filter(expense => 
        (expense.currency || 'USD') === selectedCurrency
    );
    
    // Calculate total for selected currency
    const totalAmount = currencyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalCount = expenses.length; // Keep total count of all expenses
    const currencyCount = currencyExpenses.length; // Count for selected currency
    
    // Update display with selected currency total
    const totalDisplay = `${formatCurrency(totalAmount, selectedCurrency)}<br><small style="color: #666; font-size: 0.8em;">${currencyCount} of ${totalCount} expenses</small>`;
    
    totalAmountDisplay.innerHTML = totalDisplay;
    totalCountDisplay.textContent = totalCount;
}

// Format number as currency with support for different currencies
function formatCurrency(amount, currency = 'USD') {
    // Currency-specific formatting options
    const currencyOptions = {
        'USD': { locale: 'en-US', minimumFractionDigits: 2 },
        'INR': { locale: 'en-IN', minimumFractionDigits: 2 },
        'EUR': { locale: 'de-DE', minimumFractionDigits: 2 },
        'GBP': { locale: 'en-GB', minimumFractionDigits: 2 },
        'JPY': { locale: 'ja-JP', minimumFractionDigits: 0 },
        'CAD': { locale: 'en-CA', minimumFractionDigits: 2 },
        'AUD': { locale: 'en-AU', minimumFractionDigits: 2 },
        'CHF': { locale: 'de-CH', minimumFractionDigits: 2 },
        'CNY': { locale: 'zh-CN', minimumFractionDigits: 2 },
        'SGD': { locale: 'en-SG', minimumFractionDigits: 2 }
    };
    
    const options = currencyOptions[currency] || currencyOptions['USD'];
    
    return new Intl.NumberFormat(options.locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: options.minimumFractionDigits
    }).format(amount);
}

// Update the expenses list/table
function updateExpensesList() {
    // Clear existing table body
    expensesTableBody.innerHTML = '';
    
    // Show/hide table and no expenses message
    if (expenses.length === 0) {
        expensesTable.style.display = 'none';
        noExpensesMsg.style.display = 'block';
        return;
    }
    
    expensesTable.style.display = 'block';
    noExpensesMsg.style.display = 'none';
    
    // Sort expenses by timestamp (newest first)
    const sortedExpenses = [...expenses].sort((a, b) => b.timestamp - a.timestamp);
    
    // Create table rows for each expense
    sortedExpenses.forEach(expense => {
        const row = createExpenseRow(expense);
        expensesTableBody.appendChild(row);
    });
}

// Create a table row for an expense
function createExpenseRow(expense) {
    const row = document.createElement('tr');
    row.className = 'expense-row';
    
    // Format date for display
    const formattedDate = formatDate(expense.date);
    
    row.innerHTML = `
        <td class="expense-date">${formattedDate}</td>
        <td class="expense-name">${escapeHtml(expense.name)}</td>
        <td><span class="expense-category">${escapeHtml(expense.category)}</span></td>
        <td class="expense-amount">${formatCurrency(expense.amount, expense.currency || 'USD')}</td>
        <td>
            <button class="delete-btn" onclick="deleteExpense('${expense.id}')">
                Delete
            </button>
        </td>
    `;
    
    return row;
}

// Format date for display (MM/DD/YYYY)
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
    });
}

// Escape HTML to prevent XSS attacks
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Delete an expense by ID
function deleteExpense(expenseId) {
    // Confirm deletion
    if (!confirm('Are you sure you want to delete this expense?')) {
        return;
    }
    
    // Remove expense from array
    expenses = expenses.filter(expense => expense.id !== expenseId);
    
    // Save to localStorage
    saveExpensesToStorage();
    
    // Update display
    updateDisplay();
}

// Handle clear all expenses
function handleClearAll() {
    // Confirm clearing all data
    if (expenses.length === 0) {
        alert('No expenses to clear.');
        return;
    }
    
    const confirmMessage = `Are you sure you want to delete all ${expenses.length} expense(s)? This action cannot be undone.`;
    
    if (!confirm(confirmMessage)) {
        return;
    }
    
    // Clear expenses array
    expenses = [];
    
    // Save to localStorage
    saveExpensesToStorage();
    
    // Update display
    updateDisplay();
    
    // Show success message
    alert('All expenses have been cleared.');
}

// Export data functionality (bonus feature)
function exportExpenses() {
    if (expenses.length === 0) {
        alert('No expenses to export.');
        return;
    }
    
    // Create CSV content
    const headers = ['Date', 'Name', 'Category', 'Amount', 'Currency'];
    const csvContent = [
        headers.join(','),
        ...expenses.map(expense => [
            expense.date,
            `"${expense.name}"`,
            `"${expense.category}"`,
            expense.amount,
            expense.currency || 'USD'
        ].join(','))
    ].join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Keyboard shortcuts for better UX
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + Enter to submit form when focused on form elements
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (document.activeElement.closest('#expenseForm')) {
            e.preventDefault();
            handleFormSubmit(e);
        }
    }
    
    // Escape key to clear form
    if (e.key === 'Escape') {
        if (document.activeElement.closest('#expenseForm')) {
            expenseForm.reset();
            expenseNameInput.focus();
        }
    }
});

// Auto-save functionality - save data every time it changes
// This ensures data is never lost even if the user closes the browser unexpectedly
window.addEventListener('beforeunload', function() {
    saveExpensesToStorage();
});

// Initialize focus on page load for better UX
window.addEventListener('load', function() {
    expenseNameInput.focus();
});

// Console log for debugging (can be removed in production)
console.log('Expense Tracker initialized successfully!');
