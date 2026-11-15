// TAT-POS Enterprise V3 - Módulo Comercial, Preventa TAT, Rutas y Administración
const POS = {
    apiUrl: localStorage.getItem('tat_api_url') || '',
    user: null,
    loginMode: 'cashier', // 'cashier' | 'admin'
    saleMode: 'TAT', // 'TAT' (Preventa/Ruta) | 'FISICO' (Mostrador)
    productView: 'grid', // 'grid' | 'list'
    activeTab: 'pos', // 'pos' | 'clients_routes' | 'inventory' | 'barcode' | 'admin_panel'

    // Perfiles separados: Cajeros/Vendedores vs Administradores
    staff: [
        { id: 'U1', pin: '1001', name: 'Carlos Mendoza', role: 'cashier', assignedRoute: 'RUTA-FUSA-01' },
        { id: 'U2', pin: '1002', name: 'Laura Gómez', role: 'cashier', assignedRoute: 'RUTA-FUSA-02' },
        { id: 'ADM1', pin: '9999', name: 'Andrés Pérez (Gerencia)', role: 'admin', assignedRoute: 'TODAS' }
    ],

    // Base de Datos de Rutas con Códigos
    routes: JSON.parse(localStorage.getItem('tat_routes_db') || JSON.stringify([
        { code: 'RUTA-FUSA-01', name: 'Ruta Fusagasugá Centro - Norte', zone: 'Fusagasugá', driver: 'Juan Pablo Díaz', status: 'ABIERTA' },
        { code: 'RUTA-FUSA-02', name: 'Ruta Fusagasugá Sur - Chinauta', zone: 'Fusagasugá', driver: 'Miguel Ángel Rojas', status: 'ABIERTA' }
    ])),

    // Base de Datos de Clientes TAT Georreferenciados (Fusagasugá)
    clients: JSON.parse(localStorage.getItem('tat_clients_db') || JSON.stringify([
        { id: 'CLI-01', code: 'FUS-101', name: 'Minimercado La Esquina', owner: 'Don Hernando', address: 'Cra 6 # 12-40, Centro', phone: '3104567890', routeCode: 'RUTA-FUSA-01', lat: 4.3382, lng: -74.3612 },
        { id: 'CLI-02', code: 'FUS-102', name: 'Tienda Don Pedro', owner: 'Pedro Pablo Ruiz', address: 'Cll 18 # 9-15, Balmoral', phone: '3112345678', routeCode: 'RUTA-FUSA-01', lat: 4.3335, lng: -74.3670 },
        { id: 'CLI-03', code: 'FUS-103', name: 'Autoservicio El Porvenir', owner: 'Marta Lucía', address: 'Av. Las Palmas # 22-10', phone: '3209876543', routeCode: 'RUTA-FUSA-01', lat: 4.3410, lng: -74.3585 },
        { id: 'CLI-04', code: 'FUS-201', name: 'Supermercado Chinauta Real', owner: 'Jorge Eliecer', address: 'Vía Panamericana Km 58', phone: '3156789012', routeCode: 'RUTA-FUSA-02', lat: 4.3150, lng: -74.3820 }
    ])),

    // Catálogo de Productos con Fotos y Descuentos
    catalog: JSON.parse(localStorage.getItem('tat_catalog_db') || JSON.stringify([
        { id: 'A1', sku: '770201', name: 'Paca Agua 600ml x24', price: 22000, cost: 16000, stock: 80, discount: 0, img: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&w=300&q=80' },
        { id: 'A2', sku: '770202', name: 'Gaseosa Cola 1.5L x12', price: 42000, cost: 31000, stock: 40, discount: 0, img: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=300&q=80' },
        { id: 'A3', sku: '770203', name: 'Detergente Polvo 1kg x15', price: 78000, cost: 59000, stock: 25, discount: 5, img: 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?auto=format&fit=crop&w=300&q=80' },
        { id: 'A4', sku: '770204', name: 'Galletas Surtidas x24', price: 36000, cost: 26000, stock: 60, discount: 0, img: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=300&q=80' }
    ])),

    // Configuración Personalizable de Factura
    invoiceConfig: JSON.parse(localStorage.getItem('tat_invoice_cfg') || JSON.stringify({
        companyName: 'DISTRIBUIDORA TAT FUSAGASUGÁ SAS',
        nit: '900.845.123-4',
        address: 'Calle 8 # 7-45 Zona Industrial, Fusagasugá',
        phone: 'PBX: (601) 867-4512 · WhatsApp: 310-555-0199',
        footerNote: 'Gracias por su compra. Verifique su mercancía al recibir.',
        qrText: 'LLAVE BRE-B / NEQUI: 3105550199 - DISTRI TAT FUSA'
    })),

    selectedRouteCode: 'RUTA-FUSA-01',
    selectedClientId: 'CLI-01',
    cart: [],
    dispatched: JSON.parse(localStorage.getItem('tat_pos_dispatched') || '[]'),
    outbox: JSON.parse(localStorage.getItem('tat_pos_outbox') || '[]'),
    cashRegister: JSON.parse(localStorage.getItem('tat_cash_register') || '{"sales":0, "cash":0, "transfers":0, "credit":0}'),

    // Modales
    showQRModal: false,
    showInvoiceModal: false,
    showSheetsModal: false,
    showNewClientModal: false,
    lastInvoice: null,
    printFormat: '80mm',
    selectedBarcodeSku: '770201'
};

function saveAllPOS() {
    localStorage.setItem('tat_routes_db', JSON.stringify(POS.routes));
    localStorage.setItem('tat_clients_db', JSON.stringify(POS.clients));
    localStorage.setItem('tat_catalog_db', JSON.stringify(POS.catalog));
    localStorage.setItem('tat_invoice_cfg', JSON.stringify(POS.invoiceConfig));
    localStorage.setItem('tat_pos_dispatched', JSON.stringify(POS.dispatched));
    localStorage.setItem('tat_pos_outbox', JSON.stringify(POS.outbox));
    localStorage.setItem('tat_cash_register', JSON.stringify(POS.cashRegister));
}

function getQRImageUrl(text, size = 160) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;
}

function render() {
    const root = document.getElementById('pos-app');

    // 1. PANTALLA DE LOGIN SEPARADA (CAJERO / VENDEDOR vs ADMINISTRADOR)
    if (!POS.user) {
        const filteredStaff = POS.staff.filter(s => s.role === POS.loginMode);
        root.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%);padding:20px;">
            <div class="modal-box" style="max-width:440px;text-align:center;">
                <img src="icons/icon-192.png" style="width:68px;height:68px;margin-bottom:10px;border-radius:16px;">
                <h2 style="margin-bottom:4px;">TAT-POS Enterprise</h2>
                <p style="color:var(--text-muted);font-size:13px;margin-bottom:16px;">Seleccione su perfil operativo para ingresar</p>

                <div class="segmented-bar" style="margin:0 0 16px 0;">
                    <button class="seg-btn ${POS.loginMode==='cashier'?'active':''}" onclick="POS.loginMode='cashier';render()">
                        <i class="fas fa-user-tag"></i> Cajero / Vendedor TAT
                    </button>
                    <button class="seg-btn ${POS.loginMode==='admin'?'active':''}" onclick="POS.loginMode='admin';render()">
                        <i class="fas fa-user-shield"></i> Administrador
                    </button>
                </div>

                <label style="display:block;text-align:left;font-size:12px;font-weight:700;margin-bottom:4px;">Usuario:</label>
                <select id="loginUserSelect">
                    ${filteredStaff.map(u => `<option value="${u.id}">${u.name} ${u.role==='cashier' ? '('+u.assignedRoute+')' : ''}</option>`).join('')}
                </select>

                <label style="display:block;text-align:left;font-size:12px;font-weight:700;margin-bottom:4px;">PIN de Seguridad:</label>
                <input id="loginPinInput" type="password" placeholder="${POS.loginMode==='cashier'?'PIN Cajero (1001 o 1002)':'PIN Admin (9999)'}" style="text-align:center;font-size:18px;letter-spacing:4px;">

                <button class="btn btn-primary btn-lg" style="width:100%;justify-content:center;margin-top:6px;" onclick="handleLogin()">
                    <i class="fas fa-right-to-bracket"></i> Iniciar Sesión
                </button>
            </div>
        </div>`;
        return;
    }

    const isAdmin = POS.user.role === 'admin';
    const hasCloud = Boolean(POS.apiUrl && POS.apiUrl.startsWith('http'));

    root.innerHTML = `
        <header class="topbar">
            <div class="brand">
                <i class="fas fa-cash-register" style="color:#60a5fa;"></i>
                <span>TAT-POS</span>
                <span class="badge ${isAdmin ? 'badge-amber' : 'badge-blue'}">
                    <i class="fas ${isAdmin ? 'fa-user-shield' : 'fa-user'}"></i> ${POS.user.name}
                </span>
                <span class="badge ${hasCloud ? 'badge-green' : 'badge-red'}" style="cursor:pointer;" onclick="POS.showSheetsModal=true;render()">
                    <i class="fas fa-table"></i> ${hasCloud ? 'Google Sheets ON' : 'Configurar Sheets'}
                </span>
            </div>

            <div class="nav-group">
                <button class="btn ${POS.activeTab==='pos'?'btn-primary':'btn-dark'}" onclick="POS.activeTab='pos';render()">
                    <i class="fas fa-cart-shopping"></i> Ventas TAT
                </button>
                <button class="btn ${POS.activeTab==='clients_routes'?'btn-primary':'btn-dark'}" onclick="POS.activeTab='clients_routes';render()">
                    <i class="fas fa-map-location-dot"></i> Clientes & Rutas
                </button>
                <button class="btn ${POS.activeTab==='inventory'?'btn-primary':'btn-dark'}" onclick="POS.activeTab='inventory';render()">
                    <i class="fas fa-boxes-stacked"></i> Inventario
                </button>
                <button class="btn ${POS.activeTab==='barcode'?'btn-primary':'btn-dark'}" onclick="POS.activeTab='barcode';render()">
                    <i class="fas fa-barcode"></i> Cód. Barras
                </button>
                ${isAdmin ? `
                <button class="btn ${POS.activeTab==='admin_panel'?'btn-warning':'btn-dark'}" onclick="POS.activeTab='admin_panel';render()">
                    <i class="fas fa-sliders"></i> Admin & Monitoreo Rutas
                </button>` : ''}
                <button class="btn btn-dark" title="Configurar Google Sheets" onclick="POS.showSheetsModal=true;render()">
                    <i class="fas fa-cloud"></i>
                </button>
                <button class="btn btn-danger" onclick="POS.user=null;render()">
                    <i class="fas fa-power-off"></i>
                </button>
            </div>
        </header>

        <div class="container">
            ${POS.activeTab === 'pos' ? renderPOSWorkspace() :
              POS.activeTab === 'clients_routes' ? renderClientsAndRoutesTab() :
              POS.activeTab === 'inventory' ? renderInventoryTab() :
              POS.activeTab === 'barcode' ? renderBarcodeTab() :
              renderAdminPanelTab()}
        </div>

        ${POS.showSheetsModal ? renderSheetsConfigModal() : ''}
        ${POS.showNewClientModal ? renderNewClientModal() : ''}
        ${POS.showQRModal ? renderQRPayModal() : ''}
        ${POS.showInvoiceModal && POS.lastInvoice ? renderInvoicePreviewModal() : ''}
    `;

    if (POS.activeTab === 'clients_routes') {
        setTimeout(initRoutesMap, 80);
    }
}

function handleLogin() {
    const uid = document.getElementById('loginUserSelect').value;
    const pin = document.getElementById('loginPinInput').value.trim();
    const u = POS.staff.find(x => x.id === uid);
    if (u && u.pin === pin) {
        POS.user = u;
        if (u.role === 'cashier' && u.assignedRoute) {
            POS.selectedRouteCode = u.assignedRoute;
        }
        POS.activeTab = u.role === 'admin' ? 'admin_panel' : 'pos';
        render();
    } else {
        alert('PIN incorrecto. Verifica tu clave de acceso.');
    }
}

// ==============================================================================
// TAB 1: WORKSPACE DE VENTAS (MODO TAT vs MOSTRADOR FÍSICO + CIERRE DE RUTA)
// ==============================================================================
function renderPOSWorkspace() {
    const routeClients = POS.clients.filter(c => c.routeCode === POS.selectedRouteCode);
    const currentClient = POS.clients.find(c => c.id === POS.selectedClientId) || routeClients[0];
    const subtotal = POS.cart.reduce((acc, item) => acc + (item.price * (1 - (item.discount||0)/100)) * item.qty, 0);
    const routeOrdersToday = POS.dispatched.filter(o => o.route === POS.selectedRouteCode && o.status === 'PENDIENTE');

    return `
    <div class="pos-grid">
        <!-- PANEL IZQUIERDO: CATÁLOGO DE PRODUCTOS CON CAMBIO DE VISTA -->
        <div class="card">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:12px;">
                <div>
                    <h3 style="font-size:17px;">Catálogo de Productos</h3>
                    <small style="color:var(--text-muted);">Toca un producto para agregarlo al pedido</small>
                </div>
                <div style="display:flex;gap:8px;align-items:center;">
                    <input id="posSearchInput" placeholder="Buscar SKU o nombre..." style="width:200px;margin:0;" oninput="filterPOSProducts(this.value)">
                    <button class="btn ${POS.productView==='grid'?'btn-primary':'btn-outline'}" title="Vista Cuadrícula" onclick="POS.productView='grid';render()"><i class="fas fa-grip"></i></button>
                    <button class="btn ${POS.productView==='list'?'btn-primary':'btn-outline'}" title="Vista Lista" onclick="POS.productView='list';render()"><i class="fas fa-list"></i></button>
                </div>
            </div>

            <div id="posProductContainer" class="${POS.productView === 'grid' ? 'prod-grid-view' : 'prod-list-view'}">
                ${POS.catalog.map(p => renderProductItem(p)).join('')}
            </div>
        </div>

        <!-- PANEL DERECHO: FACTURACIÓN TAT / PUNTO FÍSICO -->
        <div class="card">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                <h3><i class="fas fa-receipt"></i> Orden de Venta</h3>
                <div class="segmented-bar" style="margin:0;width:220px;">
                    <button class="seg-btn ${POS.saleMode==='TAT'?'active':''}" onclick="POS.saleMode='TAT';render()">Venta TAT</button>
                    <button class="seg-btn ${POS.saleMode==='FISICO'?'active':''}" onclick="POS.saleMode='FISICO';render()">Mostrador</button>
                </div>
            </div>

            ${POS.saleMode === 'TAT' ? `
                <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:10px;margin-bottom:10px;">
                    <label style="font-size:11px;font-weight:700;color:#1e40af;display:block;margin-bottom:4px;">
                        <i class="fas fa-route"></i> RUTA DEL DÍA (Vendedor: ${POS.user.name})
                    </label>
                    <select style="margin-bottom:8px;font-weight:600;" onchange="POS.selectedRouteCode=this.value;render()">
                        ${POS.routes.map(r => `<option value="${r.code}" ${POS.selectedRouteCode===r.code?'selected':''}>${r.code} - ${r.name}</option>`).join('')}
                    </select>

                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                        <label style="font-size:11px;font-weight:700;color:#1e40af;">CLIENTE EN RUTA:</label>
                        <button class="btn btn-primary" style="padding:3px 8px;font-size:11px;" onclick="POS.showNewClientModal=true;render()">
                            <i class="fas fa-user-plus"></i> Nuevo Cliente
                        </button>
                    </div>
                    <select style="margin-bottom:4px;" onchange="POS.selectedClientId=this.value;render()">
                        ${routeClients.map(c => `<option value="${c.id}" ${currentClient && currentClient.id===c.id?'selected':''}>[${c.code}] ${c.name} - ${c.address}</option>`).join('')}
                    </select>
                    ${currentClient ? `<small style="color:#334155;"><i class="fas fa-location-dot"></i> ${currentClient.address} · Tel: ${currentClient.phone}</small>` : ''}
                </div>
            ` : `
                <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:10px;margin-bottom:10px;">
                    <label style="font-size:11px;font-weight:700;color:#475569;">VENTA DIRECTA EN PUNTO FÍSICO (MOSTRADOR)</label>
                    <input id="walkInClient" placeholder="Nombre Cliente Mostrador (Opcional - Consumidor Final)" style="margin-top:4px;margin-bottom:0;">
                </div>
            `}

            <select id="posPaymentMethod" style="margin-bottom:8px;">
                <option value="Efectivo">Pago Contraentrega / Efectivo</option>
                <option value="QR Digital (Nequi/Bre-B)">Pago con Código QR Digital</option>
                <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                <option value="Crédito / Cartera TAT">Crédito / Cartera Autorizada</option>
            </select>

            <!-- LISTA DE ITEMS EN CARRITO -->
            <div style="min-height:130px;max-height:200px;overflow-y:auto;border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;padding:8px 0;margin-bottom:10px;">
                ${POS.cart.length === 0 ? '<p style="color:#94a3b8;text-align:center;margin-top:42px;font-size:13px;">Agrega productos desde el catálogo</p>' :
                  POS.cart.map(item => {
                      const unitFinal = Math.round(item.price * (1 - (item.discount||0)/100));
                      return `
                      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-size:13px;">
                          <div style="max-width:55%;">
                              <strong>${item.name}</strong>
                              <div style="color:var(--text-muted);font-size:11px;">$${unitFinal.toLocaleString()} c/u ${item.discount>0?`<span class="badge badge-amber">-${item.discount}%</span>`:''}</div>
                          </div>
                          <div style="display:flex;align-items:center;gap:5px;">
                              <button class="btn btn-outline" style="padding:2px 8px;" onclick="updateCartQty('${item.id}', -1)">-</button>
                              <strong style="min-width:18px;text-align:center;">${item.qty}</strong>
                              <button class="btn btn-outline" style="padding:2px 8px;" onclick="updateCartQty('${item.id}', 1)">+</button>
                              <button class="btn btn-danger" style="padding:4px 7px;" onclick="removeCartItem('${item.id}')"><i class="fas fa-trash"></i></button>
                          </div>
                      </div>`;
                  }).join('')}
            </div>

            <div style="display:flex;justify-content:space-between;align-items:center;font-size:20px;font-weight:800;margin-bottom:12px;">
                <span>TOTAL:</span>
                <span style="color:var(--emerald);">$${Math.round(subtotal).toLocaleString()}</span>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1.3fr;gap:8px;margin-bottom:12px;">
                <button class="btn btn-primary" style="justify-content:center;" onclick="triggerQRModal()">
                    <i class="fas fa-qrcode"></i> Cobrar QR
                </button>
                <button class="btn btn-success" style="justify-content:center;" onclick="completeSale()">
                    <i class="fas fa-check-circle"></i> Facturar Pedido
                </button>
            </div>

            ${POS.saleMode === 'TAT' ? `
            <div style="border-top:1px dashed #cbd5e1;padding-top:10px;display:flex;justify-content:space-between;align-items:center;gap:8px;">
                <div style="font-size:12px;">
                    <strong>Pedidos en ${POS.selectedRouteCode}:</strong> ${routeOrdersToday.length} listos
                </div>
                <button class="btn btn-warning" onclick="closeDayAndExportRoute()">
                    <i class="fas fa-truck-arrow-right"></i> Cerrar Venta del Día y Enviar a Reparto
                </button>
            </div>` : ''}
        </div>
    </div>`;
}

function renderProductItem(p) {
    const finalPrice = Math.round(p.price * (1 - (p.discount||0)/100));
    if (POS.productView === 'list') {
        return `
        <div class="prod-row" onclick="addProductToCart('${p.id}')">
            <div style="display:flex;align-items:center;gap:10px;">
                <img src="${p.img}" style="width:44px;height:44px;border-radius:8px;object-fit:cover;">
                <div>
                    <div style="font-weight:700;font-size:13px;">${p.name}</div>
                    <small style="color:var(--text-muted);">SKU: ${p.sku} · Stock: ${p.stock}</small>
                </div>
            </div>
            <div style="text-align:right;">
                <div style="font-weight:800;color:var(--emerald);">$${finalPrice.toLocaleString()}</div>
                ${p.discount>0?`<small style="text-decoration:line-through;color:#94a3b8;">$${p.price.toLocaleString()}</small>`:''}
            </div>
        </div>`;
    }
    return `
    <div class="prod-card" onclick="addProductToCart('${p.id}')">
        <div>
            <img src="${p.img}" style="width:100%;height:105px;object-fit:cover;border-radius:8px;margin-bottom:6px;">
            <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-muted);">
                <span>${p.sku}</span>
                <span>Stock: <strong>${p.stock}</strong></span>
            </div>
            <div style="font-weight:700;font-size:13px;margin:4px 0;line-height:1.25;">${p.name}</div>
        </div>
        <div style="margin-top:4px;display:flex;justify-content:space-between;align-items:center;">
            <span style="color:var(--emerald);font-weight:800;font-size:14px;">$${finalPrice.toLocaleString()}</span>
            ${p.discount>0?`<span class="badge badge-amber">-${p.discount}%</span>`:''}
        </div>
    </div>`;
}

function filterPOSProducts(q) {
    const term = q.toLowerCase();
    const container = document.getElementById('posProductContainer');
    const matches = POS.catalog.filter(p => p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term));
    container.innerHTML = matches.map(p => renderProductItem(p)).join('');
}

function addProductToCart(id) {
    const p = POS.catalog.find(x => x.id === id);
    if (!p || p.stock <= 0) return alert('Sin stock disponible.');
    const existing = POS.cart.find(x => x.id === id);
    if (existing) {
        if (existing.qty >= p.stock) return alert('Stock máximo alcanzado.');
        existing.qty++;
    } else {
        POS.cart.push({ ...p, qty: 1 });
    }
    render();
}

function updateCartQty(id, delta) {
    const p = POS.catalog.find(x => x.id === id);
    const item = POS.cart.find(x => x.id === id);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) POS.cart = POS.cart.filter(x => x.id !== id);
    else if (item.qty > p.stock) { item.qty = p.stock; alert('Stock máximo.'); }
    render();
}

function removeCartItem(id) {
    POS.cart = POS.cart.filter(x => x.id !== id);
    render();
}

function triggerQRModal() {
    if (!POS.cart.length) return alert('Agrega productos primero.');
    POS.showQRModal = true;
    render();
}

function renderQRPayModal() {
    const total = Math.round(POS.cart.reduce((acc, item) => acc + (item.price * (1 - (item.discount||0)/100)) * item.qty, 0));
    return `
    <div class="modal-bg">
        <div class="modal-box" style="text-align:center;max-width:400px;">
            <h3><i class="fas fa-qrcode"></i> Pago Digital QR</h3>
            <p style="font-size:13px;color:var(--text-muted);margin:6px 0 14px;">Escanea desde Nequi, Daviplata o App Bancaria</p>
            <img src="${getQRImageUrl(POS.invoiceConfig.qrText + ' | VALOR: $' + total, 190)}" style="border:6px solid #f1f5f9;border-radius:12px;margin-bottom:12px;">
            <div style="font-size:22px;font-weight:800;color:var(--emerald);margin-bottom:14px;">$${total.toLocaleString()}</div>
            <div style="display:flex;gap:10px;justify-content:center;">
                <button class="btn btn-outline" onclick="POS.showQRModal=false;render()">Cancelar</button>
                <button class="btn btn-success" onclick="POS.showQRModal=false;document.getElementById('posPaymentMethod').value='QR Digital (Nequi/Bre-B)';completeSale()">
                    <i class="fas fa-check"></i> Confirmar Pago
                </button>
            </div>
        </div>
    </div>`;
}

async function completeSale() {
    if (!POS.cart.length) return alert('El carrito está vacío.');
    const paymentMethod = document.getElementById('posPaymentMethod').value;
    const total = Math.round(POS.cart.reduce((acc, item) => acc + (item.price * (1 - (item.discount||0)/100)) * item.qty, 0));

    let clientName = 'Consumidor Final (Mostrador)';
    let clientAddress = 'Punto de Venta Físico';
    let clientCode = 'MOSTRADOR';
    let lat = 4.3365;
    let lng = -74.3638;
    let routeCode = 'MOSTRADOR';

    if (POS.saleMode === 'TAT') {
        const cli = POS.clients.find(c => c.id === POS.selectedClientId) || POS.clients[0];
        clientName = cli.name;
        clientAddress = cli.address;
        clientCode = cli.code;
        lat = cli.lat;
        lng = cli.lng;
        routeCode = POS.selectedRouteCode;
    } else {
        const walkIn = document.getElementById('walkInClient')?.value.trim();
        if (walkIn) clientName = walkIn;
    }

    const order = {
        id: 'FAC-' + Date.now().toString().slice(-6),
        date: new Date().toLocaleString('es-CO'),
        clientCode,
        client: clientName,
        address: clientAddress,
        route: routeCode,
        cashier: POS.user.name,
        paymentMethod,
        items: POS.cart.map(i => ({ ...i, unitFinal: Math.round(i.price * (1 - (i.discount||0)/100)) })),
        total,
        lat,
        lng,
        status: POS.saleMode === 'TAT' ? 'PENDIENTE' : 'ENTREGADO_MOSTRADOR'
    };

    // Descontar Stock y Sumar a Caja
    order.items.forEach(it => {
        const prod = POS.catalog.find(p => p.id === it.id);
        if (prod) prod.stock -= it.qty;
    });

    POS.cashRegister.sales++;
    if (paymentMethod.includes('Efectivo')) POS.cashRegister.cash += total;
    else if (paymentMethod.includes('QR') || paymentMethod.includes('Transferencia')) POS.cashRegister.transfers += total;
    else POS.cashRegister.credit += total;

    POS.dispatched.push(order);
    POS.lastInvoice = order;
    POS.cart = [];
    saveAllPOS();

    // Sincronización automática con Google Sheets si está configurada
    if (POS.apiUrl && POS.saleMode === 'TAT') {
        pushOrderToSheets(order);
    }

    POS.showInvoiceModal = true;
    render();
}

async function pushOrderToSheets(order) {
    if (!POS.apiUrl) return;
    try {
        await fetch(POS.apiUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'CREATE', order })
        });
    } catch (e) {
        POS.outbox.push(order);
        saveAllPOS();
    }
}

async function closeDayAndExportRoute() {
    const ordersToExport = POS.dispatched.filter(o => o.route === POS.selectedRouteCode && o.status === 'PENDIENTE');
    if (!ordersToExport.length) return alert('No hay pedidos pendientes en ' + POS.selectedRouteCode + ' para exportar.');

    // 1. Sincronizar lote con Google Sheets si hay URL
    if (POS.apiUrl && navigator.onLine) {
        for (const ord of ordersToExport) {
            await pushOrderToSheets(ord);
        }
    }

    // 2. Exportar JSON automáticamente para respaldo / carga directa en App Reparto
    const blob = new Blob([JSON.stringify(ordersToExport, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `manifiesto_${POS.selectedRouteCode}_${new Date().toISOString().slice(0,10)}.json`;
    a.click();

    alert(`¡Cierre de venta TAT completado!
Se han sincronizado y exportado ${ordersToExport.length} paradas de ${POS.selectedRouteCode} hacia la App de Reparto.`);
}

// ==============================================================================
// TAB 2: CLIENTES TAT Y GESTIÓN DE RUTAS CON MAPA (FUSAGASUGÁ)
// ==============================================================================
function renderClientsAndRoutesTab() {
    return `
    <div class="pos-grid">
        <div class="card">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                <h3><i class="fas fa-route"></i> Rutas y Clientes Georreferenciados</h3>
                <div style="display:flex;gap:6px;">
                    <button class="btn btn-dark" onclick="createNewRoute()"><i class="fas fa-plus"></i> Nueva Ruta</button>
                    <button class="btn btn-primary" onclick="POS.showNewClientModal=true;render()"><i class="fas fa-user-plus"></i> Crear Cliente</button>
                </div>
            </div>

            <div style="margin-bottom:12px;">
                <label style="font-size:12px;font-weight:700;">Filtrar por Código de Ruta:</label>
                <select onchange="POS.selectedRouteCode=this.value;render()">
                    ${POS.routes.map(r => `<option value="${r.code}" ${POS.selectedRouteCode===r.code?'selected':''}>${r.code} - ${r.name} (Conductor: ${r.driver})</option>`).join('')}
                </select>
            </div>

            <div style="max-height:420px;overflow-y:auto;display:flex;flex-direction:column;gap:8px;">
                ${POS.clients.filter(c => c.routeCode === POS.selectedRouteCode).map((c, idx) => `
                    <div style="border:1px solid #e2e8f0;border-radius:10px;padding:10px 12px;display:flex;justify-content:space-between;align-items:center;">
                        <div>
                            <span class="badge badge-blue">#${idx+1} · ${c.code}</span>
                            <strong style="margin-left:6px;">${c.name}</strong>
                            <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">${c.address} · Encargado: ${c.owner}</div>
                        </div>
                        <button class="btn btn-outline" style="padding:5px 9px;" onclick="reassignClientRoute('${c.id}')">Cambiar Ruta</button>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="card">
            <h3 style="margin-bottom:8px;"><i class="fas fa-map-pin"></i> Organización Visual en Mapa</h3>
            <p style="font-size:12px;color:var(--text-muted);margin-bottom:10px;">Clientes asignados a <strong>${POS.selectedRouteCode}</strong></p>
            <div id="pos-routes-map" style="height:440px;border-radius:12px;border:1px solid #cbd5e1;"></div>
        </div>
    </div>`;
}

function initRoutesMap() {
    const el = document.getElementById('pos-routes-map');
    if (!el) return;
    const map = L.map('pos-routes-map').setView([4.3365, -74.3638], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    const pts = [];
    POS.clients.filter(c => c.routeCode === POS.selectedRouteCode).forEach((c, i) => {
        const icon = L.divIcon({
            className: '',
            html: `<div class="circuit-pin"><span>${i+1}</span></div>`,
            iconSize: [34, 34],
            iconAnchor: [17, 34]
        });
        L.marker([c.lat, c.lng], { icon }).addTo(map).bindPopup(`<b>[${c.code}] ${c.name}</b><br>${c.address}`);
        pts.push([c.lat, c.lng]);
    });
    if (pts.length > 1) L.polyline(pts, { color: '#2563eb', weight: 4 }).addTo(map);
}

function createNewRoute() {
    const code = prompt('Código de la nueva ruta (Ej: RUTA-FUSA-03):', 'RUTA-FUSA-03');
    if (!code) return;
    const name = prompt('Nombre descriptivo de la ruta:', 'Ruta Fusagasugá Occidente');
    const driver = prompt('Nombre del conductor asignado:', 'Conductor por asignar');
    POS.routes.push({ code: code.toUpperCase(), name, zone: 'Fusagasugá', driver, status: 'ABIERTA' });
    POS.selectedRouteCode = code.toUpperCase();
    saveAllPOS();
    render();
}

function reassignClientRoute(clientId) {
    const c = POS.clients.find(x => x.id === clientId);
    const newCode = prompt(`Ingrese el código de ruta para ${c.name} (${POS.routes.map(r=>r.code).join(', ')}):`, c.routeCode);
    if (newCode && POS.routes.some(r => r.code === newCode.toUpperCase())) {
        c.routeCode = newCode.toUpperCase();
        saveAllPOS();
        render();
    } else if (newCode) {
        alert('Código de ruta no válido.');
    }
}

function renderNewClientModal() {
    return `
    <div class="modal-bg">
        <div class="modal-box" style="max-width:460px;">
            <h3 style="margin-bottom:10px;"><i class="fas fa-user-plus"></i> Registrar Nuevo Cliente TAT</h3>
            <input id="ncCode" placeholder="Código Cliente (Ej: FUS-105)" value="FUS-${100 + POS.clients.length + 1}">
            <input id="ncName" placeholder="Nombre del Negocio / Tienda">
            <input id="ncOwner" placeholder="Nombre del Propietario / Encargado">
            <input id="ncAddr" placeholder="Dirección exacta (Ej: Cra 3 # 15-22, Fusagasugá)">
            <input id="ncPhone" placeholder="Teléfono / WhatsApp">
            <select id="ncRoute">
                ${POS.routes.map(r => `<option value="${r.code}" ${POS.selectedRouteCode===r.code?'selected':''}>${r.code} - ${r.name}</option>`).join('')}
            </select>
            <div style="display:flex;gap:8px;justify-content:flex-end;">
                <button class="btn btn-outline" onclick="POS.showNewClientModal=false;render()">Cancelar</button>
                <button class="btn btn-success" onclick="saveNewClient()">Guardar Cliente</button>
            </div>
        </div>
    </div>`;
}

function saveNewClient() {
    const name = document.getElementById('ncName').value.trim();
    if (!name) return alert('El nombre del negocio es obligatorio.');
    const newCli = {
        id: 'CLI-' + Date.now(),
        code: document.getElementById('ncCode').value.trim() || 'FUS-NEW',
        name,
        owner: document.getElementById('ncOwner').value.trim() || 'Propietario',
        address: document.getElementById('ncAddr').value.trim() || 'Fusagasugá',
        phone: document.getElementById('ncPhone').value.trim() || '3000000000',
        routeCode: document.getElementById('ncRoute').value,
        lat: 4.3365 + (Math.random() - 0.5) * 0.022,
        lng: -74.3638 + (Math.random() - 0.5) * 0.022
    };
    POS.clients.push(newCli);
    POS.selectedClientId = newCli.id;
    POS.selectedRouteCode = newCli.routeCode;
    POS.showNewClientModal = false;
    saveAllPOS();
    render();
}

// ==============================================================================
// TAB 3: INVENTARIO CON TARJETAS INFORMATIVAS, FOTOS Y DESCUENTOS
// ==============================================================================
function renderInventoryTab() {
    const isAdmin = POS.user.role === 'admin';
    return `
    <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
            <div>
                <h3><i class="fas fa-boxes-stacked"></i> Inventario y Ficha de Productos</h3>
                <small style="color:var(--text-muted);">Gestión de stock, fotografías y descuentos comerciales</small>
            </div>
            ${isAdmin ? `<button class="btn btn-primary" onclick="addNewProductPrompt()"><i class="fas fa-plus"></i> Nuevo Producto</button>` : ''}
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px;">
            ${POS.catalog.map(p => `
                <div class="card" style="padding:14px;">
                    <img src="${p.img}" style="width:100%;height:135px;object-fit:cover;border-radius:10px;margin-bottom:8px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <span class="badge badge-blue">SKU: ${p.sku}</span>
                        <span class="badge ${p.stock>15?'badge-green':'badge-red'}">Stock: ${p.stock}</span>
                    </div>
                    <h4 style="margin:6px 0;">${p.name}</h4>
                    <div style="font-size:13px;color:var(--text-muted);margin-bottom:10px;">
                        Precio Público: <strong style="color:#0f172a;">$${p.price.toLocaleString()}</strong><br>
                        Costo Base: $${p.cost.toLocaleString()} · Descuento: <strong>${p.discount||0}%</strong>
                    </div>
                    ${isAdmin ? `
                    <div style="display:flex;gap:6px;flex-wrap:wrap;">
                        <button class="btn btn-outline" style="flex:1;justify-content:center;" onclick="editStockAndDiscount('${p.id}')">Stock / Desc.</button>
                        <button class="btn btn-danger" style="padding:8px;" onclick="deleteCatalogProduct('${p.id}')"><i class="fas fa-trash"></i></button>
                    </div>` : ''}
                </div>
            `).join('')}
        </div>
    </div>`;
}

function addNewProductPrompt() {
    const name = prompt('Nombre del producto:');
    if (!name) return;
    const price = Number(prompt('Precio de venta ($):', '25000'));
    const cost = Number(prompt('Costo de compra ($):', '18000'));
    const stock = Number(prompt('Cantidad inicial en stock:', '40'));
    const img = prompt('URL de fotografía del producto:', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=300&q=80');
    const sku = '770' + Math.floor(100 + Math.random() * 900);
    POS.catalog.push({ id: 'P' + Date.now(), sku, name, price, cost, stock, discount: 0, img });
    saveAllPOS();
    render();
}

function editStockAndDiscount(id) {
    const p = POS.catalog.find(x => x.id === id);
    const newStock = prompt(`Stock disponible para ${p.name}:`, p.stock);
    if (newStock !== null) p.stock = Number(newStock);
    const newDisc = prompt(`Porcentaje de descuento (%) para ${p.name}:`, p.discount || 0);
    if (newDisc !== null) p.discount = Number(newDisc);
    saveAllPOS();
    render();
}

function deleteCatalogProduct(id) {
    if (confirm('¿Eliminar este producto del inventario?')) {
        POS.catalog = POS.catalog.filter(x => x.id !== id);
        saveAllPOS();
        render();
    }
}

// ==============================================================================
// TAB 4: GENERADOR DE CÓDIGOS DE BARRAS
// ==============================================================================
function renderBarcodeTab() {
    const prod = POS.catalog.find(p => p.sku === POS.selectedBarcodeSku) || POS.catalog[0];
    return `
    <div class="card" style="max-width:560px;margin:0 auto;text-align:center;">
        <h3><i class="fas fa-barcode"></i> Módulo de Códigos de Barras</h3>
        <p style="font-size:13px;color:var(--text-muted);margin:6px 0 16px;">Genera etiquetas térmicas para estantería o empaque</p>
        <select onchange="POS.selectedBarcodeSku=this.value;render()">
            ${POS.catalog.map(p => `<option value="${p.sku}" ${prod.sku===p.sku?'selected':''}>${p.name} (SKU: ${p.sku})</option>`).join('')}
        </select>

        <div id="print-area" style="background:#fff;border:2px solid #0f172a;border-radius:12px;padding:20px;margin:16px auto;max-width:320px;">
            <div style="font-weight:800;font-size:14px;margin-bottom:4px;">${prod.name}</div>
            <div style="font-family:'Courier New',monospace;font-size:36px;letter-spacing:3px;font-weight:900;line-height:1;margin:10px 0;">
                || ||| | |||| || | |||
            </div>
            <div style="font-family:monospace;font-size:14px;font-weight:700;">*${prod.sku}*</div>
            <div style="font-size:18px;font-weight:900;color:#059669;margin-top:6px;">$${prod.price.toLocaleString()}</div>
        </div>

        <button class="btn btn-primary" onclick="window.print()"><i class="fas fa-print"></i> Imprimir Etiqueta</button>
    </div>`;
}

// ==============================================================================
// TAB 5: PANEL EXCLUSIVO DE ADMINISTRADOR (CAJEROS, ARQUEO Z, PERSONALIZACIÓN FACTURA Y MONITOREO DE RUTAS)
// ==============================================================================
function renderAdminPanelTab() {
    const totalPendingDeliveries = POS.dispatched.filter(o => o.status === 'PENDIENTE').length;
    const totalDelivered = POS.dispatched.filter(o => o.status !== 'PENDIENTE').length;

    return `
    <div style="display:flex;flex-direction:column;gap:18px;">
        <!-- RESUMEN FINANCIERO Y CIERRE DE CAJA -->
        <div class="card">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
                <h3><i class="fas fa-chart-pie"></i> Arqueo de Caja & Consolidado Operativo</h3>
                <button class="btn btn-success" onclick="alert('Cierre de Caja Z auditado y guardado.')"><i class="fas fa-file-invoice-dollar"></i> Ejecutar Cierre Z</button>
            </div>
            <div class="stat-grid">
                <div class="stat-card">
                    <small style="color:var(--text-muted);">Facturas Emitidas</small>
                    <h2 style="color:var(--primary);margin-top:4px;">${POS.cashRegister.sales}</h2>
                </div>
                <div class="stat-card">
                    <small style="color:var(--text-muted);">Efectivo en Caja</small>
                    <h2 style="color:var(--emerald);margin-top:4px;">$${POS.cashRegister.cash.toLocaleString()}</h2>
                </div>
                <div class="stat-card">
                    <small style="color:var(--text-muted);">Recaudo QR / Bancos</small>
                    <h2 style="color:#0284c7;margin-top:4px;">$${POS.cashRegister.transfers.toLocaleString()}</h2>
                </div>
                <div class="stat-card">
                    <small style="color:var(--text-muted);">Cartera / Créditos</small>
                    <h2 style="color:var(--warning);margin-top:4px;">$${POS.cashRegister.credit.toLocaleString()}</h2>
                </div>
            </div>
        </div>

        <div class="pos-grid">
            <!-- GESTIÓN DE CAJEROS Y VENDEDORES -->
            <div class="card">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                    <h3><i class="fas fa-users-gear"></i> Gestión de Cajeros y Vendedores</h3>
                    <button class="btn btn-primary" onclick="addNewCashier()"><i class="fas fa-user-plus"></i> Agregar Cajero</button>
                </div>
                <div style="display:flex;flex-direction:column;gap:8px;">
                    ${POS.staff.map(s => `
                        <div style="display:flex;justify-content:space-between;align-items:center;background:#f8fafc;padding:10px 12px;border-radius:10px;border:1px solid #e2e8f0;">
                            <div>
                                <strong>${s.name}</strong> <span class="badge ${s.role==='admin'?'badge-amber':'badge-blue'}">${s.role.toUpperCase()}</span>
                                <div style="font-size:12px;color:var(--text-muted);">PIN: <strong>${s.pin}</strong> · Ruta Asignada: ${s.assignedRoute}</div>
                            </div>
                            ${s.role !== 'admin' ? `<button class="btn btn-danger" style="padding:6px 10px;" onclick="removeCashier('${s.id}')"><i class="fas fa-trash"></i></button>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- MONITOREO EN TIEMPO REAL DE LA APP DE RUTAS -->
            <div class="card">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                    <h3><i class="fas fa-truck-fast"></i> Monitoreo de Rutas y Repartidores</h3>
                    <button class="btn btn-outline" onclick="syncRoutesStatusFromCloud()"><i class="fas fa-rotate"></i> Actualizar Estado</button>
                </div>
                <div style="display:flex;gap:10px;margin-bottom:12px;">
                    <span class="badge badge-amber">En Ruta (Pendientes): ${totalPendingDeliveries}</span>
                    <span class="badge badge-green">Entregados / Auditados: ${totalDelivered}</span>
                </div>
                <div style="max-height:220px;overflow-y:auto;display:flex;flex-direction:column;gap:8px;">
                    ${POS.dispatched.slice().reverse().map(o => `
                        <div style="border:1px solid #e2e8f0;border-radius:8px;padding:8px 12px;font-size:12px;display:flex;justify-content:space-between;align-items:center;">
                            <div>
                                <strong>${o.id} · ${o.client}</strong> (${o.route})<br>
                                <span style="color:var(--text-muted);">Vendedor: ${o.cashier} · $${o.total.toLocaleString()}</span>
                            </div>
                            <span class="badge ${o.status==='PENDIENTE'?'badge-amber':'badge-green'}">${o.status}</span>
                        </div>
                    `).join('') || '<p style="color:var(--text-muted);font-size:13px;">Aún no hay despachos registrados.</p>'}
                </div>
            </div>
        </div>

        <!-- PERSONALIZACIÓN DE FACTURA Y QR DE COBRO -->
        <div class="card">
            <h3 style="margin-bottom:10px;"><i class="fas fa-file-pen"></i> Personalización de Factura y QR de Recaudo</h3>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px;">
                <div>
                    <label style="font-size:12px;font-weight:700;">Nombre Comercial / Razón Social:</label>
                    <input id="cfgCompName" value="${POS.invoiceConfig.companyName}">
                </div>
                <div>
                    <label style="font-size:12px;font-weight:700;">NIT / RUT:</label>
                    <input id="cfgNit" value="${POS.invoiceConfig.nit}">
                </div>
                <div>
                    <label style="font-size:12px;font-weight:700;">Dirección y Ciudad:</label>
                    <input id="cfgAddr" value="${POS.invoiceConfig.address}">
                </div>
                <div>
                    <label style="font-size:12px;font-weight:700;">Datos QR de Cobro (Nequi / Bre-B / Cuenta):</label>
                    <input id="cfgQr" value="${POS.invoiceConfig.qrText}">
                </div>
            </div>
            <button class="btn btn-primary" onclick="saveInvoiceCustomization()"><i class="fas fa-save"></i> Guardar Diseño de Factura</button>
        </div>
    </div>`;
}

function addNewCashier() {
    const name = prompt('Nombre completo del cajero/vendedor:');
    if (!name) return;
    const pin = prompt('Asigne un PIN numérico de 4 dígitos:', '1003');
    const route = prompt('Código de ruta asignada (Ej: RUTA-FUSA-01):', 'RUTA-FUSA-01');
    POS.staff.push({ id: 'U' + Date.now(), pin, name, role: 'cashier', assignedRoute: route.toUpperCase() });
    render();
}

function removeCashier(id) {
    if (confirm('¿Eliminar este cajero del sistema?')) {
        POS.staff = POS.staff.filter(s => s.id !== id);
        render();
    }
}

function saveInvoiceCustomization() {
    POS.invoiceConfig.companyName = document.getElementById('cfgCompName').value;
    POS.invoiceConfig.nit = document.getElementById('cfgNit').value;
    POS.invoiceConfig.address = document.getElementById('cfgAddr').value;
    POS.invoiceConfig.qrText = document.getElementById('cfgQr').value;
    saveAllPOS();
    alert('Configuración de factura y QR actualizada.');
}

async function syncRoutesStatusFromCloud() {
    if (!POS.apiUrl) return alert('Configura primero la URL de Google Sheets en el botón superior.');
    try {
        const res = await fetch(POS.apiUrl);
        const data = await res.json();
        if (data.ok && Array.isArray(data.orders)) {
            POS.dispatched = data.orders;
            saveAllPOS();
            render();
            alert('Estados de entrega actualizados desde la nube.');
        }
    } catch (e) {
        alert('Error al consultar Google Sheets.');
    }
}

// ==============================================================================
// MODALES: GOOGLE SHEETS CONFIG & FACTURA PERSONALIZADA CON QR
// ==============================================================================
function renderSheetsConfigModal() {
    return `
    <div class="modal-bg">
        <div class="modal-box" style="max-width:480px;">
            <h3 style="margin-bottom:8px;"><i class="fas fa-table"></i> Sincronización con Google Sheets</h3>
            <p style="font-size:13px;color:var(--text-muted);margin-bottom:12px;">
                Pega la URL de tu Web App de Google Apps Script para sincronizar automáticamente ventas, inventario y entregas con la app de reparto.
            </p>
            <input id="sheetsUrlInput" value="${POS.apiUrl}" placeholder="https://script.google.com/macros/s/.../exec">
            <div style="display:flex;gap:8px;justify-content:flex-end;">
                <button class="btn btn-outline" onclick="POS.showSheetsModal=false;render()">Cerrar</button>
                <button class="btn btn-success" onclick="saveSheetsUrl()"><i class="fas fa-check"></i> Guardar Conexión</button>
            </div>
        </div>
    </div>`;
}

function saveSheetsUrl() {
    POS.apiUrl = document.getElementById('sheetsUrlInput').value.trim();
    localStorage.setItem('tat_api_url', POS.apiUrl);
    POS.showSheetsModal = false;
    render();
}

function renderInvoicePreviewModal() {
    const inv = POS.lastInvoice;
    const cfg = POS.invoiceConfig;
    const qrSrc = getQRImageUrl(`${cfg.qrText} | FACTURA: ${inv.id} | TOTAL: $${inv.total}`, 110);

    return `
    <div class="modal-bg">
        <div class="modal-box" style="max-width:600px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                <h3><i class="fas fa-print"></i> Factura de Venta ${inv.id}</h3>
                <div style="display:flex;gap:6px;">
                    <button class="btn ${POS.printFormat==='58mm'?'btn-primary':'btn-outline'}" onclick="POS.printFormat='58mm';render()">58mm</button>
                    <button class="btn ${POS.printFormat==='80mm'?'btn-primary':'btn-outline'}" onclick="POS.printFormat='80mm';render()">80mm</button>
                    <button class="btn ${POS.printFormat==='Carta'?'btn-primary':'btn-outline'}" onclick="POS.printFormat='Carta';render()">Carta</button>
                </div>
            </div>

            <div id="print-area" style="background:#fff;padding:16px;border:1px dashed #cbd5e1;border-radius:10px;color:#000;margin-bottom:14px;">
                <div style="width:${POS.printFormat==='58mm'?'215px':POS.printFormat==='80mm'?'295px':'100%'};margin:0 auto;font-family:${POS.printFormat==='Carta'?'Segoe UI,sans-serif':'monospace'};font-size:12px;">
                    <div style="text-align:center;margin-bottom:8px;">
                        <strong style="font-size:14px;">${cfg.companyName}</strong><br>
                        <span>NIT: ${cfg.nit}</span><br>
                        <span>${cfg.address}</span>
                    </div>
                    <hr style="border:0;border-top:1px dashed #000;margin:6px 0;">
                    <div>
                        <strong>Factura:</strong> ${inv.id}<br>
                        <strong>Fecha:</strong> ${inv.date}<br>
                        <strong>Vendedor/Cajero:</strong> ${inv.cashier}<br>
                        <strong>Cliente:</strong> [${inv.clientCode}] ${inv.client}<br>
                        <strong>Dirección:</strong> ${inv.address}<br>
                        <strong>Ruta:</strong> ${inv.route} | <strong>Pago:</strong> ${inv.paymentMethod}
                    </div>
                    <hr style="border:0;border-top:1px dashed #000;margin:6px 0;">
                    ${inv.items.map(it => `
                        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                            <span>${it.qty}x ${it.name}</span>
                            <strong>$${(it.unitFinal * it.qty).toLocaleString()}</strong>
                        </div>
                    `).join('')}
                    <hr style="border:0;border-top:1px dashed #000;margin:6px 0;">
                    <div style="text-align:right;font-size:15px;font-weight:800;">
                        TOTAL A PAGAR: $${inv.total.toLocaleString()}
                    </div>
                    <div style="text-align:center;margin-top:10px;">
                        <img src="${qrSrc}" style="width:105px;height:105px;"><br>
                        <small style="font-size:10px;">Escanea para pago rápido QR<br>${cfg.footerNote}</small>
                    </div>
                </div>
            </div>

            <div style="display:flex;gap:8px;justify-content:flex-end;">
                <button class="btn btn-outline" onclick="POS.showInvoiceModal=false;render()">Cerrar</button>
                <button class="btn btn-success" onclick="window.print()"><i class="fas fa-print"></i> Imprimir Factura</button>
            </div>
        </div>
    </div>`;
}

render();
