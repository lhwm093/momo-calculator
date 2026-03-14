// 全局變數
let dailyCalories = 0;

// localStorage key
const STORAGE_KEY = 'momo-kitten-settings-v2';

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
const petNameInput = document.getElementById('petName');
const petBirthInput = document.getElementById('petBirth');
const petPhotoInput = document.getElementById('petPhoto');
const petPhotoPreview = document.getElementById('petPhotoPreview');
const petPhotoPreviewFallback = document.getElementById('petPhotoPreviewFallback');
const petCard = document.getElementById('petCard');
const petPhotoDisplay = document.getElementById('petPhotoDisplay');
const petAvatarFallback = document.getElementById('petAvatarFallback');
const petNameDisplay = document.getElementById('petNameDisplay');
const petAgeDisplay = document.getElementById('petAgeDisplay');
const petWeightDisplay = document.getElementById('petWeightDisplay');
const petCaloriesDisplay = document.getElementById('petCaloriesDisplay');
const editPetButton = document.getElementById('editPetButton');
const calculatorForm = document.getElementById('calculatorForm');
const petAgeResult = document.getElementById('petAgeResult');
const petAgeValue = document.getElementById('petAgeValue');
const activitySlider = document.getElementById('activitySlider');
const activityDisplay = document.getElementById('activityDisplay');
const petSexDisplay = document.getElementById('petSexDisplay');
const petAgeBandDisplay = document.getElementById('petAgeBandDisplay');
const petWeightStatusIcon = document.getElementById('petWeightStatusIcon');
const petActivityDisplay = document.getElementById('petActivityDisplay');
const infoButton = document.getElementById('infoButton');
const infoModal = document.getElementById('infoModal');
const infoModalClose = document.getElementById('infoModalClose');
const infoModalBackdrop = document.getElementById('infoModalBackdrop');

let petPhotoDataUrl = '';

const ACTIVITY_LABELS = { lazy: '🥱 死懶鬼', normal: '😇 一般', adhd: '🤪 ADHD' };
const AGE_BAND_LABELS = { kitten: '幼貓', junior: '幼貓', adult: '成貓', middle: '中年成貓', senior: '老年貓' };

function showForm() {
    if (calculatorForm) calculatorForm.style.display = 'block';
}

function hideForm() {
    if (calculatorForm) calculatorForm.style.display = 'none';
}

// --- 年齡區間與乘數（依出生日、絕育、活躍、體重狀態、生病）---
// 回傳 { years, months, totalMonths }，無生日則 null
function getAgeInMonths(birthStr) {
    if (!birthStr) return null;
    const birth = new Date(birthStr);
    if (isNaN(birth.getTime())) return null;
    const now = new Date();
    if (birth > now) return null;
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    let days = now.getDate() - birth.getDate();
    if (days < 0) {
        const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        days += prevMonth.getDate();
        months -= 1;
    }
    if (months < 0) {
        months += 12;
        years -= 1;
    }
    return { years, months, totalMonths: years * 12 + months };
}

// 年齡區間：kitten(<4月) | junior(4月~未滿1歲) | adult(1~7歲) | middle(7~11歲) | senior(≥11歲)
function getAgeBand(birthStr) {
    const age = getAgeInMonths(birthStr);
    if (!age) return null;
    const m = age.totalMonths;
    if (m < 4) return 'kitten';
    if (m < 12) return 'junior';
    if (m < 84) return 'adult';   // 1–7 歲
    if (m < 132) return 'middle'; // 7–11 歲
    return 'senior';
}

// 體重狀態：under | normal | obese（幼貓/4月~1歲不判定肥胖）
// 門檻：新生~1月<0.09kg過瘦 | 2月<0.8 | 3~5月<1 | 6~11月<2 | 成貓/中年 母<3.6/公<4.9過瘦 >4.5肥胖 | 老貓<3過瘦 >7肥胖
function getWeightStatus(ageBand, weightKg, sex, birthStr) {
    if (!weightKg || weightKg <= 0) return 'normal';
    const age = birthStr ? getAgeInMonths(birthStr) : null;
    if (!ageBand) return 'normal';

    if (ageBand === 'kitten' || ageBand === 'junior') {
        const m = age ? age.totalMonths : 0;
        const w = weightKg;
        if (m <= 1 && w < 0.09) return 'under';   // 新生~1個月
        if (m >= 2 && m < 3 && w < 0.8) return 'under';  // 2個月
        if (m >= 3 && m < 6 && w < 1) return 'under';    // 3~5個月
        if (m >= 6 && m < 12 && w < 2) return 'under';   // 6~11個月（junior 上限 11）
        return 'normal';
    }

    if (ageBand === 'adult' || ageBand === 'middle') {
        // 成貓／中年：理想 3.6–4.5 kg，>4.5 視為肥胖，<3.6 視為過瘦（不再放大公貓過瘦門檻）
        if (weightKg > 4.5) return 'obese';
        if (weightKg < 3.6) return 'under';
        return 'normal';
    }

    if (ageBand === 'senior') {
        if (weightKg < 3) return 'under';
        if (weightKg > 7) return 'obese';
        return 'normal';
    }

    return 'normal';
}

// 乘數優先：生病(成貓) > 肥胖 > 過瘦成貓 > 年齡+絕育+活躍
// 無出生日期時視為成貓，至少依絕育與活躍程度計算
function getMultiplier(ageBand, neutered, activity, weightStatus, isSick) {
    const lazy = activity === 'lazy';
    const normal = activity === 'normal';
    const adhd = activity === 'adhd';
    const effectiveBand = ageBand || 'adult';

    if (isSick && effectiveBand === 'adult') return 1;

    if (weightStatus === 'obese') {
        if (lazy) return 0.8;
        if (normal) return 0.9;
        return 1;
    }
    if (weightStatus === 'under' && (effectiveBand === 'adult' || effectiveBand === 'middle')) {
        if (lazy) return 1.2;
        if (normal) return 1.5;
        return 1.8;
    }

    switch (effectiveBand) {
        case 'kitten':
            return 2.5;
        case 'junior':
            if (adhd) return 2.5;
            return 2;
        case 'adult':
            const neuteredYes = neutered === 'yes';
            if (neuteredYes) {
                if (lazy) return 1.2;
                if (normal) return 1.3;
                return 1.4;
            }
            if (lazy) return 1.4;
            if (normal) return 1.5;
            return 1.6;
        case 'middle':
            if (lazy) return 1.1;
            if (normal) return 1.25;
            return 1.4;
        case 'senior':
            if (lazy) return 1.1;
            if (normal) return 1.3;
            return 1.6;
        default:
            return 2.5;
    }
}

// 計算每日熱量：體重^0.75 × 70 × 乘數
function calculateDailyCalories(weight) {
    const birthStr = document.getElementById('petBirth')?.value || '';
    const sex = document.getElementById('petSex')?.value || 'male';
    const neutered = document.getElementById('neutered')?.value || 'no';
    const activity = document.getElementById('activity')?.value || 'normal';
    const healthStatus = document.getElementById('healthStatus')?.value || 'healthy';

    const ageBand = getAgeBand(birthStr);
    const weightStatus = getWeightStatus(ageBand, weight, sex, birthStr);
    const isSick = healthStatus === 'sick';
    const mult = getMultiplier(ageBand, neutered, activity, weightStatus, isSick);

    const base = Math.pow(weight, 0.75) * 70;
    const calories = base * mult;
    return Math.round(calories * 100) / 100;
}

// 更新年齡區塊顯示（出生日期變更時）
function updatePetAgeBlock() {
    const birth = petBirthInput ? petBirthInput.value : '';
    if (!petAgeResult || !petAgeValue) return;
    if (!birth) {
        petAgeResult.style.display = 'none';
        return;
    }
    const text = (formatPetAge(birth) || '').replace(/^年齡：/, '').trim();
    petAgeValue.textContent = text || '—';
    petAgeResult.style.display = 'block';
}

// 依重量與所有狀態即時更新每日熱量
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

// 選項按鈕（性別、絕育、狀態）：點擊設 hidden 並更新 active，再重算熱量（僅綁定一次）
let optionButtonsBound = false;
function initOptionButtons() {
    if (optionButtonsBound) return;
    optionButtonsBound = true;
    document.querySelectorAll('.option-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            const field = btn.dataset.field;
            const value = btn.dataset.value;
            const hidden = document.getElementById(field);
            if (hidden) hidden.value = value;
            btn.closest('.option-buttons')?.querySelectorAll('.option-btn').forEach((b) => b.classList.remove('active'));
            btn.classList.add('active');
            updatePetAgeBlock();
            updateDailyCaloriesFromWeight();
            updateMealResultsRealtime();
        });
    });
}

// 活躍程度滑條：0=死懶鬼 1=一般 2=ADHD（僅綁定一次，避免覆寫還原值）
let activitySliderBound = false;
function initActivitySlider() {
    if (!activitySlider || !activityDisplay) return;
    const sync = () => {
        const parsed = parseInt(activitySlider.value, 10);
        const v = Number.isNaN(parsed) ? 1 : parsed;
        const act = v === 0 ? 'lazy' : v === 2 ? 'adhd' : 'normal';
        const hidden = document.getElementById('activity');
        if (hidden) hidden.value = act;
        activityDisplay.textContent = ACTIVITY_LABELS[act];
        updateDailyCaloriesFromWeight();
        updateMealResultsRealtime();
    };
    if (!activitySliderBound) {
        activitySliderBound = true;
        activitySlider.addEventListener('input', sync);
    }
    sync();
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
    const drySlider = mealRatiosContainer.querySelector(`.ratio-range[data-meal="${meal}"][data-type="dry"]`);
    const wetSlider = mealRatiosContainer.querySelector(`.ratio-range[data-meal="${meal}"][data-type="wet"]`);
    drySpan.textContent = drySlider ? drySlider.value : '0';
    wetSpan.textContent = wetSlider ? wetSlider.value : '0';
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
        ratioMode: getRatioMode(),
        petName: petNameInput ? petNameInput.value : '',
        petBirth: petBirthInput ? petBirthInput.value : '',
        petPhoto: petPhotoDataUrl || '',
        petSex: document.getElementById('petSex')?.value || '',
        neutered: document.getElementById('neutered')?.value || 'no',
        activity: document.getElementById('activity')?.value || 'normal',
        healthStatus: document.getElementById('healthStatus')?.value || 'healthy'
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

    // 寵物基本資料
    if (petNameInput) petNameInput.value = settings.petName || '';
    if (petBirthInput) petBirthInput.value = settings.petBirth || '';
    const petSexEl = document.getElementById('petSex');
    if (petSexEl) petSexEl.value = settings.petSex || '';
    const neuteredEl = document.getElementById('neutered');
    if (neuteredEl) neuteredEl.value = settings.neutered || 'no';
    const activityEl = document.getElementById('activity');
    if (activityEl) activityEl.value = settings.activity || 'normal';
    const healthStatusEl = document.getElementById('healthStatus');
    if (healthStatusEl) healthStatusEl.value = settings.healthStatus || 'healthy';
    if (activitySlider) {
        const v = settings.activity === 'lazy' ? 0 : settings.activity === 'adhd' ? 2 : 1;
        activitySlider.value = String(v);
        const act = settings.activity || 'normal';
        const activityHidden = document.getElementById('activity');
        if (activityHidden) activityHidden.value = act;
        if (activityDisplay) activityDisplay.textContent = ACTIVITY_LABELS[act];
    }
    initOptionButtons();
    initActivitySlider();
    if (settings.petBirth) updatePetAgeBlock();
    document.querySelectorAll('.option-btn[data-field="petSex"]').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.value === (settings.petSex || ''));
    });
    document.querySelectorAll('.option-btn[data-field="neutered"]').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.value === (settings.neutered || 'no'));
    });
    document.querySelectorAll('.option-btn[data-field="healthStatus"]').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.value === (settings.healthStatus || 'healthy'));
    });
    if (settings.petPhoto) {
        petPhotoDataUrl = settings.petPhoto;
        if (petPhotoPreview) {
            petPhotoPreview.src = petPhotoDataUrl;
            petPhotoPreview.style.display = 'block';
        }
        if (petPhotoPreviewFallback) petPhotoPreviewFallback.style.display = 'none';
    }

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

    // 還原每日熱量顯示（依體重與狀態重算）
    if (settings.catWeight) {
        const w = parseFloat(settings.catWeight);
        if (!isNaN(w) && w > 0) {
            dailyCalories = calculateDailyCalories(w);
            dailyCaloriesSpan.textContent = dailyCalories;
            dailyCaloriesResult.style.display = 'block';
        }
    } else if (typeof settings.dailyCalories === 'number' && settings.dailyCalories > 0) {
        dailyCalories = settings.dailyCalories;
        dailyCaloriesSpan.textContent = dailyCalories;
        dailyCaloriesResult.style.display = 'block';
    }

    updateMealResultsRealtime();
}

// 計算年齡文字（依出生日期，顯示為：X 年&X個月、X 個月&X日 或 X 日）
function formatPetAge(birthStr) {
    if (!birthStr) return '年齡：—';
    const birth = new Date(birthStr);
    if (isNaN(birth.getTime())) return '年齡：—';
    const now = new Date();
    if (birth > now) return '年齡：—';

    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    let days = now.getDate() - birth.getDate();

    if (days < 0) {
        // 向前借一個月的天數
        const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        days += prevMonth.getDate();
        months -= 1;
    }
    if (months < 0) {
        months += 12;
        years -= 1;
    }

    // 全部為 0 的極端情況（同一天出生）
    if (years <= 0 && months <= 0 && days <= 0) {
        return '年齡：0 日';
    }

    // 小於 1 個月：只顯示 X 日
    if (years <= 0 && months <= 0) {
        return `年齡：${days} 日`;
    }

    // 小於 1 年：顯示 X 個月 & X日（若天數為 0 則只顯示個月）
    if (years <= 0) {
        if (days > 0) {
            return `年齡：${months} 個月&${days}日`;
        }
        return `年齡：${months} 個月`;
    }

    // 大於等於 1 年：顯示 X 年 & X個月（忽略天數）
    if (months > 0) {
        return `年齡：${years} 年&${months}個月`;
    }
    return `年齡：${years} 年`;
}

// 更新寵物身分證卡片顯示
function updatePetCardFromState() {
    if (!petCard) return;
    const hasAnyInfo =
        (petNameInput && petNameInput.value) ||
        (petBirthInput && petBirthInput.value) ||
        (catWeightInput && catWeightInput.value) ||
        dailyCalories > 0 ||
        petPhotoDataUrl;

    if (!hasAnyInfo) {
        petCard.style.display = 'none';
        return;
    }

    const name = (petNameInput && petNameInput.value.trim()) || '小貓';
    const birth = petBirthInput ? petBirthInput.value : '';
    const ageText = formatPetAge(birth);
    const weight = parseFloat(catWeightInput.value) || 0;
    const sex = document.getElementById('petSex')?.value || '';
    const activity = document.getElementById('activity')?.value || 'normal';
    const healthStatus = document.getElementById('healthStatus')?.value || 'healthy';

    const ageBand = getAgeBand(birth);
    const weightStatus = getWeightStatus(ageBand, weight, sex, birth);

    if (petNameDisplay) petNameDisplay.textContent = name;
    if (petSexDisplay) {
        petSexDisplay.textContent = sex === 'female' ? '女' : sex === 'male' ? '男' : '';
        petSexDisplay.style.display = sex ? 'inline' : 'none';
    }
    if (petAgeBandDisplay) {
        const bandLabel = ageBand ? AGE_BAND_LABELS[ageBand] : '';
        petAgeBandDisplay.textContent = bandLabel ? `（${bandLabel}）` : '';
        petAgeBandDisplay.style.display = bandLabel ? 'inline' : 'none';
    }
    if (petAgeDisplay) petAgeDisplay.textContent = (ageText || '—').replace(/^年齡：/, '').trim() || '—';
    if (petWeightDisplay) {
        const wtxt = weight > 0 ? `${weight.toFixed(2)} kg` : '— kg';
        const icon = weight > 0 ? (weightStatus === 'obese' ? ' 🐷' : weightStatus === 'under' ? ' 💀' : ' 👍🏻') : '';
        petWeightDisplay.innerHTML = wtxt + (icon ? `<span id="petWeightStatusIcon" class="pet-weight-icon">${icon}</span>` : '');
    }
    if (petCaloriesDisplay) petCaloriesDisplay.textContent = dailyCalories > 0 ? `${Math.round(dailyCalories)} kcal` : '— kcal';
    if (petActivityDisplay) petActivityDisplay.textContent = ACTIVITY_LABELS[activity] || '—';

    const statusBtn = petCard.querySelector('.pet-status-btn');
    if (statusBtn) {
        statusBtn.dataset.status = healthStatus;
        statusBtn.textContent = healthStatus === 'sick' ? '生病' : '健康';
        statusBtn.classList.toggle('pet-status-btn--sick', healthStatus === 'sick');
    }

    if (petPhotoDataUrl && petPhotoDisplay) {
        petPhotoDisplay.src = petPhotoDataUrl;
        petPhotoDisplay.style.display = 'block';
        if (petAvatarFallback) petAvatarFallback.style.display = 'none';
    } else {
        if (petPhotoDisplay) petPhotoDisplay.style.display = 'none';
        if (petAvatarFallback) petAvatarFallback.style.display = 'block';
    }

    petCard.style.display = 'flex';
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
        updatePetCardFromState();
        showSaveMessage('已儲存這次設定，下次打開會自動套用。');
        hideForm();
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
    updatePetCardFromState();
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
            <div class="meal-time-block">
                <span class="meal-number">第 ${meal.number} 餐</span>
                <div class="meal-time-circle">
                    <span class="meal-time">${meal.time}</span>
                </div>
            </div>
            <div class="meal-portions">
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
            hideForm(); // 已有設定時預設隱藏輸入表單，只顯示身分證與結果
        } else {
            updateRatioModeUI();
            renderMealRatios();
        }
    } catch (e) {
        updateRatioModeUI();
        renderMealRatios();
    }
    initOptionButtons();
    initActivitySlider();
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

    if (petPhotoInput) {
        petPhotoInput.addEventListener('change', (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                petPhotoDataUrl = ev.target.result;
                if (petPhotoPreview) {
                    petPhotoPreview.src = petPhotoDataUrl;
                    petPhotoPreview.style.display = 'block';
                }
                if (petPhotoPreviewFallback) petPhotoPreviewFallback.style.display = 'none';
                updatePetCardFromState();
            };
            reader.readAsDataURL(file);
        });
    }

    if (editPetButton) {
        editPetButton.addEventListener('click', () => {
            const form = document.getElementById('calculatorForm');
            showForm();
            if (form) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
            if (petNameInput) petNameInput.focus();
        });
    }

    // 說明彈窗開關
    if (infoButton && infoModal) {
        const openModal = () => {
            infoModal.classList.add('is-open');
            infoModal.setAttribute('aria-hidden', 'false');
        };
        const closeModal = () => {
            infoModal.classList.remove('is-open');
            infoModal.setAttribute('aria-hidden', 'true');
        };
        infoButton.addEventListener('click', openModal);
        infoModalClose?.addEventListener('click', closeModal);
        infoModalBackdrop?.addEventListener('click', closeModal);
    }

    const statusToggle = petCard?.querySelector('.pet-status-btn');
    if (statusToggle) {
        statusToggle.addEventListener('click', () => {
            const statusHidden = document.getElementById('healthStatus');
            const current = statusHidden?.value || 'healthy';
            const next = current === 'healthy' ? 'sick' : 'healthy';
            if (statusHidden) statusHidden.value = next;
            updateDailyCaloriesFromWeight();
            updateMealResultsRealtime();
            updatePetCardFromState();
            // 同步表單內的狀態選項按鈕外觀
            document.querySelectorAll('.option-btn[data-field="healthStatus"]').forEach((btn) => {
                btn.classList.toggle('active', btn.dataset.value === next);
            });
        });
    }

    petBirthInput?.addEventListener('input', () => {
        updatePetAgeBlock();
        updateDailyCaloriesFromWeight();
        updateMealResultsRealtime();
    });
    petBirthInput?.addEventListener('change', () => {
        updatePetAgeBlock();
        updateDailyCaloriesFromWeight();
        updateMealResultsRealtime();
    });

    updatePetCardFromState();
});

// 儲存／重設按鈕綁定
if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', handleSaveSettings);
}
if (resetSettingsBtn) {
    resetSettingsBtn.addEventListener('click', handleResetSettings);
}
