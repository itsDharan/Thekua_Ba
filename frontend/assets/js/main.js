// ===== GLOBAL VARIABLES =====
let cart = JSON.parse(localStorage.getItem('thekuaCart')) || [];
let isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
// ===== GLOBAL VARIABLES =====
// ===== DOM CONTENT LOADED =====
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    loadFeaturedProducts();
    updateCartCount();
    setupEventListeners();
    checkAuthStatus();
    initializeAnimations();
});

// ===== INITIALIZE APP =====
function initializeApp() {
    // Show loading screen
    showLoading();
    
    // Hide loading after content loads
    setTimeout(() => {
        hideLoading();
    }, 1500);
    
    // Initialize smooth scrolling
    initSmoothScroll();
    
    // Initialize parallax effects
    initParallax();
}

// ===== LOADING FUNCTIONS =====
function showLoading() {
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading';
    loadingDiv.innerHTML = `
        <div class="loading-content">
            <div class="loading-spinner"></div>
            <h2>Loading Bihar Heritage...</h2>
        </div>
    `;
    document.body.appendChild(loadingDiv);
}

function hideLoading() {
    const loading = document.querySelector('.loading');
    if (loading) {
        loading.style.opacity = '0';
        setTimeout(() => loading.remove(), 500);
    }
}

// ===== LOAD FEATURED PRODUCTS FROM API =====
async function loadFeaturedProducts() {
    const featuredContainer = document.getElementById('featuredProducts');
    if (!featuredContainer) return;
    
    try {
        // Fetch bestseller products from API
        const response = await fetch(`${API_BASE_URL}/products?bestseller=true&limit=4`);
        const data = await response.json();
        
        if (response.ok && data.products) {
            const featuredProducts = data.products;
            
            featuredContainer.innerHTML = featuredProducts.map(product => `
                <div class="product-card animate-fade-up">
                    <div class="product-image">
                        ${product.images && product.images.length > 0 ? 
                            `<img src="${product.images[0].url.startsWith('http') ? product.images[0].url : API_BASE_URL.replace('/api', '') + product.images[0].url}" alt="${product.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : 
                            ''
                        }
                        <div class="product-emoji" ${product.images && product.images.length > 0 ? 'style="display:none;"' : ''}>
                            ${product.emoji || '🍪'}
                        </div>
                        ${product.bestseller ? '<span class="product-badge">Bestseller</span>' : ''}
                    </div>
                    <div class="product-info">
                        <h3 class="product-name">${product.name}</h3>
                        <p class="product-description">${product.description}</p>
                        <div class="product-footer">
                            <span class="product-price">₹${product.price}</span>
                            <button class="add-to-cart" onclick="addToCart('${product._id}')">
                                Add to Cart
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading featured products:', error);
        // Fallback to show error message
        featuredContainer.innerHTML = '<p style="text-align: center; color: #666;">Unable to load products. Please try again later.</p>';
    }
}

// ===== CART FUNCTIONS =====
async function addToCart(productId) {
    try {
        // Fetch product details from API
        const response = await fetch(`${API_BASE_URL}/products/${productId}`);
        const product = await response.json();
        
        if (!response.ok || !product) {
            showNotification('Product not found', 'error');
            return;
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
                    `${product.images[0].url.startsWith('http') ? product.images[0].url : API_BASE_URL.replace('/api', '') + product.images[0].url}` : null,
                quantity: 1
            });
        }
        
        saveCart();
        updateCartCount();
        showNotification(`${product.name} added to cart!`, 'success');
    } catch (error) {
        console.error('Error adding to cart:', error);
        showNotification('Failed to add product to cart', 'error');
    }
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartCount();
    updateCartDisplay();
}

function updateCartQuantity(productId, quantity) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity = Math.max(1, quantity);
        saveCart();
        updateCartDisplay();
    }
}

function saveCart() {
    localStorage.setItem('thekuaCart', JSON.stringify(cart));
}

function updateCartCount() {
    const cartCountElements = document.querySelectorAll('#cartCount, .cart-count');
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    
    cartCountElements.forEach(element => {
        element.textContent = totalItems;
        element.style.display = totalItems > 0 ? 'flex' : 'none';
    });
}

function updateCartDisplay() {
    // This function will be overridden in cart.js for the cart page
    updateCartCount();
}

function getCartTotal() {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

// ===== SEARCH FUNCTIONS =====
function toggleSearch() {
    const searchBar = document.getElementById('searchBar');
    searchBar.classList.toggle('active');
    
    if (searchBar.classList.contains('active')) {
        document.getElementById('searchInput').focus();
    }
}

function performSearch() {
    const searchInput = document.getElementById('searchInput');
    const query = searchInput.value.trim();
    
    if (query) {
        window.location.href = `products.html?search=${encodeURIComponent(query)}`;
    }
}

// ===== MOBILE MENU =====
function toggleMobileMenu() {
    const navMenu = document.getElementById('navMenu');
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    
    navMenu.classList.toggle('active');
    mobileMenuBtn.classList.toggle('active');
}

// ===== AUTHENTICATION =====
function checkAuthStatus() {
    if (isLoggedIn && currentUser) {
        updateAuthUI();
    }
}

function updateAuthUI() {
    const userBtn = document.querySelector('.user-btn');
    if (userBtn && isLoggedIn) {
        userBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
        `;
        userBtn.setAttribute('href', 'profile.html');
        userBtn.setAttribute('title', currentUser.name || 'Profile');
    }
}

function login(email, password) {
    // Simulate login - in real app, this would be an API call
    isLoggedIn = true;
    currentUser = {
        id: 1,
        name: 'John Doe',
        email: email
    };
    
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    updateAuthUI();
    showNotification('Login successful!', 'success');
    
    // Redirect after login
    setTimeout(() => {
        const redirectUrl = sessionStorage.getItem('redirectAfterLogin') || 'index.html';
        sessionStorage.removeItem('redirectAfterLogin');
        window.location.href = redirectUrl;
    }, 1000);
}

function logout() {
    isLoggedIn = false;
    currentUser = null;
    
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('authToken');
    
    showNotification('Logged out successfully!', 'success');
    
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
}

// ===== NOTIFICATIONS =====
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }
    
    // Newsletter form
    const newsletterForm = document.getElementById('newsletterForm');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = this.querySelector('input[type="email"]').value;
            subscribeNewsletter(email);
        });
    }
    
    // Close modals on outside click
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
        }
    });
    
    // Sticky header on scroll
    let lastScroll = 0;
    window.addEventListener('scroll', function() {
        const header = document.querySelector('.header');
        if (header) {
            const currentScroll = window.pageYOffset;
            
            if (currentScroll > 100) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
            
            lastScroll = currentScroll;
        }
    });
}

// ===== NEWSLETTER =====
function subscribeNewsletter(email) {
    // Simulate newsletter subscription
    showNotification('Thank you for subscribing to our newsletter!', 'success');
    
    // Clear form
    const form = document.getElementById('newsletterForm');
    if (form) {
        form.reset();
    }
}

// ===== SMOOTH SCROLL =====
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = targetElement.offsetTop - headerHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ===== PARALLAX EFFECTS =====
function initParallax() {
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        
        // Hero parallax
        const heroContent = document.querySelector('.hero-content');
        if (heroContent) {
            heroContent.style.transform = `translateY(${scrolled * 0.5}px)`;
            heroContent.style.opacity = 1 - (scrolled * 0.001);
        }
        
        // Video parallax
        const heroVideo = document.querySelector('.hero-video');
        if (heroVideo) {
            heroVideo.style.transform = `translate(-50%, calc(-50% + ${scrolled * 0.3}px))`;
        }
    });
}

// ===== ANIMATIONS =====
function initializeAnimations() {
    // Intersection Observer for fade-in animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observe elements with animation classes
    document.querySelectorAll('.animate-fade-up, .product-card, .feature-card, .testimonial-card').forEach(el => {
        observer.observe(el);
    });
}

// ===== UTILITY FUNCTIONS =====
function formatPrice(price) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0
    }).format(price);
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

// ===== EXPORT FUNCTIONS =====
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateCartQuantity = updateCartQuantity;
window.toggleSearch = toggleSearch;
window.performSearch = performSearch;
window.toggleMobileMenu = toggleMobileMenu;
window.login = login;
window.logout = logout;
window.showNotification = showNotification;