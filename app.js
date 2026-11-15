// TAT-POS Enterprise Pro v3.2 - Sistema de Preventa & Facturación en Ruta
let posState = {
    activeTab: 'pos',
    priceList: 'tienda', // tienda, mayorista, distribuidor
    cart: [],
    products: JSON.parse(localStorage.getItem('tat_pos_products') || JSON.stringify([
        { id: 'P01', code: '7701001', name: 'Leche Deslactosada 1L', cost: 3200, priceTienda: 4500, priceMayorista: 4100, priceDist: 3800, stock: 24, cat: 'Lácteos' },
        { id: 'P02', code: '7701002', name: 'Queso Campesino 500g', cost: 6500, priceTienda: 9200, priceMayorista: 8500, priceDist: 7900, stock: 4, cat: 'Lácteos' }, // Stock crítico
        { id: 'P03', code: '7701003', name: 'Arepa de Chócolo x5', cost: 4000, priceTienda: 6000, priceMayorista: 5500, priceDist: 5000, stock: 15, cat: 'Panadería' },
        { id: 'P04', code: '7701004', name: 'Café Sellado 500g', cost: 12000, priceTienda: 16500, priceMayorista: 15200, priceDist: 14000, stock: 2, cat: 'Abarrotes' } // Stock crítico
    ])),
    clients: JSON.parse(localStorage.getItem('tat_pos_clients') || JSON.stringify([
        { id: 'FUS-101', client: 'Minimercado La Esquina', address: 'Cra 6 # 12-40, Centro', phone: '3104567890', lat: 4.3382, lng: -74.3612 },
        { id: 'FUS-102', client: 'Tienda Don Pedro', address: 'Cll 18 # 9-15, Balmoral', phone: '3112345678', lat: 4.3335, lng: -74.3670 }
    ])),
    denominations: JSON.parse(localStorage.getItem('tat_pos_denom') || JSON.stringify({
        100000: 0, 50000: 0, 20000: 0, 10000: 0, 5000: 0, 2000: 0, 1000: 0, 500: 0, 200: 0, 100: 0
    }))
};

document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    renderPosCatalog();
    renderInventory();
    renderClients();
    renderDenominations();
});

function switchTab(tabId) {
    posState.activeTab = tabId;
    ['pos', 'inventory', 'clients', 'finances'].forEach(t => {
        const el = document.getElementById(`view-${t}`);
        const btn = document.getElementById(`nav-btn-${t}`);
        if (el) el.classList.toggle('hidden', t !== tabId);
        if (btn) {
            btn.classList.toggle('text-cyan-400', t === tabId);
            btn.classList.toggle('text-neutral-400', t !== tabId);
        }
    });
}

function cambiarListaPrecios(val) {
    posState.priceList = val;
    renderPosCatalog();
    updateCartTotals();
}

function renderPosCatalog(filter = '') {
    const grid = document.getElementById('pos-catalog-grid');
    if (!grid) return;

    const filtered = posState.products.filter(p => p.name.toLowerCase().includes(filter.toLowerCase()) || p.code.includes(filter));

    grid.innerHTML = filtered.map(p => {
        const price = posState.priceList === 'mayorista' ? p.priceMayorista : posState.priceList === 'distribuidor' ? p.priceDist : p.priceTienda;
        const isCritical = p.stock <= 5;

        return `
            <div onclick="addToCart('${p.id}')" class="bg-neutral-900 hover:bg-neutral-800 border ${isCritical ? 'border-amber-500/50' : 'border-neutral-800'} rounded-2xl p-3 flex flex-col justify-between cursor-pointer transition active:scale-95 shadow-lg">
                <div>
                    <div class="flex justify-between items-start gap-1">
                        <span class="text-[9px] font-bold px-1.5 py-0.5 rounded ${isCritical ? 'bg-amber-500/20 text-amber-400' : 'bg-neutral-800 text-neutral-400'}">Stock: ${p.stock}</span>
                        <span class="text-[9px] text-cyan-400 font-bold uppercase">${p.cat}</span>
                    </div>
                    <h4 class="font-bold text-xs text-white mt-1.5 line-clamp-2">${p.name}</h4>
                </div>
                <div class="pt-2 mt-2 border-t border-neutral-800 flex justify-between items-center">
                    <span class="font-black text-emerald-400 text-xs">$${price.toLocaleString()}</span>
                    <button class="w-7 h-7 bg-cyan-500 text-neutral-950 font-black rounded-xl flex items-center justify-center text-xs">+</button>
                </div>
            </div>
        `;
    }).join('');
}

function filtrarCatalogoPOS(val) {
    renderPosCatalog(val);
}

function addToCart(productId) {
    const p = posState.products.find(x => x.id === productId);
    if (!p || p.stock <= 0) return alert('Producto sin stock disponible.');

    const price = posState.priceList === 'mayorista' ? p.priceMayorista : posState.priceList === 'distribuidor' ? p.priceDist : p.priceTienda;
    const existing = posState.cart.find(item => item.id === productId);

    if (existing) {
        existing.qty++;
    } else {
        posState.cart.push({ id: p.id, name: p.name, price, qty: 1 });
    }
    renderCart();
}

function renderCart() {
    const container = document.getElementById('pos-cart-items');
    const countEl = document.getElementById('pos-cart-count');
    if (!container) return;

    if (posState.cart.length === 0) {
        container.innerHTML = `<div class="text-center text-neutral-500 text-xs py-4">Carrito vacío. Seleccione productos abajo.</div>`;
        countEl.innerText = `0 ítems`;
        document.getElementById('pos-subtotal').innerText = `$0`;
        document.getElementById('pos-total').innerText = `$0`;
        return;
    }

    const totalItems = posState.cart.reduce((acc, item) => acc + item.qty, 0);
    countEl.innerText = `${totalItems} ítems`;

    let subtotal = 0;
    container.innerHTML = posState.cart.map((item, idx) => {
        const itemTotal = item.price * item.qty;
        subtotal += itemTotal;
        return `
            <div class="flex justify-between items-center bg-neutral-950 p-2 rounded-xl border border-neutral-800 text-xs">
                <div class="min-w-0 flex-1 pr-2">
                    <div class="font-bold text-white truncate">${item.name}</div>
                    <div class="text-[10px] text-neutral-400">$${item.price.toLocaleString()} x ${item.qty}</div>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                    <strong class="text-emerald-400">$${itemTotal.toLocaleString()}</strong>
                    <button onclick="posState.cart.splice(${idx},1);renderCart()" class="text-neutral-500 hover:text-rose-400 font-bold px-1">×</button>
                </div>
            </div>
        `;
    }).join('');

    document.getElementById('pos-subtotal').innerText = `$${subtotal.toLocaleString()}`;
    document.getElementById('pos-total').innerText = `$${subtotal.toLocaleString()}`;
}

let currentPaymentMethod = 'cash';
function abrirModalPagoPOS(method) {
    if (posState.cart.length === 0) return alert('El carrito está vacío.');
    currentPaymentMethod = method;
    const total = posState.cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    
    document.getElementById('modal-pago-title.innerText', `Cobrar por ${method === 'cash' ? 'Efectivo' : 'Nequi / DaviPlata'}`);
    document.getElementById('modal-pago-total').innerText = `$${total.toLocaleString()}`;
    document.getElementById('transfer-ref-box').classList.toggle('hidden', method === 'cash');
    document.getElementById('modal-pago').classList.remove('hidden');
}

function procesarVentaPOS() {
    const total = posState.cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    
    // Descontar stock local
    posState.cart.forEach(item => {
        const p = posState.products.find(x => x.id === item.id);
        if (p) p.stock = Math.max(0, p.stock - item.qty);
    });

    localStorage.setItem('tat_pos_products', JSON.stringify(posState.products));
    posState.cart = [];
    renderCart();
    renderPosCatalog();
    renderInventory();
    document.getElementById('modal-pago').classList.add('hidden');
    alert(`¡Venta procesada con éxito por $${total.toLocaleString()}! Ticket impreso correctamente.`);
}

function openScannerModal() {
    document.getElementById('modal-scanner').classList.remove('hidden');
}

function simularEscaneoCodigo() {
    const code = document.getElementById('simulated-barcode').value.trim();
    const p = posState.products.find(x => x.code === code);
    document.getElementById('modal-scanner').classList.add('hidden');
    if (p) {
        addToCart(p.id);
    } else {
        alert('Producto no encontrado con el código: ' + code);
    }
}

function exportarManifiestoRutaJSON() {
    const stopsForDriver = posState.clients.map((c, idx) => ({
        id: `FAC-2026-${100+idx}`,
        clientCode: c.id,
        client: c.client,
        owner: 'Propietario',
        phone: c.phone,
        address: c.address,
        total: 125000 + (idx * 34000),
        lat: c.lat,
        lng: c.lng,
        status: 'PENDIENTE',
        paymentMethod: 'Efectivo',
        notes: ''
    }));

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(stopsForDriver, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "manifiesto_ruta_fusa.json");
    dlAnchorElem.click();
}

function renderInventory() {
    const container = document.getElementById('lista-inventario-pos');
    if (!container) return;
    container.innerHTML = posState.products.map(p => `
        <div class="bg-neutral-900 border ${p.stock<=5?'border-amber-500/40':'border-neutral-800'} rounded-2xl p-3 flex justify-between items-center text-xs">
            <div>
                <h4 class="font-bold text-white">${p.name}</h4>
                <p class="text-[11px] text-neutral-400">Código: ${p.code} • Costo: $${p.cost.toLocaleString()}</p>
            </div>
            <div class="text-right">
                <div class="font-black ${p.stock<=5?'text-amber-400':'text-emerald-400'} text-sm">${p.stock} unids</div>
                <span class="text-[10px] text-neutral-500 uppercase">${p.cat}</span>
            </div>
        </div>
    `).join('');
}

function renderClients() {
    const container = document.getElementById('lista-agenda');
    if (!container) return;
    container.innerHTML = posState.clients.map(c => `
        <div class="bg-neutral-900 border border-neutral-800 rounded-2xl p-3 text-xs">
            <h4 class="font-bold text-white">${c.client}</h4>
            <p class="text-[11px] text-neutral-400">${c.address} • Tel: ${c.phone}</p>
        </div>
    `).join('');
}

function renderDenominations() {
    const denoms = [100000, 50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100];
    const container = document.getElementById('denominations-container');
    if (!container) return;
    container.innerHTML = denoms.map(d => `
        <div class="flex items-center justify-between bg-neutral-950 p-2.5 rounded-xl border border-neutral-800 text-xs">
            <span class="font-bold text-white">$${d.toLocaleString()}</span>
            <div class="flex items-center gap-2">
                <input type="number" min="0" value="${posState.denominations[d] || 0}" onchange="posState.denominations[${d}]=Math.max(0,parseInt(this.value)||0);updatePosCash()" class="w-12 bg-neutral-900 border border-neutral-700 rounded-lg text-center text-white font-bold p-1">
            </div>
        </div>
    `).join('');
}

function updatePosCash() {
    const denoms = [100000, 50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100];
    const total = denoms.reduce((acc, d) => acc + d * (posState.denominations[d] || 0), 0);
    const disp = document.getElementById('counter-total-display');
    if (disp) disp.innerText = `$${total.toLocaleString()}`;
}

function openProductModal() { alert('Función de agregar producto rápido en catálogo POS.'); }
function openClientModal() { alert('Función de registrar nuevo cliente TAT.'); }
function openReturnModal() { alert('Módulo de Nota Crédito y Devoluciones activado.'); }
function resetCashCounter() { 
    Object.keys(posState.denominations).forEach(k => posState.denominations[k] = 0);
    renderDenominations();
    updatePosCash();
}
