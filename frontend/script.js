const API_URL = '/api';
const materialForm = document.getElementById('material-form');
const materialContainer = document.getElementById('material-container');
const taskCount = document.getElementById('task-count');
const grandTotal = document.getElementById('grand-total');
const loading = document.getElementById('loading');

// Initial Load
document.addEventListener('DOMContentLoaded', fetchMaterials);

async function fetchMaterials() {
    toggleLoading(true);
    try {
        const response = await fetch(`${API_URL}/materials`);
        const materials = await response.json();
        renderMaterials(materials);
    } catch (error) {
        console.error('Error fetching materials:', error);
        showNotification('Failed to fetch data.', 'error');
    } finally {
        toggleLoading(false);
    }
}

materialForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('mat-name').value;
    const price = parseFloat(document.getElementById('mat-price').value);
    const qty = parseFloat(document.getElementById('mat-qty').value);

    if (!name || isNaN(price) || isNaN(qty)) return;

    toggleLoading(true);
    try {
        const response = await fetch(`${API_URL}/materials`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: name,
                quantity: qty,
                unit_price: price,
                category: "Construction"
            })
        });

        if (response.ok) {
            materialForm.reset();
            await fetchMaterials();
            showNotification('Item added successfully!', 'success');
        }
    } catch (error) {
        showNotification('Error saving data.', 'error');
    } finally {
        toggleLoading(false);
    }
});

async function deleteMaterial(id) {
    if (!confirm('Are you sure?')) return;
    
    toggleLoading(true);
    try {
        const response = await fetch(`${API_URL}/materials/${id}`, {
            method: 'DELETE'
        });
        if (response.ok) {
            await fetchMaterials();
            showNotification('Item deleted.', 'success');
        }
    } catch (error) {
        showNotification('Error deleting item.', 'error');
    } finally {
        toggleLoading(false);
    }
}

function renderMaterials(materials) {
    materialContainer.innerHTML = '';
    taskCount.innerText = materials.length;

    let total = 0;

    if (materials.length === 0) {
        materialContainer.innerHTML = `
            <div class="card" style="text-align: center; color: var(--text-dim); padding: 3rem; width: 100%;">
                <p>No items added. Start adding materials to calculate.</p>
            </div>
        `;
        grandTotal.innerText = '฿0.00';
        return;
    }

    materials.forEach((mat, index) => {
        const itemTotal = mat.quantity * mat.unit_price;
        total += itemTotal;

        const el = document.createElement('div');
        el.className = 'todo-item';
        el.style.animationDelay = `${index * 0.05}s`;

        el.innerHTML = `
            <div class="todo-content">
                <h3 class="todo-title">${mat.name}</h3>
                <div class="todo-meta">
                    <span>Qty: <strong>${mat.quantity}</strong></span>
                    <span>@ ฿${mat.unit_price.toLocaleString()}</span>
                </div>
            </div>
            <div class="price-tag">฿${itemTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
            <div class="actions">
                <button class="btn-icon" onclick="deleteMaterial(${mat.id})">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </div>
        `;
        materialContainer.appendChild(el);
    });

    grandTotal.innerText = `฿${total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
}

function toggleLoading(show) {
    if (show) loading.classList.remove('hidden');
    else loading.classList.add('hidden');
}

function showNotification(message, type) {
    const container = document.getElementById('notification-container');
    const note = document.createElement('div');
    note.className = 'notification';
    note.innerText = message;
    
    Object.assign(note.style, {
        background: type === 'error' ? 'var(--error)' : 'var(--success)',
        color: 'white',
        padding: '0.75rem 1.5rem',
        borderRadius: '0.5rem',
        marginBottom: '0.75rem',
        boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
        fontWeight: '600'
    });
    
    if (!container.style.position) {
        Object.assign(container.style, { position: 'fixed', bottom: '20px', right: '20px', zIndex: '1000' });
    }
    container.appendChild(note);
    setTimeout(() => {
        note.style.opacity = '0';
        setTimeout(() => note.remove(), 300);
    }, 3000);
}
