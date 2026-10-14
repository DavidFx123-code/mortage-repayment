const form = document.getElementById("form");
const amountEl = document.getElementById("amount");
const termEl = document.getElementById("term");
const rateEl = document.getElementById("rate");
const clearBtn = document.getElementById("clear");
const emptyEl = document.getElementById("empty");
const completedEl = document.getElementById("completed");
const monthlyEl = document.getElementById("monthly");
const totalEl = document.getElementById("total");
const monthlyLabel = document.getElementById("monthly-label");

const fmt = (n) =>
  "£" +
  n.toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
const toNumber = (str) => parseFloat(str.replace(/,/g, ""));

// Only allow digits (and one decimal point) while typing; add commas to the amount
function sanitize(el, allowDecimal) {
  let v = el.value.replace(allowDecimal ? /[^\d.]/g : /[^\d]/g, "");
  if (allowDecimal) {
    const parts = v.split(".");
    v = parts.shift() + (parts.length ? "." + parts.join("") : "");
  }
  return v;
}

amountEl.addEventListener("input", () => {
  const v = sanitize(amountEl, true);
  const [whole, dec] = v.split(".");
  const withCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  amountEl.value = dec !== undefined ? withCommas + "." + dec : withCommas;
  clearError("amount");
});
termEl.addEventListener("input", () => {
  termEl.value = sanitize(termEl, false);
  clearError("term");
});
rateEl.addEventListener("input", () => {
  rateEl.value = sanitize(rateEl, true);
  clearError("rate");
});
document
  .querySelectorAll('input[name="type"]')
  .forEach((r) => r.addEventListener("change", () => clearError("type")));

function setError(name, message) {
  const field = document.querySelector(`[data-field="${name}"]`);
  field.classList.add("invalid");
  if (message) document.getElementById(name + "-error").textContent = message;
}
function clearError(name) {
  document.querySelector(`[data-field="${name}"]`).classList.remove("invalid");
}

function validate() {
  let valid = true;
  const amount = toNumber(amountEl.value);
  const term = toNumber(termEl.value);
  const rate = toNumber(rateEl.value);
  const type = form.querySelector('input[name="type"]:checked');

  ["amount", "term", "rate", "type"].forEach(clearError);

  if (!amountEl.value.trim() || isNaN(amount) || amount <= 0) {
    setError(
      "amount",
      amountEl.value.trim() ? "Enter a valid amount" : "This field is required",
    );
    valid = false;
  }
  if (!termEl.value.trim() || isNaN(term) || term <= 0) {
    setError(
      "term",
      termEl.value.trim() ? "Enter a valid term" : "This field is required",
    );
    valid = false;
  }
  if (!rateEl.value.trim() || isNaN(rate) || rate < 0) {
    setError(
      "rate",
      rateEl.value.trim() ? "Enter a valid rate" : "This field is required",
    );
    valid = false;
  }
  if (!type) {
    setError("type", "This field is required");
    valid = false;
  }

  if (!valid) {
    // Move keyboard focus to the first invalid field
    const first = form.querySelector(".invalid input");
    if (first) first.focus();
  }
  return valid;
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!validate()) {
    showEmpty();
    return;
  }

  const principal = toNumber(amountEl.value);
  const years = toNumber(termEl.value);
  const monthlyRate = toNumber(rateEl.value) / 100 / 12;
  const months = years * 12;
  const type = form.querySelector('input[name="type"]:checked').value;

  let monthly, total;
  if (type === "repayment") {
    monthly =
      monthlyRate === 0
        ? principal / months
        : (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));
    total = monthly * months;
  } else {
    // Interest only: pay the interest each month, then repay the loan at the end
    monthly = principal * monthlyRate;
    total = monthly * months + principal;
  }

  monthlyLabel.textContent =
    type === "repayment"
      ? "Your monthly repayments"
      : "Your monthly interest payments";
  monthlyEl.textContent = fmt(monthly);
  totalEl.textContent = fmt(total);
  emptyEl.hidden = true;
  completedEl.hidden = false;
});

function showEmpty() {
  completedEl.hidden = true;
  emptyEl.hidden = false;
}

clearBtn.addEventListener("click", () => {
  form.reset();
  ["amount", "term", "rate", "type"].forEach(clearError);
  showEmpty();
  amountEl.focus();
});
