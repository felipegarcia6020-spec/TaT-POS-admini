const POS = {
    apiUrl: localStorage.getItem('tat_api_url') || '',
    seller: 'VEND-001',
    sellers: [
        { pin: 'VEND-001', name: 'Carlos Mendoza (Caja 1)', zone: 'Centro' },
        { pin: 'VEND-002', name: 'Laura Gómez (Caja 2)', zone: 'Norte' },
        { pin: 'VEND-003', name: 'Andrés Pérez (Supervisor)', zone: 'General' }
    ],
    catalog: [
        { id: 'A1', sku: '770201', name: 'Paca Agua 600ml x24', price: 22000, cost: 16000, stock: 80, cat: 'Bebidas' },
        { id: 'A2', sku: '770202', name: 'Gaseosa Cola 1.5L x12', price: 42000, cost: 31000, stock: 40, cat: 'Bebidas' },
        { id: 'A3', sku: '770203', name: 'Detergente Polvo 1kg x15', price: 78000, cost: 59000, stock: 25, cat: 'Aseo' },
        { id: 'A4', sku: '770204', name: 'Galletas Surtidas x24', price: 36000, cost: 26000, stock: 60, cat: 'Snacks' }
    ],
    cart: [],
    dispatched: JSON.parse(localStorage.getItem('tat_pos_dispatched') || '[]'),
    outbox: JSON.parse(localStorage.getItem('tat_pos_outbox') || '[]'),
    showConfig: false,
    showInvoiceModal: false,
    lastInvoice: null,
    printFormat: '80mm'
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
                <i class="fas fa-cash-register"></i> <strong>TAT-POS Enterprise</strong>
                <span class="badge ${hasCloud ? 'badge-online' : 'badge-offline'}" style="margin-left:8px;">
                    ${hasCloud ? '<i class="fas fa-cloud"></i> Nube Activa' : '<i class="fas fa-hard-drive"></i> Solo Local / JSON'}
                </span>
            </div>
            <div class="header-controls">
                <select style="width:auto;margin:0;background:#1e293b;color:#fff;border-color:#334155;" onchange="POS.seller=this.value">
                    ${POS.sellers.map(s => `<option value="${s.pin}" ${POS.seller===s.pin?'selected':''}>${s.pin} - ${s.name}</option>`).join('')}
                </select>
                ${POS.outbox.length > 0 ? `<button class="btn" style="background:#d97706;" onclick="flushOutbox()"><i class="fas fa-rotate"></i> Subir Nube (${POS.outbox.length})</button>` : ''}
                <button class="btn btn-dark" onclick="POS.showConfig=true;renderPOSApp()"><i class="fas fa-gear"></i> Config</button>
            </div>
        </header>

        <div class="layout">
            <div class="panel">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                    <h3>Catálogo & Inventario TAT</h3>
                    <button class="btn btn-dark" style="padding:6px 10px;" onclick="addNewProduct()"><i class="fas fa-plus"></i> Nuevo Producto</button>
                </div>
                <div class="prod-grid">
                    ${POS.catalog.map(p => `
                        <div class="prod-item" onclick="addItem('${p.id}')">
                            <small style="color:#64748b;">SKU: ${p.sku} | Stock: ${p.stock}</small>
                            <div style="font-weight:600;margin:3px 0;font-size:14px;">${p.name}</div>
                            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px;">
                                <span style="color:#15803d;font-weight:700;">$${p.price.toLocaleString()}</span>
                                <button class="btn btn-dark" style="padding:2px 6px;font-size:11px;" onclick="event.stopPropagation();generateBarcode('${p.sku}')"><i class="fas fa-barcode"></i></button>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div style="margin-top:20px;padding-top:14px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
                    <div>
                        <h4>Manifiestos Despachados (${POS.dispatched.length})</h4>
                        <small style="color:#64748b;">Sincronización híbrida automática o respaldo offline</small>
                    </div>
                    <button class="btn btn-dark" onclick="exportManifestJSON()"><i class="fas fa-file-export"></i> Exportar JSON para Ruta</button>
                </div>
            </div>

            <div class="panel">
                <h3>Nueva Factura & Pedido Ruta</h3>
                <input id="cName" placeholder="Nombre de Tienda / Cliente TAT (Ej: Tienda El Progreso)">
                <input id="cAddr" placeholder="Dirección / Barrio (Ej: Cra 6 # 12-40)">
                <select id="cRoute">
                    <option value="RUTA-NORTE">Ruta 01 - Centro / Norte</option>
                    <option value="RUTA-SUR">Ruta 02 - Sur / Occidente</option>
                </select>
                <select id="cPayment" style="margin-bottom:10px;">
                    <option value="Efectivo">Pago: Efectivo</option>
                    <option value="Nequi / Daviplata">Pago: Nequi / Daviplata</option>
                    <option value="Transferencia Bancaria">Pago: Transferencia Bancaria</option>
                    <option value="Crédito Autorizado">Pago: Crédito / Cartera</option>
                </select>

                <div style="min-height:120px;max-height:220px;overflow-y:auto;border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;padding:8px 0;margin-bottom:10px;">
                    ${POS.cart.length === 0 ? '<p style="color:#94a3b8;text-align:center;margin-top:35px;">Carrito vacío - Seleccione productos</p>' :
                      POS.cart.map(i => `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;"><span>${i.qty}x ${i.name}</span><strong>$${(i.price*i.qty).toLocaleString()}</strong></div>`).join('')}
                </div>
                <div style="display:flex;justify-content:space-between;font-size:19px;font-weight:700;margin-bottom:12px;">
                    <span>Total Factura:</span><span>$${total.toLocaleString()}</span>
                </div>
                <button class="btn btn-green" style="width:100%;justify-content:center;padding:12px;" onclick="dispatchOrder()">
                    <i class="fas fa-file-invoice-dollar"></i> Generar Factura e Imprimir / Enviar a Ruta
                </button>
            </div>
        </div>

        ${POS.showConfig ? `
        <div class="modal-bg">
            <div class="modal-box">
                <h3 style="margin-bottom:8px;"><i class="fas fa-cloud"></i> Conexión Google Sheets & Servidor</h3>
                <p style="font-size:13px;color:#475569;margin-bottom:12px;">Pega la URL de tu aplicación web publicada en Google Apps Script para sincronización automática en la nube.</p>
                <input id="apiInput" value="${POS.apiUrl}" placeholder="https://script.google.com/macros/s/.../exec">
                <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px;">
                    <button class="btn btn-dark" onclick="POS.showConfig=false;renderPOSApp()">Cancelar</button>
                    <button class="btn btn-green" onclick="saveApiUrl()">Guardar URL</button>
                </div>
            </div>
        </div>` : ''}

        ${POS.showInvoiceModal && POS.lastInvoice ? `
        <div class="modal-bg">
            <div class="modal-box" style="max-width:640px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
                    <h3><i class="fas fa-print"></i> Vista Previa Factura y Tickets</h3>
                    <div>
                        <button class="btn ${POS.printFormat==='58mm'?'btn-green':'btn-dark'}" onclick="POS.printFormat='58mm';renderPOSApp()">58mm</button>
                        <button class="btn ${POS.printFormat==='80mm'?'btn-green':'btn-dark'}" onclick="POS.printFormat='80mm';renderPOSApp()">80mm</button>
                        <button class="btn ${POS.printFormat==='Carta'?'btn-green':'btn-dark'}" onclick="POS.printFormat='Carta';renderPOSApp()">Carta DIAN</button>
                    </div>
                </div>

                <div id="print-area" style="background:#fff;padding:16px;border:1px dashed #cbd5e1;border-radius:8px;font-family:monospace;font-size:12px;color:#000;margin-bottom:16px;">
                    ${POS.printFormat === 'Carta' ? `
                        <div style="font-family:'Segoe UI',sans-serif;">
                            <div style="display:flex;justify-content:space-between;border-bottom:2px solid #0f172a;padding-bottom:10px;margin-bottom:10px;">
                                <div>
                                    <h2 style="color:#1e3a8a;margin:0;">TAT-PRO ENTERPRISE SAS</h2>
                                    <p style="margin:2px 0;font-size:12px;">NIT: 900.123.456-1 · Regimen Común</p>
                                    <p style="margin:2px 0;font-size:12px;">Factura Electrónica de Venta No. ${POS.lastInvoice.id}</p>
                                </div>
                                <div style="text-align:right;font-size:12px;">
                                    <strong>CUFE:</strong> 9a8f7c6e5d4b3a2f1...<br>
                                    Fecha: ${POS.lastInvoice.date}
                                </div>
                            </div>
                            <p><strong>Cliente:</strong> ${POS.lastInvoice.client} (${POS.lastInvoice.address})</p>
                            <p><strong>Vendedor / Cajero:</strong> ${POS.lastInvoice.seller} | <strong>Ruta:</strong> ${POS.lastInvoice.route}</p>
                            <table style="width:100%;border-collapse:collapse;margin:12px 0;font-size:13px;">
                                <tr style="background:#f1f5f9;border-bottom:1px solid #cbd5e1;"><th style="text-align:left;padding:6px;">Cant Descripción</th><th style="text-align:right;padding:6px;">Subtotal</th></tr>
                                ${POS.lastInvoice.items.map(it => `<tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:6px;">${it.qty}x ${it.name}</td><td style="text-align:right;padding:6px;">$${(it.price*it.qty).toLocaleString()}</td></tr>`).join('')}
                            </table>
                            <h3 style="text-align:right;margin-top:10px;">TOTAL: $${POS.lastInvoice.total.toLocaleString()}</h3>
                            <div style="margin-top:20px;font-size:11px;text-align:center;color:#475569;border-top:1px solid #cbd5e1;padding-top:8px;">
                                Autorización Facturación Electrónica DIAN No. 18764000000001 desde 2026/01 hasta 2027/01 Prefijo INV<br>
                                Representación gráfica de Factura Electrónica TAT-Pro Enterprise.
                            </div>
                        </div>
                    ` : `
                        <div style="width:${POS.printFormat==='58mm'?'220px':'300px'};margin:0 auto;text-align:center;">
                            <h4 style="margin:0;">TAT-PRO ENTERPRISE</h4>
                            <p style="margin:2px 0;font-size:11px;">NIT 900.123.456-1</p>
                            <p style="margin:2px 0;font-size:11px;">TICKET POS / RUTA TAT</p>
                            <hr style="border:0;border-top:1px dashed #000;margin:6px 0;">
                            <div style="text-align:left;font-size:11px;margin-bottom:6px;">
                                <strong>Factura:</strong> ${POS.lastInvoice.id}<br>
                                <strong>Cliente:</strong> ${POS.lastInvoice.client}<br>
                                <strong>Dirección:</strong> ${POS.lastInvoice.address}<br>
                                <strong>Cajero/Vend:</strong> ${POS.lastInvoice.seller}<br>
                                <strong>Fecha:</strong> ${POS.lastInvoice.date}
                            </div>
                            <hr style="border:0;border-top:1px dashed #000;margin:6px 0;">
                            <div style="text-align:left;font-size:11px;">
                                ${POS.lastInvoice.items.map(it => `<div>${it.qty} x ${it.name}<br><span style="float:right;">$${(it.price*it.qty).toLocaleString()}</span></div><div style="clear:both;"></div>`).join('')}
                            </div>
                            <hr style="border:0;border-top:1px dashed #000;margin:6px 0;">
                            <div style="font-size:14px;font-weight:bold;text-align:right;">
                                TOTAL: $${POS.lastInvoice.total.toLocaleString()}
                            </div>
                            <p style="font-size:10px;margin-top:8px;">¡Gracias por su compra!<br>Control de Ruta Tienda a Tienda</p>
                        </div>
                    `}
                </div>

                <div style="display:flex;gap:10px;justify-content:flex-end;">
                    <button class="btn btn-dark" onclick="POS.showInvoiceModal=false;renderPOSApp()">Cerrar</button>
                    <button class="btn btn-green" onclick="window.print()"><i class="fas fa-print"></i> Imprimir</button>
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

function addNewProduct() {
    const name = prompt('Nombre del nuevo producto:');
    if (!name) return;
    const price = Number(prompt('Precio de venta ($):', '10000'));
    const stock = Number(prompt('Stock inicial:', '50'));
    const sku = '770' + Math.floor(100 + Math.random() * 900);
    POS.catalog.push({ id: 'P' + Date.now(), sku, name, price, cost: Math.round(price*0.75), stock, cat: 'General' });
    renderPOSApp();
}

function generateBarcode(sku) {
    alert('Código de Barras / QR generado para SKU: ' + sku + '\n[||||| | |||| ||| |] (Listo para etiquetado térmico)');
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
    const client = document.getElementById('cName').value || 'Tienda Central';
    const address = document.getElementById('cAddr').value || 'Calle 10 # 5-20';
    const route = document.getElementById('cRoute').value;
    const paymentMethod = document.getElementById('cPayment').value;
    const total = POS.cart.reduce((a, b) => a + b.price * b.qty, 0);

    const order = {
        id: 'INV-' + Date.now().toString().slice(-6),
        date: new Date().toLocaleString('es-CO'),
        client,
        address,
        route,
        seller: POS.seller,
        paymentMethod,
        items: [...POS.cart],
        total,
        lat: 4.3365 + (Math.random() - 0.5) * 0.025,
        lng: -74.3638 + (Math.random() - 0.5) * 0.025,
        status: 'PENDIENTE'
    };

    POS.dispatched.push(order);
    POS.lastInvoice = order;
    POS.cart = [];

    if (POS.apiUrl && navigator.onLine) {
        const sent = await sendToCloud(order);
        if (!sent) POS.outbox.push(order);
    } else if (POS.apiUrl) {
        POS.outbox.push(order);
    }

    saveLocal();
    POS.showInvoiceModal = true;
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
    alert('Sincronización de pendientes completada.');
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
