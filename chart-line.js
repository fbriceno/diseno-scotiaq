// Thin wrapper around uPlot (https://github.com/leeoniya/uPlot) as a plain web component.
// Usage: <qm-line-chart data-json='{"labels":[...],"cur":[...],"prev":[...],"color":"#EC111A","unit":"","meanCur":33.8,"showDots":true}'></qm-line-chart>
(function () {
  function waitForUplot(cb) {
    if (window.uPlot) return cb();
    setTimeout(function () { waitForUplot(cb); }, 30);
  }

  class QmLineChart extends HTMLElement {
    static get observedAttributes() { return ['data-json']; }

    connectedCallback() {
      this.style.display = 'block';
      this.style.width = '100%';
      this.style.height = '100%';
      this.style.position = 'relative';
      this._chartEl = document.createElement('div');
      this._chartEl.style.width = '100%';
      this._chartEl.style.height = '100%';
      this.appendChild(this._chartEl);

      this._tip = document.createElement('div');
      this._tip.style.cssText = 'position:absolute;pointer-events:none;z-index:5;background:#fff;border:1px solid #E3E5E8;border-radius:9px;padding:8px 11px;box-shadow:0 8px 20px -10px rgba(0,0,0,.25);font:600 11.5px Archivo,system-ui,sans-serif;color:#1A1A1A;white-space:nowrap;opacity:0;transition:opacity .1s;';
      this.appendChild(this._tip);

      this._ro = new ResizeObserver(function () { this._resize(); }.bind(this));
      this._ro.observe(this);

      waitForUplot(function () { this._render(); }.bind(this));
    }

    disconnectedCallback() {
      if (this._ro) this._ro.disconnect();
      if (this._u) this._u.destroy();
    }

    attributeChangedCallback() {
      if (window.uPlot && this._chartEl) this._render();
    }

    _resize() {
      if (!this._u) return;
      const w = this.clientWidth, h = this.clientHeight;
      if (w > 10 && h > 10) this._u.setSize({ width: w, height: h });
    }

    _render() {
      if (!this._chartEl) return;
      let data;
      try { data = JSON.parse(this.getAttribute('data-json') || '{}'); } catch (e) { return; }
      if (!data.cur || !data.cur.length) return;
      if (this._u) { this._u.destroy(); this._u = null; }

      const n = data.cur.length;
      const xs = data.cur.map(function (_, i) { return i; });
      const labels = data.labels || xs.map(String);
      const step = Math.max(1, Math.ceil(n / 10));
      const tickIdxs = xs.filter(function (i) { return i % step === 0 || i === n - 1; });
      const unit = data.unit || '';
      const color = data.color || '#EC111A';
      const showDots = !!data.showDots;
      const font = '11px Archivo, system-ui, sans-serif';

      const opts = {
        width: Math.max(10, this.clientWidth || 600),
        height: Math.max(10, this.clientHeight || 190),
        padding: [10, 10, 4, 6],
        cursor: { points: { size: 8, width: 2, stroke: color, fill: '#fff' }, drag: { x: false, y: false } },
        legend: { show: false },
        axes: [
          {
            stroke: '#6B7078', font: font, grid: { stroke: '#F1F2F4', width: 1 },
            ticks: { show: false },
            splits: function () { return tickIdxs; },
            values: function (u, splits) { return splits.map(function (i) { return labels[i] || ''; }); }
          },
          {
            stroke: '#6B7078', font: font, grid: { stroke: '#F1F2F4', width: 1 },
            ticks: { show: false }, side: 3,
            values: function (u, splits) { return splits.map(function (v) { return Math.round(v * 10) / 10 + unit; }); }
          }
        ],
        series: [
          {},
          { stroke: color, width: 2.6, points: { show: showDots, size: 7, stroke: color, fill: '#fff', width: 2 } },
          { stroke: '#B0B4BA', width: 2, dash: [6, 5], points: { show: false } }
        ],
        hooks: {
          draw: [function (u) {
            if (data.meanCur == null) return;
            const ctx = u.ctx;
            const y = u.valToPos(data.meanCur, 'y', true);
            const x0 = u.valToPos(0, 'x', true), x1 = u.valToPos(n - 1, 'x', true);
            ctx.save();
            ctx.strokeStyle = color; ctx.globalAlpha = 0.5; ctx.lineWidth = 1.4;
            ctx.setLineDash([3, 5]);
            ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
            ctx.restore();
          }],
          setCursor: [function (u) {
            const idx = u.cursor.idx;
            if (idx == null) { this._tip.style.opacity = 0; return; }
            const cx = u.cursor.left, cy = u.cursor.top;
            if (cx == null || cx < 0) { this._tip.style.opacity = 0; return; }
            const cur = data.cur[idx], prev = data.prev ? data.prev[idx] : null;
            this._tip.innerHTML =
              '<div style="color:#8A8F98;font-weight:700;margin-bottom:3px">' + (labels[idx] || '') + '</div>' +
              '<div style="color:' + color + '">● Actual: ' + cur + unit + '</div>' +
              (prev != null ? '<div style="color:#8A8F98">● Anterior: ' + prev + unit + '</div>' : '');
            const w = this.clientWidth;
            let left = cx + 14;
            if (left + 140 > w) left = cx - 150;
            this._tip.style.left = left + 'px';
            this._tip.style.top = Math.max(0, cy - 10) + 'px';
            this._tip.style.opacity = 1;
          }.bind(this)]
        }
      };

      const plotData = [xs, data.cur, data.prev || data.cur.map(function () { return null; })];
      this._u = new window.uPlot(opts, plotData, this._chartEl);
    }
  }

  if (!customElements.get('qm-line-chart')) customElements.define('qm-line-chart', QmLineChart);
})();
