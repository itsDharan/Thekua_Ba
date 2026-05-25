// frontend-api.js - Add this to your frontend to integrate with backend

// API Configuration
if (typeof API_BASE_URL === 'undefined') { var API_BASE_URL = window.location.origin + '/api'; }

// Update the existing main.js to use API
class ThekuaAPI {
    constructor() {
        this.token = localStorage.getItem('userToken');
        this.user = JSON.parse(localStorage.getItem('userData')) || null;
    }

    // Set authorization header
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }

    // User Authentication
    async register(userData) {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });

            const data = await response.json();
            
            if (response.ok) {
                this.token = data.token;
                this.user = data.user;
                localStorage.setItem('userToken', this.token);
                localStorage.setItem('userData', JSON.stringify(this.user));
                return { success: true, data };
            }
            
            return { success: false, error: data.error };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async login(email, password) {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            
            if (response.ok) {
                this.token = data.token;
                this.user = data.user;
                localStorage.setItem('userToken', this.token);
                localStorage.setItem('userData', JSON.stringify(this.user));
                return { success: true, data };
            }
            
            return { success: false, error: data.error };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    logout() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('userToken');
        localStorage.removeItem('userData');
    }

    // Products
    async getProducts(params = {}) {
        try {
            const queryString = new URLSearchParams(params).toString();
            const response = await fetch(`${API_BASE_URL}/products?${queryString}`);
            const data = await response.json();
            
            if (response.ok) {
                return { success: true, data };
            }
            
            return { success: false, error: data.error };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getProduct(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/products/${id}`);
            const data = await response.json();
            
            if (response.ok) {
                return { success: true, data };
            }
            
            return { success: false, error: data.error };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Orders
    async createOrder(orderData) {
        try {
            const response = await fetch(`${API_BASE_URL}/orders`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(orderData)
            });

            const data = await response.json();
            
            if (response.ok) {
                return { success: true, data };
            }
            
            return { success: false, error: data.error };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getOrders() {
        try {
            const response = await fetch(`${API_BASE_URL}/orders`, {
                headers: this.getHeaders()
            });

            const data = await response.json();
            
            if (response.ok) {
                return { success: true, data };
            }
            
            return { success: false, error: data.error };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getOrder(orderNumber) {
        try {
            const response = await fetch(`${API_BASE_URL}/orders/${orderNumber}`, {
                headers: this.getHeaders()
            });

            const data = await response.json();
            
            if (response.ok) {
                return { success: true, data };
            }
            
            return { success: false, error: data.error };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // User Profile
    async updateProfile(updates) {
        try {
            const response = await fetch(`${API_BASE_URL}/user/profile`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(updates)
            });

            const data = await response.json();
            
            if (response.ok) {
                this.user = data;
                localStorage.setItem('userData', JSON.stringify(this.user));
                return { success: true, data };
            }
            
            return { success: false, error: data.error };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

// Initialize API client
const thekuaAPI = new ThekuaAPI();

// Update existing functions to use API
async function loadProductsFromAPI() {
    const result = await thekuaAPI.getProducts();
    
    if (result.success) {
        // Update products display
        const productsGrid = document.getElementById('productsGrid');
        if (productsGrid) {
            productsGrid.innerHTML = result.data.products.map(product => `
                <div class="product-card">
                    <div class="product-image">
                        ${product.images && product.images.length > 0 ? 
                            `<img src="${API_BASE_URL.replace('/api', '')}${product.images[0].url}" alt="${product.name}">` : 
                            `<div class="product-emoji">${product.emoji}</div>`
                        }
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
    }
}

// Update auth functions
async function handleLoginAPI(email, password) {
    const result = await thekuaAPI.login(email, password);
    
    if (result.success) {
        showNotification('Login successful!', 'success');
        updateAuthUI();
        
        // Redirect
        setTimeout(() => {
            const redirectUrl = sessionStorage.getItem('redirectAfterLogin') || 'index.html';
            sessionStorage.removeItem('redirectAfterLogin');
            window.location.href = redirectUrl;
        }, 1000);
    } else {
        showNotification(result.error || 'Login failed', 'error');
    }
}

// Export for use in other files
window.thekuaAPI = thekuaAPI;