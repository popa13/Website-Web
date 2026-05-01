(function () {
    'use strict';

    var MB_W = 512, MB_H = 512;
    var JL_W = 512, JL_H = 512;
    var PV_W = 256, PV_H = 256;

    var MB_X0 = -2.5, MB_X1 = 1.0, MB_Y0 = -1.75, MB_Y1 = 1.75;
    var JL_X0 = -1.75, JL_X1 = 1.75, JL_Y0 = -1.75, JL_Y1 = 1.75;

    var cR = -0.7, cI = 0.27;
    var maxIter = 200;
    var dragging = false;
    var pendingFull = null;
    var mbCache = null;

    var mbCanvas, jlCanvas, mbCtx, jlCtx, iterNum, iterRange, cLabel;

    // Mandelbrot: smooth escape-time grayscale
    function mbBright(cr, ci) {
        var zr = 0, zi = 0, zr2, zi2, n;
        for (n = 0; n < maxIter; n++) {
            zr2 = zr * zr; zi2 = zi * zi;
            if (zr2 + zi2 > 4e6) {
                var log_zn = 0.5 * Math.log(zr2 + zi2);
                var nu = Math.log(log_zn / Math.LN2) / Math.LN2;
                var t = Math.max(0, n + 1 - nu) / maxIter;
                return Math.floor(255 * Math.pow(t, 0.4));
            }
            zi = 2 * zr * zi + ci;
            zr = zr2 - zi2 + cr;
        }
        return 0;
    }

    function renderMB() {
        var img = mbCtx.createImageData(MB_W, MB_H);
        var d = img.data;
        var dx = (MB_X1 - MB_X0) / MB_W;
        var dy = (MB_Y1 - MB_Y0) / MB_H;
        for (var py = 0; py < MB_H; py++) {
            var ci = MB_Y1 - py * dy;
            for (var px = 0; px < MB_W; px++) {
                var v = mbBright(MB_X0 + px * dx, ci);
                var i = (py * MB_W + px) * 4;
                d[i] = d[i+1] = d[i+2] = v; d[i+3] = 255;
            }
        }
        mbCtx.putImageData(img, 0, 0);
        mbCache = mbCtx.getImageData(0, 0, MB_W, MB_H);
    }

    // DEM 3D relief: lighting constants (upper-right light at 45° elevation)
    // L = (1, 1, √2) / 2  →  Lx=0.5, Ly=0.5, Lz=√2/2, already unit length
    var LX = 0.5, LY = 0.5, LZ = 0.7071;
    var AMB = 0.2;   // ambient fraction
    // Normal = normalize(Re(z/dz), Im(z/dz), H)
    // With 2D part already unit-length: |N| = sqrt(1 + H²)
    var H = 1.5;
    var NLEN = Math.sqrt(1 + H * H);  // ≈ 1.803

    // Julia: DEM with 3D relief (Lambert shading on potential-surface normal)
    function jlBright(zr0, zi0, iters) {
        var r = zr0, i = zi0, dr = 1, di = 0, n;
        for (n = 0; n < iters; n++) {
            // dz_{n+1} = 2 * z_n * dz_n
            var ndr = 2 * (r * dr - i * di);
            var ndi = 2 * (r * di + i * dr);
            dr = ndr; di = ndi;
            // z_{n+1} = z_n^2 + c
            var nr = r * r - i * i + cR;
            var ni = 2 * r * i + cI;
            r = nr; i = ni;
            if (r * r + i * i > 1e4) {
                // Normal direction: u = z_N / dz_N (complex quotient)
                var den = dr * dr + di * di;
                if (den < 1e-20) return Math.floor(255 * AMB);
                var ux = (r * dr + i * di) / den;  // Re(z/dz)
                var uy = (i * dr - r * di) / den;  // Im(z/dz)
                // Normalize 2D part, then build 3D normal (ux, uy, H)
                var umag = Math.sqrt(ux * ux + uy * uy);
                if (umag < 1e-10) return Math.floor(255 * AMB);
                ux /= umag; uy /= umag;
                // dot(N, L) = (ux*LX + uy*LY + H*LZ) / NLEN
                var dot = (ux * LX + uy * LY + H * LZ) / NLEN;
                var bright = AMB + (1 - AMB) * Math.max(0, dot);
                return Math.floor(255 * bright);
            }
        }
        return 0; // interior of filled Julia set: black
    }

    function renderJL(w, h, iters) {
        var img = jlCtx.createImageData(w, h);
        var d = img.data;
        var dx = (JL_X1 - JL_X0) / w;
        var dy = (JL_Y1 - JL_Y0) / h;
        for (var py = 0; py < h; py++) {
            var zi0 = JL_Y1 - py * dy;
            for (var px = 0; px < w; px++) {
                var v = jlBright(JL_X0 + px * dx, zi0, iters);
                var idx = (py * w + px) * 4;
                d[idx] = d[idx+1] = d[idx+2] = v; d[idx+3] = 255;
            }
        }
        return img;
    }

    function drawJLPreview() {
        var iters = Math.min(maxIter, 80);
        var img = renderJL(PV_W, PV_H, iters);
        var tmp = document.createElement('canvas');
        tmp.width = PV_W; tmp.height = PV_H;
        tmp.getContext('2d').putImageData(img, 0, 0);
        jlCtx.imageSmoothingEnabled = false;
        jlCtx.drawImage(tmp, 0, 0, JL_W, JL_H);
    }

    function drawJLFull() {
        jlCtx.putImageData(renderJL(JL_W, JL_H, maxIter), 0, 0);
    }

    function drawXhair() {
        if (!mbCache) return;
        mbCtx.putImageData(mbCache, 0, 0);
        var px = (cR - MB_X0) / (MB_X1 - MB_X0) * MB_W;
        var py = (MB_Y1 - cI) / (MB_Y1 - MB_Y0) * MB_H;
        mbCtx.save();
        mbCtx.strokeStyle = '#ff4444';
        mbCtx.lineWidth = 1.5;
        mbCtx.beginPath();
        mbCtx.moveTo(px - 12, py); mbCtx.lineTo(px + 12, py);
        mbCtx.moveTo(px, py - 12); mbCtx.lineTo(px, py + 12);
        mbCtx.stroke();
        mbCtx.beginPath();
        mbCtx.arc(px, py, 4, 0, 2 * Math.PI);
        mbCtx.stroke();
        mbCtx.restore();
    }

    function updateLabel() {
        var abs = Math.abs(cI).toFixed(4);
        var s = cI < 0 ? '−' : '+';
        cLabel.textContent = 'c = ' + cR.toFixed(4) + ' ' + s + ' ' + abs + 'i';
    }

    function toComplex(e) {
        var rect = mbCanvas.getBoundingClientRect();
        var px = (e.clientX - rect.left) * MB_W / rect.width;
        var py = (e.clientY - rect.top) * MB_H / rect.height;
        return {
            r: MB_X0 + px / MB_W * (MB_X1 - MB_X0),
            i: MB_Y1 - py / MB_H * (MB_Y1 - MB_Y0)
        };
    }

    function pickC(pos, isFinal) {
        cR = Math.max(MB_X0, Math.min(MB_X1, pos.r));
        cI = Math.max(MB_Y0, Math.min(MB_Y1, pos.i));
        updateLabel();
        drawXhair();
        if (pendingFull) { clearTimeout(pendingFull); pendingFull = null; }
        if (isFinal) {
            drawJLFull();
        } else {
            drawJLPreview();
            pendingFull = setTimeout(function () { drawJLFull(); pendingFull = null; }, 400);
        }
    }

    function init() {
        mbCanvas = document.getElementById('je-mandelbrot');
        jlCanvas = document.getElementById('je-julia');
        if (!mbCanvas || !jlCanvas) return;
        mbCtx = mbCanvas.getContext('2d');
        jlCtx = jlCanvas.getContext('2d');
        iterNum = document.getElementById('je-iter-num');
        iterRange = document.getElementById('je-iter-range');
        cLabel = document.getElementById('je-c-label');

        mbCanvas.width = MB_W; mbCanvas.height = MB_H;
        jlCanvas.width = JL_W; jlCanvas.height = JL_H;

        // Mouse events
        mbCanvas.addEventListener('mousedown', function (e) {
            dragging = true;
            pickC(toComplex(e), false);
        });
        document.addEventListener('mousemove', function (e) {
            if (dragging) pickC(toComplex(e), false);
        });
        document.addEventListener('mouseup', function (e) {
            if (!dragging) return;
            dragging = false;
            pickC(toComplex(e), true);
        });

        // Touch events
        function tp(e) {
            var t = e.touches[0] || e.changedTouches[0];
            return toComplex(t);
        }
        mbCanvas.addEventListener('touchstart', function (e) {
            e.preventDefault(); dragging = true; pickC(tp(e), false);
        }, { passive: false });
        document.addEventListener('touchmove', function (e) {
            if (!dragging) return;
            e.preventDefault(); pickC(tp(e), false);
        }, { passive: false });
        document.addEventListener('touchend', function (e) {
            if (!dragging) return;
            dragging = false; pickC(tp(e), true);
        });

        // Iteration controls
        function applyIter() {
            renderMB(); drawXhair(); drawJLFull();
        }
        iterNum.addEventListener('change', function () {
            var v = Math.max(10, Math.min(2000, parseInt(iterNum.value, 10) || 200));
            iterNum.value = maxIter = v;
            iterRange.value = v;
            applyIter();
        });
        iterRange.addEventListener('input', function () {
            maxIter = parseInt(iterRange.value, 10);
            iterNum.value = maxIter;
        });
        iterRange.addEventListener('change', applyIter);

        updateLabel();
        renderMB();
        drawXhair();
        drawJLFull();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
