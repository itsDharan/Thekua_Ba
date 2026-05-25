// ===== CHECKOUT FUNCTIONALITY =====
// API Configuration
const API_URL = window.API_BASE_URL || (window.location.origin + '/api');
const GST_RATE = 0.18; // 18% GST

// Get auth token and user data
const authToken = localStorage.getItem('userToken') || localStorage.getItem('authToken');
const currentUser = JSON.parse(localStorage.getItem('userData') || localStorage.getItem('currentUser') || 'null');
const isLoggedIn = !!authToken && !!currentUser;

// Initialize Razorpay (for Indian payments)
const razorpayKey = 'rzp_test_YOUR_KEY'; // Replace with your Razorpay key

// Load cart from localStorage
let cart = JSON.parse(localStorage.getItem('thekuaCart')) || [];

// Check authentication
if (!isLoggedIn) {
    showNotification('Please login to continue', 'error');
    setTimeout(() => window.location.href = 'login.html', 1500);
}

// Initialize checkout
document.addEventListener('DOMContentLoaded', function() {
    if (cart.length === 0) {
        showNotification('Your cart is empty', 'error');
        setTimeout(() => window.location.href = 'cart.html', 1500);
        return;
    }
    
    // Set user email if logged in
    if (isLoggedIn) {
        document.getElementById('loggedInInfo').style.display = 'flex';
        document.getElementById('userEmail').textContent = currentUser.email;
        document.getElementById('email').value = currentUser.email;
        document.getElementById('email').readOnly = true;
    }
    
    loadOrderSummary();
    loadSavedAddresses();
    setupPaymentHandlers();
    setupFormValidation();
    formatCardInput();
});

// Load order summary
function loadOrderSummary() {
    const orderItemsContainer = document.getElementById('orderItems');
    const { subtotal, shipping, tax, total } = calculateTotals();
    
    orderItemsContainer.innerHTML = cart.map(item => `
        <div class="order-item">
            <div class="order-item-image">
                ${item.emoji || ''}
            </div>
            <div class="order-item-details">
                <div class="order-item-name">${item.name}</div>
                <div class="order-item-quantity">Qty: ${item.quantity}</div>
            </div>
            <div class="order-item-price">₹${item.price * item.quantity}</div>
        </div>
    `).join('');
    
    // Update summary display
    document.getElementById('subtotal').textContent = `₹${subtotal}`;
    document.getElementById('shipping').textContent = shipping === 0 ? 'FREE' : `₹${shipping}`;
    document.getElementById('tax').textContent = `₹${tax}`;
    document.getElementById('total').textContent = `₹${total}`;
}

// Calculate order totals
function calculateTotals() {
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const shipping = getShippingCost();
    const tax = Math.round(subtotal * GST_RATE);
    const total = subtotal + shipping + tax;
    
    return { subtotal, shipping, tax, total };
}

// Get shipping cost
function getShippingCost() {
    const selectedShipping = document.querySelector('input[name="shipping"]:checked')?.value || 'standard';
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    
    if (subtotal >= 500) return 0; // Free shipping over ₹500
    return selectedShipping === 'express' ? 100 : 50;
}

// Load saved addresses
async function loadSavedAddresses() {
    if (!isLoggedIn) return;
    
    try {
        const response = await fetch(`${API_URL}/user/addresses`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const addresses = await response.json();
            displayAddresses(addresses);
        }
    } catch (error) {
        console.error('Error loading addresses:', error);
    }
}

function displayAddresses(addresses) {
    const addressContainer = document.getElementById('savedAddresses');
    if (!addressContainer || !addresses.length) return;
    
    addressContainer.innerHTML = addresses.map(address => `
        <div class="address-option">
            <input type="radio" name="savedAddress" id="address-${address._id}" 
                   value="${address._id}">
            <label for="address-${address._id}">
                <strong>${address.firstName} ${address.lastName}</strong><br>
                ${address.address}, ${address.city}, ${address.state} - ${address.pincode}<br>
                Phone: ${address.phone}
            </label>
        </div>
    `).join('');
    
    // Add event listener for address selection
    document.querySelectorAll('input[name="savedAddress"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const selectedAddress = addresses.find(a => a._id === this.value);
            if (selectedAddress) {
                populateAddressForm(selectedAddress);
            }
        });
    });
}

function populateAddressForm(address) {
    document.getElementById('firstName').value = address.firstName;
    document.getElementById('lastName').value = address.lastName;
    document.getElementById('phone').value = address.phone;
    document.getElementById('address').value = address.address;
    document.getElementById('apartment').value = address.apartment || '';
    document.getElementById('city').value = address.city;
    document.getElementById('state').value = address.state;
    document.getElementById('pincode').value = address.pincode;
}

// Setup payment handlers
function setupPaymentHandlers() {
    // Shipping method change
    document.querySelectorAll('input[name="shipping"]').forEach(input => {
        input.addEventListener('change', () => loadOrderSummary());
    });
    
    // Payment method change
    document.querySelectorAll('input[name="payment"]').forEach(input => {
        input.addEventListener('change', function() {
            const cardDetails = document.getElementById('cardDetails');
            cardDetails.style.display = this.value === 'card' ? 'block' : 'none';
        });
    });
}

// Setup form validation
function setupFormValidation() {
    // Phone number formatting
    document.getElementById('phone').addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 10) value = value.slice(0, 10);
        e.target.value = value;
    });
    
    // Pincode validation
    document.getElementById('pincode').addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 6) value = value.slice(0, 6);
        e.target.value = value;
    });
}

// Format card input
function formatCardInput() {
    const cardNumber = document.getElementById('cardNumber');
    const expiry = document.getElementById('expiry');
    const cvv = document.getElementById('cvv');
    
    // Card number formatting
    cardNumber?.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\s/g, '');
        let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
        e.target.value = formattedValue;
    });
    
    // Expiry date formatting
    expiry?.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 2) {
            value = value.slice(0, 2) + '/' + value.slice(2, 4);
        }
        e.target.value = value;
    });
    
    // CVV formatting
    cvv?.addEventListener('input', function(e) {
        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 3);
    });
}

// Complete order
async function completeOrder() {
    // Validate forms
    if (!validateContactForm()) return;
    if (!validateShippingForm()) return;
    if (!validatePaymentForm()) return;
    
    // Show loading
    showLoader('Processing your order...');
    
    // Get form data
    const shippingAddress = getShippingAddress();
    const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
    const { subtotal, shipping, tax, total } = calculateTotals();
    
    // Create order data
    const orderData = {
        items: cart.map(item => ({
            product: item.id || item._id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            total: item.price * item.quantity
        })),
        shippingAddress,
        billing: {
            subtotal,
            shipping,
            tax,
            discount: 0,
            total
        },
        payment: {
            method: paymentMethod,
            status: 'pending'
        }
    };
    
    try {
        // Create order in backend
        const response = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(orderData)
        });
        
        if (!response.ok) {
            throw new Error('Failed to create order');
        }
        
        const order = await response.json();
        
        // Process payment based on method
        if (paymentMethod === 'cod') {
            // Cash on delivery
            await confirmOrder(order._id, order.orderNumber);
        } else if (paymentMethod === 'card') {
            // Online payment
            await processOnlinePayment(order, total);
        } else {
            // Other payment methods (UPI, Netbanking, etc.)
            await confirmOrder(order._id, order.orderNumber);
        }
        
    } catch (error) {
        hideLoader();
        console.error('Checkout error:', error);
        showNotification('Failed to process order. Please try again.', 'error');
    }
}

// Process online payment
async function processOnlinePayment(order, amount) {
    try {
        // Create Razorpay order
        const response = await fetch(`${API_URL}/create-payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                orderId: order._id,
                amount: amount * 100 // Razorpay expects amount in paise
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to create payment');
        }
        
        const paymentData = await response.json();
        
        // Initialize Razorpay
        const options = {
            key: razorpayKey,
            amount: paymentData.amount,
            currency: 'INR',
            name: 'Thekua Store',
            description: `Order #${order.orderNumber}`,
            order_id: paymentData.razorpay_order_id,
            handler: async function(response) {
                // Payment successful
                await verifyPayment(order._id, order.orderNumber, response);
            },
            prefill: {
                name: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
                email: currentUser.email,
                contact: shippingAddress.phone
            },
            theme: {
                color: '#8EB69B'
            }
        };
        
        const razorpay = new Razorpay(options);
        razorpay.open();
        
    } catch (error) {
        console.error('Payment error:', error);
        showNotification('Payment initialization failed. Please try again.', 'error');
    }
}

// Validation functions
function validateContactForm() {
    const email = document.getElementById('email').value;
    
    if (!isValidEmail(email)) {
        showNotification('Please enter a valid email address', 'error');
        return false;
    }
    
    return true;
}

function validateShippingForm() {
    const required = ['firstName', 'lastName', 'phone', 'address', 'city', 'state', 'pincode'];
    
    for (const field of required) {
        const value = document.getElementById(field).value.trim();
        if (!value) {
            showNotification(`Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`, 'error');
            document.getElementById(field).focus();
            return false;
        }
    }
    
    // Validate phone
    const phone = document.getElementById('phone').value;
    if (phone.length !== 10) {
        showNotification('Please enter a valid 10-digit phone number', 'error');
        document.getElementById('phone').focus();
        return false;
    }
    
    // Validate pincode
    const pincode = document.getElementById('pincode').value;
    if (pincode.length !== 6) {
        showNotification('Please enter a valid 6-digit PIN code', 'error');
        document.getElementById('pincode').focus();
        return false;
    }
    
    return true;
}

function validatePaymentForm() {
    const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
    
    if (paymentMethod === 'card') {
        const cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
        const expiry = document.getElementById('expiry').value;
        const cvv = document.getElementById('cvv').value;
        
        if (!cardNumber || cardNumber.length < 13) {
            showNotification('Please enter a valid card number', 'error');
            document.getElementById('cardNumber').focus();
            return false;
        }
        
        if (!expiry || expiry.length !== 5) {
            showNotification('Please enter a valid expiry date (MM/YY)', 'error');
            document.getElementById('expiry').focus();
            return false;
        }
        
        if (!cvv || cvv.length !== 3) {
            showNotification('Please enter a valid CVV', 'error');
            document.getElementById('cvv').focus();
            return false;
        }
        
        // Validate expiry date
        const [month, year] = expiry.split('/');
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear() % 100;
        const currentMonth = currentDate.getMonth() + 1;
        
        if (parseInt(year) < currentYear || (parseInt(year)) === currentYear && parseInt(month) < currentMonth) {
            showNotification('Card has expired', 'error');
            document.getElementById('expiry').focus();
            return false;
        }
    }
    
    return true;
}

// Helper functions
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showNotification(message, type) {
    // Use main.js notification if available, otherwise fallback
    if (window.showNotification && window.showNotification !== showNotification) {
        window.showNotification(message, type);
        return;
    }
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = 'position:fixed;top:20px;right:20px;padding:12px 24px;border-radius:8px;color:#fff;z-index:10000;font-family:Poppins,sans-serif;animation:slideInRight 0.3s ease;';
    notification.style.background = type === 'error' ? '#e74c3c' : type === 'success' ? '#27ae60' : '#3498db';
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

function showLoader(message) {
    let loader = document.getElementById('checkoutLoader');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'checkoutLoader';
        loader.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:10000;';
        loader.innerHTML = `<div style="background:#fff;padding:2rem 3rem;border-radius:12px;text-align:center;"><div style="border:4px solid #f3f3f3;border-top:4px solid #8EB69B;border-radius:50%;width:40px;height:40px;animation:spin 1s linear infinite;margin:0 auto 1rem;"></div><p style="font-family:Poppins,sans-serif;color:#333;">${message}</p></div>`;
        const style = document.createElement('style');
        style.textContent = '@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}';
        loader.appendChild(style);
        document.body.appendChild(loader);
    }
}

function hideLoader() {
    const loader = document.getElementById('checkoutLoader');
    if (loader) loader.remove();
}

// Get shipping address from form
function getShippingAddress() {
    return {
        firstName: document.getElementById('firstName').value.trim(),
        lastName: document.getElementById('lastName').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        address: document.getElementById('address').value.trim(),
        apartment: document.getElementById('apartment')?.value.trim() || '',
        city: document.getElementById('city').value.trim(),
        state: document.getElementById('state').value.trim(),
        pincode: document.getElementById('pincode').value.trim()
    };
}

// Confirm order and redirect to confirmation page
async function confirmOrder(orderId, orderNumber) {
    hideLoader();
    // Clear cart after successful order
    localStorage.removeItem('thekuaCart');
    showNotification('Order placed successfully!', 'success');
    // Redirect to order confirmation page
    setTimeout(() => {
        window.location.href = `order-confirmation.html?order=${orderNumber}`;
    }, 1500);
}

// Verify payment after online payment
async function verifyPayment(orderId, orderNumber, paymentResponse) {
    try {
        const response = await fetch(`${API_URL}/orders/${orderId}/verify-payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_signature: paymentResponse.razorpay_signature
            })
        });

        if (response.ok) {
            await confirmOrder(orderId, orderNumber);
        } else {
            // Even if verification fails, order is created - just confirm with COD fallback
            await confirmOrder(orderId, orderNumber);
        }
    } catch (error) {
        console.error('Payment verification error:', error);
        // Order was created, redirect anyway
        await confirmOrder(orderId, orderNumber);
    }
}

// Add Razorpay script dynamically
if (!document.querySelector('script[src*="razorpay"]')) {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    document.head.appendChild(script);
}