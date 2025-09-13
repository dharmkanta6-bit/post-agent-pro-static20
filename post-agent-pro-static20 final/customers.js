// Customers page functionality

document.addEventListener('DOMContentLoaded', function() {
    bindFilter();
    loadCustomers();
});

function bindFilter(){
    const input = document.getElementById('customerFilterInput');
    if (input){
        input.addEventListener('input', ()=> loadCustomers());
    }
}

function getFilteredCustomers(){
    const term = (document.getElementById('customerFilterInput')?.value || '').toLowerCase().trim();
    const customers = (app.customers || []).slice().sort((a,b)=>{
        const an = parseInt(a.shortCode||'0',10)||0;
        const bn = parseInt(b.shortCode||'0',10)||0;
        return an - bn;
    });
    if (!term) return customers;
    return customers.filter(c =>
        (c.shortCode||'').toLowerCase().includes(term) ||
        (c.name||'').toLowerCase().includes(term) ||
        (c.phone||'').toLowerCase().includes(term) ||
        (c.accountNumber||'').toLowerCase().includes(term)
    );
}

function loadCustomers() {
    const tbody = document.getElementById('customersTableBody');
    if (!tbody) return;
    
    const customers = getFilteredCustomers();
    
    if (customers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 2rem; color: hsl(var(--muted-foreground));">
                    No customers found. <a href="#" onclick="openAddCustomerModal()" style="color: hsl(var(--primary));">Add your first customer</a>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = customers.map(customer => `
        <tr>
            <td>${customer.shortCode || '-'}</td>
            <td>${(customer.name||'')}<div style="font-size:12px; color:hsl(var(--muted-foreground));">Acc: ${(customer.accountNumber||'-')} · SC: ${(customer.shortCode||'-')}</div></td>
            <td>${customer.phone || ''}</td>
            <td>${customer.address || ''}</td>
            <td>${customer.accountNumber || ''}</td>
            <td>
                <button class="btn btn-outline btn-sm" onclick="openEditCustomerModal('${customer.id}')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px;">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    Edit
                </button>
                <button class="btn btn-outline btn-sm" onclick="deleteCustomerHandler('${customer.id}')" style="margin-left: 0.5rem; color: hsl(var(--destructive));">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px;">
                        <polyline points="3,6 5,6 21,6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    Delete
                </button>
            </td>
        </tr>
    `).join('');
}

function openAddCustomerModal() {
    const modal = document.getElementById('addCustomerModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeAddCustomerModal() {
    const modal = document.getElementById('addCustomerModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        document.getElementById('addCustomerForm').reset();
    }
}

function handleAddCustomer(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    let shortCode = String(formData.get('shortCode')||'').trim();
    
    // If no short code provided, auto-generate
    if (!shortCode) {
        shortCode = generateNextShortCode();
    }
    
    // Validate short code format (numbers only, starting from 1)
    if (!/^\d+$/.test(shortCode) || parseInt(shortCode, 10) < 1) {
        showToast('Short Code must be a number starting from 1', 'error');
        return;
    }
    
    if ((app.customers||[]).some(c => (c.shortCode||'') === shortCode)){
        showToast('Short Code already exists', 'error');
        return;
    }

    const customerData = {
        shortCode,
        name: formData.get('name'),
        phone: formData.get('phone'),
        address: formData.get('address'),
        accountNumber: formData.get('accountNumber'),
        email: formData.get('email') || ''
    };
    
    addCustomer(customerData);
    closeAddCustomerModal();
    loadCustomers();
}

function openEditCustomerModal(id){
    const canModify = !!(app.appSettings && app.appSettings.allowModifications);
    if (!canModify){ showToast('Editing is disabled in settings', 'warning'); return; }
    const c = app.customers.find(x=>x.id===id);
    if (!c){ showToast('Customer not found','error'); return; }
    const modal = document.getElementById('editCustomerModal');
    if (!modal) return;
    document.getElementById('editCustomerId').value = c.id;
    document.getElementById('editCustomerShortCode').value = c.shortCode||'';
    document.getElementById('editCustomerName').value = c.name||'';
    document.getElementById('editCustomerPhone').value = c.phone||'';
    document.getElementById('editCustomerAddress').value = c.address||'';
    document.getElementById('editCustomerAccount').value = c.accountNumber||'';
    document.getElementById('editCustomerEmail').value = c.email||'';
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeEditCustomerModal(){
    const modal = document.getElementById('editCustomerModal');
    if (modal){
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function handleEditCustomer(event){
    event.preventDefault();
    const formData = new FormData(event.target);
    const id = formData.get('id');
    let shortCode = String(formData.get('shortCode')||'').trim();
    if (!/^\d+$/.test(shortCode) || parseInt(shortCode,10) < 1){
        showToast('Short Code must be a number starting from 1', 'error');
        return;
    }
    if ((app.customers||[]).some(c => c.id!==id && (c.shortCode||'') === shortCode)){
        showToast('Short Code already exists', 'error');
        return;
    }
    const updates = {
        shortCode,
        name: formData.get('name'),
        phone: formData.get('phone'),
        address: formData.get('address'),
        accountNumber: formData.get('accountNumber'),
        email: formData.get('email') || ''
    };
    updateCustomer(id, updates);
    closeEditCustomerModal();
    loadCustomers();
}

function deleteCustomerHandler(id) {
    const canModify = !!(app.appSettings && app.appSettings.allowModifications);
    if (!canModify){
        showToast('Deleting is disabled in settings', 'warning');
        return;
    }
    if (confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
        const deleted = app.deleteCustomer(id);
        if (deleted) {
            showToast('Customer deleted successfully', 'success');
            loadCustomers();
        } else {
            showToast('Customer not found', 'error');
        }
    }
}

function exportCustomersCSV(){
    const headers = ['shortCode','name','phone','address','accountNumber','email'];
    const rows = (app.customers||[]).map(c=>({
        shortCode: c.shortCode||'',
        name: c.name||'',
        phone: c.phone||'',
        address: c.address||'',
        accountNumber: c.accountNumber||'',
        email: c.email||''
    }));
    const csv = toCSV(headers, rows);
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'customers.csv'; a.click();
    URL.revokeObjectURL(url);
    showToast('Customers exported', 'success');
}

function handleImportCustomers(event){
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e)=>{
        try{
            const text = String(e.target?.result||'');
            const records = parseCSV(text);
            let added = 0, skipped = 0;
            records.forEach(r =>{
                let shortCode = String(r.shortCode||'').trim();
                
                // If no short code or invalid, auto-generate
                if (!shortCode || !/^\d+$/.test(shortCode) || parseInt(shortCode, 10) < 1) {
                    shortCode = generateNextShortCode();
                }
                
                // Check if short code already exists
                if ((app.customers||[]).some(c => (c.shortCode||'') === shortCode)) { 
                    skipped++; 
                    return; 
                }
                
                addCustomer({
                    shortCode,
                    name: r.name||'',
                    phone: r.phone||'',
                    address: r.address||'',
                    accountNumber: r.accountNumber||'',
                    email: r.email||''
                });
                added++;
            });
            showToast(`Imported ${added} customers, skipped ${skipped}`, 'success');
            loadCustomers();
        }catch(err){
            console.error(err);
            showToast('Failed to import CSV', 'error');
        }
    };
    reader.readAsText(file);
    // reset input so same file can be picked again
    event.target.value = '';
}

// Close modal when clicking outside
document.addEventListener('click', function(event) {
    const modal = document.getElementById('addCustomerModal');
    if (event.target === modal) {
        closeAddCustomerModal();
    }
    const edit = document.getElementById('editCustomerModal');
    if (event.target === edit){ closeEditCustomerModal(); }
});

// Close modal with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeAddCustomerModal();
        closeEditCustomerModal();
    }
});
