const POS = {
    seller: 'VEND-001',
    catalog: [
        { id: 'A1', sku: '770201', name: 'Paca Agua 600ml x24', price: 22000, stock: 80 },
        { id: 'A2', sku: '770202', name: 'Gaseosa Cola 1.5L x12', price: 42000, stock: 40 },
        { id: 'A3', sku: '770203', name: 'Detergente Polvo 1kg x15', price: 78000, stock: 25 },
        { id: 'A4', sku: '770204', name: 'Galletas Surtidas x24', price: 36000, stock: 60 }
    ],
    cart: [],
    dispatched: JSON.parse(localStorage.getItem('tat_pos_dispatched') || '[]')
};

function renderPOSApp() {
    const total = POS.cart.reduce((a, b) => a + b.price * b.qty, 0);
    document.getElementById('pos-app').innerHTML = `
        <header>
            <div><i class="fas fa-cash-register"></i> <strong>TAT-POS Admin</strong></div>
            <div>
                <select style="width:auto;margin:0;background:#1e293b;color:#fff;border-color:#334155;" onchange="POS.seller=this.value">
                    <option value="VEND-001">Cajero: VEND-001 (Carlos)</option>
                    <option value="VEND-002">Cajero: VEND-002 (Laura)</option>
                </select>
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
                <div style="margin-top:20px;display:flex;justify-content:space-between;align-items:center;">
                    <h4>Manifiestos Despachados (${POS.dispatched.length})</h4>
                    <button class="btn" onclick="exportManifestJSON()"><i class="fas fa-file-export"></i> Exportar JSON para Ruta</button>
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
                    ${POS.cart.map(i => `<div style="display:flex;justify-content:space-between;margin-bottom:6px;"><span>${i.qty}x ${i.name}</span><strong>$${(i.price*i.qty).toLocaleString()}</strong></div>`).join('') || '<p style="color:#94a3b8;text-align:center;">Seleccione productos</p>'}
                </div>
                <div style="display:flex;justify-content:space-between;font-size:19px;font-weight:700;margin-bottom:12px;">
                    <span>Total Factura:</span><span>$${total.toLocaleString()}</span>
                </div>
                <button class="btn btn-green" style="width:100%;justify-content:center;" onclick="dispatchOrder()">Facturar y Enviar a App Conductor</button>
            </div>
        </div>
    `;
}

function addItem(id) {
    const p = POS.catalog.find(x => x.id === id);
    const ex = POS.cart.find(x => x.id === id);
    if (ex) ex.qty++; else POS.cart.push({ ...p, qty: 1 });
    renderPOSApp();
}

function dispatchOrder() {
    if (!POS.cart.length) return alert('Carrito vacío.');
    const order = {
        id: 'INV-' + Date.now().toString().slice(-6),
        client: document.getElementById('cName').value || 'Tienda Central',
        address: document.getElementById('cAddr').value || 'Calle 10 # 5-20',
        route: document.getElementById('cRoute').value,
        seller: POS.seller,
        total: POS.cart.reduce((a, b) => a + b.price * b.qty, 0),
        lat: 4.3365 + (Math.random() - 0.5) * 0.025,
        lng: -74.3638 + (Math.random() - 0.5) * 0.025,
        status: 'PENDIENTE'
    };
    POS.dispatched.push(order);
    localStorage.setItem('tat_pos_dispatched', JSON.stringify(POS.dispatched));
    POS.cart = [];
    alert('Factura ' + order.id + ' lista para despacho.');
    renderPOSApp();
}

function exportManifestJSON() {
    const blob = new Blob([JSON.stringify(POS.dispatched, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'manifiesto_ruta.json';
    a.click();
}

renderPOSApp();
