// ===== PROFILE PAGE FUNCTIONALITY =====

// Initialize profile page
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('profile.html')) {
        initializeProfilePage();
    }
});

function initializeProfilePage() {
    // Check if user is logged in
    if (!isLoggedIn || !currentUser) {
        window.location.href = 'login.html';
        return;
    }
    
    loadUserProfile();
    loadDashboardData();
    setupProfileEventListeners();
}

// Load user profile data
function loadUserProfile() {
    if (!currentUser) return;
    
    // Update profile info
    document.getElementById('userName').textContent = currentUser.name || 'User';
    document.getElementById('userEmail').textContent = currentUser.email || '';
    
    // Update avatar initials
    const initials = getInitials(currentUser.name || 'User');
    document.getElementById('avatarInitials').textContent = initials;
    
    // Load settings form
    document.getElementById('settingsFirstName').value = currentUser.firstName || '';
    document.getElementById('settingsLastName').value = currentUser.lastName || '';
    document.getElementById('settingsEmail').value = currentUser.email || '';
    document.getElementById('settingsPhone').value = currentUser.phone || '';
}

// Get initials from name
function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

// Load dashboard data
function loadDashboardData() {
    // Load orders count
    const orders = getUserOrders();
    document.getElementById('totalOrders').textContent = orders.length;
    
    // Load wishlist count
    const wishlist = JSON.parse(localStorage.getItem('thekuaWishlist')) || [];
    document.getElementById('wishlistCount').textContent = wishlist.length;
    
    // Load addresses count
    const addresses = getUserAddresses();
    document.getElementById('addressCount').textContent = addresses.length;
    
    // Load recent orders
    loadRecentOrders();
}

// Load recent orders
function loadRecentOrders() {
    const orders = getUserOrders().slice(0, 3); // Get latest 3 orders
    const container = document.getElementById('recentOrdersList');
    
    if (orders.length === 0) {
        container.innerHTML = '<p style="color: var(--text-light); text-align: center; padding: 2rem;">No orders yet. <a href="products.html">Start shopping!</a></p>';
        return;
    }
    
    container.innerHTML = orders.map(order => `
        <div class="order-preview">
            <div class="order-preview-header">
                <h4>Order #${order.orderNumber}</h4>
                <span class="order-status ${getOrderStatusClass(order.status || 'processing')}">${order.status || 'Processing'}</span>
            </div>
            <p class="order-preview-date">${formatDate(order.date)}</p>
            <p class="order-preview-total">${order.total}</p>
        </div>
    `).join('');
}

// Get user orders
function getUserOrders() {
    if (!currentUser) return [];
    return JSON.parse(localStorage.getItem(`thekuaOrders_${currentUser.id}`)) || [];
}

// Get user addresses
function getUserAddresses() {
    if (!currentUser) return [];
    return JSON.parse(localStorage.getItem(`thekuaAddresses_${currentUser.id}`)) || [];
}

// Get order status class
function getOrderStatusClass(status) {
    const statusMap = {
        'delivered': 'delivered',
        'processing': 'processing',
        'shipped': 'processing',
        'confirmed': 'processing'
    };
    return statusMap[status.toLowerCase()] || 'processing';
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Setup event listeners
function setupProfileEventListeners() {
    // Personal info form
    document.getElementById('personalInfoForm').addEventListener('submit', handlePersonalInfoUpdate);
    
    // Change password form
    document.getElementById('changePasswordForm').addEventListener('submit', handlePasswordChange);
    
    // Preferences
    document.getElementById('newsletterPref').addEventListener('change', savePreferences);
    document.getElementById('smsPref').addEventListener('change', savePreferences);
}

// Show section
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.profile-section-content').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active class from all nav links
    document.querySelectorAll('.profile-nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(`${sectionName}-section`).classList.add('active');
    
    // Add active class to clicked nav link
    event.target.classList.add('active');
    
    // Load section-specific data
    switch(sectionName) {
        case 'orders':
            loadAllOrders();
            break;
        case 'addresses':
            loadAddresses();
            break;
        case 'wishlist':
            loadWishlist();
            break;
    }
}

// Load all orders
function loadAllOrders() {
    const orders = getUserOrders();
    const container = document.getElementById('ordersList');
    
    if (orders.length === 0) {
        container.innerHTML = '<div class="empty-state"><h3>No orders found</h3><p>You haven\'t placed any orders yet.</p><a href="products.html" class="btn btn-primary">Start Shopping</a></div>';
        return;
    }
    
    container.innerHTML = orders.map(order => `
        <div class="order-card">
            <div class="order-header">
                <div>
                    <h3>Order #${order.orderNumber}</h3>
                    <p class="order-date">${formatDate(order.date)}</p>
                </div>
                <span class="order-status ${getOrderStatusClass(order.status || 'processing')}">${order.status || 'Processing'}</span>
            </div>
            <div class="order-items">
                ${order.items ? order.items.map(item => `
                    <div class="order-item-summary">
                        <span>${item.name} x ${item.quantity}</span>
                        <span>₹${item.price * item.quantity}</span>
                    </div>
                `).join('') : ''}
            </div>
            <div class="order-footer">
                <div class="order-total">Total: ${order.total}</div>
                <div class="order-actions">
                    <button class="btn btn-outline" onclick="viewOrderDetails('${order.orderNumber}')">View Details</button>
                    <a href="track-order.html" class="btn btn-primary">Track Order</a>
                </div>
            </div>
        </div>
    `).join('');
}

// Filter orders
function filterOrders(status) {
    const orders = getUserOrders();
    let filteredOrders = orders;
    
    if (status !== 'all') {
        filteredOrders = orders.filter(order => 
            (order.status || 'processing').toLowerCase() === status.toLowerCase()
        );
    }
    
    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Display filtered orders
    displayFilteredOrders(filteredOrders);
}

// Display filtered orders
function displayFilteredOrders(orders) {
    const container = document.getElementById('ordersList');
    
    if (orders.length === 0) {
        container.innerHTML = '<div class="empty-state"><h3>No orders found</h3><p>No orders match the selected filter.</p></div>';
        return;
    }
    
    container.innerHTML = orders.map(order => `
        <div class="order-card">
            <div class="order-header">
                <div>
                    <h3>Order #${order.orderNumber}</h3>
                    <p class="order-date">${formatDate(order.date)}</p>
                </div>
                <span class="order-status ${getOrderStatusClass(order.status || 'processing')}">${order.status || 'Processing'}</span>
            </div>
            <div class="order-items">
                ${order.items ? order.items.map(item => `
                    <div class="order-item-summary">
                        <span>${item.name} x ${item.quantity}</span>
                        <span>₹${item.price * item.quantity}</span>
                    </div>
                `).join('') : ''}
            </div>
            <div class="order-footer">
                <div class="order-total">Total: ${order.total}</div>
                <div class="order-actions">
                    <button class="btn btn-outline" onclick="viewOrderDetails('${order.orderNumber}')">View Details</button>
                    <a href="track-order.html" class="btn btn-primary">Track Order</a>
                </div>
            </div>
        </div>
    `).join('');
}

// Load addresses
function loadAddresses() {
    const addresses = getUserAddresses();
    const container = document.getElementById('addressesList');
    
    if (addresses.length === 0) {
        container.innerHTML = '<div class="empty-state"><h3>No addresses saved</h3><p>Add your first address for faster checkout.</p><button class="btn btn-primary" onclick="showAddAddressModal()">Add Address</button></div>';
        return;
    }
    
    container.innerHTML = addresses.map((address, index) => `
        <div class="address-card ${address.isDefault ? 'default' : ''}">
            <div class="address-actions">
                <button class="action-btn" onclick="editAddress(${index})" title="Edit">✏️</button>
                <button class="action-btn" onclick="deleteAddress(${index})" title="Delete">🗑️</button>
            </div>
            
            <h4>${address.firstName} ${address.lastName}</h4>
            <p>${address.address}</p>
            ${address.apartment ? `<p>${address.apartment}</p>` : ''}
            <p>${address.city}, ${address.state} ${address.pincode}</p>
            <p>📞 ${address.phone}</p>
            
            ${address.isDefault ? '<span class="default-badge">Default</span>' : 
              `<button class="btn btn-outline btn-sm" onclick="setDefaultAddress(${index})">Set as Default</button>`}
        </div>
    `).join('');
}

// Load wishlist
function loadWishlist() {
    const wishlist = JSON.parse(localStorage.getItem('thekuaWishlist')) || [];
    const container = document.getElementById('wishlistGrid');
    
    if (wishlist.length === 0) {
        container.innerHTML = '<div class="empty-state" style="grid-column: 1 / -1;"><h3>Your wishlist is empty</h3><p>Save items you love for later.</p><a href="products.html" class="btn btn-primary">Browse Products</a></div>';
        return;
    }
    
    container.innerHTML = wishlist.map(product => `
        <div class="product-card">
            <div class="product-image">
                ${product.image ? 
                    `<img src="${product.image}" alt="${product.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : 
                    ''
                }
                <div class="product-emoji" ${product.image ? 'style="display:none;"' : 'style="display:flex; align-items: center; justify-content: center; width: 100%; height: 100%;"'}>
                    ${product.emoji}
                </div>
                <button class="remove-wishlist" onclick="removeFromWishlist(${product.id})" title="Remove from wishlist">❌</button>
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-footer">
                    <span class="product-price">₹${product.price}</span>
                    <button class="add-to-cart" onclick="addToCartFromWishlist(${product.id})">Add to Cart</button>
                </div>
            </div>
        </div>
    `).join('');
}

// Handle personal info update
function handlePersonalInfoUpdate(e) {
    e.preventDefault();
    
    const firstName = document.getElementById('settingsFirstName').value;
    const lastName = document.getElementById('settingsLastName').value;
    const phone = document.getElementById('settingsPhone').value;
    
    // Validate inputs
    if (!firstName.trim() || !lastName.trim()) {
        showNotification('First name and last name are required', 'error');
        return;
    }
    
    if (phone && !isValidPhone(phone)) {
        showNotification('Please enter a valid phone number', 'error');
        return;
    }
    
    // Update current user
    currentUser.firstName = firstName;
    currentUser.lastName = lastName;
    currentUser.name = `${firstName} ${lastName}`;
    currentUser.phone = phone;
    
    // Save to localStorage
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    // Update display
    document.getElementById('userName').textContent = currentUser.name;
    document.getElementById('avatarInitials').textContent = getInitials(currentUser.name);
    
    showNotification('Profile updated successfully!', 'success');
}

// Handle password change
function handlePasswordChange(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmNewPassword').value;
    
    // Validate passwords
    if (!currentPassword || !newPassword || !confirmPassword) {
        showNotification('All password fields are required', 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showNotification('New passwords do not match', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showNotification('Password must be at least 6 characters', 'error');
        return;
    }
    
    // In a real app, you would verify the current password
    // For demo purposes, we'll just update it
    showNotification('Password updated successfully!', 'success');
    e.target.reset();
}

// Save preferences
function savePreferences() {
    const newsletter = document.getElementById('newsletterPref').checked;
    const sms = document.getElementById('smsPref').checked;
    
    // Save preferences
    const preferences = { newsletter, sms };
    localStorage.setItem(`thekuaPreferences_${currentUser.id}`, JSON.stringify(preferences));
    
    showNotification('Preferences saved!', 'success');
}

// Address management functions
function showAddAddressModal() {
    // Create and show modal for adding address
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content modal-large">
            <button class="modal-close" onclick="closeAddressModal()">&times;</button>
            <h2>Add New Address</h2>
            <form id="addAddressForm" onsubmit="handleAddAddress(event)">
                <div class="form-row">
                    <div class="form-group">
                        <label for="newFirstName">First Name *</label>
                        <input type="text" id="newFirstName" required>
                    </div>
                    <div class="form-group">
                        <label for="newLastName">Last Name *</label>
                        <input type="text" id="newLastName" required>
                    </div>
                </div>
                <div class="form-group">
                    <label for="newPhone">Phone Number *</label>
                    <input type="tel" id="newPhone" required>
                </div>
                <div class="form-group">
                    <label for="newAddress">Address *</label>
                    <input type="text" id="newAddress" required>
                </div>
                <div class="form-group">
                    <label for="newApartment">Apartment/Suite (optional)</label>
                    <input type="text" id="newApartment">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="newCity">City *</label>
                        <input type="text" id="newCity" required>
                    </div>
                    <div class="form-group">
                        <label for="newState">State *</label>
                        <select id="newState" required>
                            <option value="">Select State</option>
                            <option value="Bihar">Bihar</option>
                            <option value="Delhi">Delhi</option>
                            <option value="Maharashtra">Maharashtra</option>
                            <option value="Karnataka">Karnataka</option>
                            <option value="West Bengal">West Bengal</option>
                            <option value="Uttar Pradesh">Uttar Pradesh</option>
                            <option value="Tamil Nadu">Tamil Nadu</option>
                            <option value="Gujarat">Gujarat</option>
                            <option value="Rajasthan">Rajasthan</option>
                            <option value="Punjab">Punjab</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="newPincode">PIN Code *</label>
                        <input type="text" id="newPincode" required pattern="[0-9]{6}" maxlength="6">
                    </div>
                </div>
                <div class="form-group">
                    <label class="checkbox-label">
                        <input type="checkbox" id="setAsDefault">
                        <span>Set as default address</span>
                    </label>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeAddressModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save Address</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function closeAddressModal() {
    const modal = document.querySelector('.modal.active');
    if (modal) {
        modal.remove();
    }
}

function handleAddAddress(e) {
    e.preventDefault();
    
    const newAddress = {
        firstName: document.getElementById('newFirstName').value,
        lastName: document.getElementById('newLastName').value,
        phone: document.getElementById('newPhone').value,
        address: document.getElementById('newAddress').value,
        apartment: document.getElementById('newApartment').value,
        city: document.getElementById('newCity').value,
        state: document.getElementById('newState').value,
        pincode: document.getElementById('newPincode').value,
        isDefault: document.getElementById('setAsDefault').checked
    };
    
    // Validate
    if (!isValidPhone(newAddress.phone)) {
        showNotification('Please enter a valid phone number', 'error');
        return;
    }
    
    if (newAddress.pincode.length !== 6) {
        showNotification('Please enter a valid 6-digit PIN code', 'error');
        return;
    }
    
    const addresses = getUserAddresses();
    
    // If setting as default, remove default from others
    if (newAddress.isDefault) {
        addresses.forEach(addr => addr.isDefault = false);
    }
    
    // If this is the first address, make it default
    if (addresses.length === 0) {
        newAddress.isDefault = true;
    }
    
    addresses.push(newAddress);
    localStorage.setItem(`thekuaAddresses_${currentUser.id}`, JSON.stringify(addresses));
    
    closeAddressModal();
    loadAddresses();
    loadDashboardData(); // Update address count
    showNotification('Address added successfully!', 'success');
}

function editAddress(index) {
    const addresses = getUserAddresses();
    const address = addresses[index];
    
    // Create edit modal (similar to add modal but pre-filled)
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content modal-large">
            <button class="modal-close" onclick="closeAddressModal()">&times;</button>
            <h2>Edit Address</h2>
            <form id="editAddressForm" onsubmit="handleEditAddress(event, ${index})">
                <div class="form-row">
                    <div class="form-group">
                        <label for="editFirstName">First Name *</label>
                        <input type="text" id="editFirstName" value="${address.firstName}" required>
                    </div>
                    <div class="form-group">
                        <label for="editLastName">Last Name *</label>
                        <input type="text" id="editLastName" value="${address.lastName}" required>
                    </div>
                </div>
                <div class="form-group">
                    <label for="editPhone">Phone Number *</label>
                    <input type="tel" id="editPhone" value="${address.phone}" required>
                </div>
                <div class="form-group">
                    <label for="editAddress">Address *</label>
                    <input type="text" id="editAddress" value="${address.address}" required>
                </div>
                <div class="form-group">
                    <label for="editApartment">Apartment/Suite (optional)</label>
                    <input type="text" id="editApartment" value="${address.apartment || ''}">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="editCity">City *</label>
                        <input type="text" id="editCity" value="${address.city}" required>
                    </div>
                    <div class="form-group">
                        <label for="editState">State *</label>
                        <select id="editState" required>
                            <option value="">Select State</option>
                            <option value="Bihar" ${address.state === 'Bihar' ? 'selected' : ''}>Bihar</option>
                            <option value="Delhi" ${address.state === 'Delhi' ? 'selected' : ''}>Delhi</option>
                            <option value="Maharashtra" ${address.state === 'Maharashtra' ? 'selected' : ''}>Maharashtra</option>
                            <option value="Karnataka" ${address.state === 'Karnataka' ? 'selected' : ''}>Karnataka</option>
                            <option value="West Bengal" ${address.state === 'West Bengal' ? 'selected' : ''}>West Bengal</option>
                            <option value="Uttar Pradesh" ${address.state === 'Uttar Pradesh' ? 'selected' : ''}>Uttar Pradesh</option>
                            <option value="Tamil Nadu" ${address.state === 'Tamil Nadu' ? 'selected' : ''}>Tamil Nadu</option>
                            <option value="Gujarat" ${address.state === 'Gujarat' ? 'selected' : ''}>Gujarat</option>
                            <option value="Rajasthan" ${address.state === 'Rajasthan' ? 'selected' : ''}>Rajasthan</option>
                            <option value="Punjab" ${address.state === 'Punjab' ? 'selected' : ''}>Punjab</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="editPincode">PIN Code *</label>
                        <input type="text" id="editPincode" value="${address.pincode}" required pattern="[0-9]{6}" maxlength="6">
                    </div>
                </div>
                <div class="form-group">
                    <label class="checkbox-label">
                        <input type="checkbox" id="editSetAsDefault" ${address.isDefault ? 'checked' : ''}>
                        <span>Set as default address</span>
                    </label>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeAddressModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Update Address</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function handleEditAddress(e, index) {
    e.preventDefault();
    
    const updatedAddress = {
        firstName: document.getElementById('editFirstName').value,
        lastName: document.getElementById('editLastName').value,
        phone: document.getElementById('editPhone').value,
        address: document.getElementById('editAddress').value,
        apartment: document.getElementById('editApartment').value,
        city: document.getElementById('editCity').value,
        state: document.getElementById('editState').value,
        pincode: document.getElementById('editPincode').value,
        isDefault: document.getElementById('editSetAsDefault').checked
    };
    
    // Validate
    if (!isValidPhone(updatedAddress.phone)) {
        showNotification('Please enter a valid phone number', 'error');
        return;
    }
    
    if (updatedAddress.pincode.length !== 6) {
        showNotification('Please enter a valid 6-digit PIN code', 'error');
        return;
    }
    
    const addresses = getUserAddresses();
    
    // If setting as default, remove default from others
    if (updatedAddress.isDefault) {
        addresses.forEach(addr => addr.isDefault = false);
    }
    
    addresses[index] = updatedAddress;
    localStorage.setItem(`thekuaAddresses_${currentUser.id}`, JSON.stringify(addresses));
    
    closeAddressModal();
    loadAddresses();
    showNotification('Address updated successfully!', 'success');
}

function deleteAddress(index) {
    if (confirm('Are you sure you want to delete this address?')) {
        const addresses = getUserAddresses();
        addresses.splice(index, 1);
        localStorage.setItem(`thekuaAddresses_${currentUser.id}`, JSON.stringify(addresses));
        loadAddresses();
        loadDashboardData(); // Update address count
        showNotification('Address deleted', 'success');
    }
}

function setDefaultAddress(index) {
    const addresses = getUserAddresses();
    
    // Remove default from all addresses
    addresses.forEach(addr => addr.isDefault = false);
    
    // Set new default
    addresses[index].isDefault = true;
    
    localStorage.setItem(`thekuaAddresses_${currentUser.id}`, JSON.stringify(addresses));
    loadAddresses();
    showNotification('Default address updated', 'success');
}

// Wishlist functions
function removeFromWishlist(productId) {
    let wishlist = JSON.parse(localStorage.getItem('thekuaWishlist')) || [];
    const product = wishlist.find(item => item.id === productId);
    
    wishlist = wishlist.filter(item => item.id !== productId);
    localStorage.setItem('thekuaWishlist', JSON.stringify(wishlist));
    
    loadWishlist();
    loadDashboardData(); // Update wishlist count
    showNotification(`${product ? product.name : 'Item'} removed from wishlist`, 'success');
}

function addToCartFromWishlist(productId) {
    const wishlist = JSON.parse(localStorage.getItem('thekuaWishlist')) || [];
    const product = wishlist.find(item => item.id === productId);
    
    if (product) {
        // Add to cart using the global function
        if (typeof addToCart === 'function') {
            addToCart(productId);
        } else {
            // Fallback if addToCart is not available
            const existingItem = cart.find(item => item.id === productId);
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cart.push({ ...product, quantity: 1 });
            }
            saveCart();
            updateCartCount();
        }
        
        // Remove from wishlist
        removeFromWishlist(productId);
        showNotification(`${product.name} moved to cart!`, 'success');
    }
}

// View order details
function viewOrderDetails(orderNumber) {
    window.location.href = `track-order.html?order=${orderNumber}`;
}

// Logout function
function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        if (typeof logout === 'function') {
            logout();
        } else {
            // Fallback logout
            isLoggedIn = false;
            currentUser = null;
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('currentUser');
            window.location.href = 'index.html';
        }
    }
}

// Utility function for phone validation
function isValidPhone(phone) {
    const re = /^[+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
    return re.test(phone);
}

// Export functions to global scope
window.showSection = showSection;
window.filterOrders = filterOrders;
window.showAddAddressModal = showAddAddressModal;
window.closeAddressModal = closeAddressModal;
window.handleAddAddress = handleAddAddress;
window.handleEditAddress = handleEditAddress;
window.editAddress = editAddress;
window.deleteAddress = deleteAddress;
window.setDefaultAddress = setDefaultAddress;
window.removeFromWishlist = removeFromWishlist;
window.addToCartFromWishlist = addToCartFromWishlist;
window.viewOrderDetails = viewOrderDetails;
window.handleLogout = handleLogout;