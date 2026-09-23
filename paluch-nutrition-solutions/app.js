(function () {
  'use strict';
  var KEY = 'paluch-nutrition.v1';
  var state = { version: 1, food: [], recipes: [], shopping: [], meals: [], preferences: {} };
  var storageBlocked = false;
  var foodLocation = 'Refrigerator';
  var selectedDate = dateKey(new Date());
  var month = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  function el(id) { return document.getElementById(id); }
  function each(selector, fn) { Array.prototype.forEach.call(document.querySelectorAll(selector), fn); }
  function dateKey(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function pad(n) { return n < 10 ? '0' + n : String(n); }
  function parseDate(s) { var p = s.split('-'); return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2])); }
  function validDate(s) { return /^\d{4}-\d{2}-\d{2}$/.test(s) && dateKey(parseDate(s)) === s; }
  function id() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function notice(text, error) { el('message').textContent = text; el('message').className = error ? 'error' : ''; }
  try {
    var saved = localStorage.getItem(KEY);
    if (saved) {
      var candidate = JSON.parse(saved);
      if (candidate.version !== 1 || !Array.isArray(candidate.food) || !Array.isArray(candidate.recipes) || !Array.isArray(candidate.shopping) || !Array.isArray(candidate.meals)) throw new Error('Unsupported saved data');
      state = candidate;
      state.preferences = state.preferences || {};
    }
  } catch (error) {
    storageBlocked = true;
    notice('Saved data could not be loaded. Changes cannot be saved. Reload or check browser storage before adding entries.', true);
  }
  // Replace this storage adapter with a server API when the Odroid backend is added.
  // Roll back failed writes so the UI never reports an unsaved change as saved.
  function update(change, success) {
    if (storageBlocked) { notice('Browser storage is unavailable. Your change was not saved.', true); return false; }
    var before = JSON.stringify(state);
    try {
      change();
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (error) {
      state = JSON.parse(before);
      notice('Your change could not be saved. Browser storage may be full or unavailable.', true);
      return false;
    }
    renderAll();
    notice(success || 'Saved on this browser.');
    return true;
  }
  function find(list, value) { for (var i = 0; i < list.length; i++) if (list[i].id === value) return list[i]; return null; }
  function replace(list, item) { for (var i = 0; i < list.length; i++) if (list[i].id === item.id) { list[i] = item; return; } list.push(item); }
  function remove(list, value) { for (var i = list.length - 1; i >= 0; i--) if (list[i].id === value) list.splice(i, 1); }
  function empty(text) { return '<div class="empty"><p>' + esc(text) + '</p></div>'; }
  function actions(kind, value) { return '<div class="row-actions"><button class="small" data-edit="' + kind + '" data-id="' + esc(value) + '">Edit</button><button class="small danger" data-delete="' + kind + '" data-id="' + esc(value) + '">Delete</button></div>'; }
  function showPage(page) {
    each('[data-page]', function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-page') === page)); });
    each('[data-panel]', function (p) { p.hidden = p.getAttribute('data-panel') !== page; });
  }
  function showFood(location) {
    foodLocation = location;
    each('[data-food]', function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-food') === location)); });
    el('food-add').hidden = location !== 'add'; el('inventory-view').hidden = location === 'add';
    renderFood();
  }
  each('[data-page]', function (b) { b.onclick = function () { showPage(b.getAttribute('data-page')); }; });
  each('[data-food]', function (b) { b.onclick = function () { showFood(b.getAttribute('data-food')); }; });
  each('[data-recipe]', function (b) { b.onclick = function () {
    var which = b.getAttribute('data-recipe');
    each('[data-recipe]', function (x) { x.setAttribute('aria-pressed', String(x === b)); });
    el('saved-recipes').hidden = which !== 'saved'; el('recipe-ideas').hidden = which !== 'ideas';
  }; });
  function renderFood() {
    el('inventory-description').textContent = foodLocation === 'Evergreen staples' ? 'Long-lasting oils, spices and essentials you have on hand.' : 'What you have in the ' + foodLocation.toLowerCase() + '.';
    var items = state.food.filter(function (f) { return f.location === foodLocation; });
    items.sort(function (a, b) { return (a.useBy || '9999').localeCompare(b.useBy || '9999'); });
    el('inventory-list').innerHTML = items.map(function (f) {
      return '<div class="row"><div class="row-content">' + esc(f.name) + '<small>' + esc(f.quantity) + (f.useBy ? ' · Use by ' + esc(f.useBy) : '') + '</small></div>' + actions('food', f.id) + '</div>';
    }).join('') || empty('Nothing here yet. Use Add groceries to enter your food.');
  }
  function clearFood() { el('food-form').reset(); el('food-id').value = ''; el('food-form-title').textContent = 'Add groceries'; }
  el('food-cancel').onclick = clearFood;
  el('food-form').onsubmit = function (event) {
    event.preventDefault();
    var name = el('food-name').value.trim(), quantity = el('food-quantity').value.trim();
    if (!name || !quantity) { notice('Enter a food name and quantity.', true); return; }
    if (el('food-date').value && !validDate(el('food-date').value)) { notice('Enter a valid use-by date.', true); return; }
    var item = { id: el('food-id').value || id(), name: name, quantity: quantity, location: el('food-location').value, useBy: el('food-date').value };
    if (update(function () { replace(state.food, item); }, 'Food saved.')) { clearFood(); showFood(item.location); }
  };
  function safeSource(value) { if (!value) return ''; try { var u = new URL(value); return (u.protocol === 'https:' || u.protocol === 'http:') ? u.href : null; } catch (e) { return null; } }
  function renderRecipes() {
    el('recipe-list').innerHTML = state.recipes.map(function (r) {
      var source = safeSource(r.source);
      return '<article class="recipe"><div class="row"><div class="row-content"><h3>' + esc(r.name) + '</h3><small>' + (r.minutes ? esc(r.minutes) + ' minutes · ' : '') + (source ? 'Saved from the web' : 'Household recipe') + '</small></div>' + actions('recipes', r.id) + '</div><details><summary>Ingredients &amp; instructions</summary><h3>Ingredients</h3><div class="recipe-text">' + esc(r.ingredients) + '</div><h3>Instructions</h3><div class="recipe-text">' + esc(r.instructions) + '</div>' + (source ? '<a href="' + esc(source) + '" target="_blank" rel="noopener noreferrer">View original recipe</a>' : '') + '</details></article>';
    }).join('') || empty('No recipes saved yet. Add a family recipe or one you found online.');
    var value = el('meal-recipe').value;
    el('meal-recipe').innerHTML = '<option value="">Write a meal below</option>' + state.recipes.map(function (r) { return '<option value="' + esc(r.id) + '">' + esc(r.name) + '</option>'; }).join('');
    el('meal-recipe').value = find(state.recipes, value) ? value : '';
  }
  function openRecipe(value) {
    el('recipe-form').reset(); el('recipe-id').value = '';
    var r = find(state.recipes, value);
    el('recipe-form-title').textContent = r ? 'Edit recipe' : 'Add a recipe';
    if (r) { el('recipe-id').value = r.id; ['name', 'source', 'minutes', 'ingredients', 'instructions'].forEach(function (key) { el('recipe-' + key).value = r[key] || ''; }); }
    el('recipe-form').hidden = false; el('recipe-name').focus();
  }
  el('new-recipe').onclick = function () { openRecipe(''); };
  el('recipe-cancel').onclick = function () { el('recipe-form').hidden = true; };
  el('recipe-form').onsubmit = function (event) {
    event.preventDefault(); var source = safeSource(el('recipe-source').value.trim());
    if (source === null) { notice('Use an http or https recipe link.', true); return; }
    var r = { id: el('recipe-id').value || id(), name: el('recipe-name').value.trim(), source: source, minutes: el('recipe-minutes').value, ingredients: el('recipe-ingredients').value.trim(), instructions: el('recipe-instructions').value.trim() };
    if (!r.name || !r.ingredients || !r.instructions) { notice('Enter the recipe name, ingredients and instructions.', true); return; }
    if (update(function () { replace(state.recipes, r); }, 'Recipe saved.')) el('recipe-form').hidden = true;
  };
  ['adventure', 'difficulty', 'time'].forEach(function (key) { if (state.preferences[key]) el('ideas-' + key).value = state.preferences[key]; });
  el('ideas-form').onsubmit = function (event) { event.preventDefault(); update(function () { ['adventure', 'difficulty', 'time'].forEach(function (key) { state.preferences[key] = el('ideas-' + key).value; }); }, 'Preferences saved for future recipe discovery.'); };
  function renderShopping() {
    el('shopping-list').innerHTML = state.shopping.map(function (s) { return '<div class="row"><label class="check' + (s.done ? ' done' : '') + '"><input type="checkbox" data-check="' + esc(s.id) + '"' + (s.done ? ' checked' : '') + '><span>' + esc(s.name) + (s.quantity ? ' · ' + esc(s.quantity) : '') + '</span></label><button class="small danger" data-delete="shopping" data-id="' + esc(s.id) + '" aria-label="Delete ' + esc(s.name) + '">Delete</button></div>'; }).join('') || empty('Your list is clear. Add an item for your next grocery trip.');
  }
  el('shopping-form').onsubmit = function (event) { event.preventDefault(); var name = el('shopping-name').value.trim(); if (!name) { notice('Enter an item name.', true); return; } var item = { id: id(), name: name, quantity: el('shopping-quantity').value.trim(), done: false }; if (update(function () { state.shopping.push(item); }, 'Shopping item added.')) el('shopping-form').reset(); };
  function friendlyDate(key) { return parseDate(key).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }); }
  function renderCalendar() {
    el('month-title').textContent = month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    var html = '', i, days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    for (i = 0; i < month.getDay(); i++) html += '<span></span>';
    for (i = 1; i <= days; i++) {
      var key = dateKey(new Date(month.getFullYear(), month.getMonth(), i));
      var meals = state.meals.filter(function (m) { return m.date === key; });
      var planned = meals.some(function (m) { return m.status === 'planned'; });
      var eaten = meals.some(function (m) { return m.status === 'eaten'; });
      html += '<button data-day="' + key + '" aria-pressed="' + (key === selectedDate) + '" class="' + (key === dateKey(new Date()) ? 'today' : '') + '" aria-label="' + esc(friendlyDate(key)) + (planned ? ', planned meals' : '') + (eaten ? ', meals eaten' : '') + '">' + i + '<span class="dots" aria-hidden="true">' + (planned ? '<b class="dot planned"></b>' : '') + (eaten ? '<b class="dot eaten"></b>' : '') + '</span></button>';
    }
    el('calendar-grid').innerHTML = html;
    el('selected-date').textContent = friendlyDate(selectedDate);
    var order = { Breakfast: 0, Lunch: 1, Dinner: 2, Snack: 3 };
    var dayMeals = state.meals.filter(function (m) { return m.date === selectedDate; }).sort(function (a, b) { return order[a.type] - order[b.type]; });
    el('meal-list').innerHTML = dayMeals.map(function (m) {
      return '<div class="row"><div class="row-content"><small><span class="badge ' + m.status + '">' + (m.status === 'eaten' ? 'Ate' : 'Planned') + '</span>' + esc(m.type) + '</small>' + esc(m.name) + (m.notes ? '<small>' + esc(m.notes) + '</small>' : '') + '</div><div>' + (m.status === 'planned' ? '<button class="small" data-eaten="' + esc(m.id) + '">Mark as eaten</button>' : '') + actions('meals', m.id) + '</div></div>';
    }).join('') || empty('No meals recorded for this day. Add what you ate or plan a meal.');
  }
  el('month-prev').onclick = function () { month = new Date(month.getFullYear(), month.getMonth() - 1, 1); renderCalendar(); };
  el('month-next').onclick = function () { month = new Date(month.getFullYear(), month.getMonth() + 1, 1); renderCalendar(); };
  el('calendar-today').onclick = function () { selectedDate = dateKey(new Date()); month = new Date(new Date().getFullYear(), new Date().getMonth(), 1); el('meal-form').hidden = true; renderCalendar(); };
  function openMeal(value) {
    el('meal-form').reset(); el('meal-id').value = ''; el('meal-date').value = selectedDate;
    el('meal-status').value = selectedDate > dateKey(new Date()) ? 'planned' : 'eaten';
    var m = find(state.meals, value); el('meal-form-title').textContent = m ? 'Edit meal' : 'Record a meal';
    if (m) { el('meal-id').value = m.id; ['date', 'type', 'status', 'name', 'notes'].forEach(function (key) { el('meal-' + key).value = m[key] || ''; }); el('meal-recipe').value = find(state.recipes, m.recipeId) ? m.recipeId : ''; }
    el('meal-form').hidden = false; el('meal-name').focus();
  }
  el('new-meal').onclick = function () { openMeal(''); };
  el('meal-cancel').onclick = function () { el('meal-form').hidden = true; };
  el('meal-recipe').onchange = function () { var r = find(state.recipes, this.value); if (r) el('meal-name').value = r.name; };
  el('meal-form').onsubmit = function (event) {
    event.preventDefault();
    var m = { id: el('meal-id').value || id(), date: el('meal-date').value, type: el('meal-type').value, status: el('meal-status').value, recipeId: el('meal-recipe').value, name: el('meal-name').value.trim(), notes: el('meal-notes').value.trim() };
    if (!validDate(m.date) || !m.name) { notice('Enter a valid date and meal name.', true); return; }
    if (m.status === 'eaten' && m.date > dateKey(new Date())) { notice('Future meals must be marked Planned. Record them as eaten after the meal.', true); return; }
    if (update(function () { replace(state.meals, m); }, 'Meal saved.')) { selectedDate = m.date; var d = parseDate(m.date); month = new Date(d.getFullYear(), d.getMonth(), 1); el('meal-form').hidden = true; renderCalendar(); }
  };
  document.addEventListener('change', function (event) { var value = event.target.getAttribute('data-check'); if (value) { var checked = event.target.checked; if (!update(function () { find(state.shopping, value).done = checked; }, 'Shopping list updated.')) event.target.checked = !checked; } });
  document.addEventListener('click', function (event) {
    var target = event.target.closest('button'); if (!target) return;
    var value = target.getAttribute('data-id'), kind = target.getAttribute('data-edit');
    if (kind === 'food') { var f = find(state.food, value); if (!f) return; showFood('add'); el('food-form-title').textContent = 'Edit food'; el('food-id').value = f.id; el('food-name').value = f.name; el('food-quantity').value = f.quantity; el('food-location').value = f.location; el('food-date').value = f.useBy; el('food-name').focus(); }
    if (kind === 'recipes') openRecipe(value);
    if (kind === 'meals') openMeal(value);
    var deletion = target.getAttribute('data-delete');
    if (deletion && window.confirm('Delete this entry?')) update(function () { remove(state[deletion], value); }, 'Entry deleted.');
    var day = target.getAttribute('data-day'); if (day) { selectedDate = day; el('meal-form').hidden = true; renderCalendar(); }
    var eaten = target.getAttribute('data-eaten'); if (eaten) { var meal = find(state.meals, eaten); if (meal.date > dateKey(new Date())) { notice('You can mark this meal as eaten on or after its planned date.', true); return; } update(function () { meal.status = 'eaten'; }, 'Meal marked as eaten.'); }
  });
  // Receipt images are previewed locally only. No upload or OCR request is made.
  var receiptURL = null;
  var receiptGeneration = 0;
  var receiptRowCounter = 0;
  function receiptMessage(text) { el('receipt-feedback').textContent = text; }
  function releaseReceiptPhoto() {
    receiptGeneration++;
    el('receipt-preview').onload = null;
    el('receipt-preview').onerror = null;
    el('receipt-preview').removeAttribute('src');
    if (receiptURL) URL.revokeObjectURL(receiptURL);
    receiptURL = null;
    el('receipt-file').value = '';
    el('receipt-photo-panel').hidden = true;
    el('receipt-filename').textContent = '';
  }
  function receiptRowCount() {
    var count = el('receipt-rows').querySelectorAll('.receipt-item').length;
    el('receipt-save').disabled = count === 0;
    return count;
  }
  function addReceiptRow() {
    receiptRowCounter++;
    var row = document.createElement('fieldset');
    row.className = 'receipt-item';
    row.innerHTML = '<legend>Item ' + receiptRowCounter + '</legend><div class="fields"><label>Food name<input data-receipt="name" required maxlength="120" placeholder="Baby spinach"></label><label>Quantity<input data-receipt="quantity" required maxlength="60" placeholder="1 bag"></label><label>Storage location<select data-receipt="location" required><option value="">Choose a location</option><option>Refrigerator</option><option>Freezer</option><option>Pantry</option><option>Evergreen staples</option></select></label><label>Use-by date (optional)<input data-receipt="useBy" type="date"></label></div><button type="button" class="small danger" data-receipt-remove>Remove item</button>';
    el('receipt-rows').appendChild(row);
    receiptRowCount();
    row.querySelector('input').focus();
  }
  el('receipt-add-row').onclick = addReceiptRow;
  el('receipt-rows').onclick = function (event) {
    var button = event.target.closest('[data-receipt-remove]');
    if (!button) return;
    var row = button.closest('.receipt-item');
    row.parentNode.removeChild(row);
    receiptRowCount();
    el('receipt-add-row').focus();
  };
  el('receipt-remove-photo').onclick = function () { releaseReceiptPhoto(); receiptMessage('Photo removed. Your review items are unchanged.'); };
  el('receipt-file').onchange = function () {
    var file = this.files && this.files[0];
    if (!file) return;
    releaseReceiptPhoto();
    if (file.size > 12 * 1024 * 1024) { receiptMessage('This image is too large. Choose a photo smaller than 12 MB.'); return; }
    if (!/^image\/(jpeg|png)$/i.test(file.type) && !(file.type === '' && /\.(jpe?g|png)$/i.test(file.name))) {
      receiptMessage('Choose a JPEG or PNG image. If your photo is HEIC, export it as JPEG first.'); return;
    }
    var generation = receiptGeneration;
    try { receiptURL = URL.createObjectURL(file); }
    catch (error) { receiptMessage('This browser could not preview the photo. You can still enter groceries below.'); return; }
    var preview = el('receipt-preview');
    preview.onload = function () {
      if (generation !== receiptGeneration) return;
      el('receipt-photo-panel').hidden = false;
      el('receipt-filename').textContent = file.name;
      receiptMessage('Photo ready. Enter the items below; this version does not read the receipt automatically.');
      if (!receiptRowCount()) addReceiptRow();
    };
    preview.onerror = function () {
      if (generation !== receiptGeneration) return;
      releaseReceiptPhoto();
      receiptMessage('The photo could not be opened. Try a different JPEG or PNG. Your review items are unchanged.');
    };
    receiptMessage('Opening photo…');
    preview.src = receiptURL;
  };
  el('receipt-form').onsubmit = function (event) {
    event.preventDefault();
    var rows = el('receipt-rows').querySelectorAll('.receipt-item');
    if (!rows.length) { receiptMessage('Add at least one item to review.'); return; }
    var items = [], invalid = false;
    Array.prototype.forEach.call(rows, function (row) {
      function value(key) { return row.querySelector('[data-receipt="' + key + '"]').value.trim(); }
      var item = { id: id(), name: value('name'), quantity: value('quantity'), location: value('location'), useBy: value('useBy') };
      if (!item.name || !item.quantity || ['Refrigerator', 'Freezer', 'Pantry', 'Evergreen staples'].indexOf(item.location) < 0 || (item.useBy && !validDate(item.useBy))) invalid = true;
      items.push(item);
    });
    if (invalid) { receiptMessage('Check each item: a name, quantity and storage location are required, and any use-by date must be valid.'); return; }
    if (update(function () { Array.prototype.push.apply(state.food, items); }, items.length + ' reviewed item' + (items.length === 1 ? '' : 's') + ' added to inventory.')) {
      el('receipt-rows').innerHTML = '';
      receiptRowCounter = 0;
      receiptRowCount();
      releaseReceiptPhoto();
      receiptMessage(items.length + ' item' + (items.length === 1 ? '' : 's') + ' saved. Select a storage tab above to see them.');
    } else { receiptMessage('Items were not saved. Your review list is still here so you can try again.'); }
  };
  window.addEventListener('beforeunload', function (event) {
    if (!receiptRowCount()) return;
    event.preventDefault(); event.returnValue = '';
  });

  function renderAll() { renderFood(); renderRecipes(); renderShopping(); renderCalendar(); }
  function sizeIcons() { document.documentElement.style.setProperty('--icon-size', el('calendar-label').getBoundingClientRect().width + 'px'); }
  renderAll(); sizeIcons(); window.addEventListener('resize', sizeIcons);
})();
