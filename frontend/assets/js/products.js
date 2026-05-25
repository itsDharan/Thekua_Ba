const API_BASE_URL = window.APP_CONFIG ? window.APP_CONFIG.API_BASE_URL : (window.location.origin + '/api');
// Global variables for filtering and sorting
let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
const productsPerPage = 8;

// Initialize products page
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('products.html')) {
        initializeProductsPage();
    }
});

async function initializeProductsPage() {
    // Load products from API
    await loadProductsFromAPI();

    setupFilterEventListeners();
    setupSearchFromURL();
    updateResultsCount();
}

// Load products from API
async function loadProductsFromAPI() {
    try {
        const response = await fetch(`${API_BASE_URL}/products?limit=100`);
        const data = await response.json();

        if (response.ok && data.products) {
            allProducts = data.products;
            filteredProducts = [...allProducts];
            loadAllProducts();
        } else {
            console.error('Failed to load products');
            showNoProductsMessage('Failed to load products. Please try again later.');
        }
    } catch (error) {
        console.error('Error loading products:', error);
        showNoProductsMessage('Unable to connect to server. Please check your connection.');
    }
}

// Load all products
function loadAllProducts() {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) return;

    // Clear loading message
    productsGrid.innerHTML = '';

    // Display products
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const productsToShow = filteredProducts.slice(startIndex, endIndex);

    if (productsToShow.length === 0) {
        const searchTerm = document.getElementById('searchInput')?.value.trim();
        if (searchTerm) {
            productsGrid.innerHTML = `
                <div class="no-search-results" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                    <h3>No products found for "${searchTerm}"</h3>
                    <p>Try adjusting your search terms or browse our categories</p>
                    <button class="btn btn-primary" onclick="clearSearch()">View All Products</button>
                </div>
            `;
        } else {
            productsGrid.innerHTML = `
                <div class="no-products" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                    <h3>No products found</h3>
                    <p>Try adjusting your filters</p>
                    <button class="btn btn-primary" onclick="clearAllFilters()">Clear Filters</button>
                </div>
            `;
        }
        return;
    }

    productsToShow.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card animate-fade-up';

        const productImage = product.images && product.images.length > 0 ?
            `${API_BASE_URL.replace('/api', '')}${product.images[0].url}` : null;

        productCard.innerHTML = `
            <div class="product-image">
                ${productImage ?
                    `<img src="${productImage}" alt="${product.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`
                    : ''
                }
                <div class="product-emoji" ${productImage ? 'style="display:none;"' : 'style="display:flex; align-items: center; justify-content: center; width: 100%; height: 100%;"'}>
                    ${product.emoji || '🍪'}
                </div>
                ${product.bestseller ? '<span class="product-badge">Bestseller</span>' : ''}
                <div class="product-actions">
                    <button class="action-btn" onclick="addToWishlist('${product._id}', event)" title="Add to Wishlist">
                        ❤️
                    </button>
                    <button class="action-btn" onclick="openQuickView('${product._id}')" title="Quick View">
                        👁️
                    </button>
                </div>
                <div class="quick-view-btn" onclick="openQuickView('${product._id}')">
                    Quick View
                </div>
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-footer">
                    <span class="product-price">₹${product.price}</span>
                    <button class="add-to-cart" onclick="addToCartFromProducts('${product._id}', event)">
                        Add to Cart
                    </button>
                </div>
            </div>
        `;
        productsGrid.appendChild(productCard);
    });

    // Update load more button
    updateLoadMoreButton();
}

// Show no products message
function showNoProductsMessage(message) {
    const productsGrid = document.getElementById('productsGrid');
    if (productsGrid) {
        productsGrid.innerHTML = `
            <div class="no-products" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                <h3>${message}</h3>
            </div>
        `;
    }
}

// Add to cart from products page
async function addToCartFromProducts(productId, event) {
    // Use the global addToCart function from main.js if available
    if (typeof addToCart === 'function') {
        await addToCart(productId);
    } else {
        // Fallback implementation
        try {
            const response = await fetch(`${API_BASE_URL}/products/${productId}`);
            const product = await response.json();

            if (!response.ok || !product) {
                showNotification('Product not found', 'error');
                return;
            }

            // Ensure cart is initialized
            if (typeof cart === 'undefined') {
                window.cart = JSON.parse(localStorage.getItem('thekuaCart')) || [];
            }

            const existingItem = cart.find(item => item.id === productId);

            if (existingItem) {
                existingItem.quantity += 1;
                showNotification(`Updated ${product.name} quantity in cart!`, 'success');
            } else {
                cart.push({
                    id: productId,
                    name: product.name,
                    description: product.description,
                    price: product.price,
                    emoji: product.emoji,
                    image: product.images && product.images.length > 0 ?
                        `${API_BASE_URL.replace('/api', '')}${product.images[0].url}` : null,
                    quantity: 1
                });
                showNotification(`${product.name} added to cart!`, 'success');
            }

            // Save cart
            localStorage.setItem('thekuaCart', JSON.stringify(cart));

            // Update cart count
            updateCartCount();
        } catch (error) {
            console.error('Error adding to cart:', error);
            showNotification('Failed to add product to cart', 'error');
        }
    }

    // Add visual feedback
    const button = event.target;
    const originalText = button.textContent;
    const originalBackground = button.style.background;
    button.textContent = 'Added!';
    button.style.background = '#4CAF50';
    button.disabled = true;
    setTimeout(() => {
        button.textContent = originalText;
        button.style.background = originalBackground;
        button.disabled = false;
    }, 1000);
}

// Quick View Modal Functions
async function openQuickView(productId) {
    const product = allProducts.find(p => p._id === productId);
    if (!product) {
        console.error('Product not found for quick view:', productId);
        return;
    }
    // Ensure modal exists or create it
    let modal = document.getElementById('quickViewModal');
    if (!modal) {
        createQuickViewModal();
        modal = document.getElementById('quickViewModal');
    }
    // Update modal content
    const nameEl = document.getElementById('quickViewName');
    const descEl = document.getElementById('quickViewDescription');
    const priceEl = document.getElementById('quickViewPrice');
    const imageEl = document.getElementById('quickViewImage');
    const emojiEl = document.getElementById('quickViewEmoji');
    if (nameEl) nameEl.textContent = product.name;
    if (descEl) descEl.textContent = product.description;
    if (priceEl) priceEl.textContent = `₹${product.price}`;
    const productImage = product.images && product.images.length > 0 ?
        `${API_BASE_URL.replace('/api', '')}${product.images[0].url}` : null;
    if (productImage && imageEl) {
        imageEl.src = productImage;
        imageEl.style.display = 'block';
        if (emojiEl) emojiEl.style.display = 'none';
    } else {
        if (imageEl) imageEl.style.display = 'none';
        if (emojiEl) {
            emojiEl.textContent = product.emoji || '🍪';
            emojiEl.style.display = 'flex';
        }
    }
    // Store current product for add to cart
    window.currentQuickViewProduct = product;
    // Show modal
    modal.classList.add('active');
}

// Create quick view modal if it doesn't exist
function createQuickViewModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'quickViewModal';
    modal.innerHTML = `
        <div class="modal-content modal-large">
            <button class="modal-close" onclick="closeQuickView()">&times;</button>
            <div class="quick-view-content">
                <div class="quick-view-image">
                    <img id="quickViewImage" src="" alt="" style="width: 100%; height: 100%; object-fit: cover;">
                    <div class="quick-view-emoji" id="quickViewEmoji" style="display: flex; align-items: center; justify-content: center; font-size: 8rem;"></div>
                </div>
                <div class="quick-view-details">
                    <h2 id="quickViewName"></h2>
                    <p id="quickViewDescription"></p>
                    <div class="quick-view-price">
                        <span class="price" id="quickViewPrice"></span>
                        <span class="weight">250g Pack</span>
                    </div>
                    <div class="quick-view-features">
                        <div class="feature">
                            <span class="feature-icon">🌾</span>
                            <span>100% Natural</span>
                        </div>
                        <div class="feature">
                            <span class="feature-icon">🚚</span>
                            <span>Fresh Delivery</span>
                        </div>
                        <div class="feature">
                            <span class="feature-icon">👨‍🍳</span>
                            <span>Handmade</span>
                        </div>
                    </div>
                    <div class="quick-view-actions">
                        <div class="quantity-selector">
                            <button onclick="decreaseQuantity()" style="background: var(--secondary-color); border: none; padding: 0.5rem 1rem; cursor: pointer;">-</button>
                            <input type="number" id="quantityInput" value="1" min="1" style="width: 60px; text-align: center; border: 1px solid #ddd; padding: 0.5rem;">
                            <button onclick="increaseQuantity()" style="background: var(--secondary-color); border: none; padding: 0.5rem 1rem; cursor: pointer;">+</button>
                        </div>
                        <button class="btn btn-primary" onclick="addToCartFromQuickView()" style="background: var(--primary-color); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 5px; cursor: pointer; margin-left: 1rem;">Add to Cart</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function closeQuickView() {
    const modal = document.getElementById('quickViewModal');
    if (modal) {
        modal.classList.remove('active');
        const quantityInput = document.getElementById('quantityInput');
        if (quantityInput) quantityInput.value = 1;
    }
}

function increaseQuantity() {
    const input = document.getElementById('quantityInput');
    if (input) {
        const currentValue = parseInt(input.value) || 1;
        if (currentValue < 99) {
            input.value = currentValue + 1;
        }
    }
}

function decreaseQuantity() {
    const input = document.getElementById('quantityInput');
    if (input) {
        const currentValue = parseInt(input.value) || 1;
        if (currentValue > 1) {
            input.value = currentValue - 1;
        }
    }
}

async function addToCartFromQuickView() {
    if (!window.currentQuickViewProduct) return;
    const quantityInput = document.getElementById('quantityInput');
    const quantity = parseInt(quantityInput?.value || 1);
    const product = window.currentQuickViewProduct;
    // Add to cart with specified quantity
    for (let i = 0; i < quantity; i++) {
        await addToCartFromProducts(product._id);
    }
    closeQuickView();
}

// Filter and sort functions
function setupFilterEventListeners() {
    // Category filters
    document.querySelectorAll('.filter-checkbox input').forEach(checkbox => {
        checkbox.addEventListener('change', applyFilters);
    });

    // Price range filter
    const priceRange = document.getElementById('priceRange');
    if (priceRange) {
        priceRange.addEventListener('input', function(e) {
            const maxPriceEl = document.getElementById('maxPrice');
            if (maxPriceEl) {
                maxPriceEl.textContent = `₹${e.target.value}`;
            }
            debounce(applyFilters, 300)();
        });
    }

    // Sort dropdown
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', applySorting);
    }

    // Search input from header
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }
}

function applyFilters() {
    filteredProducts = [...allProducts];

    // Category filters
    const selectedCategories = [];
    document.querySelectorAll('.filter-checkbox input:checked').forEach(checkbox => {
        if (checkbox.value === 'sweet' || checkbox.value === 'savory') {
            selectedCategories.push(checkbox.value);
        }
    });

    if (selectedCategories.length > 0) {
        filteredProducts = filteredProducts.filter(product =>
            selectedCategories.includes(product.category)
        );
    }

    // Price filter
    const priceRange = document.getElementById('priceRange');
    const maxPrice = parseInt(priceRange?.value || 500);
    filteredProducts = filteredProducts.filter(product => product.price <= maxPrice);

    // Diet filters
    const dietFilters = [];
    document.querySelectorAll('.filter-checkbox input:checked').forEach(checkbox => {
        if (checkbox.value === 'vegan' || checkbox.value === 'gluten-free') {
            dietFilters.push(checkbox.value);
        }
    });

    if (dietFilters.includes('gluten-free')) {
        filteredProducts = filteredProducts.filter(product =>
            product.name.toLowerCase().includes('millet') ||
            product.category === 'savory'
        );
    }

    // Apply current search term
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput?.value.trim().toLowerCase();
    if (searchTerm) {
        filteredProducts = filteredProducts.filter(product =>
            product.name.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm)
        );
    }

    applySorting();
    currentPage = 1;
    loadAllProducts();
    updateResultsCount();
}

function applySorting() {
    const sortSelect = document.getElementById('sortSelect');
    const sortValue = sortSelect?.value || 'default';
    switch (sortValue) {
        case 'price-low':
            filteredProducts.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            filteredProducts.sort((a, b) => b.price - a.price);
            break;
        case 'name':
            filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'default':
        default:
            filteredProducts.sort((a, b) => {
                if (a.bestseller && !b.bestseller) return -1;
                if (!a.bestseller && b.bestseller) return 1;
                return 0;
            });
            break;
    }
    if (currentPage > 1) {
        currentPage = 1;
        loadAllProducts();
    }
}

function handleSearch() {
    applyFilters();
}

function setupSearchFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('search');
    if (searchQuery) {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = searchQuery;
            applyFilters();
        }
    }
}

function clearAllFilters() {
    document.querySelectorAll('.filter-checkbox input').forEach(checkbox => {
        checkbox.checked = false;
    });

    const priceRange = document.getElementById('priceRange');
    if (priceRange) {
        priceRange.value = 500;
        const maxPriceEl = document.getElementById('maxPrice');
        if (maxPriceEl) maxPriceEl.textContent = '₹500';
    }

    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.value = 'default';
    }

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = '';
    }

    applyFilters();

    if (typeof showNotification === 'function') {
        showNotification('Filters cleared', 'info');
    }
}

function updateResultsCount() {
    const resultsCount = document.getElementById('resultsCount');
    if (resultsCount) {
        resultsCount.textContent = filteredProducts.length;
    }
}

function updateLoadMoreButton() {
    const loadMoreContainer = document.querySelector('.load-more-container');
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
    if (loadMoreContainer) {
        if (currentPage >= totalPages) {
            loadMoreContainer.style.display = 'none';
        } else {
            loadMoreContainer.style.display = 'block';
        }
    }
}

function loadMoreProducts() {
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        const startIndex = (currentPage - 1) * productsPerPage;
        const endIndex = startIndex + productsPerPage;
        const additionalProducts = filteredProducts.slice(startIndex, endIndex);
        const productsGrid = document.getElementById('productsGrid');
        additionalProducts.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card animate-fade-up';

            const productImage = product.images && product.images.length > 0 ?
                `${API_BASE_URL.replace('/api', '')}${product.images[0].url}` : null;

            productCard.innerHTML = `
                <div class="product-image">
                    ${productImage ?
                        `<img src="${productImage}" alt="${product.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`
                        : ''
                    }
                    <div class="product-emoji" ${productImage ? 'style="display:none;"' : 'style="display:flex; align-items: center; justify-content: center; width: 100%; height: 100%;"'}>
                        ${product.emoji || '🍪'}
                    </div>
                    ${product.bestseller ? '<span class="product-badge">Bestseller</span>' : ''}
                    <div class="product-actions">
                        <button class="action-btn" onclick="addToWishlist('${product._id}', event)" title="Add to Wishlist">
                            ❤️
                        </button>
                        <button class="action-btn" onclick="openQuickView('${product._id}')" title="Quick View">
                            👁️
                        </button>
                    </div>
                    <div class="quick-view-btn" onclick="openQuickView('${product._id}')">
                        Quick View
                    </div>
                </div>
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-description">${product.description}</p>
                    <div class="product-footer">
                        <span class="product-price">₹${product.price}</span>
                        <button class="add-to-cart" onclick="addToCartFromProducts('${product._id}', event)">
                            Add to Cart
                        </button>
                    </div>
                </div>
            `;
            productsGrid.appendChild(productCard);
        });
        updateLoadMoreButton();
    }
}

function addToWishlist(productId, event) {
    const product = allProducts.find(p => p._id === productId);
    if (!product) return;
    let wishlist = JSON.parse(localStorage.getItem('thekuaWishlist')) || [];
    if (wishlist.find(item => item._id === productId)) {
        if (typeof showNotification === 'function') {
            showNotification('Item already in wishlist', 'info');
        }
        return;
    }
    wishlist.push({
        id: productId,
        _id: productId,
        name: product.name,
        description: product.description,
        price: product.price,
        emoji: product.emoji,
        image: product.images && product.images.length > 0 ?
            `${API_BASE_URL.replace('/api', '')}${product.images[0].url}` : null
    });

    localStorage.setItem('thekuaWishlist', JSON.stringify(wishlist));
    if (typeof showNotification === 'function') {
        showNotification(`${product.name} added to wishlist!`, 'success');
    }
    // Update wishlist icon
    const button = event.target;
    const originalBackground = button.style.background;
    const originalText = button.textContent;
    button.style.background = '#ff6b6b';
    button.textContent = '💔';
    setTimeout(() => {
        button.style.background = originalBackground;
        button.textContent = originalText;
    }, 1000);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function clearSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = '';
        applyFilters();
    }
}

// Helper function to update cart count
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('thekuaCart')) || [];
    const cartCountElements = document.querySelectorAll('#cartCount, .cart-count');
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);

    cartCountElements.forEach(element => {
        element.textContent = totalItems;
        element.style.display = totalItems > 0 ? 'flex' : 'none';
    });
}

// Export functions to global scope
window.addToCartFromProducts = addToCartFromProducts;
window.clearAllFilters = clearAllFilters;
window.loadMoreProducts = loadMoreProducts;
window.openQuickView = openQuickView;
window.closeQuickView = closeQuickView;
window.increaseQuantity = increaseQuantity;
window.decreaseQuantity = decreaseQuantity;
window.addToCartFromQuickView = addToCartFromQuickView;
window.addToWishlist = addToWishlist;
window.clearSearch = clearSearch;
