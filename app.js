(() => {
  'use strict';

  const STORAGE_KEY = 'brim_personal_crc_v1';
  const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * 40; // r = 40

  const DEFAULT_CATEGORIES = [
    { id: 'groceries', name: 'Groceries', fullName: 'Super & Groceries', emoji: '🛒', color: '#10b981' },
    { id: 'dining', name: 'Dining', fullName: 'Dining & Café', emoji: '☕', color: '#f59e0b' },
    { id: 'transport', name: 'Transport', fullName: 'Transport & Fuel', emoji: '🚗', color: '#3b82f6' },
    { id: 'shopping', name: 'Shopping', fullName: 'Shopping', emoji: '🛍️', color: '#8b5cf6' },
    { id: 'fun', name: 'Fun', fullName: 'Fun & Social', emoji: '🎉', color: '#ec4899' },
    { id: 'health', name: 'Health', fullName: 'Health & Pharmacy', emoji: '💊', color: '#ef4444' },
    { id: 'home', name: 'Home', fullName: 'Home & Supplies', emoji: '🏠', color: '#14b8a6' },
    { id: 'other', name: 'Other', fullName: 'Other', emoji: '✨', color: '#64748b' }
  ];

  const EMOJI_PRESETS = [
    '🛒', '☕', '🚗', '🛍️', '🎉', '💊', '🏠', '✨',
    '🍔', '🍺', '🐾', '✈️', '🎮', '📚', '💻', '🎁',
    '🏋️', '💇', '🚕', '🛠️', '📱', '🎓', '🌴', '❤️'
  ];

  const COLOR_SWATCHES = [
    '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899',
    '#ef4444', '#14b8a6', '#64748b', '#84cc16', '#f97316'
  ];

  function hexToRgba(hex, alpha = 0.16) {
    const clean = String(hex || '').replace('#', '').trim();
    if (/^[0-9a-fA-F]{6}$/.test(clean)) {
      const r = parseInt(clean.slice(0, 2), 16);
      const g = parseInt(clean.slice(2, 4), 16);
      const b = parseInt(clean.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return `rgba(100, 116, 139, ${alpha})`;
  }

  function getCategoryById(id) {
    const list = Array.isArray(state?.categories) && state.categories.length > 0
      ? state.categories
      : DEFAULT_CATEGORIES;
    const found = list.find((c) => c.id === id)
      || list.find((c) => c.id === 'other')
      || list[list.length - 1]
      || DEFAULT_CATEGORIES[DEFAULT_CATEGORIES.length - 1];
    return {
      ...found,
      soft: hexToRgba(found.color, 0.16)
    };
  }

  // Local date helpers (avoid UTC offset issues)
  function toLocalYMD(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function parseLocalYMD(ymd) {
    const [y, m, d] = ymd.split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
  }

  function daysOffsetYMD(daysAgo) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - daysAgo);
    return toLocalYMD(d);
  }

  function formatCRC(amount, options = {}) {
    const { showSign = false, compact = false } = options;
    const num = Math.round(Number(amount) || 0);
    const absVal = Math.abs(num);

    if (compact && absVal >= 1000000) {
      const m = (absVal / 1000000).toFixed(1).replace(/\.0$/, '');
      const prefix = num < 0 ? '-' : (showSign && num > 0 ? '+' : '');
      return `${prefix}₡${m}M`;
    }

    const formatted = absVal.toLocaleString('en-US', { maximumFractionDigits: 0 });
    if (num < 0) return `-₡${formatted}`;
    if (showSign && num > 0) return `+₡${formatted}`;
    return `₡${formatted}`;
  }

  function uid(prefix = 'id') {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
    }
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  }

  function createDemoState() {
    const today = new Date();
    const dayOfMonth = today.getDate();
    const safeOffset = (d) => {
      const clamped = Math.min(d, Math.max(0, dayOfMonth - 1));
      return daysOffsetYMD(clamped);
    };

    return {
      theme: 'dark',
      frame: 'phone',
      cycleMode: 'monthly', // 'monthly' | 'quincenal'
      paydayDay: 1,
      incomeByMode: {
        monthly: 1200000,
        quincenal: 600000
      },
      savingsByMode: {
        monthly: 200000,
        quincenal: 100000
      },
      categories: DEFAULT_CATEGORIES.map((c) => ({ ...c })),
      bills: [
        { id: uid('bill'), name: 'Alquiler / Vivienda', amount: 320000, dueDay: 1, categoryId: 'home', active: true },
        { id: uid('bill'), name: 'Electricidad y Agua (ICE / AyA)', amount: 38000, dueDay: 10, categoryId: 'home', active: true },
        { id: uid('bill'), name: 'Internet Fibra + Celular', amount: 42000, dueDay: 15, categoryId: 'home', active: true },
        { id: uid('bill'), name: 'Gimnasio & Suscripciones', amount: 45000, dueDay: 5, categoryId: 'health', active: true }
      ],
      transactions: [
        { id: uid('tx'), amount: 48500, categoryId: 'groceries', note: 'Auto Mercado semanal', date: safeOffset(1), time: '18:20' },
        { id: uid('tx'), amount: 4200, categoryId: 'dining', note: 'Café Britt & croissant', date: safeOffset(0), time: '09:15' },
        { id: uid('tx'), amount: 22000, categoryId: 'transport', note: 'Gasolina Recope', date: safeOffset(2), time: '14:40' },
        { id: uid('tx'), amount: 18500, categoryId: 'groceries', note: 'Feria del Agricultor', date: safeOffset(4), time: '08:30' },
        { id: uid('tx'), amount: 14800, categoryId: 'health', note: 'Farmacia Fischel', date: safeOffset(5), time: '16:10' },
        { id: uid('tx'), amount: 26500, categoryId: 'fun', note: 'Cena con amigos', date: safeOffset(6), time: '20:45' },
        { id: uid('tx'), amount: 7500, categoryId: 'transport', note: 'Uber aeropuerto / centro', date: safeOffset(8), time: '11:05' },
        { id: uid('tx'), amount: 19900, categoryId: 'shopping', note: 'Camisa & básicos', date: safeOffset(10), time: '15:30' },
        { id: uid('tx'), amount: 9600, categoryId: 'dining', note: 'Almuerzo casado + fresco', date: safeOffset(12), time: '12:45' }
      ]
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return createDemoState();
      const parsed = JSON.parse(raw);
      return {
        ...createDemoState(),
        ...parsed,
        incomeByMode: { monthly: 1200000, quincenal: 600000, ...(parsed.incomeByMode || {}) },
        savingsByMode: { monthly: 200000, quincenal: 100000, ...(parsed.savingsByMode || {}) },
        categories: Array.isArray(parsed.categories) && parsed.categories.length > 0
          ? parsed.categories
          : DEFAULT_CATEGORIES.map((c) => ({ ...c })),
        bills: Array.isArray(parsed.bills) ? parsed.bills : [],
        transactions: Array.isArray(parsed.transactions) ? parsed.transactions : []
      };
    } catch {
      return createDemoState();
    }
  }

  let state = loadState();
  let activeTab = 'spend';
  let keypadDigits = '';
  let activityScope = 'cycle';
  let activityCategoryFilter = 'all';
  let activitySearchQuery = '';
  let lastDeletedTx = null;
  let toastTimer = null;

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors cleanly
    }
  }

  // Cycle Bounds Computation
  function getCycleInfo(now = new Date()) {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let start;
    let end;

    if (state.cycleMode === 'quincenal') {
      const day = today.getDate();
      if (day <= 14) {
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today.getFullYear(), today.getMonth(), 14);
      } else {
        start = new Date(today.getFullYear(), today.getMonth(), 15);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      }
    } else {
      const payday = Math.max(1, Math.min(28, Number(state.paydayDay) || 1));
      if (today.getDate() >= payday) {
        start = new Date(today.getFullYear(), today.getMonth(), payday);
        const nextMonthPayday = new Date(today.getFullYear(), today.getMonth() + 1, payday);
        end = new Date(nextMonthPayday.getFullYear(), nextMonthPayday.getMonth(), nextMonthPayday.getDate() - 1);
      } else {
        start = new Date(today.getFullYear(), today.getMonth() - 1, payday);
        const thisMonthPayday = new Date(today.getFullYear(), today.getMonth(), payday);
        end = new Date(thisMonthPayday.getFullYear(), thisMonthPayday.getMonth(), thisMonthPayday.getDate() - 1);
      }
    }

    const msPerDay = 86400000;
    const totalDays = Math.max(1, Math.round((end - start) / msPerDay) + 1);
    const daysElapsed = Math.max(1, Math.min(totalDays, Math.round((today - start) / msPerDay) + 1));
    const daysRemaining = Math.max(1, Math.round((end - today) / msPerDay) + 1);

    const fmtShort = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const label = `${fmtShort(start)} – ${fmtShort(end)}`;

    return {
      start,
      end,
      startYMD: toLocalYMD(start),
      endYMD: toLocalYMD(end),
      todayYMD: toLocalYMD(today),
      totalDays,
      daysElapsed,
      daysRemaining,
      label
    };
  }

  function computeMetrics() {
    const cycle = getCycleInfo();
    const mode = state.cycleMode;
    const cycleIncome = Number(state.incomeByMode[mode]) || 0;
    const savingsGoal = Number(state.savingsByMode[mode]) || 0;

    const rawActiveBills = state.bills
      .filter((b) => b.active)
      .reduce((acc, b) => acc + (Number(b.amount) || 0), 0);

    // In Quincenal mode, monthly fixed bills are split 50/50 across the two quincenas
    const activeFixedBillsTotal = mode === 'quincenal' ? Math.round(rawActiveBills / 2) : rawActiveBills;

    const disposablePool = cycleIncome - activeFixedBillsTotal - savingsGoal;

    const cycleTransactions = state.transactions.filter(
      (tx) => tx.date >= cycle.startYMD && tx.date <= cycle.endYMD
    );

    const variableSpentThisCycle = cycleTransactions.reduce(
      (acc, tx) => acc + (Number(tx.amount) || 0),
      0
    );

    const safeToSpend = disposablePool - variableSpentThisCycle;
    const safeToday = Math.max(0, Math.round(safeToSpend / cycle.daysRemaining));
    const baselineDailyAllowance = Math.max(0, Math.round(disposablePool / cycle.totalDays));
    const paceDeltaPerDay = safeToday - baselineDailyAllowance;

    const pctLeft = disposablePool > 0
      ? Math.max(0, Math.min(100, Math.round((safeToSpend / disposablePool) * 100)))
      : (safeToSpend > 0 ? 100 : 0);

    const avgDailySpend = Math.round(variableSpentThisCycle / cycle.daysElapsed);

    return {
      cycle,
      mode,
      cycleIncome,
      savingsGoal,
      rawActiveBills,
      activeFixedBillsTotal,
      disposablePool,
      cycleTransactions,
      variableSpentThisCycle,
      safeToSpend,
      safeToday,
      baselineDailyAllowance,
      paceDeltaPerDay,
      pctLeft,
      avgDailySpend
    };
  }

  // DOM References
  const $ = (id) => document.getElementById(id);

  function escapeText(str) {
    return String(str || '');
  }

  function applyThemeAndFrame() {
    document.documentElement.setAttribute('data-theme', state.theme);
    document.documentElement.setAttribute('data-frame', state.frame);

    const isDark = state.theme === 'dark';
    $('meta-theme-color').setAttribute('content', isDark ? '#0b0f14' : '#f3f5f8');

    document.querySelectorAll('.theme-icon').forEach((el) => {
      el.textContent = isDark ? '☀️' : '🌙';
    });
    document.querySelectorAll('.theme-text').forEach((el) => {
      el.textContent = isDark ? 'Light Mode' : 'Dark Mode';
    });

    const isPhone = state.frame === 'phone';
    $('frame-label').textContent = isPhone ? 'Phone Preview' : 'Full Width';
    $('btn-toggle-frame').setAttribute('aria-pressed', String(isPhone));
  }

  function showToast(message, undoTx = null) {
    const toast = $('toast');
    const msgEl = $('toast-message');
    const undoBtn = $('toast-undo-btn');

    msgEl.textContent = message;
    lastDeletedTx = undoTx;
    undoBtn.hidden = !undoTx;
    toast.hidden = false;

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.hidden = true;
      lastDeletedTx = null;
    }, undoTx ? 4500 : 2800);
  }

  function switchTab(tabName) {
    activeTab = tabName;
    const titles = {
      spend: 'Safe to Spend',
      activity: 'Activity',
      plan: 'Budget Plan',
      insights: 'Insights & Tools'
    };
    $('header-title').textContent = titles[tabName] || 'Brim Personal';

    document.querySelectorAll('.tab-panel').forEach((panel) => {
      const match = panel.id === `tab-${tabName}`;
      panel.hidden = !match;
      panel.classList.toggle('active', match);
    });

    document.querySelectorAll('.tab-item').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    $('main-scroll').scrollTop = 0;
    renderAll();
  }

  // Keypad Logic
  function updateKeypadDisplay() {
    const val = keypadDigits ? parseInt(keypadDigits, 10) : 0;
    $('keypad-display').textContent = val.toLocaleString('en-US');
    $('btn-clear-amount').hidden = val === 0;
  }

  function handleKeypadKey(key) {
    if (key === 'back') {
      keypadDigits = keypadDigits.slice(0, -1);
    } else if (key === '000') {
      if (keypadDigits.length > 0 && keypadDigits.length <= 6) {
        keypadDigits += '000';
      }
    } else {
      if (keypadDigits === '0') keypadDigits = '';
      if (keypadDigits.length < 9) {
        keypadDigits += key;
      }
    }
    updateKeypadDisplay();
  }

  function addQuickColones(addAmount) {
    const current = keypadDigits ? parseInt(keypadDigits, 10) : 0;
    const next = Math.min(999999999, current + addAmount);
    keypadDigits = next > 0 ? String(next) : '';
    updateKeypadDisplay();
  }

  function logExpense(categoryId, overrideAmount = null, overrideNote = null, overrideDate = null) {
    const amount = overrideAmount !== null
      ? Math.round(Number(overrideAmount))
      : (keypadDigits ? parseInt(keypadDigits, 10) : 0);

    if (!amount || amount <= 0) {
      const disp = $('keypad-display');
      disp.classList.remove('shake');
      void disp.offsetWidth;
      disp.classList.add('shake');
      showToast('Enter an amount in ₡ first');
      return false;
    }

    const cat = getCategoryById(categoryId);
    const noteRaw = overrideNote !== null ? overrideNote : $('input-expense-note').value.trim();
    const dateVal = overrideDate || $('input-expense-date').value || toLocalYMD(new Date());
    const now = new Date();
    const timeVal = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newTx = {
      id: uid('tx'),
      amount,
      categoryId: cat.id,
      note: noteRaw || cat.fullName,
      date: dateVal,
      time: timeVal
    };

    state.transactions.unshift(newTx);
    saveState();

    if (overrideAmount === null) {
      keypadDigits = '';
      $('input-expense-note').value = '';
      updateKeypadDisplay();
    }

    renderAll();
    showToast(`Logged ${formatCRC(amount)} in ${cat.emoji} ${cat.name}`, newTx);
    return true;
  }

  function deleteTransaction(txId) {
    const idx = state.transactions.findIndex((t) => t.id === txId);
    if (idx === -1) return;
    const [removed] = state.transactions.splice(idx, 1);
    saveState();
    renderAll();
    showToast(`Removed ${formatCRC(removed.amount)}`, removed);
  }

  // DOM Element Builders (Safe textContent usage)
  function createTransactionRow(tx, { allowEdit = true, showDelete = true } = {}) {
    const cat = getCategoryById(tx.categoryId);
    const row = document.createElement('div');
    row.className = allowEdit ? 'tx-row clickable' : 'tx-row';

    const left = document.createElement('div');
    left.className = 'tx-left';

    const icon = document.createElement('div');
    icon.className = 'tx-icon';
    icon.style.background = cat.soft;
    icon.textContent = cat.emoji;

    const info = document.createElement('div');
    info.className = 'tx-info';

    const title = document.createElement('div');
    title.className = 'tx-title';
    title.textContent = escapeText(tx.note || cat.fullName);

    const meta = document.createElement('div');
    meta.className = 'tx-meta';
    meta.textContent = `${cat.name} · ${formatHumanDate(tx.date)}${tx.time ? ` · ${tx.time}` : ''}`;

    info.appendChild(title);
    info.appendChild(meta);
    left.appendChild(icon);
    left.appendChild(info);

    const right = document.createElement('div');
    right.className = 'tx-right';

    const amt = document.createElement('span');
    amt.className = 'tx-amount';
    amt.textContent = formatCRC(-tx.amount);
    right.appendChild(amt);

    if (showDelete) {
      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'tx-del-btn';
      delBtn.title = 'Delete expense';
      delBtn.setAttribute('aria-label', `Delete ${tx.note || cat.name}`);
      delBtn.textContent = '✕';
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteTransaction(tx.id);
      });
      right.appendChild(delBtn);
    }

    row.appendChild(left);
    row.appendChild(right);

    if (allowEdit) {
      row.addEventListener('click', () => openTxEditModal(tx.id));
    }

    return row;
  }

  function formatHumanDate(ymd) {
    const today = toLocalYMD(new Date());
    const yesterday = daysOffsetYMD(1);
    if (ymd === today) return 'Today';
    if (ymd === yesterday) return 'Yesterday';
    const d = parseLocalYMD(ymd);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  // Rendering Functions
  function renderHeader(metrics) {
    $('header-cycle-label').textContent = `${metrics.cycle.label} · ${metrics.cycle.daysRemaining}d left`;
    $('cycle-badge-short').textContent = metrics.mode === 'quincenal' ? '15D' : '1M';
  }

  function renderSpendTab(metrics) {
    const heroAmt = $('hero-safe-amount');
    heroAmt.textContent = formatCRC(metrics.safeToSpend);
    heroAmt.classList.remove('negative', 'warning');
    if (metrics.safeToSpend < 0) {
      heroAmt.classList.add('negative');
    } else if (metrics.pctLeft <= 20) {
      heroAmt.classList.add('warning');
    }

    $('hero-disposable-total').textContent = formatCRC(metrics.disposablePool);
    $('hero-pct-left').textContent = `${metrics.pctLeft}%`;

    const offset = CIRCLE_CIRCUMFERENCE * (1 - metrics.pctLeft / 100);
    const gauge = $('hero-gauge-circle');
    gauge.style.strokeDashoffset = String(offset);

    const barFill = $('hero-bar-fill');
    barFill.style.width = `${metrics.pctLeft}%`;

    const statusColor = metrics.safeToSpend < 0
      ? 'var(--danger)'
      : (metrics.pctLeft <= 20 ? 'var(--amber)' : 'var(--accent)');
    gauge.style.stroke = statusColor;
    barFill.style.background = statusColor;

    $('hero-safe-today').textContent = `${formatCRC(metrics.safeToday)}/d`;
    $('hero-days-left').textContent = `${metrics.cycle.daysRemaining} ${metrics.cycle.daysRemaining === 1 ? 'day' : 'days'}`;

    const pacePill = $('hero-pace-pill');
    const paceVal = $('hero-pace-val');
    pacePill.classList.remove('ahead', 'tight', 'over');

    if (metrics.safeToSpend < 0) {
      pacePill.classList.add('over');
      paceVal.textContent = 'Over budget';
    } else if (metrics.paceDeltaPerDay >= 0) {
      pacePill.classList.add('ahead');
      paceVal.textContent = metrics.paceDeltaPerDay === 0
        ? 'On track'
        : `${formatCRC(metrics.paceDeltaPerDay, { showSign: true, compact: true })}/d`;
    } else {
      pacePill.classList.add('tight');
      paceVal.textContent = `${formatCRC(metrics.paceDeltaPerDay, { showSign: true, compact: true })}/d`;
    }

    // Recent Feed (top 3 sorted newest first)
    const sorted = [...state.transactions].sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return (b.time || '').localeCompare(a.time || '');
    });

    const recentContainer = $('recent-list');
    recentContainer.innerHTML = '';
    if (sorted.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = 'No expenses logged yet. Enter an amount above and tap a category!';
      recentContainer.appendChild(empty);
    } else {
      sorted.slice(0, 3).forEach((tx) => {
        recentContainer.appendChild(createTransactionRow(tx));
      });
    }
  }

  function renderActivityTab(metrics) {
    // Filter pills
    const pillsWrap = $('activity-cat-filters');
    pillsWrap.innerHTML = '';

    const allPill = document.createElement('button');
    allPill.type = 'button';
    allPill.className = `filter-pill ${activityCategoryFilter === 'all' ? 'active' : ''}`;
    allPill.textContent = 'All';
    allPill.addEventListener('click', () => {
      activityCategoryFilter = 'all';
      renderActivityTab(computeMetrics());
    });
    pillsWrap.appendChild(allPill);

    state.categories.forEach((cat) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `filter-pill ${activityCategoryFilter === cat.id ? 'active' : ''}`;
      btn.textContent = `${cat.emoji} ${cat.name}`;
      btn.addEventListener('click', () => {
        activityCategoryFilter = cat.id;
        renderActivityTab(computeMetrics());
      });
      pillsWrap.appendChild(btn);
    });

    const query = activitySearchQuery.trim().toLowerCase();
    const baseList = activityScope === 'cycle' ? metrics.cycleTransactions : state.transactions;

    const filtered = baseList
      .filter((tx) => {
        if (activityCategoryFilter !== 'all' && tx.categoryId !== activityCategoryFilter) return false;
        if (query) {
          const cat = getCategoryById(tx.categoryId);
          const haystack = `${tx.note || ''} ${cat ? cat.name + ' ' + cat.fullName : ''}`.toLowerCase();
          if (!haystack.includes(query)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        return (b.time || '').localeCompare(a.time || '');
      });

    const total = filtered.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
    $('activity-count-label').textContent = `${filtered.length} ${filtered.length === 1 ? 'expense' : 'expenses'}`;
    $('activity-total-label').textContent = formatCRC(total);

    const groupsWrap = $('activity-groups');
    groupsWrap.innerHTML = '';

    if (filtered.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'card empty-state';
      empty.textContent = 'No matching expenses found.';
      groupsWrap.appendChild(empty);
      return;
    }

    const grouped = new Map();
    filtered.forEach((tx) => {
      if (!grouped.has(tx.date)) grouped.set(tx.date, []);
      grouped.get(tx.date).push(tx);
    });

    grouped.forEach((txs, dateKey) => {
      const section = document.createElement('div');
      const dayTotal = txs.reduce((s, t) => s + (Number(t.amount) || 0), 0);

      const hdr = document.createElement('div');
      hdr.className = 'date-group-header';
      const left = document.createElement('span');
      left.textContent = formatHumanDate(dateKey);
      const right = document.createElement('span');
      right.textContent = formatCRC(dayTotal);
      hdr.appendChild(left);
      hdr.appendChild(right);

      const list = document.createElement('div');
      list.className = 'tx-list';
      txs.forEach((tx) => list.appendChild(createTransactionRow(tx)));

      section.appendChild(hdr);
      section.appendChild(list);
      groupsWrap.appendChild(section);
    });
  }

  function renderPlanTab(metrics) {
    const isQuincenal = metrics.mode === 'quincenal';
    $('plan-cycle-badge').textContent = isQuincenal ? 'Quincenal (50% bills)' : 'Monthly';
    $('btn-mode-monthly').classList.toggle('active', !isQuincenal);
    $('btn-mode-quincenal').classList.toggle('active', isQuincenal);
    $('payday-row').hidden = isQuincenal;

    $('label-income').textContent = isQuincenal ? 'Quincenal Income (₡)' : 'Monthly Income (₡)';
    $('label-savings').textContent = isQuincenal ? 'Savings / Quincena (₡)' : 'Monthly Savings Goal (₡)';

    const paydayInput = $('input-payday');
    if (document.activeElement !== paydayInput) paydayInput.value = state.paydayDay;

    const incInput = $('input-income');
    if (document.activeElement !== incInput) incInput.value = metrics.cycleIncome;

    const savInput = $('input-savings');
    if (document.activeElement !== savInput) savInput.value = metrics.savingsGoal;

    // Waterfall Bar
    const denom = Math.max(1, metrics.cycleIncome, metrics.activeFixedBillsTotal + metrics.savingsGoal + metrics.variableSpentThisCycle);
    const segments = [
      { label: 'Fixed Bills', value: metrics.activeFixedBillsTotal, color: '#3b82f6' },
      { label: 'Savings', value: metrics.savingsGoal, color: '#8b5cf6' },
      { label: 'Spent', value: metrics.variableSpentThisCycle, color: '#f59e0b' },
      { label: 'Safe Left', value: Math.max(0, metrics.safeToSpend), color: '#10b981' }
    ];

    const wfBar = $('waterfall-bar');
    wfBar.innerHTML = '';
    const wfLegend = $('waterfall-legend');
    wfLegend.innerHTML = '';

    segments.forEach((seg) => {
      const pct = Math.max(0, (seg.value / denom) * 100);
      if (pct > 0) {
        const div = document.createElement('div');
        div.className = 'wf-seg';
        div.style.width = `${pct}%`;
        div.style.background = seg.color;
        div.title = `${seg.label}: ${formatCRC(seg.value)}`;
        wfBar.appendChild(div);
      }

      const item = document.createElement('div');
      item.className = 'wf-item';
      const lw = document.createElement('div');
      lw.className = 'wf-label-wrap';
      const dot = document.createElement('span');
      dot.className = 'wf-dot';
      dot.style.background = seg.color;
      const lbl = document.createElement('span');
      lbl.textContent = seg.label;
      lw.appendChild(dot);
      lw.appendChild(lbl);

      const val = document.createElement('strong');
      val.textContent = formatCRC(seg.value, { compact: true });
      item.appendChild(lw);
      item.appendChild(val);
      wfLegend.appendChild(item);
    });

    // Spending Categories List
    renderPlanCategoriesList();

    // Fixed Bills List
    $('plan-bills-total').textContent = isQuincenal
      ? `${formatCRC(metrics.activeFixedBillsTotal)} / quincena (${formatCRC(metrics.rawActiveBills)}/mo)`
      : formatCRC(metrics.activeFixedBillsTotal);

    const billsWrap = $('bills-list');
    billsWrap.innerHTML = '';

    if (state.bills.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = 'No recurring bills yet. Add rent, utilities, or subscriptions.';
      billsWrap.appendChild(empty);
      return;
    }

    state.bills.forEach((bill) => {
      const cat = getCategoryById(bill.categoryId);
      const row = document.createElement('div');
      row.className = `bill-row ${bill.active ? '' : 'paused'}`;

      const left = document.createElement('div');
      left.className = 'bill-left';
      left.addEventListener('click', () => openBillModal(bill.id));

      const icon = document.createElement('div');
      icon.className = 'tx-icon';
      icon.style.background = cat.soft;
      icon.textContent = cat.emoji;

      const info = document.createElement('div');
      info.className = 'tx-info';
      const title = document.createElement('div');
      title.className = 'tx-title';
      title.textContent = bill.name;
      const meta = document.createElement('div');
      meta.className = 'tx-meta';
      meta.textContent = `Due day ${bill.dueDay} · ${formatCRC(bill.amount)}/mo`;

      info.appendChild(title);
      info.appendChild(meta);
      left.appendChild(icon);
      left.appendChild(info);

      const right = document.createElement('div');
      right.className = 'bill-right';

      const switchLbl = document.createElement('label');
      switchLbl.className = 'ios-switch';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = bill.active;
      cb.setAttribute('aria-label', `Toggle ${bill.name}`);
      cb.addEventListener('change', () => {
        bill.active = cb.checked;
        saveState();
        renderAll();
      });
      const slider = document.createElement('span');
      slider.className = 'ios-slider';
      switchLbl.appendChild(cb);
      switchLbl.appendChild(slider);

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'tx-del-btn';
      delBtn.title = 'Delete bill';
      delBtn.textContent = '✕';
      delBtn.addEventListener('click', () => {
        state.bills = state.bills.filter((b) => b.id !== bill.id);
        saveState();
        renderAll();
        showToast(`Deleted bill "${bill.name}"`);
      });

      right.appendChild(switchLbl);
      right.appendChild(delBtn);
      row.appendChild(left);
      row.appendChild(right);
      billsWrap.appendChild(row);
    });
  }

  function renderInsightsTab(metrics) {
    // KPI Summary
    const projectedSavings = metrics.savingsGoal + Math.max(0, metrics.safeToSpend);
    const savingsRate = metrics.cycleIncome > 0
      ? Math.round((projectedSavings / metrics.cycleIncome) * 100)
      : 0;
    const fixedRatio = metrics.cycleIncome > 0
      ? Math.round((metrics.activeFixedBillsTotal / metrics.cycleIncome) * 100)
      : 0;

    $('insight-savings-rate').textContent = `${savingsRate}%`;
    $('insight-savings-sub').textContent = formatCRC(projectedSavings, { compact: true });
    $('insight-fixed-ratio').textContent = `${fixedRatio}%`;
    $('insight-avg-daily').textContent = formatCRC(metrics.avgDailySpend);
    $('insight-avg-sub').textContent = `over ${metrics.cycle.daysElapsed}d elapsed`;

    // Category Breakdown Chart
    $('insight-cat-total').textContent = formatCRC(metrics.variableSpentThisCycle);
    const catWrap = $('chart-categories');
    catWrap.innerHTML = '';

    const totalsByCat = {};
    metrics.cycleTransactions.forEach((tx) => {
      totalsByCat[tx.categoryId] = (totalsByCat[tx.categoryId] || 0) + (Number(tx.amount) || 0);
    });

    const catEntries = Object.entries(totalsByCat)
      .map(([id, total]) => ({ cat: getCategoryById(id), total }))
      .sort((a, b) => b.total - a.total);

    if (catEntries.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = 'No variable spending in this cycle yet.';
      catWrap.appendChild(empty);
    } else {
      const maxCat = catEntries[0].total || 1;
      catEntries.forEach(({ cat, total }) => {
        const pctOfSpent = metrics.variableSpentThisCycle > 0
          ? Math.round((total / metrics.variableSpentThisCycle) * 100)
          : 0;
        const barWidth = Math.max(4, Math.round((total / maxCat) * 100));

        const item = document.createElement('div');
        item.className = 'cat-bar-item';

        const top = document.createElement('div');
        top.className = 'cat-bar-top';
        const lbl = document.createElement('span');
        lbl.textContent = `${cat.emoji} ${cat.fullName}`;
        const val = document.createElement('strong');
        val.textContent = `${formatCRC(total)} (${pctOfSpent}%)`;
        top.appendChild(lbl);
        top.appendChild(val);

        const track = document.createElement('div');
        track.className = 'cat-bar-track';
        const fill = document.createElement('div');
        fill.className = 'cat-bar-fill';
        fill.style.width = `${barWidth}%`;
        fill.style.background = cat.color;
        track.appendChild(fill);

        item.appendChild(top);
        item.appendChild(track);
        catWrap.appendChild(item);
      });
    }

    // Daily Spending Rhythm (last 10 days or elapsed days up to 12)
    $('insight-daily-target').textContent = `Target ≤ ${formatCRC(metrics.baselineDailyAllowance)}/d`;
    const rhythmWrap = $('chart-daily-rhythm');
    rhythmWrap.innerHTML = '';

    const numDaysToShow = Math.min(12, Math.max(7, metrics.cycle.daysElapsed));
    const daySums = [];
    for (let i = numDaysToShow - 1; i >= 0; i--) {
      const ymd = daysOffsetYMD(i);
      const sum = state.transactions
        .filter((t) => t.date === ymd)
        .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
      const d = parseLocalYMD(ymd);
      daySums.push({ ymd, dayNum: d.getDate(), sum });
    }

    const maxDayVal = Math.max(
      metrics.baselineDailyAllowance * 1.35,
      ...daySums.map((d) => d.sum),
      1000
    );

    if (metrics.baselineDailyAllowance > 0) {
      const targetPct = Math.min(92, Math.round((metrics.baselineDailyAllowance / maxDayVal) * 100));
      const line = document.createElement('div');
      line.className = 'rhythm-target-line';
      line.style.bottom = `${20 + (targetPct * 0.94)}px`;
      rhythmWrap.appendChild(line);
    }

    daySums.forEach((d) => {
      const col = document.createElement('div');
      col.className = 'rhythm-col';
      col.title = `${formatHumanDate(d.ymd)}: ${formatCRC(d.sum)}`;

      const bar = document.createElement('div');
      const heightPct = d.sum > 0 ? Math.max(8, Math.round((d.sum / maxDayVal) * 100)) : 4;
      bar.className = `rhythm-bar ${d.sum === 0 ? 'empty' : (d.sum > metrics.baselineDailyAllowance ? 'over' : '')}`;
      bar.style.height = `${heightPct}%`;

      const lbl = document.createElement('span');
      lbl.className = 'rhythm-lbl';
      lbl.textContent = String(d.dayNum);

      col.appendChild(bar);
      col.appendChild(lbl);
      rhythmWrap.appendChild(col);
    });

    // Top 5 Expenses
    const topWrap = $('insight-top-expenses');
    topWrap.innerHTML = '';
    const topFive = [...metrics.cycleTransactions]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    if (topFive.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = 'Log expenses to see your top drains.';
      topWrap.appendChild(empty);
    } else {
      topFive.forEach((tx) => topWrap.appendChild(createTransactionRow(tx)));
    }

    // Live iOS Widget Previews
    $('widget-small-safe').textContent = formatCRC(metrics.safeToSpend, { compact: false });
    $('widget-small-daily').textContent = `${formatCRC(metrics.safeToday)}/d`;
    $('widget-small-days').textContent = `${metrics.cycle.daysRemaining}d left`;

    $('widget-med-daily').textContent = formatCRC(metrics.safeToday);
    $('widget-med-pace').textContent = metrics.safeToSpend < 0
      ? 'Over budget'
      : (metrics.paceDeltaPerDay >= 0 ? 'Ahead of pace' : 'Tight pace');
    $('widget-med-safe').textContent = formatCRC(metrics.safeToSpend);
    $('widget-med-spent').textContent = formatCRC(metrics.variableSpentThisCycle);

    // Shortcut Template URL
    const baseUrl = window.location.origin === 'null'
      ? 'https://your-brim-app.local/'
      : `${window.location.origin}${window.location.pathname}`;
    $('shortcut-template-url').textContent = `${baseUrl}?amount=[Amount]&category=dining&note=[Merchant]`;
  }

  function renderCategoryButtonsAndSelects() {
    const catGrid = $('category-grid');
    catGrid.innerHTML = '';
    state.categories.forEach((cat) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cat-btn';
      btn.dataset.category = cat.id;

      const emojiSpan = document.createElement('span');
      emojiSpan.className = 'cat-emoji';
      emojiSpan.textContent = cat.emoji;

      const nameSpan = document.createElement('span');
      nameSpan.className = 'cat-name';
      nameSpan.textContent = cat.name;

      btn.appendChild(emojiSpan);
      btn.appendChild(nameSpan);
      btn.addEventListener('click', () => logExpense(cat.id));
      catGrid.appendChild(btn);
    });

    populateCategorySelect($('bill-category'));
    populateCategorySelect($('tx-category'));
  }

  function renderPlanCategoriesList() {
    const listWrap = $('plan-categories-list');
    if (!listWrap) return;
    listWrap.innerHTML = '';

    state.categories.forEach((cat, idx) => {
      const row = document.createElement('div');
      row.className = 'cat-manage-row';
      row.addEventListener('click', () => openCategoryModal(cat.id));

      const left = document.createElement('div');
      left.className = 'cat-manage-left';

      const icon = document.createElement('div');
      icon.className = 'tx-icon';
      icon.style.background = hexToRgba(cat.color, 0.16);
      icon.textContent = cat.emoji;

      const info = document.createElement('div');
      info.className = 'tx-info';

      const title = document.createElement('div');
      title.className = 'tx-title';
      title.textContent = cat.name;

      const meta = document.createElement('div');
      meta.className = 'tx-meta';
      meta.textContent = cat.fullName;

      info.appendChild(title);
      info.appendChild(meta);
      left.appendChild(icon);
      left.appendChild(info);

      const actions = document.createElement('div');
      actions.className = 'cat-manage-actions';

      const orderBtns = document.createElement('div');
      orderBtns.className = 'cat-order-btns';

      const upBtn = document.createElement('button');
      upBtn.type = 'button';
      upBtn.className = 'order-btn';
      upBtn.textContent = '↑';
      upBtn.title = 'Move up';
      upBtn.disabled = idx === 0;
      upBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        moveCategory(idx, -1);
      });

      const downBtn = document.createElement('button');
      downBtn.type = 'button';
      downBtn.className = 'order-btn';
      downBtn.textContent = '↓';
      downBtn.title = 'Move down';
      downBtn.disabled = idx === state.categories.length - 1;
      downBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        moveCategory(idx, 1);
      });

      orderBtns.appendChild(upBtn);
      orderBtns.appendChild(downBtn);
      actions.appendChild(orderBtns);

      row.appendChild(left);
      row.appendChild(actions);
      listWrap.appendChild(row);
    });
  }

  function moveCategory(index, delta) {
    const target = index + delta;
    if (target < 0 || target >= state.categories.length) return;
    const [item] = state.categories.splice(index, 1);
    state.categories.splice(target, 0, item);
    saveState();
    renderAll();
  }

  function renderAll() {
    renderCategoryButtonsAndSelects();
    const metrics = computeMetrics();
    renderHeader(metrics);
    renderSpendTab(metrics);
    if (activeTab === 'activity') renderActivityTab(metrics);
    if (activeTab === 'plan') renderPlanTab(metrics);
    if (activeTab === 'insights') renderInsightsTab(metrics);
  }

  // Modals
  function populateCategorySelect(selectEl) {
    const previousValue = selectEl.value;
    selectEl.innerHTML = '';
    state.categories.forEach((cat) => {
      const opt = document.createElement('option');
      opt.value = cat.id;
      opt.textContent = `${cat.emoji} ${cat.fullName}`;
      selectEl.appendChild(opt);
    });
    if (previousValue && state.categories.some((c) => c.id === previousValue)) {
      selectEl.value = previousValue;
    }
  }

  function syncCategoryPickerHighlights() {
    const currentEmoji = $('cat-emoji').value.trim();
    const currentColor = $('cat-color').value.toLowerCase();

    document.querySelectorAll('#cat-emoji-presets .emoji-preset-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.emoji === currentEmoji);
    });
    document.querySelectorAll('#cat-color-swatches .color-swatch-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.color.toLowerCase() === currentColor);
    });
  }

  function openCategoryModal(catId = null) {
    const existing = catId ? state.categories.find((c) => c.id === catId) : null;
    $('dialog-cat-title').textContent = existing ? 'Edit Category' : 'New Category';
    $('cat-edit-id').value = existing ? existing.id : '';
    $('cat-emoji').value = existing ? existing.emoji : '✨';
    $('cat-name').value = existing ? existing.name : '';
    $('cat-fullname').value = existing ? existing.fullName : '';
    $('cat-color').value = existing ? existing.color : COLOR_SWATCHES[0];
    $('btn-delete-category').hidden = !existing || state.categories.length <= 1;
    syncCategoryPickerHighlights();
    $('dialog-category').showModal();
  }

  function openBillModal(billId = null) {
    const dialog = $('dialog-bill');
    const existing = billId ? state.bills.find((b) => b.id === billId) : null;
    $('dialog-bill-title').textContent = existing ? 'Edit Recurring Bill' : 'New Recurring Bill';
    $('bill-edit-id').value = existing ? existing.id : '';
    $('bill-name').value = existing ? existing.name : '';
    $('bill-amount').value = existing ? existing.amount : '';
    $('bill-day').value = existing ? existing.dueDay : 1;
    const fallbackCat = state.categories[0]?.id || 'other';
    $('bill-category').value = existing ? getCategoryById(existing.categoryId).id : (state.categories.some((c) => c.id === 'home') ? 'home' : fallbackCat);
    dialog.showModal();
  }

  function openTxEditModal(txId) {
    const tx = state.transactions.find((t) => t.id === txId);
    if (!tx) return;
    $('tx-edit-id').value = tx.id;
    $('tx-amount').value = tx.amount;
    $('tx-category').value = getCategoryById(tx.categoryId).id;
    $('tx-note').value = tx.note || '';
    $('tx-date').value = tx.date;
    $('dialog-tx').showModal();
  }

  // Exports & Import
  function downloadFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function exportCSV() {
    const headers = ['id', 'date', 'time', 'category', 'amount_crc', 'note'];
    const rows = state.transactions.map((tx) => {
      const cat = getCategoryById(tx.categoryId).fullName;
      const safeNote = `"${String(tx.note || '').replace(/"/g, '""')}"`;
      return [tx.id, tx.date, tx.time || '', `"${cat}"`, tx.amount, safeNote].join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    downloadFile(`brim-personal-crc-${toLocalYMD(new Date())}.csv`, csv, 'text/csv;charset=utf-8;');
    showToast('Exported CSV file');
  }

  function exportJSON() {
    downloadFile(`brim-personal-backup-${toLocalYMD(new Date())}.json`, JSON.stringify(state, null, 2), 'application/json');
    showToast('Exported JSON backup');
  }

  // Check URL Query Parameters for Apple Pay / iOS Shortcuts Auto-Log
  function processShortcutQueryHook() {
    const params = new URLSearchParams(window.location.search);
    const rawAmt = params.get('amount');
    if (!rawAmt) return;

    const cleanAmt = Number(String(rawAmt).replace(/[^\d.]/g, ''));
    const rawCat = (params.get('category') || 'other').toLowerCase().trim();
    const matchedCat = state.categories.find((c) => c.id === rawCat || c.name.toLowerCase() === rawCat);
    const catId = matchedCat ? matchedCat.id : getCategoryById('other').id;
    const note = params.get('note') || params.get('merchant') || 'Apple Pay';

    if (cleanAmt > 0) {
      logExpense(catId, cleanAmt, note, toLocalYMD(new Date()));
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }

  // Initialization & Event Wiring
  function init() {
    applyThemeAndFrame();
    $('input-expense-date').value = toLocalYMD(new Date());

    // Build Emoji Presets & Color Swatches in Category Dialog
    const emojiPresetsEl = $('cat-emoji-presets');
    EMOJI_PRESETS.forEach((em) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'emoji-preset-btn';
      btn.dataset.emoji = em;
      btn.textContent = em;
      btn.addEventListener('click', () => {
        $('cat-emoji').value = em;
        syncCategoryPickerHighlights();
      });
      emojiPresetsEl.appendChild(btn);
    });

    const colorSwatchesEl = $('cat-color-swatches');
    COLOR_SWATCHES.forEach((hex) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'color-swatch-btn';
      btn.dataset.color = hex;
      btn.style.background = hex;
      btn.setAttribute('aria-label', `Color ${hex}`);
      btn.addEventListener('click', () => {
        $('cat-color').value = hex;
        syncCategoryPickerHighlights();
      });
      colorSwatchesEl.appendChild(btn);
    });

    $('cat-emoji').addEventListener('input', syncCategoryPickerHighlights);
    $('cat-color').addEventListener('input', syncCategoryPickerHighlights);

    $('btn-edit-categories-shortcut').addEventListener('click', () => {
      switchTab('plan');
      requestAnimationFrame(() => {
        $('plan-categories-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    // Keypad
    document.querySelectorAll('.key-btn').forEach((btn) => {
      btn.addEventListener('click', () => handleKeypadKey(btn.dataset.key));
    });

    // Quick CRC Chips
    document.querySelectorAll('.chip-btn').forEach((btn) => {
      btn.addEventListener('click', () => addQuickColones(Number(btn.dataset.add)));
    });

    $('btn-clear-amount').addEventListener('click', () => {
      keypadDigits = '';
      updateKeypadDisplay();
    });

    // Physical Keyboard Support on Spend Tab
    document.addEventListener('keydown', (e) => {
      if (activeTab !== 'spend') return;
      if (document.querySelector('dialog[open]')) return;
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;

      if (e.key >= '0' && e.key <= '9') {
        handleKeypadKey(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleKeypadKey('back');
      } else if (e.key === 'Escape') {
        keypadDigits = '';
        updateKeypadDisplay();
      }
    });

    // Tab Navigation
    document.querySelectorAll('.tab-item').forEach((btn) => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    $('btn-see-all-activity').addEventListener('click', () => switchTab('activity'));

    // Theme & Frame Toggles
    const toggleTheme = () => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      saveState();
      applyThemeAndFrame();
    };
    $('btn-toggle-theme').addEventListener('click', toggleTheme);
    $('btn-toggle-theme-desktop').addEventListener('click', toggleTheme);

    $('btn-toggle-frame').addEventListener('click', () => {
      state.frame = state.frame === 'phone' ? 'full' : 'phone';
      saveState();
      applyThemeAndFrame();
    });

    // Quick Cycle Toggle in Header
    $('btn-cycle-quick-toggle').addEventListener('click', () => {
      state.cycleMode = state.cycleMode === 'monthly' ? 'quincenal' : 'monthly';
      saveState();
      renderAll();
      showToast(state.cycleMode === 'quincenal' ? 'Switched to Quincenal (1st & 15th)' : 'Switched to Monthly cycle');
    });

    // Toast Undo
    $('toast-undo-btn').addEventListener('click', () => {
      if (!lastDeletedTx) return;
      const existingIdx = state.transactions.findIndex((t) => t.id === lastDeletedTx.id);
      if (existingIdx !== -1) {
        // Undo an addition
        state.transactions.splice(existingIdx, 1);
      } else {
        // Undo a deletion
        state.transactions.unshift(lastDeletedTx);
      }
      lastDeletedTx = null;
      $('toast').hidden = true;
      saveState();
      renderAll();
    });

    // Activity Controls
    $('activity-search').addEventListener('input', (e) => {
      activitySearchQuery = e.target.value;
      renderActivityTab(computeMetrics());
    });
    $('scope-cycle-btn').addEventListener('click', () => {
      activityScope = 'cycle';
      $('scope-cycle-btn').classList.add('active');
      $('scope-all-btn').classList.remove('active');
      renderActivityTab(computeMetrics());
    });
    $('scope-all-btn').addEventListener('click', () => {
      activityScope = 'all';
      $('scope-all-btn').classList.add('active');
      $('scope-cycle-btn').classList.remove('active');
      renderActivityTab(computeMetrics());
    });

    // Plan Controls
    $('btn-mode-monthly').addEventListener('click', () => {
      state.cycleMode = 'monthly';
      saveState();
      renderAll();
    });
    $('btn-mode-quincenal').addEventListener('click', () => {
      state.cycleMode = 'quincenal';
      saveState();
      renderAll();
    });
    $('input-payday').addEventListener('input', (e) => {
      const val = Math.max(1, Math.min(28, Number(e.target.value) || 1));
      state.paydayDay = val;
      saveState();
      renderAll();
    });
    $('input-income').addEventListener('input', (e) => {
      const val = Math.max(0, Number(e.target.value) || 0);
      state.incomeByMode[state.cycleMode] = val;
      saveState();
      renderAll();
    });
    $('input-savings').addEventListener('input', (e) => {
      const val = Math.max(0, Number(e.target.value) || 0);
      state.savingsByMode[state.cycleMode] = val;
      saveState();
      renderAll();
    });

    // Bill Modal
    $('btn-open-bill-modal').addEventListener('click', () => openBillModal(null));
    $('btn-close-bill-dialog').addEventListener('click', () => $('dialog-bill').close());
    $('btn-cancel-bill').addEventListener('click', () => $('dialog-bill').close());
    $('form-bill').addEventListener('submit', (e) => {
      e.preventDefault();
      const editId = $('bill-edit-id').value;
      const name = $('bill-name').value.trim();
      const amount = Math.max(1, Math.round(Number($('bill-amount').value) || 0));
      const dueDay = Math.max(1, Math.min(31, Math.round(Number($('bill-day').value) || 1)));
      const categoryId = $('bill-category').value;

      if (!name) return;

      if (editId) {
        const bill = state.bills.find((b) => b.id === editId);
        if (bill) {
          bill.name = name;
          bill.amount = amount;
          bill.dueDay = dueDay;
          bill.categoryId = categoryId;
        }
      } else {
        state.bills.push({ id: uid('bill'), name, amount, dueDay, categoryId, active: true });
      }
      saveState();
      $('dialog-bill').close();
      renderAll();
      showToast(`Saved bill "${name}"`);
    });

    // Category Modal
    $('btn-open-category-modal').addEventListener('click', () => openCategoryModal(null));
    $('btn-close-cat-dialog').addEventListener('click', () => $('dialog-category').close());
    $('btn-cancel-category').addEventListener('click', () => $('dialog-category').close());

    $('form-category').addEventListener('submit', (e) => {
      e.preventDefault();
      const editId = $('cat-edit-id').value;
      const emoji = $('cat-emoji').value.trim() || '✨';
      const name = $('cat-name').value.trim();
      const fullName = $('cat-fullname').value.trim() || name;
      const color = $('cat-color').value || '#10b981';

      if (!name) return;

      if (editId) {
        const cat = state.categories.find((c) => c.id === editId);
        if (cat) {
          cat.emoji = emoji;
          cat.name = name;
          cat.fullName = fullName;
          cat.color = color;
        }
      } else {
        state.categories.push({ id: uid('cat'), name, fullName, emoji, color });
      }
      saveState();
      $('dialog-category').close();
      renderAll();
      showToast(`Saved category ${emoji} ${name}`);
    });

    $('btn-delete-category').addEventListener('click', () => {
      if (state.categories.length <= 1) return;
      const id = $('cat-edit-id').value;
      const target = state.categories.find((c) => c.id === id);
      if (!target) return;

      state.categories = state.categories.filter((c) => c.id !== id);
      const fallbackId = (state.categories.find((c) => c.id === 'other') || state.categories[0]).id;

      state.transactions.forEach((tx) => {
        if (tx.categoryId === id) tx.categoryId = fallbackId;
      });
      state.bills.forEach((b) => {
        if (b.categoryId === id) b.categoryId = fallbackId;
      });
      if (activityCategoryFilter === id) activityCategoryFilter = 'all';

      saveState();
      $('dialog-category').close();
      renderAll();
      showToast(`Removed category "${target.name}"`);
    });

    // Transaction Edit Modal
    $('btn-close-tx-dialog').addEventListener('click', () => $('dialog-tx').close());
    $('btn-cancel-tx').addEventListener('click', () => $('dialog-tx').close());
    $('btn-delete-tx').addEventListener('click', () => {
      const id = $('tx-edit-id').value;
      $('dialog-tx').close();
      deleteTransaction(id);
    });
    $('form-tx').addEventListener('submit', (e) => {
      e.preventDefault();
      const id = $('tx-edit-id').value;
      const tx = state.transactions.find((t) => t.id === id);
      if (tx) {
        tx.amount = Math.max(1, Math.round(Number($('tx-amount').value) || tx.amount));
        tx.categoryId = $('tx-category').value;
        tx.note = $('tx-note').value.trim() || getCategoryById(tx.categoryId).fullName;
        tx.date = $('tx-date').value || tx.date;
        saveState();
        renderAll();
        showToast('Updated expense');
      }
      $('dialog-tx').close();
    });

    // Insights Tools: Shortcut, Export, Import, Reset
    $('btn-copy-shortcut').addEventListener('click', async () => {
      const txt = $('shortcut-template-url').textContent;
      try {
        await navigator.clipboard.writeText(txt);
        showToast('Copied iOS Shortcut URL template');
      } catch {
        showToast('Select & copy the URL shown above');
      }
    });

    $('btn-test-shortcut').addEventListener('click', () => {
      logExpense('dining', 4500, 'Apple Pay: Café Test', toLocalYMD(new Date()));
      switchTab('spend');
    });

    $('btn-export-csv').addEventListener('click', exportCSV);
    $('btn-export-json').addEventListener('click', exportJSON);

    $('input-import-json').addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const imported = JSON.parse(String(reader.result));
          if (!Array.isArray(imported.transactions) || !Array.isArray(imported.bills)) {
            throw new Error('Invalid backup format');
          }
          state = {
            ...state,
            ...imported,
            categories: Array.isArray(imported.categories) && imported.categories.length > 0
              ? imported.categories
              : state.categories
          };
          saveState();
          applyThemeAndFrame();
          renderAll();
          showToast('Restored JSON backup');
        } catch {
          showToast('Invalid JSON backup file');
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    });

    $('btn-restore-demo').addEventListener('click', () => {
      const theme = state.theme;
      const frame = state.frame;
      state = createDemoState();
      state.theme = theme;
      state.frame = frame;
      saveState();
      renderAll();
      showToast('Loaded CRC demo dataset');
    });

    // Reset Modal
    $('btn-open-reset-modal').addEventListener('click', () => $('dialog-reset').showModal());
    $('btn-close-reset-dialog').addEventListener('click', () => $('dialog-reset').close());
    $('btn-cancel-reset').addEventListener('click', () => $('dialog-reset').close());

    $('btn-reset-keep-bills').addEventListener('click', () => {
      state.transactions = [];
      saveState();
      $('dialog-reset').close();
      renderAll();
      showToast('Cleared expenses (kept fixed bills)');
    });

    $('btn-reset-all').addEventListener('click', () => {
      state.transactions = [];
      state.bills = [];
      saveState();
      $('dialog-reset').close();
      renderAll();
      showToast('Cleared all expenses and bills');
    });

    // Light dismiss on backdrop clicks for native dialogs
    document.querySelectorAll('dialog.ios-dialog').forEach((dlg) => {
      dlg.addEventListener('click', (e) => {
        if (e.target === dlg) dlg.close();
      });
    });

    // Register Service Worker if supported over HTTP(S)
    if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }

    updateKeypadDisplay();
    renderAll();
    processShortcutQueryHook();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
