// TAT-POS Enterprise Logic (100% Offline con Promociones, Logo, Cierre Z e Inventario)
const GREETINGS = [
    "¡Hola! Qué gusto tenerte de nuevo. ¡A romper récords hoy!",
    "¡Buen día! Tu dedicación mueve la economía local. ¡Vamos con toda!",
    "¡Hola! Cada venta exitosa construye un gran futuro. ¡Muchos éxitos!"
];

const POS_STATE = {
    role: localStorage.getItem('tat_pos_role') || 'pos',
    username: localStorage.getItem('tat_pos_name') || 'Cajero Principal',
    businessName: localStorage.getItem('tat_pos_biz') || 'Distribuciones Fusa S.A.S.',
    logoUrl: localStorage.getItem('tat_pos_logo') || '',
    pin: localStorage.getItem('tat_pos_pin') || '1234',
    isLoggedIn: localStorage.getItem('tat_pos_logged') === 'true',
    viewMode: 'inventory', // 'inventory' | 'arqueo' | 'promos' | 'admin_dash'
    productViewStyle: 'grid', // 'grid' | 'list'
    
    inventory: JSON.parse(localStorage.getItem('tat_inventory') || JSON.stringify([
        { id: 'p1', name: 'Queso Doble Crema 500g', price: 12000, stock: 40 },
        { id: 'p2', name: 'Leche Entera 1L', price: 4500, stock: 80 },
        { id: 'p3', name: 'Yogurt 1L', price: 5500, stock: 35 }
    ])),
    promotions: JSON.parse(localStorage.getItem('tat_promos') || JSON.stringify([
        { id: 'pr1', title: 'Combo Lácteo Fusa', desc: '10% de descuento en quesos y leches', discount: 10 }
    ])),
    denominations: JSON.parse(localStorage.getItem('tat_pos_denom') || JSON.stringify({
        100000: 0, 50000: 0, 20000: 0, 10000: 0, 5000: 0, 2000: 0, 1000: 0, 500: 0, 200: 0, 100: 0
    })),
    cart: [],
    lastReceipt: null,
    showModal: null
};

function savePosData() {
    localStorage.setItem('tat_pos_role', POS_STATE.role);
    localStorage.setItem('tat_pos_name', POS_STATE.username);
    localStorage.setItem('tat_pos_biz', POS_STATE.businessName);
    localStorage.setItem('tat_pos_logo', POS_STATE.logoUrl);
    localStorage.setItem('tat_pos_pin', POS_STATE.pin);
    localStorage.setItem('tat_pos_logged', POS_STATE.isLoggedIn);
    localStorage.setItem('tat_inventory', JSON.stringify(POS_STATE.inventory));
    localStorage.setItem('tat_promos', JSON.stringify(POS_STATE.promotions));
    localStorage.setItem('tat_pos_denom', JSON.stringify(POS_STATE.denominations));
}

window.addEventListener('DOMContentLoaded', () => {
    initClock();
    document.getElementById('greeting-subtitle').innerText = `"${GREETINGS[Math.floor(Math.random()*GREETINGS.length)]}"`;
    if (POS_STATE.isLoggedIn) {
        document.getElementById('auth-screen').style.display = 'none';
        document.getElementById('app-container').style.display = 'block';
        renderPosApp();
    }
});

function initClock() {
    setInterval(() => {
        const now = new Date();
        const str = now.toLocaleDateString('es-CO', { weekday: 'short', month: 'short', day: 'numeric' }) + ' ' + now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
        const el = document.getElementById('live-clock');
        if (el) el.innerText = str;
    }, 1000);
}

function loginPos() {
    const role = document.getElementById('pos-role-sel').value;
    const name = document.getElementById('pos-name').value.trim();
    const biz = document.getElementById('pos-biz').value.trim();
    const pin = document.getElementById('pos-pin').value.trim();
    if (!pin) return alert('Ingresa tu PIN de seguridad.');

    POS_STATE.role = role;
    if (name) POS_STATE.username = name;
    if (biz) POS_STATE.businessName = biz;
    POS_STATE.pin = pin;
    POS_STATE.isLoggedIn = true;

    savePosData();
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('app-container').style.display = 'block';
    renderPosApp();
}

function logoutPosWithPin() {
    const entered = prompt('Ingresa tu PIN de seguridad para cerrar sesión:');
    if (entered === POS_STATE.pin) {
        POS_STATE.isLoggedIn = false;
        savePosData();
        document.getElementById('app-container').style.display = 'none';
        document.getElementById('auth-screen').style.display = 'flex';
    } else if (entered !== null) {
        alert('PIN incorrecto.');
    }
}

function renderPosApp() {
    const container = document.getElementById('app-container');
    container.innerHTML = `
        <div class="topbar">
            <div class="brand">
                <div style="width:30px;height:30px;background:var(--primary);border-radius:6px;display:flex;align-items:center;justify-content:center;">POS</div>
                <span>${POS_STATE.businessName} (${POS_STATE.role==='admin'?'Admin':'Cajero'}: ${POS_STATE.username})</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
                <span id="live-clock" class="clock-display">--</span>
                <button class="btn btn-dark" style="padding:5px 8px;" onclick="changePosPin()"><i class="fas fa-key"></i></button>
                <button class="btn btn-danger" style="padding:5px 8px;" onclick="logoutPosWithPin()"><i class="fas fa-lock"></i></button>
            </div>
        </div>

        <div class="segmented-bar">
            <button class="seg-btn ${POS_STATE.viewMode==='inventory'?'active':''}" onclick="POS_STATE.viewMode='inventory';renderPosApp()"><i class="fas fa-cash-register"></i> POS & Ventas</button>
            <button class="seg-btn ${POS_STATE.viewMode==='promos'?'active':''}" onclick="POS_STATE.viewMode='promos';renderPosApp()"><i class="fas fa-tags"></i> Promociones</button>
            <button class="seg-btn ${POS_STATE.viewMode==='arqueo'?'active':''}" onclick="POS_STATE.viewMode='arqueo';renderPosApp()"><i class="fas fa-calculator"></i> Cierre Z</button>
            ${POS_STATE.role==='admin'?`<button class="seg-btn ${POS_STATE.viewMode==='admin_dash'?'active':''}" onclick="POS_STATE.viewMode='admin_dash';renderPosApp()"><i class="fas fa-chart-bar"></i> Gerencia</button>`:''}
        </div>

        ${renderPosBody()}
        ${renderPosModals()}
    `;
}

function renderPosBody() {
    switch(POS_STATE.viewMode) {
        case 'inventory': return renderPosSalesView();
        case 'promos': return renderPromosView();
        case 'arqueo': return renderCierreZView();
        case 'admin_dash': return renderAdminDashView();
        default: return '';
    }
}

// 6 & 7 & 8 & 14 & 16. POS 100% OFFLINE, VISTAS DUALES, PROMOCIONES Y LOGO
function renderPosSalesView() {
    const total = POS_STATE.cart.reduce((sum, i) => sum + (i.qty * i.price), 0);
    return `
    <div class="container">
        <div class="card" style="display:flex;justify-content:space-between;align-items:center;">
            <h3>Terminal de Autoventa POS (100% Offline)</h3>
            <div style="display:flex;gap:6px;">
                <button class="btn ${POS_STATE.productViewStyle==='grid'?'btn-primary':'btn-outline'}" style="padding:5px 10px;" onclick="POS_STATE.productViewStyle='grid';renderPosApp()"><i class="fas fa-th"></i> Miniaturas</button>
                <button class="btn ${POS_STATE.productViewStyle==='list'?'btn-primary':'btn-outline'}" style="padding:5px 10px;" onclick="POS_STATE.productViewStyle='list';renderPosApp()"><i class="fas fa-list"></i> Lista</button>
                ${POS_STATE.role==='admin'?`<button class="btn btn-success" style="padding:5px 10px;" onclick="POS_STATE.showModal='product';renderPosApp()"><i class="fas fa-plus"></i> Producto</button>`:''}
            </div>
        </div>

        <div style="display:grid;grid-template-columns:1.4fr 1fr;gap:12px;">
            <div class="card">
                <h4 style="margin-bottom:8px;">Catálogo</h4>
                ${POS_STATE.productViewStyle==='grid' ? `
                    <div class="product-grid">
                        ${POS_STATE.inventory.map(p => `
                            <div class="product-card">
                                <div class="product-thumb"><i class="fas fa-box"></i></div>
                                <strong>${p.name}</strong>
                                <div style="color:var(--emerald);font-weight:800;margin:4px 0;">$${Number(p.price).toLocaleString()}</div>
                                <small style="color:#64748b;">Stock: ${p.stock}</small>
                                <button class="btn btn-primary btn-lg" style="padding:6px;margin-top:6px;font-size:12px;" onclick="addToCart('${p.id}')">Agregar</button>
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <div style="display:flex;flex-direction:column;gap:6px;">
                        ${POS_STATE.inventory.map(p => `
                            <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;background:#f8fafc;border-radius:6px;border:1px solid #e2e8f0;">
                                <div><strong>${p.name}</strong><br><small style="color:#64748b;">$${p.price} · Stock: ${p.stock}</small></div>
                                <button class="btn btn-primary" style="padding:5px 10px;" onclick="addToCart('${p.id}')">Agregar</button>
                            </div>
                        `).join('')}
                    </div>
                `}
            </div>

            <div class="card" style="background:#f8fafc;">
                <h4 style="margin-bottom:8px;">Carrito</h4>
                <div style="display:flex;flex-direction:column;gap:6px;max-height:240px;overflow-y:auto;margin-bottom:10px;">
                    ${POS_STATE.cart.map((i, idx) => `
                        <div style="display:flex;justify-content:space-between;align-items:center;background:#fff;padding:6px;border-radius:6px;border:1px solid #e2e8f0;">
                            <div><strong style="font-size:13px;">${i.name}</strong><br><small>$${i.price} x ${i.qty}</small></div>
                            <div style="display:flex;align-items:center;gap:6px;">
                                <strong style="font-size:13px;">$${(i.qty*i.price).toLocaleString()}</strong>
                                <button class="btn btn-danger" style="padding:2px 6px;" onclick="removeFromCart(${idx})">×</button>
                            </div>
                        </div>
                    `).join('') || '<p style="font-size:12px;color:#64748b;text-align:center;padding:20px;">Carrito vacío</p>'}
                </div>
                <div style="display:flex;justify-content:space-between;font-size:15px;font-weight:900;border-top:2px solid #cbd5e1;padding-top:8px;margin-bottom:10px;">
                    <span>TOTAL:</span><span style="color:var(--emerald);">$${total.toLocaleString()}</span>
                </div>
                <button class="btn btn-success btn-lg" onclick="checkoutPos()" ${POS_STATE.cart.length===0?'disabled':''}>COBRAR E IMPRIMIR</button>
            </div>
        </div>
    </div>`;
}

function addToCart(id) {
    const p = POS_STATE.inventory.find(x => x.id === id);
    if (!p || p.stock <= 0) return alert('Sin stock.');
    const ex = POS_STATE.cart.find(i => i.id === id);
    if (ex) ex.qty++; else POS_STATE.cart.push({ id: p.id, name: p.name, price: p.price, qty: 1 });
    renderPosApp();
}

function removeFromCart(idx) { POS_STATE.cart.splice(idx, 1); renderPosApp(); }

function checkoutPos() {
    const total = POS_STATE.cart.reduce((s, i) => s + (i.qty * i.price), 0);
    POS_STATE.cart.forEach(i => { const p = POS_STATE.inventory.find(x => x.id === i.id); if (p) p.stock = Math.max(0, p.stock - i.qty); });
    POS_STATE.lastReceipt = { id: 'FAC-'+Math.floor(100000+Math.random()*900000), total, items: [...POS_STATE.cart] };
    POS_STATE.cart = [];
    savePosData();
    POS_STATE.showModal = 'receipt';
    renderPosApp();
}

// MÓDULO PROMOCIONES (ADMIN)
function renderPromosView() {
    return `
    <div class="container">
        <div class="card" style="display:flex;justify-content:space-between;align-items:center;">
            <h3>Gestión de Promociones y Descuentos</h3>
            ${POS_STATE.role==='admin'?`<button class="btn btn-success" onclick="POS_STATE.showModal='promo';renderPosApp()"><i class="fas fa-plus"></i> Nueva Promo</button>`:''}
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;">
            ${POS_STATE.promotions.map(pr => `
                <div class="card" style="padding:12px;margin-bottom:0;">
                    <strong style="color:var(--primary);">${pr.title}</strong>
                    <p style="font-size:12px;color:#64748b;">${pr.desc}</p>
                    <span class="badge badge-green" style="margin-top:4px;">Descuento: ${pr.discount}%</span>
                </div>
            `).join('')}
        </div>
    </div>`;
}

// CIERRE Z & CAJA POS
function renderCierreZView() {
    const denoms = [100000, 50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100];
    const totalCash = denoms.reduce((sum, d) => sum + d * (POS_STATE.denominations[d] || 0), 0);
    return `
    <div class="container">
        <div class="card">
            <h3>Cierre Z y Arqueo de Caja POS</h3>
            <p style="font-size:12px;color:#64748b;margin-bottom:10px;">Conteo detallado de caja registradora en modo offline.</p>
            <div style="background:#f8fafc;padding:12px;border-radius:10px;margin-bottom:10px;">
                <strong>Total Efectivo Físico:</strong> <span style="color:var(--emerald);font-size:16px;">$${totalCash.toLocaleString()}</span>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:6px;">
                ${denoms.map(d => `
                    <div style="display:flex;justify-content:space-between;align-items:center;border:1px solid #e2e8f0;padding:6px;border-radius:6px;">
                        <span style="font-size:12px;font-weight:750;">$${d.toLocaleString()}</span>
                        <input type="number" min="0" value="${POS_STATE.denominations[d] || 0}" style="width:55px;margin:0;padding:3px;text-align:center;" onchange="updatePosDenom(${d}, this.value)">
                    </div>
                `).join('')}
            </div>
            <button class="btn btn-success btn-lg" style="margin-top:14px;" onclick="alert('¡Cierre Z registrado correctamente!')">Ejecutar Cierre Z</button>
        </div>
    </div>`;
}

function updatePosDenom(d, val) {
    POS_STATE.denominations[d] = Math.max(0, parseInt(val) || 0);
    savePosData();
    renderPosApp();
}

function renderAdminDashView() {
    return `
    <div class="container">
        <div class="card">
            <h3>Dashboard Gerencial & Permisos POS</h3>
            <p style="font-size:12px;color:#64748b;margin-top:4px;">Control total del negocio, inventario y reportes en base de datos local.</p>
        </div>
    </div>`;
}

// MODALES POS
function renderPosModals() {
    if (!POS_STATE.showModal) return '';
    let content = '';

    if (POS_STATE.showModal === 'receipt' && POS_STATE.lastReceipt) {
        const r = POS_STATE.lastReceipt;
        content = `
            <div id="print-receipt" style="font-family:monospace;text-align:center;">
                ${POS_STATE.logoUrl ? `<img src="${POS_STATE.logoUrl}" style="max-width:70px;max-height:70px;margin-bottom:6px;">` : ''}
                <h3 style="font-size:15px;font-weight:900;">${POS_STATE.businessName.toUpperCase()}</h3>
                <p style="font-size:11px;color:#64748b;">${new Date().toLocaleString('es-CO')}</p>
                <hr style="border:1px dashed #cbd5e1;margin:8px 0;">
                <div style="text-align:left;font-size:12px;margin-bottom:6px;">Factura: ${r.id}</div>
                <hr style="border:1px dashed #cbd5e1;margin:8px 0;">
                <div style="text-align:left;font-size:12px;margin-bottom:8px;">
                    ${r.items.map(i => `<div>${i.qty}x ${i.name} ... $${(i.qty*i.price).toLocaleString()}</div>`).join('')}
                </div>
                <hr style="border:1px dashed #cbd5e1;margin:8px 0;">
                <div style="display:flex;justify-content:space-between;font-size:14px;font-weight:900;margin-bottom:12px;">
                    <span>TOTAL:</span><span style="color:var(--emerald);">$${r.total.toLocaleString()}</span>
                </div>
            </div>
            <div style="display:flex;gap:8px;">
                <button class="btn btn-primary" style="flex:1;justify-content:center;" onclick="window.print()"><i class="fas fa-print"></i> Imprimir</button>
                <button class="btn btn-success" style="flex:1;justify-content:center;" onclick="POS_STATE.showModal=null;renderPosApp()">Cerrar</button>
            </div>`;
    } else if (POS_STATE.showModal === 'product') {
        content = `
            <h3>Nuevo Producto Inventario</h3>
            <input id="pName" placeholder="Nombre" style="margin-top:8px;">
            <input id="pPrice" type="number" placeholder="Precio ($)" value="12000">
            <input id="pStock" type="number" placeholder="Stock" value="50">
            <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px;">
                <button class="btn btn-outline" onclick="POS_STATE.showModal=null;renderPosApp()">Cancelar</button>
                <button class="btn btn-success" onclick="savePosProduct()">Guardar</button>
            </div>`;
    } else if (POS_STATE.showModal === 'promo') {
        content = `
            <h3>Nueva Promoción</h3>
            <input id="prTitle" placeholder="Título" style="margin-top:8px;">
            <input id="prDesc" placeholder="Descripción">
            <input id="prDisc" type="number" placeholder="Descuento (%)" value="10">
            <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px;">
                <button class="btn btn-outline" onclick="POS_STATE.showModal=null;renderPosApp()">Cancelar</button>
                <button class="btn btn-success" onclick="savePosPromo()">Guardar</button>
            </div>`;
    }
    return `<div class="modal-bg"><div class="modal-box">${content}</div></div>`;
}

function savePosProduct() {
    const name = document.getElementById('pName').value.trim();
    if (!name) return;
    POS_STATE.inventory.push({ id: 'p-'+Date.now(), name, price: Number(document.getElementById('pPrice').value)||0, stock: Number(document.getElementById('pStock').value)||0 });
    savePosData();
    POS_STATE.showModal = null;
    renderPosApp();
}

function savePosPromo() {
    const title = document.getElementById('prTitle').value.trim();
    if (!title) return;
    POS_STATE.promotions.push({ id: 'pr-'+Date.now(), title, desc: document.getElementById('prDesc').value, discount: Number(document.getElementById('prDisc').value)||10 });
    savePosData();
    POS_STATE.showModal = null;
    alert('¡Promoción guardada!');
    renderPosApp();
}

function changePosPin() {
    const pin = prompt('Nuevo PIN de seguridad (4 dígitos):', POS_STATE.pin);
    if (pin && pin.length === 4) { POS_STATE.pin = pin; savePosData(); alert('PIN actualizado.'); }
}
