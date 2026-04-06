// Data-driven config generation for Ghostty
// Each section defines its label and items with config key, toggle key, and value getter.

var CONFIG_SECTIONS = [
  {
    label: 'Theme',
    items: [
      { key: 'theme', togKey: null, getValue: function() {
        if (!selected) return '';
        return selected.name.includes(' ') ? '"' + selected.name + '"' : selected.name;
      }},
    ]
  },
  {
    label: 'Font',
    items: [
      { key: 'font-family', togKey: 'font-family', getValue: function() {
        return document.getElementById('font-family').value;
      }},
      { key: 'font-size', togKey: 'font-size', getValue: function() {
        return document.getElementById('font-size').value;
      }},
    ]
  },
  {
    label: 'Cursor',
    items: [
      { key: 'cursor-style', togKey: 'cursor-style', getValue: function() {
        return document.getElementById('cursor-style').value;
      }},
      { key: 'cursor-color', togKey: 'cursor-color', getValue: function() {
        return document.getElementById('cursor-color').value;
      }},
    ]
  },
  {
    label: 'Window',
    items: [
      { key: 'foreground', togKey: 'foreground', getValue: function() {
        return document.getElementById('foreground-color').value;
      }},
      { key: 'window-padding-x', togKey: 'window-padding-x', getValue: function() {
        return document.getElementById('window-padding-x').value;
      }},
      { key: 'window-padding-y', togKey: 'window-padding-y', getValue: function() {
        return document.getElementById('window-padding-y').value;
      }},
      { key: 'background-opacity', togKey: 'bg-opacity', getValue: function() {
        return parseFloat(document.getElementById('bg-opacity').value).toFixed(2);
      }},
      { key: 'unfocused-split-opacity', togKey: 'unfocused-opacity', getValue: function() {
        return parseFloat(document.getElementById('unfocused-opacity').value).toFixed(2);
      }},
      { key: 'unfocused-split-fill', togKey: 'focus-color', getValue: function() {
        return document.getElementById('focus-color').value;
      }},
      { key: 'split-divider-size', togKey: 'split-divider', getValue: function() {
        return document.getElementById('split-divider').value;
      }},
    ]
  },
  {
    label: 'Background',
    items: [
      { key: 'background', togKey: 'background', getValue: function() {
        return document.getElementById('background-color').value;
      }},
      { key: 'background-image', togKey: 'bg-image', getValue: function() {
        return document.getElementById('bg-image-path').value.trim();
      }, showIf: function() {
        return isOn('bg-image') && !!document.getElementById('bg-image-path').value.trim();
      }},
      { key: 'background-image-opacity', togKey: 'bg-image-opacity', getValue: function() {
        return parseFloat(document.getElementById('bg-image-opacity').value).toFixed(2);
      }, showIf: function() {
        return isOn('bg-image') && !!document.getElementById('bg-image-path').value.trim();
      }},
      { key: 'background-image-fit', togKey: 'bg-image-fit', getValue: function() {
        return document.getElementById('bg-image-fit').value;
      }, showIf: function() {
        return isOn('bg-image') && !!document.getElementById('bg-image-path').value.trim();
      }},
    ]
  },
  {
    label: 'macOS',
    items: [
      { key: 'macos-option-as-alt', togKey: 'option-alt', getValue: function() {
        return document.getElementById('option-alt').value;
      }},
    ]
  },
];

function isOn(key) {
  var el = document.getElementById('tog-' + key);
  return el ? el.checked : true;
}

function renderConfig() {
  if (!selected) return;
  var lines = [];

  CONFIG_SECTIONS.forEach(function(section) {
    var sectionLines = [];
    section.items.forEach(function(item) {
      if (item.showIf && !item.showIf()) return;
      if (item.togKey !== null && !isOn(item.togKey)) return;
      var val = item.getValue();
      sectionLines.push('<span class="config-key">' + item.key + '</span> = <span class="config-val">' + escHtml(val) + '</span>');
    });
    if (sectionLines.length === 0) return;
    if (lines.length > 0) lines.push('');
    lines.push('<span class="config-comment"># ' + section.label + '</span>');
    lines = lines.concat(sectionLines);
  });

  document.getElementById('config-text').innerHTML = lines.join('\n');
}

function copyConfig() {
  if (!selected) return;
  var lines = [];

  CONFIG_SECTIONS.forEach(function(section) {
    var sectionLines = [];
    section.items.forEach(function(item) {
      if (item.showIf && !item.showIf()) return;
      if (item.togKey !== null && !isOn(item.togKey)) return;
      sectionLines.push(item.key + ' = ' + item.getValue());
    });
    if (sectionLines.length === 0) return;
    if (lines.length > 0) lines.push('');
    lines.push('# ' + section.label);
    lines = lines.concat(sectionLines);
  });

  navigator.clipboard.writeText(lines.join('\n')).then(function() {
    var btn = document.getElementById('copy-btn');
    btn.textContent = 'Copied';
    btn.classList.add('copied');
    setTimeout(function() { btn.textContent = 'Copy config'; btn.classList.remove('copied'); }, 2000);
  });
}
