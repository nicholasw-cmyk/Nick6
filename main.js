document.addEventListener('DOMContentLoaded', () => {
    // --- Global State ---
    window.goldPriceAlerts = {
        alerts: [],
        basePriceInUsdPerOz: 2320.50,
        historicalData: Array.from({ length: 30 }, () => 2320.50 + (Math.random() - 0.5) * 50),
        selectedCurrency: 'SGD',
        selectedWeight: 'g'
    };

    // --- Constants ---
    const CONVERSION_RATES = { currency: { USD: 1, SGD: 1.35, EUR: 0.92 }, weight: { oz: 1, g: 1 / 31.1035 } };
    const CURRENCY_SYMBOLS = { USD: '$', SGD: 'S$', EUR: '€' };

    // --- Navigation ---
    const navLinks = document.querySelectorAll('nav a');
    const pageContent = document.querySelectorAll('.page-content');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            document.querySelector('nav li.active').classList.remove('active');
            link.parentElement.classList.add('active');
            pageContent.forEach(page => page.classList.toggle('active', page.id === targetId));
            if (targetId === 'alerts' && !window.alertsInitialized) initializeAlerts();
        });
    });

    // --- Initialization ---
    Notification.requestPermission();
    initializeDashboard();
});

// --- Utility Functions ---
function getConvertedPrice(priceInUsd, currency, weight) {
    const CONVERSION_RATES = { currency: { USD: 1, SGD: 1.35, EUR: 0.92 }, weight: { oz: 1, g: 1 / 31.1035 } };
    const priceInSelectedCurrency = priceInUsd * CONVERSION_RATES.currency[currency];
    return priceInSelectedCurrency * CONVERSION_RATES.weight[weight];
}

function formatCurrency(amount, currency) {
    const CURRENCY_SYMBOLS = { USD: '$', SGD: 'S$', EUR: '€' };
    return `${CURRENCY_SYMBOLS[currency]}${amount.toFixed(2)}`;
}

// --- Dashboard ---
function initializeDashboard() {
    if (window.dashboardInitialized) return;
    window.dashboardInitialized = true;

    const currentPriceEl = document.getElementById('current-price');
    const predictionEl = document.getElementById('prediction');
    const predictionReasonEl = document.getElementById('prediction-reason');
    const chartEl = document.getElementById('chart');
    const currencySelect = document.getElementById('currency-select');
    const weightSelect = document.getElementById('weight-select');
    const priceHeaderEl = document.getElementById('price-header');
    const lastUpdatedEl = document.getElementById('last-updated');

    function renderDashboard() {
        const { basePriceInUsdPerOz, historicalData, selectedCurrency, selectedWeight } = window.goldPriceAlerts;
        priceHeaderEl.textContent = `Current Price (per ${selectedWeight === 'g' ? 'gram' : 'troy oz'})`;
        currentPriceEl.textContent = formatCurrency(getConvertedPrice(basePriceInUsdPerOz, selectedCurrency, selectedWeight), selectedCurrency);
        updatePrediction(historicalData, predictionEl, predictionReasonEl);
        updateChart(historicalData, chartEl, selectedCurrency, selectedWeight);
        lastUpdatedEl.textContent = `Last Updated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
    }

    function updatePrice() {
        let { basePriceInUsdPerOz, historicalData } = window.goldPriceAlerts;
        basePriceInUsdPerOz += (Math.random() - 0.5) * 10;
        historicalData.push(basePriceInUsdPerOz);
        if (historicalData.length > 30) historicalData.shift();
        window.goldPriceAlerts.basePriceInUsdPerOz = basePriceInUsdPerOz;
        renderDashboard();
        checkAlerts();
    }

    currencySelect.addEventListener('change', e => { window.goldPriceAlerts.selectedCurrency = e.target.value; renderDashboard(); });
    weightSelect.addEventListener('change', e => { window.goldPriceAlerts.selectedWeight = e.target.value; renderDashboard(); });

    setInterval(updatePrice, 3000);
    renderDashboard();
}

function updatePrediction(historicalData, predictionEl, predictionReasonEl) {
    const trend = (historicalData.slice(-1)[0] - historicalData.slice(-3)[0]) / historicalData.slice(-3)[0];
    let text = 'Hold', className = 'hold', reason = 'Price is stable; no significant short-term trend detected.';
    if (trend > 0.005) { text = 'Sell'; className = 'sell'; reason = 'Strong upward momentum suggests a potential peak.'; }
    else if (trend < -0.005) { text = 'Buy'; className = 'buy'; reason = 'Strong downward momentum suggests a potential rebound.'; }
    predictionEl.textContent = text;
    predictionEl.className = `prediction ${className}`;
    predictionReasonEl.textContent = reason;
}

function updateChart(historicalData, chartEl, currency, weight) {
    chartEl.innerHTML = '';
    const convertedHistory = historicalData.map(price => getConvertedPrice(price, currency, weight));
    const max = Math.max(...convertedHistory), min = Math.min(...convertedHistory), range = max - min || 1;
    const points = convertedHistory.map((p, i) => `${(i / 29) * 500},${150 - ((p - min) / range) * 140 - 5}`).join(' ');
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    line.setAttribute('class', 'line');
    line.setAttribute('points', points);
    chartEl.appendChild(line);
}

// --- Alerts ---
function initializeAlerts() {
    window.alertsInitialized = true;
    const alertForm = document.getElementById('alert-form');
    const alertPriceInput = document.getElementById('alert-price');
    const alertListEl = document.getElementById('alert-list');

    alertForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const targetPrice = parseFloat(alertPriceInput.value);
        if (isNaN(targetPrice) || targetPrice <= 0) return;
        const { selectedCurrency, selectedWeight } = window.goldPriceAlerts;
        addAlert(targetPrice, selectedCurrency, selectedWeight);
        alertPriceInput.value = '';
    });

    renderAlerts();
}

function addAlert(targetPrice, currency, weight) {
    const newAlert = { id: Date.now(), targetPrice, currency, weight, triggered: false };
    window.goldPriceAlerts.alerts.push(newAlert);
    renderAlerts();
}

function deleteAlert(alertId) {
    window.goldPriceAlerts.alerts = window.goldPriceAlerts.alerts.filter(a => a.id !== alertId);
    renderAlerts();
}

function renderAlerts() {
    const alertListEl = document.getElementById('alert-list');
    if (!alertListEl) return;
    alertListEl.innerHTML = '';
    window.goldPriceAlerts.alerts.forEach(alert => {
        const li = document.createElement('li');
        li.textContent = `Alert at ${formatCurrency(alert.targetPrice, alert.currency)} (per ${alert.weight === 'g' ? 'gram' : 'troy oz'})`;
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.className = 'delete-alert';
        deleteBtn.onclick = () => deleteAlert(alert.id);
        li.appendChild(deleteBtn);
        alertListEl.appendChild(li);
    });
}

function checkAlerts() {
    const { basePriceInUsdPerOz, alerts } = window.goldPriceAlerts;
    alerts.forEach(alert => {
        if (alert.triggered) return;
        const currentConvertedPrice = getConvertedPrice(basePriceInUsdPerOz, alert.currency, alert.weight);
        if (currentConvertedPrice >= alert.targetPrice) {
            new Notification('Gold Price Alert', {
                body: `Gold has reached your target price of ${formatCurrency(alert.targetPrice, alert.currency)}!`,
                icon: './gold-icon.png' // Optional: Add an icon
            });
            alert.triggered = true; // Mark as triggered to avoid repeated notifications
            // Optionally remove the alert after it has been triggered
            // deleteAlert(alert.id);
        }
    });
}
