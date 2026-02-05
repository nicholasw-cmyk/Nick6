document.addEventListener('DOMContentLoaded', () => {
    // --- Global State ---
    window.goldPriceAlerts = {
        alerts: [],
        basePriceInUsdPerOz: 2320.50,
        historicalData: Array.from({ length: 30 }, () => 2320.50 + (Math.random() - 0.5) * 50),
        selectedCurrency: 'SGD',
        selectedWeight: 'g',
        portfolio: [], // { date: '2023-10-27', amountGrams: 10, purchasePricePerGram: 95 }
        newsFeed: [
            {
                headline: "Gold Prices Soar as Inflation Fears Mount",
                source: "Financial Times",
                url: "#"
            },
            {
                headline: "Central Banks Continue to Add to Gold Reserves",
                source: "Bloomberg",
                url: "#"
            },
            {
                headline: "Is Gold Still a Safe Haven Asset?",
                source: "The Wall Street Journal",
                url: "#"
            }
        ]
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
            if (targetId === 'portfolio' && !window.portfolioInitialized) initializePortfolio();
            if (targetId === 'trade' && !window.tradeInitialized) initializeTrade();
            if (targetId === 'analyser' && !window.analyserInitialized) initializeAnalyser();
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
    const newsFeedEl = document.getElementById('news-feed');

    function renderDashboard() {
        const { basePriceInUsdPerOz, historicalData, selectedCurrency, selectedWeight, newsFeed } = window.goldPriceAlerts;
        priceHeaderEl.textContent = `Current Price (per ${selectedWeight === 'g' ? 'gram' : 'troy oz'})`;
        currentPriceEl.textContent = formatCurrency(getConvertedPrice(basePriceInUsdPerOz, selectedCurrency, selectedWeight), selectedCurrency);
        updatePrediction(historicalData, predictionEl, predictionReasonEl);
        updateChart(historicalData, chartEl, selectedCurrency, selectedWeight);
        lastUpdatedEl.textContent = `Last Updated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
        renderNews(newsFeed, newsFeedEl);
    }

    function updatePrice() {
        let { basePriceInUsdPerOz, historicalData } = window.goldPriceAlerts;
        basePriceInUsdPerOz += (Math.random() - 0.5) * 10;
        historicalData.push(basePriceInUsdPerOz);
        if (historicalData.length > 30) historicalData.shift();
        window.goldPriceAlerts.basePriceInUsdPerOz = basePriceInUsdPerOz;
        renderDashboard();
        checkAlerts();
        if (window.portfolioInitialized) renderPortfolio();
    }

    currencySelect.addEventListener('change', e => { window.goldPriceAlerts.selectedCurrency = e.target.value; renderDashboard(); });
    weightSelect.addEventListener('change', e => { window.goldPriceAlerts.selectedWeight = e.target.value; renderDashboard(); });

    document.querySelectorAll('.trade-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const broker = e.target.dataset.broker;
            const tradeType = e.target.classList.contains('buy') ? 'buy' : 'sell';
            document.querySelector('a[href="#trade"]').click();
            setupTradeForm(broker, tradeType);
        });
    });

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

function renderNews(newsFeed, newsFeedEl) {
    newsFeedEl.innerHTML = '';
    newsFeed.forEach(item => {
        const newsItem = document.createElement('div');
        newsItem.className = 'news-item';
        const link = document.createElement('a');
        link.href = item.url;
        link.textContent = item.headline;
        link.target = '_blank';
        const source = document.createElement('p');
        source.textContent = item.source;
        newsItem.appendChild(link);
        newsItem.appendChild(source);
        newsFeedEl.appendChild(newsItem);
    });
}

// --- Portfolio ---
function initializePortfolio() {
    window.portfolioInitialized = true;
    const holdingForm = document.getElementById('holding-form');
    const holdingAmountInput = document.getElementById('holding-amount');
    const holdingPriceInput = document.getElementById('holding-price');

    holdingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const amount = parseFloat(holdingAmountInput.value);
        const price = parseFloat(holdingPriceInput.value);
        if (isNaN(amount) || amount <= 0 || isNaN(price) || price <= 0) return;
        addHolding(amount, price);
        holdingAmountInput.value = '';
        holdingPriceInput.value = '';
    });

    renderPortfolio();
}

function addHolding(amountGrams, purchasePricePerGram) {
    const newHolding = {
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        amountGrams,
        purchasePricePerGram
    };
    window.goldPriceAlerts.portfolio.push(newHolding);
    renderPortfolio();
}

function sellHolding(holdingId, amountToSell) {
    const holding = window.goldPriceAlerts.portfolio.find(h => h.id === holdingId);
    if (!holding) return;

    if (amountToSell >= holding.amountGrams) {
        window.goldPriceAlerts.portfolio = window.goldPriceAlerts.portfolio.filter(h => h.id !== holdingId);
    } else {
        holding.amountGrams -= amountToSell;
    }
    renderPortfolio();
}

function renderPortfolio() {
    const summaryEl = document.getElementById('portfolio-summary');
    const holdingsListEl = document.getElementById('holdings-list');
    if (!summaryEl || !holdingsListEl) return;

    const { portfolio, basePriceInUsdPerOz, selectedCurrency } = window.goldPriceAlerts;
    const currentPricePerGram = getConvertedPrice(basePriceInUsdPerOz, selectedCurrency, 'g');

    // Summary
    const totalGrams = portfolio.reduce((sum, h) => sum + h.amountGrams, 0);
    const totalCost = portfolio.reduce((sum, h) => sum + (h.amountGrams * h.purchasePricePerGram), 0);
    const currentValue = totalGrams * currentPricePerGram;
    const profitLoss = currentValue - totalCost;

    summaryEl.innerHTML = `
        <p><strong>Total Holdings:</strong> ${totalGrams.toFixed(2)} grams</p>
        <p><strong>Total Cost:</strong> ${formatCurrency(totalCost, selectedCurrency)}</p>
        <p><strong>Current Value:</strong> ${formatCurrency(currentValue, selectedCurrency)}</p>
        <p><strong>Profit/Loss:</strong> <span class="${profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}">${formatCurrency(profitLoss, selectedCurrency)}</span></p>
    `;

    // Holdings Table
    holdingsListEl.innerHTML = '';
    portfolio.forEach(h => {
        const row = document.createElement('tr');
        const holdingCurrentValue = h.amountGrams * currentPricePerGram;
        row.innerHTML = `
            <td>${h.date}</td>
            <td>${h.amountGrams.toFixed(2)}</td>
            <td>${formatCurrency(h.purchasePricePerGram, selectedCurrency)}</td>
            <td>${formatCurrency(holdingCurrentValue, selectedCurrency)}</td>
            <td><button class="sell-holding-btn" data-id="${h.id}">Sell</button></td>
        `;
        row.querySelector('.sell-holding-btn').addEventListener('click', (e) => {
            const amountToSell = prompt(`How much of this holding do you want to sell? (Max: ${h.amountGrams.toFixed(2)}g)`);
            if (amountToSell) {
                sellHolding(h.id, parseFloat(amountToSell));
            }
        });
        holdingsListEl.appendChild(row);
    });
}

// --- Trade ---
function initializeTrade() {
    window.tradeInitialized = true;
    const tradeForm = document.getElementById('trade-form');
    const tradeAmountInput = document.getElementById('trade-amount');
    const tradeConfirmationEl = document.getElementById('trade-confirmation');

    tradeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const amount = parseFloat(tradeAmountInput.value);
        const broker = document.getElementById('trade-broker').value;
        const tradeType = document.getElementById('trade-type').value;

        if (isNaN(amount) || amount <= 0) return;

        tradeConfirmationEl.textContent = `Successfully executed ${tradeType} of ${amount}g with ${broker}.`;
        tradeConfirmationEl.style.color = 'green';
        tradeAmountInput.value = '';

        if (tradeType === 'buy') {
            const { basePriceInUsdPerOz, selectedCurrency } = window.goldPriceAlerts;
            const purchasePrice = getConvertedPrice(basePriceInUsdPerOz, selectedCurrency, 'g');
            addHolding(amount, purchasePrice);
        } else { // Sell
            sellHoldingFromTrade(amount);
        }
    });
}

function sellHoldingFromTrade(amountToSell) {
    let remainingToSell = amountToSell;
    const portfolio = window.goldPriceAlerts.portfolio;

    // FIFO - Sell from the oldest holdings first
    for (const holding of portfolio) {
        if (remainingToSell <= 0) break;

        if (holding.amountGrams <= remainingToSell) {
            remainingToSell -= holding.amountGrams;
            sellHolding(holding.id, holding.amountGrams);
        } else {
            sellHolding(holding.id, remainingToSell);
            remainingToSell = 0;
        }
    }
}

function setupTradeForm(broker, tradeType) {
    document.getElementById('trade-header').textContent = `Trade with ${broker}`;
    document.getElementById('trade-broker').value = broker;
    document.getElementById('trade-type').value = tradeType;
    document.getElementById('trade-btn').textContent = `Confirm ${tradeType.charAt(0).toUpperCase() + tradeType.slice(1)}`;
    document.getElementById('trade-confirmation').textContent = '';
}

// --- Analyser ---
function initializeAnalyser() {
    window.analyserInitialized = true;
    const analyserForm = document.getElementById('analyser-form');
    const principalInput = document.getElementById('analyser-principal');
    const horizonInput = document.getElementById('analyser-horizon');
    const resultsEl = document.getElementById('analysis-results');

    analyserForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const principal = parseFloat(principalInput.value);
        const horizon = parseInt(horizonInput.value, 10);
        if (isNaN(principal) || principal <= 0 || isNaN(horizon) || horizon <= 0) {
            resultsEl.innerHTML = '<p style="color: red;">Please enter a valid principal and time horizon.</p>';
            return;
        }
        renderAnalysis(principal, horizon, resultsEl);
    });
}

function renderAnalysis(principal, horizon, resultsEl) {
    const { selectedCurrency } = window.goldPriceAlerts;
    const bestCaseRate = 0.08; // 8% annual growth
    const worstCaseRate = -0.05; // -5% annual growth

    const bestCaseValue = principal * Math.pow(1 + bestCaseRate, horizon);
    const worstCaseValue = principal * Math.pow(1 + worstCaseRate, horizon);

    const bestCaseRationale = `Based on current market trends, including strong demand from central banks and persistent inflation fears, a bullish outlook is plausible. Expert analysis suggests that gold could continue its upward trajectory, potentially leading to significant returns over your investment horizon.`;
    const worstCaseRationale = `In a scenario where global economies stabilize unexpectedly, or if central banks adopt a more aggressive stance on interest rates to combat inflation, gold's appeal as a safe-haven asset could diminish. This could lead to a correction in gold prices.`;

    resultsEl.innerHTML = `
        <div class="scenario best-case">
            <h3>Best-Case Scenario</h3>
            <p><strong>Projected Value:</strong> ${formatCurrency(bestCaseValue, selectedCurrency)}</p>
            <p><strong>Return:</strong> ${formatCurrency(bestCaseValue - principal, selectedCurrency)} (+${((bestCaseValue / principal - 1) * 100).toFixed(2)}%)</p>
            <p class="rationale"><strong>Rationale:</strong> ${bestCaseRationale}</p>
        </div>
        <div class="scenario worst-case">
            <h3>Worst-Case Scenario</h3>
            <p><strong>Projected Value:</strong> ${formatCurrency(worstCaseValue, selectedCurrency)}</p>
            <p><strong>Return:</strong> ${formatCurrency(worstCaseValue - principal, selectedCurrency)} (${((worstCaseValue / principal - 1) * 100).toFixed(2)}%)</p>
            <p class="rationale"><strong>Rationale:</strong> ${worstCaseRationale}</p>
        </div>
    `;
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
