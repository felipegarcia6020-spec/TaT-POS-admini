// ============================================================================
// TAT-POS ADMIN - MODO HÍBRIDO (GOOGLE SHEETS API + RESPALDO OFFLINE JSON)
// ============================================================================
const POS = {
    apiUrl: localStorage.getItem('tat_api_url') || '',
    seller: 'VEND-001',
    catalog: [
        { id: 'A1', sku: '770201', name: 'Paca Agua 600ml x24', price: 22000, stock: 80 },
        { id: 'A2', sku: '770202', name: 'Gaseosa Cola 1.5L x12', price: 42000, stock: 40 },
        { id: 'A3', sku: '770203', name: 'Detergente Polvo 1kg x15', price: 78000, stock: 25 },
        { id: 'A4', sku: '770204', name: 'Galletas Surtidas x24', price: 36000, stock: 60 }
    ],
    cart: [],
    dispatched: JSON.parse(localStorage.getItem('tat_pos_dispatched') || '[]'),
    outbox: JSON.parse(localStorage.getItem('tat_pos_outbox') || '[]'),
    showConfig: false
};

function saveLocal() {
    localStorage.setItem('tat_pos_dispatched', JSON.stringify(POS.dispatched));
    localStorage.setItem('tat_pos_outbox', JSON.stringify(POS.outbox));
}

function renderPOSApp() {
    const total = POS.cart.reduce((a, b) => a + b.price * b.qty, 0);
    const hasCloud = Boolean(POS.apiUrl && POS.apiUrl.startsWith('http'));

    document.getElementById('pos-app').innerHTML = `
        <header>
            <div>
                <i class="fas fa-cash-register"></i> <strong>TAT-POS Admin</strong>
                <span class="badge ${hasCloud ? 'badge-online' : 'badge-offline'}" style="margin-left:8px;">
                    ${hasCloud ? '<i class="fas fa-cloud"></i> Nube Activa' : '<i class="fas fa-hard-drive"></i> Solo Local / JSON'}
                </span>
            </div>
            <div class="header-controls">
                <select style="width:auto;margin:0;background:#1e293b;color:#fff;border-color:#334155;" onchange="POS.seller=this.value">
                    <option value="VEND-001" ${POS.seller==='VEND-001'?'selected':''}>Cajero: VEND-001 (Carlos)</option>
                    <option value="VEND-002" ${POS.seller==='VEND-002'?'selected':''}>Cajero: VEND-002 (Laura)</option>
                </select>
                ${POS.outbox.length > 0 ? `<button class="btn" style="background:#d97706;" onclick="flushOutbox()"><i class="fas fa-rotate"></i> Subir Pendientes (${POS.outbox.length})</button>` : ''}
                <button class="btn btn-dark" onclick="POS.showConfig=true;renderPOSApp()"><i class="fas fa-gear"></i> Configurar Nube</button>
            </div>
        </header>

        <div class="layout">
            <div class="panel">
                <h3>Inventario & Catálogo TAT</h3>
                <div class="prod-grid">
                    ${POS.catalog.map(p => `
                        <div class="prod-item" onclick="addItem('${p.id}')">
                            <small style="color:#64748b;">SKU: ${p.sku}</small>
                            <div style="font-weight:600;margin:4px 0;">${p.name}</div>
                            <div style="color:#15803d;font-weight:700;">$${p.price.toLocaleString()}</div>
                        </div>
                    `).join('')}
                </div>

                <div style="margin-top:22px;padding-top:14px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
                    <div>
                        <h4>Manifiestos Emitidos (${POS.dispatched.length})</h4>
                        <small style="color:#64748b;">Respaldo offline disponible en cualquier momento</small>
                    </div>
                    <button class="btn btn-dark" onclick="exportManifestJSON()"><i class="fas fa-file-export"></i> Exportar JSON para Ruta</button>
                </div>
            </div>

            <div class="panel">
                <h3>Nueva Factura de Ruta</h3>
                <input id="cName" placeholder="Nombre del Cliente / Tienda">
                <input id="cAddr" placeholder="Dirección / Barrio">
                <select id="cRoute">
                    <option value="RUTA-NORTE">Ruta Norte</option>
                    <option value="RUTA-SUR">Ruta Sur</option>
                </select>
                <div style="min-height:130px;border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;padding:10px 0;margin-bottom:10px;">
                    ${POS.cart.map(i => `<div style="display:flex;justify-content:space-between;margin-bottom:6px;"><span>${i.qty}x ${i.name}</span><strong>$${(i.price*i.qty).toLocaleString()}</strong></div>`).join('') || '<p style="color:#94a3b8;text-align:center;margin-top:35px;">Seleccione productos del catálogo</p>'}
                </div>
                <div style="display:flex;justify-content:space-between;font-size:19px;font-weight:700;margin-bottom:12px;">
                    <span>Total Factura:</span><span>$${total.toLocaleString()}</span>
                </div>
                <button class="btn btn-green" style="width:100%;justify-content:center;padding:12px;" onclick="dispatchOrder()">
                    <i class="fas fa-paper-plane"></i> Facturar y Sincronizar con Ruta
                </button>
            </div>
        </div>

        ${POS.showConfig ? `
        <div class="modal-bg">
            <div class="modal-box">
                <h3 style="margin-bottom:8px;"><i class="fas fa-cloud"></i> Conexión Google Sheets (Apps Script)</h3>
                <p style="font-size:13px;color:#475569;margin-bottom:12px;">Pega la URL de tu aplicación web publicada en Google Apps Script. Si lo dejas vacío, funcionará en modo local con exportación JSON.</p>
                <input id="apiInput" value="${POS.apiUrl}" placeholder="https://script.google.com/macros/s/.../exec">
                <div style="display:flex;gap:8px;justify-content:flex-end;">
                    <button class="btn btn-dark" onclick="POS.showConfig=false;renderPOSApp()">Cancelar</button>
                    <button class="btn btn-green" onclick="saveApiUrl()">Guardar URL</button>
                </div>
            </div>
        </div>` : ''}
    `;
}

function saveApiUrl() {
    const val = document.getElementById('apiInput').value.trim();
    POS.apiUrl = val;
    localStorage.setItem('tat_api_url', val);
    POS.showConfig = false;
    renderPOSApp();
}

function addItem(id) {
    const p = POS.catalog.find(x => x.id === id);
    const ex = POS.cart.find(x => x.id === id);
    if (ex) ex.qty++; else POS.cart.push({ ...p, qty: 1 });
    renderPOSApp();
}

async function sendToCloud(order) {
    if (!POS.apiUrl) return false;
    try {
        await fetch(POS.apiUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'CREATE', order })
        });
        return true;
    } catch (err) {
        return false;
    }
}

async function dispatchOrder() {
    if (!POS.cart.length) return alert('El carrito está vacío.');
    const order = {
        id: 'INV-' + Date.now().toString().slice(-6),
        client: document.getElementById('cName').value || 'Tienda Central',
        address: document.getElementById('cAddr').value || 'Calle 10 # 5-20',
        route: document.getElementById('cRoute').value,
        seller: POS.seller,
        items: POS.cart,
        total: POS.cart.reduce((a, b) => a + b.price * b.qty, 0),
        lat: 4.3365 + (Math.random() - 0.5) * 0.025,
        lng: -74.3638 + (Math.random() - 0.5) * 0.025,
        status: 'PENDIENTE'
    };

    POS.dispatched.push(order);
    POS.cart = [];

    if (POS.apiUrl && navigator.onLine) {
        const sent = await sendToCloud(order);
        if (!sent) POS.outbox.push(order);
    } else if (POS.apiUrl) {
        POS.outbox.push(order);
    }

    saveLocal();
    alert('Factura ' + order.id + ' emitida correctamente.');
    renderPOSApp();
}

async function flushOutbox() {
    if (!POS.apiUrl || !navigator.onLine) return alert('Sin conexión a internet o URL no configurada.');
    const remaining = [];
    for (const ord of POS.outbox) {
        const ok = await sendToCloud(ord);
        if (!ok) remaining.push(ord);
    }
    POS.outbox = remaining;
    saveLocal();
    alert('Sincronización de cola completada.');
    renderPOSApp();
}

function exportManifestJSON() {
    const blob = new Blob([JSON.stringify(POS.dispatched, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'manifiesto_ruta_' + new Date().toISOString().slice(0,10) + '.json';
    a.click();
}

window.addEventListener('online', () => { if (POS.outbox.length) flushOutbox(); });
renderPOSApp();
