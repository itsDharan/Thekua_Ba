// ===== AUTHENTICATION FUNCTIONALITY =====

// Form submissions
document.getElementById('loginForm').addEventListener('submit', handleLogin);
document.getElementById('registerForm').addEventListener('submit', handleRegister);
document.getElementById('forgotForm').addEventListener('submit', handleForgotPassword);

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const remember = document.getElementById('remember').checked;
    
    // Basic validation
    if (!validateEmail(email)) {
        showNotification('Please enter a valid email address', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification('Password must be at least 6 characters', 'error');
        return;
    }
    
    // Show loading
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Logging in...';
    submitBtn.disabled = true;
    
    // Call real API for login
    try {
        const API_URL = window.API_BASE_URL || (window.APP_CONFIG ? window.APP_CONFIG.API_BASE_URL : (window.location.origin + '/api'));
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Store auth data for checkout.js compatibility
            localStorage.setItem('userToken', data.token);
            localStorage.setItem('userData', JSON.stringify(data.user));
            // Also store for main.js compatibility
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            localStorage.setItem('authToken', data.token);
            
            if (remember) {
                localStorage.setItem('rememberedEmail', email);
            }
            
            if (typeof showNotification === 'function') {
                showNotification('Login successful!', 'success');
            }
            
            // Redirect after login
            setTimeout(() => {
                const redirectUrl = sessionStorage.getItem('redirectAfterLogin') || 'index.html';
                sessionStorage.removeItem('redirectAfterLogin');
                window.location.href = redirectUrl;
            }, 1000);
        } else {
            if (typeof showNotification === 'function') {
                showNotification(data.error || 'Invalid email or password', 'error');
            }
        }
    } catch (error) {
        console.error('Login error:', error);
        if (typeof showNotification === 'function') {
            showNotification('Unable to connect to server. Please try again.', 'error');
        }
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Handle registration
async function handleRegister(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    const firstName = data.firstName;
    const lastName = data.lastName;
    const email = data.email;
    const phone = data.phone;
    const password = data.password;
    
    // Validation
    if (!validateEmail(email)) {
        showNotification('Please enter a valid email address', 'error');
        return;
    }
    
    if (!validatePhone(phone)) {
        showNotification('Please enter a valid phone number', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification('Password must be at least 6 characters', 'error');
        return;
    }
    
    if (data.password !== data.confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }
    
    if (!data.terms) {
        showNotification('Please accept the terms and conditions', 'error');
        return;
    }
    
    // Show loading
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Creating account...';
    submitBtn.disabled = true;
    
    try {
        const API_URL = window.API_BASE_URL || (window.APP_CONFIG ? window.APP_CONFIG.API_BASE_URL : (window.location.origin + '/api'));
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ firstName, lastName, email, phone, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            if (typeof showNotification === 'function') {
                showNotification('Registration successful! Please login.', 'success');
            }
            // Switch to login form and pre-fill email
            setTimeout(() => {
                document.getElementById('registerModal').classList.remove('active');
                document.getElementById('loginEmail').value = email;
            }, 1500);
        } else {
            if (typeof showNotification === 'function') {
                showNotification(data.error || 'Registration failed', 'error');
            }
        }
    } catch (error) {
        console.error('Registration error:', error);
        if (typeof showNotification === 'function') {
            showNotification('Registration failed. Please try again.', 'error');
        }
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Handle forgot password
function handleForgotPassword(e) {
    e.preventDefault();
    
    const email = document.getElementById('forgotEmail').value;
    
    if (!validateEmail(email)) {
        showNotification('Please enter a valid email address', 'error');
        return;
    }
    
    // Show loading
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
        showNotification('Password reset link sent to your email!', 'success');
        closeModal('forgotModal');
        
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }, 1500);
}

// Show register modal
function showRegister() {
    document.getElementById('registerModal').classList.add('active');
}

// Show forgot password modal
function showForgotPassword() {
    document.getElementById('forgotModal').classList.add('active');
}

// Close modal
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Toggle password visibility
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const type = input.type === 'password' ? 'text' : 'password';
    input.type = type;
    
    // Update icon
    const btn = input.nextElementSibling;
    btn.textContent = type === 'password' ? '👁️' : '👁️‍🗨️';
}

// Social login
function socialLogin(provider) {
    showNotification(`${provider} login coming soon!`, 'info');
}

// Validation functions
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePhone(phone) {
    const re = /^[+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
    return re.test(phone);
}

// Check for remembered email
window.addEventListener('DOMContentLoaded', function() {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
        document.getElementById('email').value = rememberedEmail;
        document.getElementById('remember').checked = true;
        document.getElementById('password').focus();
    }
});