// ===== GLOBAL CONFIGURATION =====
// This file should be loaded first before all other JavaScript files

window.APP_CONFIG = {
    API_BASE_URL: window.location.origin + '/api',
    DELIVERY_CHARGE: 50,
    FREE_DELIVERY_AMOUNT: 500,
    GST_RATE: 0.18
};

// Make it globally accessible for backward compatibility
window.API_BASE_URL = window.APP_CONFIG.API_BASE_URL;