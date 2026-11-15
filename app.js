// TAT-POS Enterprise Application Logic
const POS = {
    apiUrl: localStorage.getItem('tat_api_url') || '',
    cashier: null,
    cashiers: [
        { pin: '1001', name: 'Carlos Mendoza', role: 'Cajero Principal' },
        { pin: '1002', name: 'Laura Gómez', role: 'Cajera Auxiliar' },
        { pin: '9999', name: 'Andrés Pérez', role: 'Administrador General' }
    ],
    catalog: [
        { id: 'A1', sku: '770201', name: 'Paca Agua 600ml x24', price: 22000, cost: 16000, stock: 80, img: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&w=300&q=80' },
        { id: 'A2', sku: '770202', name: 'Gaseosa Cola 1.5L x12', price: 42000, cost: 31000, stock: 40, img: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=300&q=80' },
        { id: 'A3', sku: '770203', name: 'Detergente Polvo 1kg x15', price: 78000, cost: 59000, stock: 25, img: 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?auto=format&fit=crop&w=300&q=80' },
        { id: 'A4', sku: '770204', name: 'Galletas Surtidas x24', price: 36000, cost: 26000, stock: 60, img: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=300&q=80' }
    ],
    cart: [],
    dispatched: JSON.parse(localStorage.getItem('tat_pos_dispatched') || '[]'),
    outbox: JSON.parse(localStorage.getItem('tat_pos_outbox') || '[]'),
    cashRegister: JSON.parse(localStorage.getItem('tat_cash_register') || '{"sales":0, "cash":0, "transfers":0, "credit":0, "open":true}'),
    activeTab: 'pos', // pos, inventory, admin, barcode
    showLogin: true,
    showQRModal: false,
    showInvoiceModal: false,
    lastInvoice: null,
    printFormat: '80mm',
    adminPinInput: ''
};

function saveState() {
    localStorage.setItem('tat_pos_dispatched', JSON.stringify(POS.dispatched));
    localStorage.setItem('tat_pos_outbox', JSON.stringify(POS.outbox));
    localStorage.setItem('tat_cash_register', JSON.stringify(POS.cashRegister));
}

function render() {
    const root = document.getElementById('pos-app');
    
    if (POS.showLogin || !POS.cashier) {
        root.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:linear-gradient(135deg, #0f172a, #1e3a8a);padding:20px;">
            <div class="modal-box" style="text-align:center;max-width:420px;">
                <div style="font-size:42px;color:#2563eb;margin-bottom:12px;"><i class="fas fa-cash-register"></i></div>
                <h2 style="margin-bottom:6px;">TAT-POS Enterprise</h2>
                <p style="color:#64748b;margin-bottom:20px;font-size:14px;">Seleccione su usuario e ingrese su PIN de acceso</p>
                <select id="loginCashierPin" style="margin-bottom:12px;">
                    ${POS.cashiers.map(c => `<option value="${c.pin}">${c.name} (${c.role})</option>`).join('')}
                </select>
                <input id="loginPinCode" type="password" placeholder="PIN de acceso (Ej: 1001)" style="text-align:center;letter-spacing:4px;font-size:18px;">
                <button class="btn btn-primary" style="width:100%;justify-content:center;padding:12px;margin-top:8px;" onclick="doLogin()">Ingresar al Sistema POS</button>
            </div>
        </div>`;
        return;
    }

    const total = POS.cart.reduce((a, b) => a + b.price * b.qty, 0);
    const hasCloud = Boolean(POS.apiUrl && POS.apiUrl.startsWith('http'));

    root.innerHTML = `
        <header class="header">
            <div>
                <i class="fas fa-cash-register"></i> <strong>TAT-POS Enterprise</strong>
                <span style="font-size:12px;background:rgba(255,255,255,0.15);padding:3px 8px;border-radius:10px;margin-left:8px;">Cajero: ${POS.cashier.name}</span>
                <span style="font-size:12px;background:${hasCloud?'#16a34a':'#d97706'};color:#fff;padding:3px 8px;border-radius:10px;margin-left:6px;">${hasCloud?'Nube Activa':'Local/JSON'}</span>
            </div>
            <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
                <button class="btn ${POS.activeTab==='pos'?'btn-primary':'btn-dark'}" onclick="POS.activeTab='pos';render()"><i class="fas fa-store"></i> POS Ventas</button>
                <button class="btn ${POS.activeTab==='inventory'?'btn-primary':'btn-dark'}" onclick="POS.activeTab='inventory';render()"><i class="fas fa-boxes-stacked"></i> Inventario</button>
                <button class="btn ${POS.activeTab==='barcode'?'btn-primary':'btn-dark'}" onclick="POS.activeTab='barcode';render()"><i class="fas fa-barcode"></i> Códigos</button>
                <button class="btn ${POS.activeTab==='admin'?'btn-primary':'btn-dark'}" onclick="verifyAdmin()"><i class="fas fa-user-shield"></i> Admin / Arqueo</button>
                <button class="btn btn-danger" onclick="POS.cashier=null;POS.showLogin=true;render()"><i class="fas fa-right-from-bracket"></i> Salir</button>
            </div>
        </header>

        <div style="max-width:1350px;margin:16px auto;padding:0 16px;">
            ${POS.activeTab === 'pos' ? renderPOSView(total) : 
              POS.activeTab === 'inventory' ? renderInventoryView() :
              POS.activeTab === 'barcode' ? renderBarcodeView() : renderAdminView()}
        </div>

        ${POS.showQRModal ? `
        <div class="modal-bg">
            <div class="modal-box" style="text-align:center;">
                <h3><i class="fas fa-qrcode"></i> Cobro Digital QR (Nequi / Daviplata / Bre-B)</h3>
                <p style="color:#64748b;font-size:13px;margin:8px 0 16px;">Escanee el código QR con la app de su banco para completar el recaudo instantáneo.</p>
                <div style="background:#f1f5f9;padding:20px;border-radius:12px;display:inline-block;margin-bottom:16px;">
                    <i class="fas fa-qrcode fa-8x" style="color:#0f172a;"></i>
                </div>
                <div style="font-size:20px;font-weight:bold;color:#16a34a;margin-bottom:16px;" id="qrAmountDisplay"></div>
                <div style="display:flex;gap:10px;justify-content:center;">
                    <button class="btn btn-dark" onclick="POS.showQRModal=false;render()">Cancelar</button>
                    <button class="btn btn-success" onclick="confirmQRPayment()"><i class="fas fa-check"></i> Pago Confirmado</button>
                </div>
            </div>
        </div>` : ''}

        ${POS.showInvoiceModal && POS.lastInvoice ? renderInvoiceModal() : ''}
    `;
}

function doLogin() {
    const pin = document.getElementById('loginPinCode').value;
    const selectedPin = document.getElementById('loginCashierPin').value;
    const found = POS.cashiers.find(c => c.pin === selectedPin);
    if (found && pin === found.pin) {
        POS.cashier = found;
        POS.showLogin = false;
        render();
    } else {
        alert('PIN incorrecto. (Use 1001, 1002 o 9999)');
    }
}

function verifyAdmin() {
    if (POS.cashier.pin !== '9999') {
        const pin = prompt('Ingrese PIN de Administrador (9999):');
        if (pin !== '9999') return alert('Acceso denegado. Se requiere rol de Administrador.');
    }
    POS.activeTab = 'admin';
    render();
}

function renderPOSView(total) {
    return `
    <div class="layout">
        <div class="card">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                <h3>Catálogo de Productos TAT</h3>
                <input id="searchProd" placeholder="Buscar producto por nombre o SKU..." style="max-width:280px;margin:0;" oninput="filterCatalog(this.value)">
            </div>
            <div class="prod-grid" id="catalogGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;max-height:520px;overflow-y:auto;">
                ${POS.catalog.map(p => `
                    <div class="card" style="padding:10px;cursor:pointer;transition:0.15s;text-align:center;" onclick="addToCart('${p.id}')">
                        <img src="${p.img}" style="width:100%;height:110px;object-fit:cover;border-radius:8px;margin-bottom:6px;">
                        <small style="color:#64748b;">SKU: ${p.sku} | Stock: ${p.stock}</small>
                        <div style="font-weight:600;font-size:13px;margin:4px 0;height:36px;overflow:hidden;">${p.name}</div>
                        <div style="color:#16a34a;font-weight:700;">$${p.price.toLocaleString()}</div>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="card">
            <h3>Factura y Venta Actual</h3>
            <input id="cName" placeholder="Nombre Tienda / Cliente (Ej: Tienda La Bendición)">
            <input id="cAddr" placeholder="Dirección / Barrio (Ej: Cra 8 # 14-20)">
            <select id="cRoute">
                <option value="RUTA-NORTE">Ruta 01 - Centro / Norte</option>
                <option value="RUTA-SUR">Ruta 02 - Sur / Occidente</option>
            </select>
            <select id="cPayment">
                <option value="Efectivo">Pago: Efectivo</option>
                <option value="QR Nequi/Daviplata">Pago: Código QR Digital</option>
                <option value="Transferencia Bancaria">Pago: Transferencia Bancaria</option>
                <option value="Crédito Autorizado">Pago: Crédito / Cartera</option>
            </select>

            <div style="min-height:140px;max-height:220px;overflow-y:auto;border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;padding:8px 0;margin-bottom:12px;">
                ${POS.cart.length === 0 ? '<p style="color:#94a3b8;text-align:center;margin-top:40px;">Carrito vacío. Seleccione productos.</p>' :
                  POS.cart.map(i => `
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-size:13px;">
                        <div>
                            <strong>${i.name}</strong><br>
                            <small style="color:#64748b;">$${i.price.toLocaleString()} c/u</small>
                        </div>
                        <div style="display:flex;align-items:center;gap:6px;">
                            <button class="btn btn-dark" style="padding:2px 8px;" onclick="changeQty('${i.id}', -1)">-</button>
                            <span>${i.qty}</span>
                            <button class="btn btn-dark" style="padding:2px 8px;" onclick="changeQty('${i.id}', 1)">+</button>
                            <button class="btn btn-danger" style="padding:2px 8px;" onclick="removeFromCart('${i.id}')"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                  `).join('')}
            </div>

            <div style="display:flex;justify-content:space-between;font-size:20px;font-weight:700;margin-bottom:14px;">
                <span>Total a Pagar:</span><span>$${total.toLocaleString()}</span>
            </div>

            <div style="display:flex;gap:8px;">
                <button class="btn btn-primary" style="flex:1;justify-content:center;" onclick="openQRPayment()"><i class="fas fa-qrcode"></i> Cobrar QR</button>
                <button class="btn btn-success" style="flex:1;justify-content:center;" onclick="dispatchOrder()"><i class="fas fa-check"></i> Emitir Factura</button>
            </div>
        </div>
    </div>`;
}

function filterCatalog(query) {
    const q = query.toLowerCase();
    const grid = document.getElementById('catalogGrid');
    const filtered = POS.catalog.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
    grid.innerHTML = filtered.map(p => `
        <div class="card" style="padding:10px;cursor:pointer;text-align:center;" onclick="addToCart('${p.id}')">
            <img src="${p.img}" style="width:100%;height:110px;object-fit:cover;border-radius:8px;margin-bottom:6px;">
            <small style="color:#64748b;">SKU: ${p.sku} | Stock: ${p.stock}</small>
            <div style="font-weight:600;font-size:13px;margin:4px 0;height:36px;overflow:hidden;">${p.name}</div>
            <div style="color:#16a34a;font-weight:700;">$${p.price.toLocaleString()}</div>
        </div>
    `).join('');
}

function addToCart(id) {
    const p = POS.catalog.find(x => x.id === id);
    if (p.stock <= 0) return alert('Producto sin stock disponible.');
    const ex = POS.cart.find(x => x.id === id);
    if (ex) {
        if (ex.qty >= p.stock) return alert('Stock máximo alcanzado.');
        ex.qty++;
    } else {
        POS.cart.push({ ...p, qty: 1 });
    }
    render();
}

function changeQty(id, delta) {
    const p = POS.catalog.find(x => x.id === id);
    const item = POS.cart.find(x => x.id === id);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) removeFromCart(id);
    else if (item.qty > p.stock) { item.qty = p.stock; alert('Stock máximo alcanzado.'); }
    render();
}

function removeFromCart(id) {
    POS.cart = POS.cart.filter(x => x.id !== id);
    render();
}

function openQRPayment() {
    if (!POS.cart.length) return alert('Carrito vacío.');
    const total = POS.cart.reduce((a, b) => a + b.price * b.qty, 0);
    document.getElementById('qrAmountDisplay').innerText = '$' + total.toLocaleString();
    POS.showQRModal = true;
    render();
}

function confirmQRPayment() {
    POS.showQRModal = false;
    document.getElementById('cPayment').value = 'QR Nequi/Daviplata';
    dispatchOrder();
}

function dispatchOrder() {
    if (!POS.cart.length) return alert('El carrito está vacío.');
    const client = document.getElementById('cName').value || 'Tienda Central';
    const address = document.getElementById('cAddr').value || 'Calle Principal # 10-20';
    const route = document.getElementById('cRoute').value;
    const paymentMethod = document.getElementById('cPayment').value;
    const total = POS.cart.reduce((a, b) => a + b.price * b.qty, 0);

    const order = {
        id: 'INV-' + Date.now().toString().slice(-6),
        date: new Date().toLocaleString('es-CO'),
        client,
        address,
        route,
        cashier: POS.cashier.name,
        paymentMethod,
        items: [...POS.cart],
        total,
        lat: 4.3365 + (Math.random() - 0.5) * 0.025,
        lng: -74.3638 + (Math.random() - 0.5) * 0.025,
        status: 'PENDIENTE'
    };

    // Update stock and cash register
    order.items.forEach(it => {
        const prod = POS.catalog.find(p => p.id === it.id);
        if (prod) prod.stock -= it.qty;
    });

    POS.cashRegister.sales++;
    if (paymentMethod === 'Efectivo') POS.cashRegister.cash += total;
    else if (paymentMethod.includes('QR') || paymentMethod.includes('Transferencia')) POS.cashRegister.transfers += total;
    else POS.cashRegister.credit += total;

    POS.dispatched.push(order);
    POS.lastInvoice = order;
    POS.cart = [];
    saveState();

    POS.showInvoiceModal = true;
    render();
}

function renderInvoiceModal() {
    return `
    <div class="modal-bg">
        <div class="modal-box" style="max-width:620px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                <h3><i class="fas fa-file-invoice"></i> Factura Emitida (${POS.lastInvoice.id})</h3>
                <div>
                    <button class="btn ${POS.printFormat==='58mm'?'btn-primary':'btn-dark'}" onclick="POS.printFormat='58mm';render()">58mm</button>
                    <button class="btn ${POS.printFormat==='80mm'?'btn-primary':'btn-dark'}" onclick="POS.printFormat='80mm';render()">80mm</button>
                    <button class="btn ${POS.printFormat==='Carta'?'btn-primary':'btn-dark'}" onclick="POS.printFormat='Carta';render()">Carta</button>
                </div>
            </div>

            <div id="print-area" style="background:#fff;padding:16px;border:1px dashed #cbd5e1;border-radius:8px;font-family:monospace;font-size:12px;color:#000;margin-bottom:16px;">
                ${POS.printFormat === 'Carta' ? `
                    <div style="font-family:'Segoe UI',sans-serif;">
                        <div style="display:flex;justify-content:space-between;border-bottom:2px solid #0f172a;padding-bottom:10px;margin-bottom:10px;">
                            <div>
                                <h2 style="color:#1e3a8a;margin:0;">TAT-PRO ENTERPRISE SAS</h2>
                                <p style="margin:2px 0;font-size:12px;">NIT: 900.123.456-1 · Factura de Venta TAT</p>
                                <p style="margin:2px 0;font-size:12px;">No. ${POS.lastInvoice.id}</p>
                            </div>
                            <div style="text-align:right;font-size:12px;">
                                <strong>Fecha:</strong> ${POS.lastInvoice.date}<br>
                                <strong>Cajero:</strong> ${POS.lastInvoice.cashier}
                            </div>
                        </div>
                        <p><strong>Cliente:</strong> ${POS.lastInvoice.client} (${POS.lastInvoice.address})</p>
                        <p><strong>Ruta:</strong> ${POS.lastInvoice.route} | <strong>Pago:</strong> ${POS.lastInvoice.paymentMethod}</p>
                        <table style="width:100%;border-collapse:collapse;margin:12px 0;font-size:13px;">
                            <tr style="background:#f1f5f9;border-bottom:1px solid #cbd5e1;"><th style="text-align:left;padding:6px;">Cant Descripción</th><th style="text-align:right;padding:6px;">Subtotal</th></tr>
                            ${POS.lastInvoice.items.map(it => `<tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:6px;">${it.qty}x ${it.name}</td><td style="text-align:right;padding:6px;">$${(it.price*it.qty).toLocaleString()}</td></tr>`).join('')}
                        </table>
                        <h3 style="text-align:right;margin-top:10px;">TOTAL: $${POS.lastInvoice.total.toLocaleString()}</h3>
                    </div>
                ` : `
                    <div style="width:${POS.printFormat==='58mm'?'220px':'300px'};margin:0 auto;text-align:center;">
                        <h4 style="margin:0;">TAT-PRO ENTERPRISE</h4>
                        <p style="margin:2px 0;font-size:11px;">TICKET POS / RUTA TAT</p>
                        <hr style="border:0;border-top:1px dashed #000;margin:6px 0;">
                        <div style="text-align:left;font-size:11px;margin-bottom:6px;">
                            <strong>Factura:</strong> ${POS.lastInvoice.id}<br>
                            <strong>Cliente:</strong> ${POS.lastInvoice.client}<br>
                            <strong>Cajero:</strong> ${POS.lastInvoice.cashier}<br>
                            <strong>Pago:</strong> ${POS.lastInvoice.paymentMethod}<br>
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
                    </div>
                `}
            </div>

            <div style="display:flex;gap:10px;justify-content:flex-end;">
                <button class="btn btn-dark" onclick="POS.showInvoiceModal=false;render()">Cerrar</button>
                <button class="btn btn-success" onclick="window.print()"><i class="fas fa-print"></i> Imprimir</button>
            </div>
        </div>
    </div>`;
}

function renderInventoryView() {
    return `
    <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
            <h3><i class="fas fa-boxes-stacked"></i> Control de Inventario y Stock</h3>
            <button class="btn btn-primary" onclick="addNewProductModal()"><i class="fas fa-plus"></i> Agregar Producto</button>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px;">
            ${POS.catalog.map(p => `
                <div class="card" style="padding:14px;">
                    <img src="${p.img}" style="width:100%;height:130px;object-fit:cover;border-radius:8px;margin-bottom:10px;">
                    <small style="color:#64748b;">SKU: ${p.sku}</small>
                    <h4 style="margin:4px 0;">${p.name}</h4>
                    <p style="font-size:13px;color:#475569;margin-bottom:8px;">Precio: <strong>$${p.price.toLocaleString()}</strong> | Costo: $${p.cost.toLocaleString()}</p>
                    <p style="font-size:13px;margin-bottom:12px;">Stock actual: <span style="background:${p.stock>10?'#dcfce7':'#fee2e2'};color:${p.stock>10?'#166534':'#991b1b'};padding:2px 8px;border-radius:6px;font-weight:700;">${p.stock} unids</span></p>
                    <div style="display:flex;gap:6px;">
                        <button class="btn btn-dark" style="flex:1;justify-content:center;" onclick="adjustStock('${p.id}')">Ajustar Stock</button>
                        <button class="btn btn-danger" style="padding:8px;" onclick="deleteProduct('${p.id}')"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `).join('')}
        </div>
    </div>`;
}

function addNewProductModal() {
    const name = prompt('Nombre del producto:');
    if (!name) return;
    const price = Number(prompt('Precio de venta ($):', '15000'));
    const stock = Number(prompt('Stock inicial:', '50'));
    const img = prompt('URL de imagen (opcional):', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=300&q=80');
    const sku = '770' + Math.floor(100 + Math.random() * 900);
    POS.catalog.push({ id: 'P' + Date.now(), sku, name, price, cost: Math.round(price*0.7), stock, img });
    render();
}

function adjustStock(id) {
    const p = POS.catalog.find(x => x.id === id);
    const qty = prompt(`Nuevo stock para ${p.name}:`, p.stock);
    if (qty !== null) { p.stock = Number(qty); render(); }
}

function deleteProduct(id) {
    if (confirm('¿Eliminar producto del catálogo?')) {
        POS.catalog = POS.catalog.filter(x => x.id !== id);
        render();
    }
}

function renderBarcodeView() {
    return `
    <div class="card" style="max-width:600px;margin:0 auto;text-align:center;">
        <h3><i class="fas fa-barcode"></i> Generador de Códigos de Barras & QR</h3>
        <p style="color:#64748b;font-size:13px;margin:8px 0 20px;">Seleccione un producto para generar su etiqueta térmica de etiquetado.</p>
        <select id="barSel" style="margin-bottom:16px;">
            ${POS.catalog.map(p => `<option value="${p.sku}">${p.name} (SKU: ${p.sku})</option>`).join('')}
        </select>
        <div style="background:#fff;border:1px solid #cbd5e1;padding:24px;border-radius:12px;display:inline-block;margin-bottom:20px;">
            <div style="font-family:monospace;font-size:32px;letter-spacing:6px;font-weight:bold;margin-bottom:10px;">||| | |||| || ||| ||</div>
            <div id="skuDisplay" style="font-weight:700;color:#0f172a;">SKU Seleccionado</div>
        </div>
        <div>
            <button class="btn btn-primary" onclick="alert('Etiqueta enviada a impresora térmica.')"><i class="fas fa-print"></i> Imprimir Etiqueta</button>
        </div>
    </div>`;
}

function renderAdminView() {
    return `
    <div class="card" style="max-width:800px;margin:0 auto;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
            <h3><i class="fas fa-user-shield"></i> Panel de Administrador & Arqueo de Caja Z</h3>
            <button class="btn btn-dark" onclick="POS.activeTab='pos';render()"><i class="fas fa-arrow-left"></i> Volver al POS</button>
        </div>
        
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;margin-bottom:20px;">
            <div class="card" style="background:#f8fafc;padding:14px;">
                <small style="color:#64748b;">Total Ventas Hoy</small>
                <h2 style="color:#1e3a8a;margin-top:4px;">${POS.cashRegister.sales} facturas</h2>
            </div>
            <div class="card" style="background:#f8fafc;padding:14px;">
                <small style="color:#64748b;">Recaudo en Efectivo</small>
                <h2 style="color:#16a34a;margin-top:4px;">$${POS.cashRegister.cash.toLocaleString()}</h2>
            </div>
            <div class="card" style="background:#f8fafc;padding:14px;">
                <small style="color:#64748b;">Recaudo Digital QR / Transferencia</small>
                <h2 style="color:#2563eb;margin-top:4px;">$${POS.cashRegister.transfers.toLocaleString()}</h2>
            </div>
        </div>

        <div style="border-top:1px solid #e2e8f0;padding-top:16px;">
            <h4 style="margin-bottom:10px;">Gestión de Cajeros y Accesos PIN</h4>
            <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px;">
                ${POS.cashiers.map(c => `<div style="display:flex;justify-content:space-between;background:#f8fafc;padding:10px;border-radius:8px;"><span><strong>${c.pin}</strong> - ${c.name} (${c.role})</span></div>`).join('')}
            </div>
            <button class="btn btn-success" onclick="alert('Cierre de caja Z generado y auditado con éxito.')"><i class="fas fa-file-invoice-dollar"></i> Generar Cierre de Caja Z</button>
        </div>
    </div>`;
}

render();
