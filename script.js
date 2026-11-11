const STORAGE_KEY = "personal-expense-tracker:transactions";

const form = document.getElementById("transactionForm");
const typeInput = document.getElementById("type");
const descriptionInput = document.getElementById("description");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");
const clearBtn = document.getElementById("clearBtn");
const filterInput = document.getElementById("filter");
const searchInput = document.getElementById("search");
const tbody = document.getElementById("transactionBody");

const totalIncomeEl = document.getElementById("totalIncome");
const totalExpensesEl = document.getElementById("totalExpenses");
const balanceEl = document.getElementById("currentBalance");

let transactions = loadTransactions();

/* ---------- Storage ---------- */
function loadTransactions() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch (e) {
    return [];
  }
}

function saveTransactions() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch (e) {
    alert("Could not save transactions. Browser storage may be disabled.");
  }
}

/* ---------- Helpers ---------- */
function formatLKR(value) {
  return "LKR " + value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function todayISO() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

function setError(input, message) {
  document.getElementById(input.id + "Error").textContent = message;
  input.classList.toggle("invalid", Boolean(message));
}

function clearErrors() {
  [descriptionInput, amountInput, categoryInput, dateInput].forEach(i => setError(i, ""));
}

/* ---------- Validation ---------- */
function validate() {
  clearErrors();
  let valid = true;

  if (!descriptionInput.value.trim()) {
    setError(descriptionInput, "Enter a description.");
    valid = false;
  }

  const amount = parseFloat(amountInput.value);
  if (amountInput.value === "" || Number.isNaN(amount)) {
    setError(amountInput, "Enter an amount.");
    valid = false;
  } else if (amount <= 0) {
    setError(amountInput, "Amount must be greater than 0.");
    valid = false;
  }

  if (!categoryInput.value) {
    setError(categoryInput, "Select a category.");
    valid = false;
  }

  if (!dateInput.value) {
    setError(dateInput, "Select a date.");
    valid = false;
  }

  return valid;
}

/* ---------- Actions ---------- */
function addTransaction(event) {
  event.preventDefault();
  if (!validate()) return;

  transactions.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    type: typeInput.value,
    description: descriptionInput.value.trim(),
    amount: parseFloat(amountInput.value),
    category: categoryInput.value,
    date: dateInput.value
  });

  saveTransactions();
  render();
  resetForm();
  alert("Transaction added successfully!");
}

function deleteTransaction(id) {
  if (!confirm("Delete this transaction?")) return;
  transactions = transactions.filter(t => t.id !== id);
  saveTransactions();
  render();
}

function resetForm() {
  form.reset();
  dateInput.value = todayISO();
  clearErrors();
}

/* ---------- Rendering ---------- */
function updateSummary() {
  const income = transactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const expenses = transactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  const balance = income - expenses;

  totalIncomeEl.textContent = formatLKR(income);
  totalExpensesEl.textContent = formatLKR(expenses);
  balanceEl.textContent = formatLKR(balance);
  balanceEl.classList.toggle("negative", balance < 0);
}

function getVisibleTransactions() {
  const filter = filterInput.value;
  const query = searchInput.value.trim().toLowerCase();

  return transactions.filter(t => {
    const matchesType = filter === "all" || t.type === filter;
    const matchesSearch =
      !query ||
      t.description.toLowerCase().includes(query) ||
      t.category.toLowerCase().includes(query);
    return matchesType && matchesSearch;
  });
}

function cell(text, className) {
  const td = document.createElement("td");
  td.textContent = text;
  if (className) td.className = className;
  return td;
}

function renderTable() {
  tbody.replaceChildren();
  const rows = getVisibleTransactions();

  if (rows.length === 0) {
    const tr = document.createElement("tr");
    const td = cell("No transactions found.", "empty");
    td.colSpan = 6;
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  // Keep entry order, as in the lab's reference screenshots
  rows.forEach(t => {
    const tr = document.createElement("tr");
    const isIncome = t.type === "income";

    tr.appendChild(cell(t.date));
    tr.appendChild(cell(t.description));

    const typeTd = document.createElement("td");
    const badge = document.createElement("span");
    badge.className = "badge " + t.type;
    badge.textContent = isIncome ? "Income" : "Expense";
    typeTd.appendChild(badge);
    tr.appendChild(typeTd);

    tr.appendChild(cell(t.category));

    const sign = isIncome ? "+" : "\u2212";
    tr.appendChild(cell(
      `${sign} ${formatLKR(t.amount)}`,
      "num " + (isIncome ? "income-amt" : "expense-amt")
    ));

    const actionTd = document.createElement("td");
    const del = document.createElement("button");
    del.type = "button";
    del.className = "btn btn-delete";
    del.textContent = "Delete";
    del.setAttribute("aria-label", `Delete ${t.description}`);
    del.addEventListener("click", () => deleteTransaction(t.id));
    actionTd.appendChild(del);
    tr.appendChild(actionTd);

    tbody.appendChild(tr);
  });
}

function render() {
  updateSummary();
  renderTable();
}

/* ---------- Events ---------- */
form.addEventListener("submit", addTransaction);
clearBtn.addEventListener("click", resetForm);
filterInput.addEventListener("change", renderTable);
searchInput.addEventListener("input", renderTable);

[descriptionInput, amountInput, categoryInput, dateInput].forEach(input => {
  input.addEventListener("input", () => setError(input, ""));
});

/* ---------- Init ---------- */
dateInput.value = todayISO();
render();
