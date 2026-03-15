/**
 * ifs-fractales.js  —  content/js/ifs-fractales.js
 *
 * Générateur de Fractales IFS (Iterated Function Systems).
 * Aucune dépendance externe. Web Worker inline pour ne pas bloquer l'UI.
 *
 * Algorithme :
 *   - Mapping inverse (PIL-AFFINE) : pour chaque pixel destination, cherche
 *     sa source dans l'image précédente via la transformation inverse.
 *   - MinFilter(3) appliqué à la source avant chaque mapping : dilate d'1 px
 *     les pixels noirs pour combler les trous dus aux arrondis sur les
 *     échelles non-entières (ex. 1/3 → 3^k px recommandés).
 *
 * Repère utilisateur : origine bas-gauche, y vers le haut.
 *   Tx=0, Ty=0 → coin bas-gauche de l'image.
 */

(function () {
'use strict';

/* ═══════════════════════════════════════════════════════════════
   PRÉRÉGLAGES  (sx, sy, rot_deg, tx, ty)
   ═══════════════════════════════════════════════════════════════ */

function _makePenta() {
  var r = 1 / 3;
  var items = [[r, r, 0, 1/3, 1/3]];
  for (var i = 0; i < 5; i++) {
    var a = (90 + i * 72) * Math.PI / 180;
    items.push([r, r, 0,
      +((0.5 + r * Math.cos(a) - r / 2).toFixed(4)),
      +((0.5 + r * Math.sin(a) - r / 2).toFixed(4))
    ]);
  }
  return items;
}

var t3 = +(1 / 3).toFixed(4);

var IFS_PRESETS = {
  Sierpinski: [
    [0.5, 0.5,   0,  0.0,   0.0],
    [0.5, 0.5,   0,  0.5,   0.0],
    [0.5, 0.5,   0,  0.25,  0.5],
  ],
  Tapis: (function () {
    var rows = [];
    for (var y = 0; y < 3; y++)
      for (var x = 0; x < 3; x++)
        if (!(x === 1 && y === 1))
          rows.push([t3, t3, 0, +(x * t3).toFixed(4), +(y * t3).toFixed(4)]);
    return rows;
  }()),
  Pentaflake: _makePenta(),
  Arbre: [
    [0.5, 0.5,   0,   0.25, 0.0],
    [0.5, 0.5,   0,   0.25, 0.5],
    [0.5, 0.5, -35,   0.0,  0.5],
    [0.5, 0.5,  35,   0.45, 0.5],
  ],
};

/* ═══════════════════════════════════════════════════════════════
   WEB WORKER INLINE
   Code du worker sous forme de chaîne pour éviter un fichier séparé.
   ═══════════════════════════════════════════════════════════════ */

var _WORKER_CODE = [
  /* MinFilter 3×3 : dilate les pixels noirs de 1 px */
  'function minFilter3(src, N) {',
  '  var out = new Uint8Array(N * N);',
  '  for (var y = 0; y < N; y++) {',
  '    for (var x = 0; x < N; x++) {',
  '      var m = 255;',
  '      for (var dy = -1; dy <= 1; dy++) {',
  '        var ny = y + dy;',
  '        if (ny < 0 || ny >= N) continue;',
  '        for (var dx = -1; dx <= 1; dx++) {',
  '          var nx2 = x + dx;',
  '          if (nx2 >= 0 && nx2 < N) { var v = src[ny*N+nx2]; if (v < m) m = v; }',
  '        }',
  '      }',
  '      out[y*N+x] = m;',
  '    }',
  '  }',
  '  return out;',
  '}',
  '',
  /* Paramètres du mapping inverse (repère bas-gauche → pixels) */
  'function invP(sx, sy, rot, tx, ty, N) {',
  '  var th = rot * Math.PI / 180;',
  '  var c = Math.cos(th), s = Math.sin(th);',
  '  return [',
  '    c/sx, -s/sx, N*(-c*tx + s*(1-ty))/sx,',
  '    s/sy,  c/sy, N*(sy - s*tx - c*(1-ty))/sy',
  '  ];',
  '}',
  '',
  /* Une itération IFS */
  'function applyIFS(arr, transforms, N) {',
  '  var dil = minFilter3(arr, N);',
  '  var res = new Uint8Array(N * N);',
  '  for (var k = 0; k < res.length; k++) res[k] = 255;',
  '  for (var ti = 0; ti < transforms.length; ti++) {',
  '    var tf = transforms[ti];',
  '    if (Math.abs(tf[0] * tf[1]) < 1e-10) continue;',
  '    var p = invP(tf[0], tf[1], tf[2], tf[3], tf[4], N);',
  '    var a=p[0], b=p[1], c=p[2], d=p[3], e=p[4], f=p[5];',
  '    for (var yd = 0; yd < N; yd++) {',
  '      for (var xd = 0; xd < N; xd++) {',
  '        var xs = Math.round(a*xd + b*yd + c);',
  '        var ys = Math.round(d*xd + e*yd + f);',
  '        if (xs >= 0 && xs < N && ys >= 0 && ys < N) {',
  '          var dst = yd*N + xd;',
  '          var val = dil[ys*N + xs];',
  '          if (val < res[dst]) res[dst] = val;',
  '        }',
  '      }',
  '    }',
  '  }',
  '  return res;',
  '}',
  '',
  'self.onmessage = function(e) {',
  '  var d = e.data;',
  '  var result = applyIFS(new Uint8Array(d.buf), d.transforms, d.size);',
  '  self.postMessage({ buf: result.buffer }, [result.buffer]);',
  '};',
].join('\n');

var _worker = new Worker(
  URL.createObjectURL(new Blob([_WORKER_CODE], { type: 'application/javascript' }))
);

/* ═══════════════════════════════════════════════════════════════
   ÉTAT GLOBAL
   ═══════════════════════════════════════════════════════════════ */

var PREVIEW_SIZE = 512;   // taille fixe du canvas d'aperçu (CSS s'occupe du scaling)

var _imgSize   = 512;     // résolution interne du calcul
var _arr       = null;    // Uint8Array grayscale N×N
var _iter      = 0;
var _history   = [];
var _rows      = [];      // lignes du tableau des transformations
var _computing = false;
var _queued    = 0;
var _autoId    = null;
var _autoLeft  = 0;

/* ═══════════════════════════════════════════════════════════════
   WORKER — callback
   ═══════════════════════════════════════════════════════════════ */

_worker.onmessage = function (e) {
  _arr = new Uint8Array(e.data.buf);
  _iter++;
  _history.push(_arr.slice());
  _computing = false;
  _setComputing(false);
  _refresh();

  if (_queued > 0) {
    _queued--;
    _runComputation();
  } else if (_autoId !== null) {
    _autoId = setTimeout(_autoStep, 200);
  }
};

function _runComputation() {
  if (_computing) { _queued++; return; }
  var tf = _getTransforms();
  if (!tf.length) { _setStatus('Ajoutez au moins une transformation. / Add at least one transformation.'); return; }
  _computing = true;
  _setComputing(true);
  _worker.postMessage({ buf: _arr.buffer.slice(0), transforms: tf, size: _imgSize });
}

/* ═══════════════════════════════════════════════════════════════
   AFFICHAGE APERÇU
   ═══════════════════════════════════════════════════════════════ */

var _prevCanvas = document.getElementById('ifs-preview-canvas');
var _prevCtx    = _prevCanvas.getContext('2d');

function _toImageData(a, N) {
  var img = new ImageData(N, N), d = img.data;
  for (var i = 0; i < N * N; i++) {
    var v = a[i];
    d[i*4] = v; d[i*4+1] = v; d[i*4+2] = v; d[i*4+3] = 255;
  }
  return img;
}

function _arrToCanvas(a, N) {
  var c = document.createElement('canvas');
  c.width = c.height = N;
  c.getContext('2d').putImageData(_toImageData(a, N), 0, 0);
  return c;
}

function _refresh() {
  /* Rendu dans un canvas temporaire à la résolution native,
     puis scale-down vers le canvas d'aperçu (CSS width: 100%) */
  /* setAttribute efface le canvas — il faut les poser AVANT drawImage */
  _prevCanvas.width  = PREVIEW_SIZE;
  _prevCanvas.height = PREVIEW_SIZE;
  var tmp = _arrToCanvas(_arr, _imgSize);
  _prevCtx.imageSmoothingEnabled = false;
  _prevCtx.drawImage(tmp, 0, 0, PREVIEW_SIZE, PREVIEW_SIZE);

  document.getElementById('ifs-iter-label').textContent =
    (_lang() === 'fr' ? 'Itération : ' : 'Iteration: ') + _iter;

  var nBlack = 0;
  for (var i = 0; i < _arr.length; i++) if (_arr[i] === 0) nBlack++;

  document.getElementById('ifs-canvas-info').textContent =
    'Aperçu ' + PREVIEW_SIZE + '×' + PREVIEW_SIZE +
    ' — ' + (_lang() === 'fr' ? 'résolution interne ' : 'internal resolution ') +
    _imgSize + '×' + _imgSize +
    ' — ' + (_lang() === 'fr' ? 'pixels noirs : ' : 'black pixels: ') +
    nBlack.toLocaleString();
}

/* Détecte la langue selon l'URL (/fr/ ou pas) */
function _lang() {
  return window.location.pathname.indexOf('/fr') !== -1 ? 'fr' : 'en';
}

function _setComputing(on) {
  document.getElementById('ifs-computing').style.display = on ? 'inline' : 'none';
  ['btn-iter1', 'btn-iter10', 'btn-auto'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.disabled = on;
  });
}

function _setStatus(msg) {
  var el = document.getElementById('ifs-status');
  if (el) el.textContent = msg;
}

/* ═══════════════════════════════════════════════════════════════
   CONTRÔLES D'ITÉRATION
   ═══════════════════════════════════════════════════════════════ */

function _resetImage() {
  _stopAuto();
  _queued    = 0;
  _computing = false;
  _setComputing(false);
  _arr     = new Uint8Array(_imgSize * _imgSize);  // tout noir = 0
  _iter    = 0;
  _history = [_arr.slice()];
  _refresh();
  _setStatus(_lang() === 'fr' ? 'Image réinitialisée.' : 'Image reset.');
}

function _doIter()   { _runComputation(); }
function _doIter10() { _runComputation(); _queued += 9; }

function _startAuto() {
  if (_autoId !== null) return;
  _autoLeft = 20;
  _autoStep();
}

function _autoStep() {
  _autoId = null;
  if (_autoLeft <= 0) return;
  _autoLeft--;
  _runComputation();
  /* Le prochain appel est planifié dans _worker.onmessage */
}

function _stopAuto() {
  if (_autoId !== null) { clearTimeout(_autoId); _autoId = null; }
  _queued = 0;
  _setStatus(_lang() === 'fr' ? 'Arrêté.' : 'Stopped.');
}

function _applyResolution() {
  var el  = document.getElementById('ifs-res-input');
  var val = parseInt(el.value, 10);
  if (isNaN(val) || val < 64) { val = 64; }
  if (val > 8192)              { val = 8192; }
  el.value  = val;
  _imgSize  = val;
  _resetImage();
  _setStatus(
    (_lang() === 'fr' ? 'Résolution : ' : 'Resolution: ') + val + '×' + val + ' px'
  );
}

/* ═══════════════════════════════════════════════════════════════
   TABLEAU DES TRANSFORMATIONS
   ═══════════════════════════════════════════════════════════════ */

function _addRow(sx, sy, rot, tx, ty) {
  sx  = (sx  !== undefined) ? sx  : 0.5;
  sy  = (sy  !== undefined) ? sy  : 0.5;
  rot = (rot !== undefined) ? rot : 0.0;
  tx  = (tx  !== undefined) ? tx  : 0.0;
  ty  = (ty  !== undefined) ? ty  : 0.0;

  var idx   = _rows.length;
  var frame = document.createElement('div');
  frame.className = 'ifs-tf-row';

  var numEl = document.createElement('span');
  numEl.className   = 'ifs-tf-num';
  numEl.textContent = 'T' + (idx + 1);
  frame.appendChild(numEl);

  var vals   = [sx, sy, rot, tx, ty];
  var inputs = vals.map(function (v) {
    var inp   = document.createElement('input');
    inp.type  = 'text';
    inp.value = v.toFixed(4);
    frame.appendChild(inp);
    return inp;
  });

  var del           = document.createElement('button');
  del.type          = 'button';
  del.className     = 'ifs-btn-del';
  del.textContent   = _lang() === 'fr' ? 'Suppr.' : 'Del.';
  var rowObj        = { frame: frame, inputs: inputs, numEl: numEl };
  del.addEventListener('click', function () { _removeRow(rowObj); });
  frame.appendChild(del);

  document.getElementById('tf-container').appendChild(frame);
  _rows.push(rowObj);
}

function _removeRow(rowObj) {
  if (rowObj.frame.parentNode) rowObj.frame.parentNode.removeChild(rowObj.frame);
  _rows = _rows.filter(function (r) { return r !== rowObj; });
  _rows.forEach(function (r, i) { r.numEl.textContent = 'T' + (i + 1); });
}

function _clearRows() {
  _rows.forEach(function (r) {
    if (r.frame.parentNode) r.frame.parentNode.removeChild(r.frame);
  });
  _rows = [];
}

function _getTransforms() {
  var out = [];
  _rows.forEach(function (r) {
    var vals = r.inputs.map(function (inp) { return parseFloat(inp.value); });
    if (!vals.some(isNaN)) out.push(vals);
  });
  return out;
}

/* ═══════════════════════════════════════════════════════════════
   PRÉRÉGLAGES  (exposée globalement pour les onclick du HTML)
   ═══════════════════════════════════════════════════════════════ */

function ifsLoadPreset(name) {
  var preset = IFS_PRESETS[name];
  if (!preset) return;
  _clearRows();
  preset.forEach(function (p) { _addRow(p[0], p[1], p[2], p[3], p[4]); });
  _resetImage();
  _setStatus((_lang() === 'fr' ? 'Préréglage chargé : ' : 'Preset loaded: ') + name);
}
window.ifsLoadPreset = ifsLoadPreset;

/* ═══════════════════════════════════════════════════════════════
   SAUVEGARDE PNG
   ═══════════════════════════════════════════════════════════════ */

function _downloadCanvas(canvas, filename) {
  canvas.toBlob(function (blob) {
    var url = URL.createObjectURL(blob);
    var a   = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
}

function _savePNG() {
  if (!_arr) return;
  _downloadCanvas(_arrToCanvas(_arr, _imgSize), 'ifs_iter' + _iter + '.png');
  _setStatus(
    (_lang() === 'fr' ? 'PNG téléchargé (' : 'PNG downloaded (') +
    _imgSize + '×' + _imgSize + ' px).'
  );
}

/* ═══════════════════════════════════════════════════════════════
   SAUVEGARDE / CHARGEMENT JSON
   ═══════════════════════════════════════════════════════════════ */

function _saveTransforms() {
  var tf = _getTransforms();
  if (!tf.length) {
    _setStatus(_lang() === 'fr' ? 'Aucune transformation à sauvegarder.' : 'No transformation to save.');
    return;
  }
  var data = {
    ifs_transforms: tf.map(function (t) {
      return { r: t[0], s: t[1], Rot: t[2], e: t[3], f: t[4] };
    })
  };
  var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  var url  = URL.createObjectURL(blob);
  var a    = document.createElement('a');
  a.href = url; a.download = 'transformations.ifs.json'; a.click();
  URL.revokeObjectURL(url);
  _setStatus(
    tf.length + (_lang() === 'fr' ? ' transformation(s) sauvegardée(s).' : ' transformation(s) saved.')
  );
}

function _loadTransforms() {
  var input = document.getElementById('ifs-file-input');
  input.onchange = function (e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function (ev) {
      try {
        var data  = JSON.parse(ev.target.result);
        var items = data.ifs_transforms || data.transforms;
        if (!items || !items.length)
          throw new Error(_lang() === 'fr' ? 'Aucune transformation trouvée.' : 'No transformation found.');
        _clearRows();
        items.forEach(function (it) {
          /* Accept both new keys (r,s,e,f) and old keys (Sx,Sy,Tx,Ty) */
          _addRow(
            +(it.r  !== undefined ? it.r  : it.Sx),
            +(it.s  !== undefined ? it.s  : it.Sy),
            +it.Rot,
            +(it.e  !== undefined ? it.e  : it.Tx),
            +(it.f  !== undefined ? it.f  : it.Ty)
          );
        });
        _setStatus(
          items.length + (_lang() === 'fr' ? ' transformation(s) chargée(s) depuis ' : ' transformation(s) loaded from ') +
          file.name
        );
      } catch (err) {
        alert((_lang() === 'fr' ? 'Erreur : ' : 'Error: ') + err.message);
      }
      input.value = '';
    };
    reader.readAsText(file);
  };
  input.click();
}

/* ═══════════════════════════════════════════════════════════════
   MODAL — IMAGE COMPLÈTE AVEC ZOOM
   ═══════════════════════════════════════════════════════════════ */

var _modalArr    = null;
var _modalSize   = 0;
var _zoomLevel   = 1.0;
var _modalCanvas = document.getElementById('ifs-modal-canvas');
var _modalCtx    = _modalCanvas.getContext('2d');
var _modalWrap   = document.getElementById('ifs-modal-canvas-wrap');
var _modalOverlay = document.getElementById('ifs-modal-overlay');

function _renderModal() {
  var sz = Math.max(1, Math.round(_modalSize * _zoomLevel));
  _modalCanvas.width  = sz;
  _modalCanvas.height = sz;
  var tmp = _arrToCanvas(_modalArr, _modalSize);
  _modalCtx.imageSmoothingEnabled = false;
  _modalCtx.drawImage(tmp, 0, 0, sz, sz);
  document.getElementById('ifs-zoom-pct').textContent = Math.round(_zoomLevel * 100) + ' %';
}

function ifsSetZoom(z) {
  _zoomLevel = Math.max(0.05, Math.min(16, z));
  _renderModal();
}
window.ifsSetZoom = ifsSetZoom;

function _showFull() {
  if (!_arr) return;
  _modalArr  = _arr.slice();
  _modalSize = _imgSize;
  _zoomLevel = 1.0;

  var titleEl = document.getElementById('ifs-modal-title');
  if (titleEl) titleEl.textContent =
    (_lang() === 'fr' ? 'Image complète — ' : 'Full image — ') +
    _imgSize + '×' + _imgSize + ' px — ' +
    (_lang() === 'fr' ? 'Itération ' : 'Iteration ') + _iter;

  var nBlack = 0;
  for (var i = 0; i < _arr.length; i++) if (_arr[i] === 0) nBlack++;
  var infoEl = document.getElementById('ifs-modal-info');
  if (infoEl) infoEl.textContent =
    _imgSize + '×' + _imgSize + ' px  ·  ' +
    (_lang() === 'fr' ? 'Pixels noirs : ' : 'Black pixels: ') +
    nBlack.toLocaleString() + '  ·  ' +
    (_lang() === 'fr' ? 'Itération : ' : 'Iteration: ') + _iter;

  _renderModal();
  _modalOverlay.classList.add('open');
}

function _closeModal() {
  _modalOverlay.classList.remove('open');
}

/* Zoom Ctrl + molette */
_modalWrap.addEventListener('wheel', function (e) {
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    ifsSetZoom(_zoomLevel * (e.deltaY < 0 ? 1.15 : 1 / 1.15));
  }
}, { passive: false });

/* Fermer avec Échap ou clic sur le fond */
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') _closeModal();
});
_modalOverlay.addEventListener('click', function (e) {
  if (e.target === _modalOverlay) _closeModal();
});

/* ═══════════════════════════════════════════════════════════════
   CÂBLAGE DES BOUTONS
   ═══════════════════════════════════════════════════════════════ */

function _wire(id, fn) {
  var el = document.getElementById(id);
  if (el) el.addEventListener('click', fn);
}

_wire('btn-iter1',     _doIter);
_wire('btn-iter10',    _doIter10);
_wire('btn-auto',      _startAuto);
_wire('btn-stop',      _stopAuto);
_wire('btn-reset',     _resetImage);
_wire('btn-apply-res', _applyResolution);
_wire('btn-add-row',   function () { _addRow(); });
_wire('btn-save-tf',   _saveTransforms);
_wire('btn-load-tf',   _loadTransforms);
_wire('btn-save-png',  _savePNG);
_wire('btn-show-full', _showFull);
_wire('btn-modal-close', _closeModal);
_wire('btn-modal-save', function () {
  if (!_modalArr) return;
  _downloadCanvas(
    _arrToCanvas(_modalArr, _modalSize),
    'ifs_iter' + _iter + '_' + _modalSize + 'px.png'
  );
});

/* Enter dans le champ résolution → Appliquer */
var resInput = document.getElementById('ifs-res-input');
if (resInput) {
  resInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') _applyResolution();
  });
}

/* ═══════════════════════════════════════════════════════════════
   INITIALISATION
   ═══════════════════════════════════════════════════════════════ */

ifsLoadPreset('Sierpinski');

}()); /* fin IIFE */