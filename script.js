// Firebase Configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY, // Load securely
  authDomain: "budget-planner-web-app.firebaseapp.com",
  projectId: "budget-planner-web-app",
  storageBucket: "budget-planner-web-app.appspot.com",
  messagingSenderId: "247333390334",
  appId: "1:247333390334:web:c01d349f60420f260ae2af",
  measurementId: "G-2TKMXXYQFE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);


// Elements
const descInput = document.getElementById("desc");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const transactionList = document.getElementById("transaction-list");
const totalIncome = document.getElementById("total-income");
const totalExpenses = document.getElementById("total-expenses");
const balance = document.getElementById("balance");
const savingsGoalInput = document.getElementById("savings-goal");
const savingsProgress = document.getElementById("savings-progress");
const expenseChartCanvas = document.getElementById("expenseChart");

let transactions = [];

// Add Transaction
function addTransaction() {
    const description = descInput.value;
    const amount = parseFloat(amountInput.value);
    const category = categoryInput.value;
    if (!description || isNaN(amount)) return;

    const transaction = { description, amount, category, timestamp: Date.now() };
    db.collection("transactions").add(transaction);
}

// Delete Transaction
function deleteTransaction(id) {
    db.collection("transactions").doc(id).delete();
}

// Fetch Transactions
function fetchTransactions() {
    db.collection("transactions").orderBy("timestamp", "desc").onSnapshot(snapshot => {
        transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderTransactions();
        updateSummary();
        updateChart();
    });
}

// Render Transactions
function renderTransactions() {
    transactionList.innerHTML = "";
    transactions.forEach(transaction => {
        const li = document.createElement("li");
        li.innerHTML = `${transaction.description} - $${transaction.amount} <button class='delete-btn' onclick='deleteTransaction("${transaction.id}")'>X</button>`;
        transactionList.appendChild(li);
    });
}

// Update Summary
function updateSummary() {
    const income = transactions.filter(t => t.amount > 0).reduce((acc, t) => acc + t.amount, 0);
    const expenses = transactions.filter(t => t.amount < 0).reduce((acc, t) => acc + Math.abs(t.amount), 0);
    const currentBalance = income - expenses;

    totalIncome.textContent = income.toFixed(2);
    totalExpenses.textContent = expenses.toFixed(2);
    balance.textContent = currentBalance.toFixed(2);
    updateSavingsProgress(currentBalance);
}

// Update Savings Progress
function updateSavingsProgress(currentBalance) {
    const goal = parseFloat(savingsGoalInput.value) || 0;
    if (goal > 0) {
        const progress = ((currentBalance / goal) * 100).toFixed(2);
        savingsProgress.textContent = `${progress}%`;
    } else {
        savingsProgress.textContent = "0%";
    }
}

// Update Chart
function updateChart() {
    const categories = {};
    transactions.forEach(t => {
        if (t.category !== "income") {
            categories[t.category] = (categories[t.category] || 0) + Math.abs(t.amount);
        }
    });

    const ctx = expenseChartCanvas.getContext("2d");
    new Chart(ctx, {
        type: "pie",
        data: {
            labels: Object.keys(categories),
            datasets: [{
                data: Object.values(categories),
                backgroundColor: ["#007bff", "#28a745", "#dc3545", "#ffc107", "#17a2b8"]
            }]
        }
    });
}

// Download Report as PDF
document.getElementById("download-report").addEventListener("click", function () {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text("Budget Report", 10, 10);
    let y = 20;
    transactions.forEach(t => {
        doc.text(`${t.description}: $${t.amount} (${t.category})`, 10, y);
        y += 10;
    });
    doc.save("budget_report.pdf");
});

// Initialize
fetchTransactions();
