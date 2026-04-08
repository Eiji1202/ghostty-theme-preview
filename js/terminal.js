// Terminal preview rendering and split interaction

var focusedSplit = 'left';

function applyTerminalSplitStyles() {
  var left = document.getElementById('terminal-pane-left');
  var right = document.getElementById('terminal-pane-right');
  if (!left || !right) return;
  var unf = parseFloat(document.getElementById('unfocused-opacity').value);

  // unfocused-split-fill: color overlay on unfocused pane
  var fillEl = document.getElementById('focus-color');
  var fillOn = document.getElementById('tog-focus-color').checked;
  var fillColor = fillOn && fillEl ? fillEl.value : 'transparent';
  var fillAlpha = fillOn ? (1 - unf) : 0; // dimming amount

  function setFill(el, active) {
    var overlay = el.querySelector('.unfocused-fill-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'unfocused-fill-overlay';
      el.appendChild(overlay);
    }
    if (active && fillOn) {
      overlay.style.background = fillColor;
      overlay.style.opacity = String(fillAlpha);
    } else {
      overlay.style.background = 'transparent';
      overlay.style.opacity = '0';
    }
  }

  if (focusedSplit === 'left') {
    left.style.opacity = '1';
    right.style.opacity = String(unf);
    left.classList.add('terminal-pane--focused');
    right.classList.remove('terminal-pane--focused');
    setFill(left, false);
    setFill(right, true);
  } else {
    right.style.opacity = '1';
    left.style.opacity = String(unf);
    right.classList.add('terminal-pane--focused');
    left.classList.remove('terminal-pane--focused');
    setFill(right, false);
    setFill(left, true);
  }
}

function setFocusedSplit(side) {
  if (side !== 'left' && side !== 'right') return;
  focusedSplit = side;
  applyTerminalSplitStyles();
}

function initTerminalSplitInteraction() {
  var split = document.getElementById('terminal-split');
  if (!split || split.dataset.bound === '1') return;
  split.dataset.bound = '1';
  document.getElementById('terminal-pane-left').addEventListener('click', function() { setFocusedSplit('left'); this.focus(); });
  document.getElementById('terminal-pane-right').addEventListener('click', function() { setFocusedSplit('right'); this.focus(); });
  document.getElementById('terminal-pane-left').addEventListener('focus', function() { focusedSplit = 'left'; applyTerminalSplitStyles(); });
  document.getElementById('terminal-pane-right').addEventListener('focus', function() { focusedSplit = 'right'; applyTerminalSplitStyles(); });
  document.getElementById('terminal-pane-left').addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFocusedSplit('left'); }
  });
  document.getElementById('terminal-pane-right').addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFocusedSplit('right'); }
  });
}

function buildCursor(style, color, fg) {
  var c = color || fg;
  if (style === 'bar') {
    return '<span class="term-cursor" style="width:2px;height:14px;background:' + c + ';margin-left:2px;"></span>';
  } else if (style === 'underline') {
    return '<span class="term-cursor" style="width:8px;height:2px;background:' + c + ';margin-left:2px;vertical-align:baseline;"></span>';
  }
  // block (default)
  return '<span class="term-cursor" style="width:8px;height:14px;background:' + c + ';margin-left:2px;"></span>';
}

function renderTerminalContent(t, fg, fontFamily, fontSize, cursorStyle, cursorColor) {
  var c = t.colors;
  var green = c[2] || '#50fa7b';
  var blue = c[4] || '#7aa2f7';
  var purple = c[5] || '#bb9af7';
  var cyan = c[6] || '#7dcfff';
  var red = c[1] || '#ff5555';
  var yellow = c[3] || '#f1fa8c';

  var leftHtml = ''
    + '<div class="term-line"><span style="color:' + green + '">\u27a1</span><span class="term-prompt-path" style="color:' + blue + '">~/develop/ghostty-theme-preview</span><span style="color:' + purple + '">git:(main)</span></div>'
    + '<div class="term-line" style="color:' + fg + '">$ claude --model sonnet</div>'
    + '<div class="term-line" style="color:' + green + '">\u2713 Claude Code initialized</div>'
    + '<div class="term-line" style="color:' + fg + '; margin-top:4px;">\u256d\u2500 Human</div>'
    + '<div class="term-line" style="color:' + fg + ';">\u2502  implement the new theme feature</div>'
    + '<div class="term-line" style="color:' + fg + ';">\u2570\u2500 Assistant</div>'
    + '<div class="term-line" style="color:' + yellow + ';">  \u2192 Reading files...</div>'
    + '<div class="term-line" style="color:' + green + ';">  \u2713 Created: src/theme-picker.ts</div>'
    + '<div class="term-line" style="color:' + cyan + ';">  \u2713 Updated: index.html</div>'
    + '<div class="term-line" style="color:' + fg + '; margin-top:4px;">$ git add . &amp;&amp; git commit -m <span style="color:' + yellow + '">"feat: add theme picker"</span></div>'
    + '<div class="term-line" style="color:' + green + ';">[main 4f2a9c1] feat: add theme picker</div>'
    + '<div class="term-line"><span style="color:' + green + '">\u27a1</span><span style="color:' + blue + '">~/develop/ghostty-theme-preview</span><span style="color:' + red + '; margin-left:4px;">\u25cf</span>' + buildCursor(cursorStyle, cursorColor, fg) + '</div>';

  var rightHtml = ''
    + '<div class="term-line"><span style="color:' + green + '">\u27a1</span><span style="color:' + blue + '">~/develop/ghostty-theme-preview</span><span style="color:' + purple + '">git:(split-demo)</span></div>'
    + '<div class="term-line" style="color:' + fg + ';">$ tail -f var/log/build.log</div>'
    + '<div class="term-line" style="color:' + cyan + ';">[12:00:01] compile: ok (240ms)</div>'
    + '<div class="term-line" style="color:' + cyan + ';">[12:00:02] compile: ok (198ms)</div>'
    + '<div class="term-line" style="color:' + yellow + ';">[12:00:03] watching for changes...</div>'
    + '<div class="term-line" style="color:' + fg + '; margin-top:4px;">$ ls src/</div>'
    + '<div class="term-line" style="color:' + green + ';">theme-picker.ts  index.html</div>'
    + '<div class="term-line" style="color:' + fg + ';"># second split</div>';

  document.getElementById('terminal-body-left').innerHTML = leftHtml;
  document.getElementById('terminal-body-right').innerHTML = rightHtml;

  document.querySelectorAll('.terminal-pane-body').forEach(function(el) {
    el.style.background = 'transparent';
    el.style.fontFamily = "'" + fontFamily + "', monospace";
    el.style.fontSize = fontSize + 'px';
  });

  initTerminalSplitInteraction();
  applyTerminalSplitStyles();
}
