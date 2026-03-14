// 全局變數
let dailyCalories = 0;

// localStorage key
const STORAGE_KEY = 'momo-kitten-settings-v1';

// 比例選項（每餐乾/濕糧可選 0%、25%、50%、75%、100%）
const RATIO_OPTIONS = [0, 25, 50, 75, 100];

// DOM 元素
const dailyCaloriesResult = document.getElementById('dailyCaloriesResult');
const dailyCaloriesSpan = document.getElementById('dailyCalories');
const resultsSection = document.getElementById('resultsSection');
const mealResults = document.getElementById('mealResults');
const toggleDryPackBtn = document.getElementById('toggleDryPack');
const toggleWetPackBtn = document.getElementById('toggleWetPack');
const dryPackInfo = document.getElementById('dryPackInfo');
const wetPackInfo = document.getElementById('wetPackInfo');
const mealsPerDaySelect = document.getElementById('mealsPerDay'); // hidden input，值由按鈕設定
const ratioPerMealSection = document.getElementById('ratioPerMealSection');
const mealRatiosContainer = document.getElementById('mealRatiosContainer');
const ratioError = document.getElementById('ratioError');
const saveSettingsBtn = document.getElementById('saveSettings');
const resetSettingsBtn = document.getElementById('resetSettings');
const saveMessage = document.getElementById('saveMessage');
const ratioModeFixed = document.getElementById('ratioModeFixed');
const ratioModePerMeal = document.getElementById('ratioModePerMeal');
const fixedDryRatioSlider = document.getElementById('fixedDryRatio');
const fixedWetRatioSlider = document.getElementById('fixedWetRatio');
const fixedDryRatioDisplay = document.getElementById('fixedDryRatioDisplay');
const fixedWetRatioDisplay = document.getElementById('fixedWetRatioDisplay');
const ratioFixedSection = document.getElementById('ratioFixedSection');
const mealIntervalSlider = document.getElementById('mealIntervalSlider');
const mealIntervalDisplay = document.getElementById('mealIntervalDisplay');
const waterPerKgInput = document.getElementById('waterPerKg');
const catWeightInput = document.getElementById('catWeight');
const catWeightSlider = document.getElementById('catWeightSlider');
const catWeightDisplay = document.getElementById('catWeightDisplay');

// 計算每日熱量
function calculateDailyCalories(weight) {
    // 公式：√(√(w³)) × 70 × 2.5
    const wCubed = weight * weight * weight;
    const firstSqrt = Math.sqrt(wCubed);
    const secondSqrt = Math.sqrt(firstSqrt);
    const calories = secondSqrt * 70 * 2.5;
    return Math.round(calories * 100) / 100; // 保留兩位小數
}

// 依重量即時更新每日熱量（拖拉或輸入時自動計算）
function updateDailyCaloriesFromWeight() {
    const weight = parseFloat(catWeightInput.value);
    if (!weight || weight <= 0) {
        dailyCaloriesResult.style.display = 'none';
        dailyCalories = 0;
        return;
    }
    dailyCalories = calculateDailyCalories(weight);
    dailyCaloriesSpan.textContent = dailyCalories;
    dailyCaloriesResult.style.display = 'block';
}

// 切換乾糧每包重量顯示
toggleDryPackBtn.addEventListener('click', () => {
    const isVisible = dryPackInfo.style.display !== 'none';
    dryPackInfo.style.display = isVisible ? 'none' : 'block';
    toggleDryPackBtn.textContent = isVisible ? '顯示每包重量' : '隱藏每包重量';
});

// 切換濕糧每包重量顯示
toggleWetPackBtn.addEventListener('click', () => {
    const isVisible = wetPackInfo.style.display !== 'none';
    wetPackInfo.style.display = isVisible ? 'none' : 'block';
    toggleWetPackBtn.textContent = isVisible ? '顯示每包重量' : '隱藏每包重量';
});

// 依餐數動態產生每餐比例滑桿（餐數 1 不顯示每餐不同區塊）
function renderMealRatios() {
    const n = parseInt(mealsPerDaySelect.value) || 0;
    mealRatiosContainer.innerHTML = '';
    ratioError.style.display = 'none';
    ratioError.textContent = '';

    if (n < 2) {
        ratioPerMealSection.style.display = 'none';
        updateMealResultsRealtime();
        return;
    }

    ratioPerMealSection.style.display = 'block';

    for (let i = 1; i <= n; i++) {
        const card = document.createElement('div');
        card.className = 'meal-ratio-card';
        card.dataset.mealIndex = i;
        card.innerHTML = `
            <div class="meal-ratio-title">第 ${i} 餐</div>
            <div class="meal-ratio-slider-row">
                <div class="meal-ratio-slider-field">
                    <label>🥘 乾糧 <span class="ratio-value" data-meal="${i}" data-type="dry">50</span>%</label>
                    <input type="range" class="ratio-range" data-meal="${i}" data-type="dry" min="0" max="100" value="50" step="5">
                </div>
                <div class="meal-ratio-slider-field">
                    <label>🍖 濕糧 <span class="ratio-value" data-meal="${i}" data-type="wet">50</span>%</label>
                    <input type="range" class="ratio-range" data-meal="${i}" data-type="wet" min="0" max="100" value="50" step="5">
                </div>
            </div>
        `;
        mealRatiosContainer.appendChild(card);
    }

    mealRatiosContainer.querySelectorAll('.ratio-range').forEach((slider) => {
        slider.addEventListener('input', syncMealRatioPair);
        slider.addEventListener('input', validateAllMealRatios);
        slider.addEventListener('input', updateMealResultsRealtime);
    });
    updateMealResultsRealtime();
}

// 同一餐乾+濕須為 100%，滑桿連動（每餐模式）
function syncMealRatioPair(e) {
    const slider = e.target;
    const meal = slider.dataset.meal;
    const type = slider.dataset.type;
    const otherType = type === 'dry' ? 'wet' : 'dry';
    const otherSlider = mealRatiosContainer.querySelector(`.ratio-range[data-meal="${meal}"][data-type="${otherType}"]`);
    const drySpan = mealRatiosContainer.querySelector(`.ratio-value[data-meal="${meal}"][data-type="dry"]`);
    const wetSpan = mealRatiosContainer.querySelector(`.ratio-value[data-meal="${meal}"][data-type="wet"]`);
    if (!otherSlider || !drySpan || !wetSpan) return;
    const val = parseInt(slider.value) || 0;
    const otherVal = 100 - val;
    otherSlider.value = String(otherVal);
    drySpan.textContent = mealRatiosContainer.querySelector(`.ratio-range[data-meal="${meal}"][data-type="dry"]`).value;
    wetSpan.textContent = otherSlider.value;
}


// 驗證所有餐次比例均為 100%（每餐模式）
function validateAllMealRatios() {
    if (getRatioMode() !== 'perMeal') return true;
    const n = parseInt(mealsPerDaySelect.value) || 0;
    let message = '';

    for (let i = 1; i <= n; i++) {
        const dryEl = mealRatiosContainer.querySelector(`.ratio-range[data-meal="${i}"][data-type="dry"]`);
        const wetEl = mealRatiosContainer.querySelector(`.ratio-range[data-meal="${i}"][data-type="wet"]`);
        const dry = parseInt(dryEl?.value) || 0;
        const wet = parseInt(wetEl?.value) || 0;
        if (dry + wet !== 100) {
            message = `第 ${i} 餐的乾糧與濕糧比例加總須為 100%（目前 ${dry}% + ${wet}%）`;
            break;
        }
    }

    if (message) {
        ratioError.textContent = message;
        ratioError.style.display = 'block';
        return false;
    }
    ratioError.style.display = 'none';
    ratioError.textContent = '';
    return true;
}

// 餐數改為按鈕後，由 initMealsButtons 設定 change 時 renderMealRatios

// 格式化時間（小時:分鐘）
function formatTime(hours, minutes) {
    const h = String(hours).padStart(2, '0');
    const m = String(minutes).padStart(2, '0');
    return `${h}:${m}`;
}

// 計算時間（小時 + 間隔）
function addHours(timeString, hours) {
    const [h, m] = timeString.split(':').map(Number);
    let newHours = h + hours;
    if (newHours >= 24) {
        newHours -= 24;
    }
    return formatTime(newHours, m);
}

// 取得第 i 餐的乾／濕比例（i 從 1 開始）
function getMealRatios(mealIndex) {
    const dryEl = mealRatiosContainer.querySelector(`.ratio-range[data-meal="${mealIndex}"][data-type="dry"]`);
    const wetEl = mealRatiosContainer.querySelector(`.ratio-range[data-meal="${mealIndex}"][data-type="wet"]`);
    return {
        dry: parseInt(dryEl?.value) || 0,
        wet: parseInt(wetEl?.value) || 0
    };
}

// 取得目前比例模式
function getRatioMode() {
    if (ratioModePerMeal && ratioModePerMeal.checked) return 'perMeal';
    return 'fixed';
}

// 切換比例模式顯示
function updateRatioModeUI() {
    const mode = getRatioMode();
    if (mode === 'fixed') {
        if (ratioFixedSection) ratioFixedSection.style.display = 'block';
        if (ratioPerMealSection) ratioPerMealSection.style.display = 'none';
    } else {
        if (ratioFixedSection) ratioFixedSection.style.display = 'none';
        if (ratioPerMealSection) ratioPerMealSection.style.display = 'block';
        renderMealRatios();
    }
    ratioError.style.display = 'none';
    ratioError.textContent = '';
}

if (ratioModeFixed) {
    ratioModeFixed.addEventListener('change', () => { updateRatioModeUI(); updateMealResultsRealtime(); });
}
if (ratioModePerMeal) {
    ratioModePerMeal.addEventListener('change', () => { updateRatioModeUI(); updateMealResultsRealtime(); });
}

// 固定比例模式：乾+濕 = 100，滑桿連動並更新顯示
function syncFixedRatio(changed) {
    if (!fixedDryRatioSlider || !fixedWetRatioSlider) return;
    const dryVal = parseInt(fixedDryRatioSlider.value) || 0;
    const wetVal = parseInt(fixedWetRatioSlider.value) || 0;

    if (changed === 'dry') {
        fixedWetRatioSlider.value = String(100 - dryVal);
    } else {
        fixedDryRatioSlider.value = String(100 - wetVal);
    }
    if (fixedDryRatioDisplay) fixedDryRatioDisplay.textContent = fixedDryRatioSlider.value;
    if (fixedWetRatioDisplay) fixedWetRatioDisplay.textContent = fixedWetRatioSlider.value;
}

if (fixedDryRatioSlider) {
    fixedDryRatioSlider.addEventListener('input', () => { syncFixedRatio('dry'); updateMealResultsRealtime(); });
}
if (fixedWetRatioSlider) {
    fixedWetRatioSlider.addEventListener('input', () => { syncFixedRatio('wet'); updateMealResultsRealtime(); });
}

// 驗證固定比例
function validateFixedRatio() {
    if (!fixedDryRatioSlider || !fixedWetRatioSlider) return true;
    const dry = parseInt(fixedDryRatioSlider.value) || 0;
    const wet = parseInt(fixedWetRatioSlider.value) || 0;
    if (dry + wet !== 100) {
        ratioError.textContent = `固定比例的乾糧與濕糧加總須為 100%（目前 ${dry}% + ${wet}%）`;
        ratioError.style.display = 'block';
        return false;
    }
    ratioError.style.display = 'none';
    ratioError.textContent = '';
    return true;
}

// 重量滑桿相關
function updateWeightDisplay(val) {
    if (!catWeightDisplay) return;
    const n = isNaN(val) ? 0 : val;
    catWeightDisplay.textContent = `${n.toFixed(2)} kg`;
}

function syncWeightFromSlider() {
    if (!catWeightSlider || !catWeightInput) return;
    const v = parseFloat(catWeightSlider.value);
    if (!isNaN(v)) {
        catWeightInput.value = v.toFixed(2);
    updateWeightDisplay(v);
    updateDailyCaloriesFromWeight();
    updateMealResultsRealtime();
}
}

function syncWeightFromInput() {
    if (!catWeightSlider || !catWeightInput) return;
    let v = parseFloat(catWeightInput.value);
    if (isNaN(v)) return;
    const min = parseFloat(catWeightSlider.min) || 0.1;
    const max = parseFloat(catWeightSlider.max) || 8;
    if (v < min) v = min;
    if (v > max) v = max;
    catWeightInput.value = v.toFixed(2);
    catWeightSlider.value = String(v);
    updateWeightDisplay(v);
    updateDailyCaloriesFromWeight();
    updateMealResultsRealtime();
}

function initWeightControls() {
    if (!catWeightSlider || !catWeightInput) return;
    if (!catWeightInput.value) {
        catWeightInput.value = '1.60';
    }
    let v = parseFloat(catWeightInput.value);
    if (isNaN(v)) v = 1.6;
    catWeightSlider.value = String(v);
    updateWeightDisplay(v);
    updateDailyCaloriesFromWeight();
    updateMealResultsRealtime();

    catWeightSlider.addEventListener('input', syncWeightFromSlider);
    catWeightInput.addEventListener('input', syncWeightFromInput);
}

// 每天幾頓飯：三按鈕 1 / 2 / 3 頓
function initMealsButtons() {
    const container = document.querySelector('.meals-buttons');
    if (!container || !mealsPerDaySelect) return;
    container.querySelectorAll('.meals-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            const val = btn.dataset.value;
            mealsPerDaySelect.value = val;
            container.querySelectorAll('.meals-btn').forEach((b) => b.classList.remove('active'));
            btn.classList.add('active');
            renderMealRatios();
            updateMealResultsRealtime();
        });
    });
}

// 每公斤喝水量：三按鈕 40 / 50 / 60
function initWaterButtons() {
    const container = document.querySelector('.water-buttons');
    if (!container || !waterPerKgInput) return;
    container.querySelectorAll('.water-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            const val = btn.dataset.value;
            waterPerKgInput.value = val;
            container.querySelectorAll('.water-btn').forEach((b) => b.classList.remove('active'));
            btn.classList.add('active');
            updateMealResultsRealtime();
        });
    });
}

// 每頓飯相隔：滑桿 4–6 小時
function initMealIntervalSlider() {
    if (!mealIntervalSlider || !mealIntervalDisplay) return;
    const hidden = document.getElementById('mealInterval');
    function update() {
        const v = mealIntervalSlider.value;
        if (hidden) hidden.value = v;
        mealIntervalDisplay.textContent = v + ' 小時';
    }
    mealIntervalSlider.addEventListener('input', () => { update(); updateMealResultsRealtime(); });
    update();
}

// 取得目前所有設定內容
function collectSettings() {
    const mealsPerDay = parseInt(mealsPerDaySelect.value) || 0;
    const settings = {
        catWeight: catWeightInput.value || '',
        dryFoodCalories: document.getElementById('dryFoodCalories').value || '',
        wetFoodCalories: document.getElementById('wetFoodCalories').value || '',
        dryPackWeight: document.getElementById('dryPackWeight').value || '',
        wetPackWeight: document.getElementById('wetPackWeight').value || '',
        mealsPerDay,
        waterPerKg: waterPerKgInput ? waterPerKgInput.value : '',
        firstMealTime: document.getElementById('firstMealTime').value || '',
        mealInterval: document.getElementById('mealInterval').value || '',
        dailyCalories,
        ratioMode: getRatioMode()
    };

    if (settings.ratioMode === 'perMeal' && mealsPerDay >= 2) {
        const ratios = [];
        for (let i = 1; i <= mealsPerDay; i++) {
            ratios.push(getMealRatios(i));
        }
        settings.mealRatios = ratios;
    } else if (settings.ratioMode === 'fixed' && fixedDryRatioSlider && fixedWetRatioSlider) {
        settings.fixedDryRatio = parseInt(fixedDryRatioSlider.value) || 0;
        settings.fixedWetRatio = parseInt(fixedWetRatioSlider.value) || 0;
    }

    return settings;
}

// 套用設定到畫面
function applySettings(settings) {
    if (!settings) return;

    catWeightInput.value = settings.catWeight || '';
    document.getElementById('dryFoodCalories').value = settings.dryFoodCalories || '';
    document.getElementById('wetFoodCalories').value = settings.wetFoodCalories || '';
    document.getElementById('dryPackWeight').value = settings.dryPackWeight || '';
    document.getElementById('wetPackWeight').value = settings.wetPackWeight || '';
    if (waterPerKgInput) waterPerKgInput.value = settings.waterPerKg || '50';
    document.getElementById('firstMealTime').value = settings.firstMealTime || '';
    const mealIntervalHidden = document.getElementById('mealInterval');
    if (mealIntervalHidden) mealIntervalHidden.value = settings.mealInterval || '5';
    if (mealIntervalSlider) {
        mealIntervalSlider.value = settings.mealInterval || '5';
        if (mealIntervalDisplay) mealIntervalDisplay.textContent = (settings.mealInterval || '5') + ' 小時';
    }
    // 喝水量按鈕選中狀態
    document.querySelectorAll('.water-btn').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.value === (settings.waterPerKg || '50'));
    });

    if (settings.mealsPerDay) {
        const n = Math.min(3, Math.max(1, parseInt(settings.mealsPerDay) || 2));
        mealsPerDaySelect.value = String(n);
        document.querySelectorAll('.meals-btn').forEach((btn) => {
            btn.classList.toggle('active', btn.dataset.value === String(n));
        });
    }

    // 比例模式（預設 fixed，舊資料沒有時視為 perMeal 以保留原行為）
    const mode = settings.ratioMode || 'perMeal';
    if (ratioModeFixed && ratioModePerMeal) {
        if (mode === 'perMeal') {
            ratioModePerMeal.checked = true;
            ratioModeFixed.checked = false;
        } else {
            ratioModeFixed.checked = true;
            ratioModePerMeal.checked = false;
        }
    }

    updateRatioModeUI();

    if (mode === 'perMeal') {
        renderMealRatios();
        if (settings.mealRatios && Array.isArray(settings.mealRatios)) {
            settings.mealRatios.forEach((r, idx) => {
                const mealIndex = idx + 1;
                const dryEl = mealRatiosContainer.querySelector(`.ratio-range[data-meal="${mealIndex}"][data-type="dry"]`);
                const wetEl = mealRatiosContainer.querySelector(`.ratio-range[data-meal="${mealIndex}"][data-type="wet"]`);
                const drySpan = mealRatiosContainer.querySelector(`.ratio-value[data-meal="${mealIndex}"][data-type="dry"]`);
                const wetSpan = mealRatiosContainer.querySelector(`.ratio-value[data-meal="${mealIndex}"][data-type="wet"]`);
                if (dryEl && typeof r.dry === 'number') {
                    dryEl.value = String(r.dry);
                    if (drySpan) drySpan.textContent = r.dry;
                }
                if (wetEl && typeof r.wet === 'number') {
                    wetEl.value = String(r.wet);
                    if (wetSpan) wetSpan.textContent = r.wet;
                }
            });
            validateAllMealRatios();
        }
    } else if (mode === 'fixed' && fixedDryRatioSlider && fixedWetRatioSlider) {
        if (typeof settings.fixedDryRatio === 'number') {
            fixedDryRatioSlider.value = String(settings.fixedDryRatio);
        }
        if (typeof settings.fixedWetRatio === 'number') {
            fixedWetRatioSlider.value = String(settings.fixedWetRatio);
        }
        if (fixedDryRatioDisplay) fixedDryRatioDisplay.textContent = fixedDryRatioSlider.value;
        if (fixedWetRatioDisplay) fixedWetRatioDisplay.textContent = fixedWetRatioSlider.value;
    }

    // 還原每日熱量顯示（若有）
    if (typeof settings.dailyCalories === 'number' && settings.dailyCalories > 0) {
        dailyCalories = settings.dailyCalories;
        dailyCaloriesSpan.textContent = dailyCalories;
        dailyCaloriesResult.style.display = 'block';
    } else if (settings.catWeight) {
        const w = parseFloat(settings.catWeight);
        if (!isNaN(w) && w > 0) {
            dailyCalories = calculateDailyCalories(w);
            dailyCaloriesSpan.textContent = dailyCalories;
            dailyCaloriesResult.style.display = 'block';
        }
    }

    updateMealResultsRealtime();
}

function showSaveMessage(text, isError = false) {
    if (!saveMessage) return;
    saveMessage.textContent = text;
    saveMessage.style.display = 'block';
    saveMessage.classList.toggle('save-message-error', !!isError);
    clearTimeout(showSaveMessage._timer);
    showSaveMessage._timer = setTimeout(() => {
        saveMessage.style.display = 'none';
    }, 2200);
}

// 儲存設定
function handleSaveSettings() {
    try {
        const data = collectSettings();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        showSaveMessage('已儲存這次設定，下次打開會自動套用。');
    } catch (e) {
        showSaveMessage('儲存失敗，請稍後再試。', true);
    }
}

// 清除已儲存設定
function handleResetSettings() {
    localStorage.removeItem(STORAGE_KEY);
    showSaveMessage('已清除先前儲存的設定。');
}

// 計算每餐分配並回傳 meals 陣列，若驗證失敗回傳 null（不 alert，供即時更新用）
function computeMealDistribution() {
    const dryFoodCalories = parseFloat(document.getElementById('dryFoodCalories').value);
    const wetFoodCalories = parseFloat(document.getElementById('wetFoodCalories').value);
    const mealsPerDay = parseInt(mealsPerDaySelect.value) || 0;
    const waterPerKg = parseFloat(waterPerKgInput ? waterPerKgInput.value : 50);
    const firstMealTime = document.getElementById('firstMealTime').value || '08:00';
    const mealInterval = parseInt(document.getElementById('mealInterval').value) || 5;
    const catWeight = parseFloat(catWeightInput.value);
    const dryPackWeight = parseFloat(document.getElementById('dryPackWeight').value) || null;
    const wetPackWeight = parseFloat(document.getElementById('wetPackWeight').value) || null;

    if (!dailyCalories || dailyCalories <= 0 || !mealsPerDay) return null;
    const mode = getRatioMode();
    if (mode === 'perMeal' && mealsPerDay >= 2 && !validateAllMealRatios()) return null;
    if (mode === 'fixed' && !validateFixedRatio()) return null;

    let needDry = false;
    let needWet = false;
    if (mode === 'fixed' && fixedDryRatioSlider && fixedWetRatioSlider) {
        const dry = parseInt(fixedDryRatioSlider.value) || 0;
        const wet = parseInt(fixedWetRatioSlider.value) || 0;
        if (dry > 0) needDry = true;
        if (wet > 0) needWet = true;
    } else {
        for (let i = 1; i <= mealsPerDay; i++) {
            const r = getMealRatios(i);
            if (r.dry > 0) needDry = true;
            if (r.wet > 0) needWet = true;
        }
    }
    if (needDry && !dryFoodCalories) return null;
    if (needWet && !wetFoodCalories) return null;

    const dailyWaterML = waterPerKg * catWeight;
    const mealWaterML = dailyWaterML / mealsPerDay;
    const caloriesPerMeal = dailyCalories / mealsPerDay;

    const meals = [];
    let currentTime = firstMealTime;

    for (let i = 0; i < mealsPerDay; i++) {
        const mealIndex = i + 1;
        let dryRatio = 50;
        let wetRatio = 50;
        if (mode === 'fixed' && fixedDryRatioSlider && fixedWetRatioSlider) {
            dryRatio = parseInt(fixedDryRatioSlider.value) || 0;
            wetRatio = parseInt(fixedWetRatioSlider.value) || 0;
        } else if (mealsPerDay >= 2 && getRatioMode() === 'perMeal') {
            const r = getMealRatios(mealIndex);
            dryRatio = r.dry;
            wetRatio = r.wet;
        }

        const mealDryCalories = caloriesPerMeal * (dryRatio / 100);
        const mealWetCalories = caloriesPerMeal * (wetRatio / 100);
        const mealDryGrams = dryRatio > 0 ? mealDryCalories / (dryFoodCalories / 1000) : 0;
        const mealWetGrams = wetRatio > 0 ? mealWetCalories / (wetFoodCalories / 1000) : 0;

        meals.push({
            number: mealIndex,
            time: currentTime,
            dryGrams: mealDryGrams,
            wetGrams: mealWetGrams,
            waterML: mealWaterML,
            dryPackWeight,
            wetPackWeight
        });

        if (i < mealsPerDay - 1) currentTime = addHours(currentTime, mealInterval);
    }

    return meals;
}

// 即時更新每餐分配結果（無需按鈕，輸入變更時自動呼叫）
function updateMealResultsRealtime() {
    const meals = computeMealDistribution();
    if (meals && meals.length > 0) {
        displayResults(meals, true);
    } else {
        resultsSection.style.display = 'none';
    }
}

// 格式化重量顯示（幾包+幾克）
function formatWeight(grams, packWeight) {
    if (!packWeight) {
        return `${Math.round(grams * 10) / 10} 克`;
    }
    
    const packs = Math.floor(grams / packWeight);
    const remainingGrams = grams % packWeight;
    
    if (packs === 0) {
        return `${Math.round(remainingGrams * 10) / 10} 克`;
    } else if (remainingGrams < 1) {
        return `${packs} 包`;
    } else {
        return `${packs} 包 + ${Math.round(remainingGrams * 10) / 10} 克`;
    }
}

// 顯示結果（skipScroll 為 true 時不自動滾動，用於即時更新）
function displayResults(meals, skipScroll) {
    mealResults.innerHTML = '';
    
    meals.forEach(meal => {
        const mealCard = document.createElement('div');
        mealCard.className = 'meal-card';
        
        const dryFormatted = formatWeight(meal.dryGrams, meal.dryPackWeight);
        const wetFormatted = formatWeight(meal.wetGrams, meal.wetPackWeight);
        
        mealCard.innerHTML = `
            <div class="meal-header">
                <span class="meal-time">${meal.time}</span>
                <span class="meal-number">第 ${meal.number} 餐</span>
            </div>
            <div class="meal-details">
                <div class="detail-item">
                    <span class="detail-label">🍖 濕糧</span>
                    <span class="detail-value">${wetFormatted}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">🥘 乾糧</span>
                    <span class="detail-value">${dryFormatted}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">💧 水</span>
                    <span class="detail-value">${Math.round(meal.waterML * 10) / 10} 毫升</span>
                </div>
            </div>
        `;
        
        mealResults.appendChild(mealCard);
    });
    
    resultsSection.style.display = 'block';
    if (!skipScroll) resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// 表單若有 submit（例如按 Enter）改為即時更新，不送出
document.getElementById('calculatorForm').addEventListener('submit', (e) => {
    e.preventDefault();
    updateMealResultsRealtime();
});

// 頁面載入：套用已儲存設定或初始化比例區塊與重量滑桿
document.addEventListener('DOMContentLoaded', () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            applySettings(parsed);
        } else {
            updateRatioModeUI();
            renderMealRatios();
        }
    } catch (e) {
        updateRatioModeUI();
        renderMealRatios();
    }
    initWeightControls();
    initMealsButtons();
    initWaterButtons();
    initMealIntervalSlider();
    // 綁定其他會影響每餐結果的輸入
    const dryFoodInput = document.getElementById('dryFoodCalories');
    const wetFoodInput = document.getElementById('wetFoodCalories');
    const firstMealTimeInput = document.getElementById('firstMealTime');
    const dryPackInput = document.getElementById('dryPackWeight');
    const wetPackInput = document.getElementById('wetPackWeight');
    [dryFoodInput, wetFoodInput, firstMealTimeInput, dryPackInput, wetPackInput].forEach((el) => {
        if (el) el.addEventListener('input', updateMealResultsRealtime);
    });
    if (firstMealTimeInput) firstMealTimeInput.addEventListener('change', updateMealResultsRealtime);
});

// 儲存／重設按鈕綁定
if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', handleSaveSettings);
}
if (resetSettingsBtn) {
    resetSettingsBtn.addEventListener('click', handleResetSettings);
}
