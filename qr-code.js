// Wraps the "qrcode" browser build (window.QRCode.toCanvas) as a self-contained web component.
// Usage: <qm-qr-code data-json='{"text":"https://...","size":136,"name":"qr-sucursal"}'></qm-qr-code>
(function () {
  function waitForLib(cb) {
    if (window.QRCode && window.QRCode.toCanvas) return cb();
    setTimeout(function () { waitForLib(cb); }, 30);
  }

  class QmQrCode extends HTMLElement {
    static get observedAttributes() { return ['data-json']; }

    connectedCallback() {
      this._build();
      waitForLib(function () { this._render(); }.bind(this));
    }

    attributeChangedCallback() {
      if (this._built && window.QRCode && window.QRCode.toCanvas) this._render();
    }

    _build() {
      this.style.display = 'block';
      this.innerHTML = '';
      const F = 'font-family:Archivo,system-ui,sans-serif;';
      const wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex; align-items:center; gap:16px; flex-wrap:wrap;';

      const canvasBox = document.createElement('div');
      canvasBox.style.cssText = 'flex:none; padding:12px; background:#fff; border:1px solid #E3E5E8; border-radius:14px; display:flex;';
      this._canvas = document.createElement('canvas');
      canvasBox.appendChild(this._canvas);

      const info = document.createElement('div');
      info.style.cssText = 'flex:1; min-width:200px; display:flex; flex-direction:column; gap:8px;';
      this._urlRow = document.createElement('div');
      this._urlRow.style.cssText = F + 'font-size:12px; font-weight:600; color:#4A4F57; word-break:break-all; background:#FAFBFC; border:1px solid #EEF0F2; border-radius:9px; padding:9px 11px;';

      const btnRow = document.createElement('div');
      btnRow.style.cssText = 'display:flex; gap:8px; flex-wrap:wrap;';
      this._copyBtn = document.createElement('button');
      this._copyBtn.textContent = 'Copiar enlace';
      this._copyBtn.style.cssText = F + 'padding:9px 13px; border-radius:9px; border:1px solid #D6D9DE; background:#fff; font-size:12.5px; font-weight:600; color:#4A4F57; cursor:pointer;';
      this._dlBtn = document.createElement('button');
      this._dlBtn.textContent = 'Descargar PNG';
      this._dlBtn.style.cssText = F + 'padding:9px 13px; border-radius:9px; border:none; background:#EC111A; color:#fff; font-size:12.5px; font-weight:700; cursor:pointer;';
      btnRow.appendChild(this._copyBtn);
      btnRow.appendChild(this._dlBtn);

      info.appendChild(this._urlRow);
      info.appendChild(btnRow);
      wrap.appendChild(canvasBox);
      wrap.appendChild(info);
      this.appendChild(wrap);
      this._built = true;

      this._copyBtn.addEventListener('click', function () {
        const t = this._text || '';
        if (navigator.clipboard) navigator.clipboard.writeText(t).catch(function () {});
        this._copyBtn.textContent = '¡Copiado!';
        setTimeout(function () { this._copyBtn.textContent = 'Copiar enlace'; }.bind(this), 1400);
      }.bind(this));

      this._dlBtn.addEventListener('click', function () {
        const a = document.createElement('a');
        a.href = this._canvas.toDataURL('image/png');
        a.download = (this._name || 'qr') + '.png';
        a.click();
      }.bind(this));
    }

    _render() {
      let data;
      try { data = JSON.parse(this.getAttribute('data-json') || '{}'); } catch (e) { return; }
      this._text = data.text || '';
      this._name = data.name || 'qr';
      this._urlRow.textContent = this._text;
      window.QRCode.toCanvas(this._canvas, this._text, { width: data.size || 132, margin: 1, color: { dark: '#1A1A1A', light: '#FFFFFF' } }, function () {});
    }
  }

  if (!customElements.get('qm-qr-code')) customElements.define('qm-qr-code', QmQrCode);
})();
