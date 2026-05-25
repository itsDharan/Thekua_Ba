// Constants
const DELIVERY_CHARGE = 50;
const FREE_DELIVERY_AMOUNT = 500;

// Initialize cart page
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('cart.html')) {
        // Initialize cart from localStorage
        window.cart = JSON.parse(localStorage.getItem('thekuaCart')) || [];

        loadCartItems();
        loadSuggestedProducts();
        updateCartSummary();
        updateCartCount();
    }
});

// Load cart items
function loadCartItems() {
    const cartItemsContainer = document.getElementById('cartItemsContainer');
    const emptyCart = document.getElementById('emptyCart');
    const cartLayout = document.querySelector('.cart-layout');

    if (typeof cart === 'undefined') {
        window.cart = JSON.parse(localStorage.getItem('thekuaCart')) || [];
    }

    if (cart.length === 0) {
        if (cartLayout) cartLayout.style.display = 'none';
        if (emptyCart) emptyCart.style.display = 'block';
        return;
    }

    if (cartLayout) cartLayout.style.display = 'grid';
    if (emptyCart) emptyCart.style.display = 'none';

    if (!cartItemsContainer) return;

    cartItemsContainer.innerHTML = cart.map(item => `
        <div class="cart-item" data-product-id="${item.id}">
            <div class="cart-item-image">
                ${item.image ?
                    `<img src="${item.image}" alt="${item.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` :
                    ''
                }
                <div class="cart-item-emoji" ${item.image ? 'style="display:none;"' : ''}>
                    ${item.emoji || '🍪'}
                </div>
            </div>

            <div class="cart-item-details">
                <h3>${item.name}</h3>
                <p>${item.description || 'Delicious traditional snack'}</p>
                <div class="cart-item-quantity">
                    <button class="quantity-btn" onclick="updateQuantity('${item.id}', ${item.quantity - 1})">-</button>
                    <input type="number" class="quantity-input" value="${item.quantity}" min="1" max="99" onchange="updateQuantity('${item.id}', this.value)">
                    <button class="quantity-btn" onclick="updateQuantity('${item.id}', ${item.quantity + 1})">+</button>
                </div>
            </div>

            <div class="cart-item-price">
                <span class="item-price">₹${item.price * item.quantity}</span>
                <button class="remove-item" onclick="removeItem('${item.id}')">Remove</button>
            </div>
        </div>
    `).join('');
}

// Update cart summary
function updateCartSummary() {
    if (typeof cart === 'undefined') {
        window.cart = JSON.parse(localStorage.getItem('thekuaCart')) || [];
    }

    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const delivery = subtotal >= FREE_DELIVERY_AMOUNT ? 0 : DELIVERY_CHARGE;
    const total = subtotal + delivery;

    const subtotalEl = document.getElementById('subtotal');
    const deliveryEl = document.getElementById('delivery');
    const totalEl = document.getElementById('total');

    if (subtotalEl) subtotalEl.textContent = `₹${subtotal}`;
    if (deliveryEl) deliveryEl.textContent = delivery === 0 ? 'FREE' : `₹${delivery}`;
    if (totalEl) totalEl.textContent = `₹${total}`;

    if (subtotal < FREE_DELIVERY_AMOUNT && subtotal > 0) {
        const remaining = FREE_DELIVERY_AMOUNT - subtotal;
        if (typeof showNotification === 'function') {
            showNotification(`Add ₹${remaining} more for free delivery!`, 'info');
        }
    }
}

// Update quantity
function updateQuantity(productId, newQuantity) {
    const quantity = parseInt(newQuantity);

    if (quantity < 1) {
        removeItem(productId);
        return;
    }

    if (quantity > 99) {
        if (typeof showNotification === 'function') {
            showNotification('Maximum quantity is 99', 'error');
        } else {
            alert('Maximum quantity is 99');
        }
        return;
    }

    if (typeof cart === 'undefined') {
        window.cart = JSON.parse(localStorage.getItem('thekuaCart')) || [];
    }

    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity = quantity;
        saveCart();
        loadCartItems();
        updateCartSummary();
        updateCartCount();
    }
}

// Remove item from cart
function removeItem(productId) {
    if (typeof cart === 'undefined') {
        window.cart = JSON.parse(localStorage.getItem('thekuaCart')) || [];
    }

    const item = cart.find(item => item.id === productId);
    if (item) {
        if (confirm(`Remove ${item.name} from cart?`)) {
            cart = cart.filter(item => item.id !== productId);
            window.cart = cart;
            saveCart();
            loadCartItems();
            updateCartSummary();
            updateCartCount();

            if (typeof showNotification === 'function') {
                showNotification('Item removed from cart', 'info');
            }

            if (cart.length === 0) {
                location.reload();
            }
        }
    }
}

// Clear entire cart
function clearCart() {
    if (typeof cart === 'undefined') {
        window.cart = JSON.parse(localStorage.getItem('thekuaCart')) || [];
    }

    if (cart.length === 0) {
        if (typeof showNotification === 'function') {
            showNotification('Cart is already empty', 'info');
        } else {
            alert('Cart is already empty');
        }
        return;
    }

    if (confirm('Are you sure you want to clear your entire cart?')) {
        cart = [];
        window.cart = cart;
        saveCart();
        location.reload();
    }
}

// Save cart to localStorage
function saveCart() {
    localStorage.setItem('thekuaCart', JSON.stringify(cart));
}

// Update cart count
function updateCartCount() {
    if (typeof cart === 'undefined') {
        window.cart = JSON.parse(localStorage.getItem('thekuaCart')) || [];
    }

    const cartCountElements = document.querySelectorAll('#cartCount, .cart-count');
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);

    cartCountElements.forEach(element => {
        if (element) {
            element.textContent = totalItems;
            element.style.display = totalItems > 0 ? 'flex' : 'none';
        }
    });
}

// Apply promo code
function applyPromo() {
    const promoCodeInput = document.getElementById('promoCode');
    if (!promoCodeInput) return;

    const promoCode = promoCodeInput.value.trim().toUpperCase();

    if (!promoCode) {
        if (typeof showNotification === 'function') {
            showNotification('Please enter a promo code', 'error');
        } else {
            alert('Please enter a promo code');
        }
        return;
    }

    const promoCodes = {
        'FIRST10': { discount: 10, type: 'percentage', message: '10% discount applied!' },
        'SAVE50': { discount: 50, type: 'fixed', message: '₹50 discount applied!' },
        'BIHAR20': { discount: 20, type: 'percentage', message: '20% Bihar special discount!' },
        'WELCOME': { discount: 15, type: 'percentage', message: 'Welcome! 15% off applied!' }
    };

    const promo = promoCodes[promoCode];

    if (promo) {
        if (typeof showNotification === 'function') {
            showNotification(promo.message, 'success');
        } else {
            alert(promo.message);
        }
    } else {
        if (typeof showNotification === 'function') {
            showNotification('Invalid promo code', 'error');
        } else {
            alert('Invalid promo code');
        }
    }
}

// Proceed to checkout function
function proceedToCheckout(event) {
    if (typeof cart === 'undefined') {
        window.cart = JSON.parse(localStorage.getItem('thekuaCart')) || [];
    }

    if (!cart || cart.length === 0) {
        alert('Your cart is empty');
        return;
    }

    const checkoutUrl = 'checkout.html';
    localStorage.setItem('thekuaCart', JSON.stringify(cart));

    const btn = event.target;
    const originalText = btn.textContent;
    btn.textContent = 'Redirecting...';
    btn.disabled = true;

    setTimeout(() => {
        window.location.href = checkoutUrl;
    }, 500);
}

// Load suggested products from API
async function loadSuggestedProducts() {
    const suggestedContainer = document.getElementById('suggestedProducts');
    if (!suggestedContainer) return;

    try {
        const API = window.API_BASE_URL || (window.location.origin + '/api');
        const response = await fetch(`${API}/products?limit=4`);
        const data = await response.json();

        if (response.ok && data.products) {
            const cartIds = cart.map(item => item.id);
            const suggestions = data.products
                .filter(product => !cartIds.includes(product._id))
                .sort(() => Math.random() - 0.5)
                .slice(0, 4);

            suggestedContainer.innerHTML = suggestions.map(product => {
                const productImage = product.images && product.images.length > 0 ?
                    `${window.location.origin}${product.images[0].url}` : null;

                return `
                    <div class="product-card animate-fade-up">
                        <div class="product-image">
                            ${productImage ?
                                `<img src="${productImage}" alt="${product.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` :
                                ''
                            }
                            <div class="product-emoji" ${productImage ? 'style="display:none;"' : ''}>
                                ${product.emoji || '🍪'}
                            </div>
                            ${product.discount > 0 ? `<span class="discount-badge">-${product.discount}%</span>` : ''}
                        </div>
                        <div class="product-info">
                            <h3 class="product-name">${product.name}</h3>
                            <p class="product-description">${product.description}</p>
                            <div class="product-footer">
                                <span class="product-price">₹${product.price}</span>
                                <button class="add-to-cart" onclick="addToCartFromSuggestion('${product._id}')">
                                    Add to Cart
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }
    } catch (error) {
        console.error('Error loading suggested products:', error);
        suggestedContainer.innerHTML = '<p style="text-align: center; color: #666;">Unable to load suggestions</p>';
    }
}

// Add to cart from suggestions
async function addToCartFromSuggestion(productId) {
    if (typeof addToCart === 'function') {
        await addToCart(productId);
    } else {
        try {
            const API = window.API_BASE_URL || (window.location.origin + '/api');
            const response = await fetch(`${API}/products/${productId}`);
            const product = await response.json();

            if (!response.ok || !product) {
                showNotification('Product not found', 'error');
                return;
            }

            if (typeof cart === 'undefined') {
                window.cart = JSON.parse(localStorage.getItem('thekuaCart')) || [];
            }

            const existingItem = cart.find(item => item.id === productId);

            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cart.push({
                    id: productId,
                    name: product.name,
                    description: product.description,
                    price: product.price,
                    emoji: product.emoji,
                    image: product.images && product.images.length > 0 ?
                        `${window.location.origin}${product.images[0].url}` : null,
                    quantity: 1
                });
            }

            window.cart = cart;
            saveCart();

            if (typeof showNotification === 'function') {
                showNotification(`${product.name} added to cart!`, 'success');
            } else {
                alert(`${product.name} added to cart!`);
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
            if (typeof showNotification === 'function') {
                showNotification('Failed to add product to cart', 'error');
            }
        }
    }

    setTimeout(() => {
        loadCartItems();
        updateCartSummary();
        updateCartCount();
        loadSuggestedProducts();
    }, 100);
}

// Override updateCartDisplay for cart page
function updateCartDisplay() {
    loadCartItems();
    updateCartSummary();
    updateCartCount();
}

// Export functions to global scope to ensure they're accessible
window.updateQuantity = updateQuantity;
window.removeItem = removeItem;
window.clearCart = clearCart;
window.applyPromo = applyPromo;
window.proceedToCheckout = proceedToCheckout;
window.addToCartFromSuggestion = addToCartFromSuggestion;
window.updateCartDisplay = updateCartDisplay;

// Console log for debugging
console.log('Cart.js loaded. Functions available:', {
    updateQuantity: typeof updateQuantity,
    removeItem: typeof removeItem,
    clearCart: typeof clearCart,
    proceedToCheckout: typeof proceedToCheckout
});
