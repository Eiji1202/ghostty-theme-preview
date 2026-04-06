// Main application logic

var THEMES = [];
var filtered = [];
var selected = null;
var favorites = JSON.parse(localStorage.getItem('ghostty-favs') || '[]');
var currentFilter = 'all';
var currentTab = 'all';
var bgImageDataUrl = null;

// ===== Utilities =====

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function isDark(hex) {
  if (!hex || hex.length < 4) return true;
  var r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return (r*299 + g*587 + b*114)/1000 < 128;
}

function adjustBrightness(hex, amount) {
  if (!hex || hex.length < 7) return '#333';
  var r = Math.max(0, Math.min(255, parseInt(hex.slice(1,3),16) + amount));
  var g = Math.max(0, Math.min(255, parseInt(hex.slice(3,5),16) + amount));
  var b = Math.max(0, Math.min(255, parseInt(hex.slice(5,7),16) + amount));
  return 'rgb(' + r + ',' + g + ',' + b + ')';
}

function hexToRgb(hex) {
  var r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return r + ',' + g + ',' + b;
}

// ===== Init =====

async function init() {
  initTerminalSplitInteraction();
  try {
    var res = await fetch('./themes.json');
    THEMES = await res.json();
    renderList();
    if (THEMES.length > 0) {
      var tokyonight = THEMES.find(function(t) { return t.name === 'TokyoNight'; }) || THEMES[0];
      selectTheme(tokyonight);
    }
  } catch(e) {
    document.getElementById('theme-list').innerHTML = '<div class="loading"><span class="loading-text">Failed to load themes.json</span></div>';
  }
}

// ===== Sidebar: Filter, Tab, Search =====

function setFilter(f, btn) {
  currentFilter = f;
  document.querySelectorAll('.filter-btn').forEach(function(b) { b.classList.remove('active'); });
  btn.classList.add('active');
  renderList();
}

function setTab(t, btn) {
  currentTab = t;
  document.querySelectorAll('.fav-toggle-btn').forEach(function(b) { b.classList.remove('active'); });
  btn.classList.add('active');
  renderList();
}

function getFiltered() {
  var q = document.getElementById('search').value.toLowerCase();
  return THEMES.filter(function(t) {
    if (!t.name.toLowerCase().includes(q)) return false;
    var dark = isDark(t.bg);
    if (currentFilter === 'dark' && !dark) return false;
    if (currentFilter === 'light' && dark) return false;
    if (currentTab === 'fav' && !favorites.includes(t.name)) return false;
    return true;
  });
}

function renderList() {
  filtered = getFiltered();
  document.getElementById('theme-count').textContent = filtered.length + ' themes';
  var list = document.getElementById('theme-list');
  if (filtered.length === 0) {
    list.innerHTML = '<div class="loading"><span class="loading-text">No themes found</span></div>';
    return;
  }
  list.innerHTML = filtered.map(function(t) {
    var isFav = favorites.includes(t.name);
    var isActive = selected && selected.name === t.name;
    return '<div class="theme-item' + (isActive ? ' active' : '') + '" data-name="' + escHtml(t.name) + '">'
      + '<div class="theme-name">' + escHtml(t.name) + '</div>'
      + '<button class="fav-btn' + (isFav ? ' active' : '') + '" onclick="toggleFav(event,\'' + escHtml(t.name) + '\')" title="Favorite">\u2665</button>'
      + '</div>';
  }).join('');
  list.querySelectorAll('.theme-item').forEach(function(el) {
    el.onclick = function() {
      var t = THEMES.find(function(x) { return x.name === el.dataset.name; });
      if (t) selectTheme(t);
    };
  });
}

function toggleFav(e, name) {
  e.stopPropagation();
  var idx = favorites.indexOf(name);
  if (idx >= 0) favorites.splice(idx, 1);
  else favorites.push(name);
  localStorage.setItem('ghostty-favs', JSON.stringify(favorites));
  renderList();
}

// ===== Theme Selection & Preview =====

function selectTheme(t) {
  if (!t) return;
  selected = t;
  renderList();
  updatePreview();
}

function updatePreview() {
  if (!selected) return;
  var t = selected;
  var dark = isDark(t.bg);
  var fontFamily = document.getElementById('font-family').value;
  var fontSize = document.getElementById('font-size').value;
  var opacity = document.getElementById('bg-opacity').value;

  document.getElementById('empty-state').style.display = 'none';
  var pc = document.getElementById('preview-content');
  pc.style.display = 'flex';
  document.getElementById('config-section').style.display = '';

  document.getElementById('theme-title').textContent = t.name;
  document.getElementById('theme-badge').textContent = dark ? 'dark' : 'light';

  // sync color pickers to theme defaults
  document.getElementById('foreground-color').value = t.fg;
  document.getElementById('background-color').value = t.bg;
  document.getElementById('cursor-color').value = t.fg;

  var bgOn = document.getElementById('tog-background').checked;
  var fgOn = document.getElementById('tog-foreground').checked;

  var activeBg = bgOn ? document.getElementById('background-color').value : t.bg;
  var activeFg = fgOn ? document.getElementById('foreground-color').value : t.fg;

  var tw = document.getElementById('terminal-wrap');
  tw.style.background = activeBg;
  tw.style.opacity = opacity;

  var tb = document.getElementById('term-titlebar');
  tb.style.background = adjustBrightness(activeBg, isDark(activeBg) ? 15 : -15);
  var termTitleText = document.getElementById('term-title-text');
  termTitleText.textContent = t.name;
  termTitleText.style.color = activeFg;

  var cursorStyle = document.getElementById('cursor-style').value;
  var cursorColorOn = document.getElementById('tog-cursor-color').checked;
  var cursorColor = cursorColorOn ? document.getElementById('cursor-color').value : null;
  renderTerminalContent(t, activeFg, fontFamily, fontSize, cursorStyle, cursorColor);
  updateBgImagePreview();

  var pg = document.getElementById('palette-grid');
  pg.innerHTML = t.colors.slice(0, 16).map(function(col) {
    return col ? '<div class="palette-chip" style="background:' + col + '" title="' + col + '"><div class="palette-chip-label">' + col + '</div></div>' : '';
  }).join('');

  renderConfig();
}

// ===== Settings =====

function onToggle(key) {
  var on = document.getElementById('tog-' + key).checked;
  var ctrl = document.getElementById('ctrl-' + key);
  var label = document.getElementById('key-' + key);
  if (ctrl) ctrl.classList.toggle('disabled', !on);
  if (label) label.classList.toggle('disabled', !on);
  if (key === 'bg-image-opacity') updateBgImagePreview();
  renderConfig();
}

function updateFontSize() {
  document.getElementById('font-size-val').textContent = document.getElementById('font-size').value;
  updatePreview();
}

function updateOpacity() {
  document.getElementById('opacity-val').textContent = parseFloat(document.getElementById('bg-opacity').value).toFixed(2);
  updatePreview();
}

function updateUnfocused() {
  document.getElementById('unfocused-val').textContent = parseFloat(document.getElementById('unfocused-opacity').value).toFixed(2);
  applyTerminalSplitStyles();
  renderConfig();
}

function updateSplitDivider() {
  var val = document.getElementById('split-divider').value;
  document.getElementById('split-divider-val').textContent = val;
  document.getElementById('terminal-split').style.setProperty('--split-divider-size', val + 'px');
  renderConfig();
}

function updatePadding() {
  var px = document.getElementById('window-padding-x').value;
  var py = document.getElementById('window-padding-y').value;
  document.getElementById('padding-x-val').textContent = px;
  document.getElementById('padding-y-val').textContent = py;
  document.querySelectorAll('.terminal-pane').forEach(function(el) {
    el.style.paddingLeft = (14 + parseInt(px)) + 'px';
    el.style.paddingRight = (16 + parseInt(px)) + 'px';
    el.style.paddingTop = (14 + parseInt(py)) + 'px';
    el.style.paddingBottom = (18 + parseInt(py)) + 'px';
  });
  renderConfig();
}

function updateCustomColors() {
  if (!selected) return;
  var bgOn = document.getElementById('tog-background').checked;
  var fgOn = document.getElementById('tog-foreground').checked;
  var tw = document.getElementById('terminal-wrap');
  var tb = document.getElementById('term-titlebar');
  if (bgOn) {
    var bg = document.getElementById('background-color').value;
    tw.style.background = bg;
    tb.style.background = adjustBrightness(bg, isDark(bg) ? 15 : -15);
  } else {
    tw.style.background = selected.bg;
    tb.style.background = adjustBrightness(selected.bg, isDark(selected.bg) ? 15 : -15);
  }
  if (fgOn) {
    var fg = document.getElementById('foreground-color').value;
    document.getElementById('term-title-text').style.color = fg;
  } else {
    document.getElementById('term-title-text').style.color = selected.fg;
  }
  renderConfig();
}

function updateFocusColor() {
  var hex = document.getElementById('focus-color').value;
  var rgb = hexToRgb(hex);
  var split = document.getElementById('terminal-split');
  split.style.setProperty('--focus-color', 'rgba(' + rgb + ',0.45)');
  split.style.setProperty('--focus-color-dim', 'rgba(' + rgb + ',0.25)');
  renderConfig();
}

// ===== Background Image =====

function onToggleBgImage() {
  var on = document.getElementById('tog-bg-image').checked;
  document.getElementById('ctrl-bg-image').classList.toggle('disabled', !on);
  document.getElementById('key-bg-image').classList.toggle('disabled', !on);
  document.getElementById('row-bg-image-opacity').style.display = on ? '' : 'none';
  document.getElementById('row-bg-image-fit').style.display = on ? '' : 'none';
  updateBgImagePreview();
  renderConfig();
}

function updateBgImagePreview() {
  var panes = [document.getElementById('pane-bg-left'), document.getElementById('pane-bg-right')];
  var on = document.getElementById('tog-bg-image').checked;
  if (!on || !bgImageDataUrl) {
    panes.forEach(function(el) { if (el) el.style.backgroundImage = 'none'; });
    return;
  }
  var imgOpacity = parseFloat(document.getElementById('bg-image-opacity').value);
  var fit = document.getElementById('bg-image-fit').value;
  var fitMap = { cover: 'cover', contain: 'contain', stretch: '100% 100%', none: 'auto' };
  panes.forEach(function(el) {
    if (!el) return;
    el.style.backgroundImage = "url('" + bgImageDataUrl + "')";
    el.style.backgroundSize = fitMap[fit] || 'cover';
    el.style.backgroundRepeat = 'no-repeat';
    el.style.backgroundPosition = 'center';
    el.style.opacity = imgOpacity;
  });
}

function updateBgImageOpacity() {
  var v = parseFloat(document.getElementById('bg-image-opacity').value).toFixed(2);
  document.getElementById('bg-image-opacity-val').textContent = v;
  updateBgImagePreview();
  renderConfig();
}

function onFileSelect(e) {
  var file = e.target.files[0];
  if (file) loadImageFile(file);
}

function onDragOver(e) {
  e.preventDefault();
  document.getElementById('image-dropzone').classList.add('drag-over');
}

function onDragLeave() {
  document.getElementById('image-dropzone').classList.remove('drag-over');
}

function onDrop(e) {
  e.preventDefault();
  document.getElementById('image-dropzone').classList.remove('drag-over');
  var file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) loadImageFile(file);
}

function loadImageFile(file) {
  var reader = new FileReader();
  reader.onload = function(e) {
    bgImageDataUrl = e.target.result;
    var thumb = document.getElementById('image-preview-thumb');
    thumb.src = bgImageDataUrl;
    thumb.style.display = 'block';
    document.getElementById('image-clear-btn').style.display = 'block';
    document.getElementById('dropzone-text').style.display = 'none';
    var pathInput = document.getElementById('bg-image-path');
    if (!pathInput.value) pathInput.value = '~/Pictures/' + file.name;
    var tog = document.getElementById('tog-bg-image');
    if (!tog.checked) { tog.checked = true; onToggleBgImage(); }
    else { updateBgImagePreview(); renderConfig(); }
  };
  reader.readAsDataURL(file);
}

function clearImage(e) {
  e.stopPropagation();
  bgImageDataUrl = null;
  document.getElementById('image-preview-thumb').style.display = 'none';
  document.getElementById('image-clear-btn').style.display = 'none';
  document.getElementById('dropzone-text').style.display = '';
  document.getElementById('file-input').value = '';
  document.getElementById('bg-image-path').value = '';
  document.getElementById('pane-bg-left').style.backgroundImage = 'none';
  document.getElementById('pane-bg-right').style.backgroundImage = 'none';
  renderConfig();
}

// ===== Start =====

init();
