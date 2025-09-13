// Post Agent Pro - Static Version
// This is a simplified static version of the Post Agent Pro application

// Local Storage Keys
const STORAGE_KEYS = {
    AGENT_PROFILE: 'agentProfile',
    CUSTOMERS: 'customers',
    COLLECTIONS: 'collections',
    DEPOSITS: 'deposits',
    APP_SETTINGS: 'appSettings'
};

// Default Data
const DEFAULT_DATA = {
    agentProfile: {
        name: 'Post Agent',
        agencyNumber: 'PA-12345',
        validityDate: new Date().toISOString().split('T')[0],
        branchAddress: 'Main Post Office, Cityville',
        mobileNumber: '1234567890'
    },
    customers: [],
    collections: [],
    deposits: [],
    appSettings: {
        allowModifications: true,
        currency: 'INR',
        maxLotAmount: 20000,
        autoConfirmationEnabled: true,
        confirmationMethod: 'whatsapp' // or 'sms'
    }
};

// Utility Functions
function getFromStorage(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error('Error reading from localStorage:', error);
        return defaultValue;
    }
}

function saveToStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error('Error saving to localStorage:', error);
        return false;
    }
}

function getCurrency() {
    const settings = getFromStorage(STORAGE_KEYS.APP_SETTINGS, DEFAULT_DATA.appSettings);
    return (settings && settings.currency) ? settings.currency : 'INR';
}

function formatCurrency(amount) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: getCurrency(),
    }).format(amount || 0);
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function generateNextShortCode() {
    const customers = app.customers || [];
    if (customers.length === 0) return '1';
    
    const existingCodes = customers
        .map(c => c.shortCode)
        .filter(code => code && /^\d+$/.test(code))
        .map(code => parseInt(code, 10))
        .filter(num => !isNaN(num));
    
    if (existingCodes.length === 0) return '1';
    
    const maxCode = Math.max(...existingCodes);
    return String(maxCode + 1);
}

function generateReceiptNumber() {
    const collections = app.collections || [];
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    
    // Find existing receipt numbers for today
    const todayReceipts = collections
        .filter(c => c.receiptNumber && c.receiptNumber.startsWith(dateStr))
        .map(c => c.receiptNumber)
        .filter(r => r && r.length > 8);
    
    if (todayReceipts.length === 0) {
        return `${dateStr}001`;
    }
    
    // Extract sequence numbers and find max
    const sequences = todayReceipts
        .map(r => parseInt(r.slice(8), 10))
        .filter(n => !isNaN(n));
    
    const maxSeq = Math.max(...sequences);
    const nextSeq = String(maxSeq + 1).padStart(3, '0');
    return `${dateStr}${nextSeq}`;
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
}

function parseCSV(text) {
    const lines = text.split(/\r?\n/).filter(l=>l.trim().length>0);
    if (lines.length === 0) return [];
    const headers = lines[0].split(',').map(h=>h.trim().replace(/^"|"$/g,''));
    return lines.slice(1).map(line => {
        const cols = [];
        let cur = '', inQuotes = false;
        for (let i=0;i<line.length;i++){
            const ch = line[i];
            if (ch === '"'){
                if (inQuotes && line[i+1] === '"'){ cur+='"'; i++; }
                else { inQuotes = !inQuotes; }
            } else if (ch === ',' && !inQuotes){
                cols.push(cur); cur='';
            } else { cur += ch; }
        }
        cols.push(cur);
        const obj = {};
        headers.forEach((h, idx)=> obj[h] = (cols[idx]||'').trim());
        return obj;
    });
}

function toCSV(headers, rows) {
    const esc = v => '"' + String(v ?? '').replace(/"/g,'""') + '"';
    const head = headers.map(esc).join(',');
    const body = rows.map(r => headers.map(h => esc(r[h])).join(',')).join('\n');
    return head + (rows.length? '\n' + body : '');
}

// App State Management
class AppState {
    constructor() {
        this.agentProfile = getFromStorage(STORAGE_KEYS.AGENT_PROFILE, DEFAULT_DATA.agentProfile);
        this.customers = getFromStorage(STORAGE_KEYS.CUSTOMERS, DEFAULT_DATA.customers);
        this.collections = getFromStorage(STORAGE_KEYS.COLLECTIONS, DEFAULT_DATA.collections);
        this.deposits = getFromStorage(STORAGE_KEYS.DEPOSITS, DEFAULT_DATA.deposits);
        this.appSettings = getFromStorage(STORAGE_KEYS.APP_SETTINGS, DEFAULT_DATA.appSettings);
    }

    save() {
        saveToStorage(STORAGE_KEYS.AGENT_PROFILE, this.agentProfile);
        saveToStorage(STORAGE_KEYS.CUSTOMERS, this.customers);
        saveToStorage(STORAGE_KEYS.COLLECTIONS, this.collections);
        saveToStorage(STORAGE_KEYS.DEPOSITS, this.deposits);
        saveToStorage(STORAGE_KEYS.APP_SETTINGS, this.appSettings);
    }

    addCustomer(customerData) {
        const newCustomer = {
            ...customerData,
            id: generateId(),
            createdAt: new Date().toISOString()
        };
        this.customers.push(newCustomer);
        this.save();
        return newCustomer;
    }

    addCollection(collectionData) {
        const newCollection = {
            ...collectionData,
            id: generateId(),
            createdAt: collectionData.createdAt || new Date().toISOString()
        };
        this.collections.push(newCollection);
        this.save();
        return newCollection;
    }

    updateCollection(id, updates) {
        const index = this.collections.findIndex(c => c.id === id);
        if (index !== -1) {
            this.collections[index] = { ...this.collections[index], ...updates };
            this.save();
            return this.collections[index];
        }
        return null;
    }

    deleteCollection(id) {
        const index = this.collections.findIndex(c => c.id === id);
        if (index !== -1) {
            this.collections.splice(index, 1);
            this.save();
            return true;
        }
        return false;
    }

    addDeposit(depositData) {
        const newDeposit = {
            ...depositData,
            id: generateId(),
            createdAt: depositData.createdAt || new Date().toISOString()
        };
        this.deposits.push(newDeposit);
        this.save();
        return newDeposit;
    }

    updateDeposit(id, updates) {
        const index = this.deposits.findIndex(d => d.id === id);
        if (index !== -1) {
            this.deposits[index] = { ...this.deposits[index], ...updates };
            this.save();
            return this.deposits[index];
        }
        return null;
    }

    deleteDeposit(id) {
        const index = this.deposits.findIndex(d => d.id === id);
        if (index !== -1) {
            this.deposits.splice(index, 1);
            this.save();
            return true;
        }
        return false;
    }

    updateCustomer(id, updates) {
        const index = this.customers.findIndex(c => c.id === id);
        if (index !== -1) {
            this.customers[index] = { ...this.customers[index], ...updates };
            this.save();
            return this.customers[index];
        }
        return null;
    }

    deleteCustomer(id) {
        const index = this.customers.findIndex(c => c.id === id);
        if (index !== -1) {
            this.customers.splice(index, 1);
            this.save();
            return true;
        }
        return false;
    }

    getStats() {
        const totalCollections = this.collections.reduce((sum, c) => sum + (c.amount || 0) + (c.penalty || 0), 0);
        const totalDeposits = this.deposits.reduce((sum, d) => sum + (d.amount || 0), 0);
        const balance = totalCollections - totalDeposits;

        return {
            totalCollections,
            totalDeposits,
            balance
        };
    }
}

// Initialize App
const app = new AppState();

// DOM Elements
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const mainContent = document.querySelector('.main-content');

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    updateDashboard();
});

function initializeApp() {
    // Initialize sidebar toggle for mobile
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
    }

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 768 && sidebar && !sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
            sidebar.classList.remove('open');
        }
    });

    // Handle window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            sidebar.classList.remove('open');
        }
    });
}

function setupEventListeners() {
    // Navigation links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Remove active class from all nav items
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // Add active class to clicked item
            this.closest('.nav-item').classList.add('active');
        });
    });
}

function toggleSidebar() {
    if (sidebar) {
        sidebar.classList.toggle('open');
    }
}

function updateDashboard() {
    const stats = app.getStats();
    
    // Update stats cards
    const totalCollectionsEl = document.getElementById('totalCollections');
    const totalDepositsEl = document.getElementById('totalDeposits');
    const balanceEl = document.getElementById('balance');
    
    if (totalCollectionsEl) {
        totalCollectionsEl.textContent = formatCurrency(stats.totalCollections);
    }
    
    if (totalDepositsEl) {
        totalDepositsEl.textContent = formatCurrency(stats.totalDeposits);
    }
    
    if (balanceEl) {
        balanceEl.textContent = formatCurrency(stats.balance);
    }
    
    // Update due reminders
    updateDueReminders();
}

function updateDueReminders() {
    const dueRemindersEl = document.getElementById('dueReminders');
    if (!dueRemindersEl) return;
    
    // Simple due reminders logic - you can enhance this
    const today = new Date();
    const dueCustomers = app.customers.filter(customer => {
        // Add your due date logic here
        return false; // For now, no due reminders
    });
    
    if (dueCustomers.length === 0) {
        dueRemindersEl.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <p>No due reminders at the moment</p>
            </div>
        `;
    } else {
        // Render due reminders list
        dueRemindersEl.innerHTML = dueCustomers.map(customer => `
            <div class="due-reminder-item">
                <h4>${customer.name}</h4>
                <p>Due: ${customer.dueDate || 'N/A'}</p>
            </div>
        `).join('');
    }
}

// Authentication Functions (Simplified for static version)
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        // In a real app, this would clear authentication tokens
        showToast('Logged out successfully', 'success');
        
        // Redirect to login page (you would need to create this)
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1000);
    }
}

// Customer Management Functions
function addCustomer(customerData) {
    try {
        const newCustomer = app.addCustomer(customerData);
        showToast('Customer added successfully', 'success');
        updateDashboard();
        return newCustomer;
    } catch (error) {
        showToast('Error adding customer', 'error');
        console.error('Error adding customer:', error);
    }
}

function updateCustomer(id, updates) {
    try {
        const updatedCustomer = app.updateCustomer(id, updates);
        if (updatedCustomer) {
            showToast('Customer updated successfully', 'success');
            updateDashboard();
            return updatedCustomer;
        } else {
            showToast('Customer not found', 'error');
        }
    } catch (error) {
        showToast('Error updating customer', 'error');
        console.error('Error updating customer:', error);
    }
}

function deleteCustomer(id) {
    if (confirm('Are you sure you want to delete this customer?')) {
        try {
            const deleted = app.deleteCustomer(id);
            if (deleted) {
                showToast('Customer deleted successfully', 'success');
                updateDashboard();
            } else {
                showToast('Customer not found', 'error');
            }
        } catch (error) {
            showToast('Error deleting customer', 'error');
            console.error('Error deleting customer:', error);
        }
    }
}

// Collection Management Functions
function addCollection(collectionData) {
    try {
        const newCollection = app.addCollection(collectionData);
        showToast('Collection added successfully', 'success');
        updateDashboard();
        return newCollection;
    } catch (error) {
        showToast('Error adding collection', 'error');
        console.error('Error adding collection:', error);
    }
}

function updateCollection(id, updates) {
    try {
        const updated = app.updateCollection(id, updates);
        if (updated) {
            showToast('Collection updated', 'success');
            updateDashboard();
            return updated;
        }
        showToast('Collection not found', 'error');
    } catch (error) {
        showToast('Error updating collection', 'error');
        console.error('Error updating collection:', error);
    }
}

function deleteCollection(id) {
    if (!confirm('Delete this collection?')) return;
    try {
        const ok = app.deleteCollection(id);
        if (ok) {
            showToast('Collection deleted', 'success');
            updateDashboard();
        } else {
            showToast('Collection not found', 'error');
        }
    } catch (error) {
        showToast('Error deleting collection', 'error');
        console.error('Error deleting collection:', error);
    }
}

// Deposit Management Functions
function addDeposit(depositData) {
    try {
        const newDeposit = app.addDeposit(depositData);
        showToast('Deposit added successfully', 'success');
        updateDashboard();
        return newDeposit;
    } catch (error) {
        showToast('Error adding deposit', 'error');
        console.error('Error adding deposit:', error);
    }
}

function updateDeposit(id, updates) {
    try {
        const updated = app.updateDeposit(id, updates);
        if (updated) {
            showToast('Deposit updated', 'success');
            updateDashboard();
            return updated;
        }
        showToast('Deposit not found', 'error');
    } catch (error) {
        showToast('Error updating deposit', 'error');
        console.error('Error updating deposit:', error);
    }
}

function deleteDeposit(id) {
    if (!confirm('Delete this deposit?')) return;
    try {
        const ok = app.deleteDeposit(id);
        if (ok) {
            showToast('Deposit deleted', 'success');
            updateDashboard();
        } else {
            showToast('Deposit not found', 'error');
        }
    } catch (error) {
        showToast('Error deleting deposit', 'error');
        console.error('Error deleting deposit:', error);
    }
}

// WhatsApp/SMS Confirmation (Static Version)
function sendConfirmation(data) {
    const method = (app.appSettings && app.appSettings.confirmationMethod) || 'whatsapp';
    console.log(`Confirmation (${method}) would be sent:`, data);
    showToast(`Confirmation sent via ${method}! (Static mode)`, 'success');
    return { success: true };
}

// Export functions for use in other pages
window.AppState = AppState;
window.app = app;
window.addCustomer = addCustomer;
window.updateCustomer = updateCustomer;
window.deleteCustomer = deleteCustomer;
window.addCollection = addCollection;
window.updateCollection = updateCollection;
window.deleteCollection = deleteCollection;
window.addDeposit = addDeposit;
window.updateDeposit = updateDeposit;
window.deleteDeposit = deleteDeposit;
window.sendConfirmation = sendConfirmation;
window.showToast = showToast;
window.formatCurrency = formatCurrency;
window.generateId = generateId;
window.generateNextShortCode = generateNextShortCode;
window.generateReceiptNumber = generateReceiptNumber;
window.parseCSV = parseCSV;
window.toCSV = toCSV;
