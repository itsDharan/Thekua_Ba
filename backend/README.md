# Thekua Ba - Complete E-commerce Setup

This is the complete backend and admin portal setup for your Thekua Ba website. Here's everything you need to get started.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- Git

### 1. Backend Setup

```bash
# Create backend directory
mkdir thekua-ba-backend
cd thekua-ba-backend

# Initialize npm and install dependencies
npm init -y
npm install express mongoose cors bcryptjs jsonwebtoken multer dotenv helmet express-rate-limit express-validator
npm install -D nodemon

# Create uploads directory for images
mkdir uploads
```

### 2. Environment Configuration

Create a `.env` file in your backend directory:

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/thekuaba

# JWT Secret (change this to a strong secret)
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random

# Server Port
PORT=5000

# Admin Credentials
ADMIN_EMAIL=admin@thekuaba.com
ADMIN_PASSWORD=admin123

# Razorpay (optional - for payments)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

### 3. File Structure

Create the following files in your backend directory:

```
thekua-ba-backend/
├── server.js
├── seed.js
├── package.json
├── .env
├── .gitignore
└── uploads/
```

### 4. Database Setup

```bash
# Make sure MongoDB is running, then seed the database
node seed.js
```

### 5. Start the Server

```bash
# Development mode with auto-restart
npm run dev

# Or production mode
npm start
```

## 🔧 Admin Portal Setup

### 1. Create Admin Portal

Save the admin portal HTML file as `admin.html` in your frontend directory or serve it separately.

### 2. Update API URLs

In `admin.html`, make sure the API_BASE_URL points to your backend:

```javascript
const API_BASE_URL = 'http://localhost:5000/api';
```

### 3. Access Admin Portal

1. Open `admin.html` in your browser
2. Login with admin credentials:
   - Email: `admin@thekuaba.com`
   - Password: `admin123`

## 🎯 Features

### Backend API Features
- ✅ User authentication (customers & admin)
- ✅ Product management (CRUD operations)
- ✅ Order management
- ✅ Customer management
- ✅ File upload for product images
- ✅ Search and filtering
- ✅ Dashboard statistics
- ✅ JWT-based security

### Admin Portal Features
- ✅ Dashboard with key metrics
- ✅ Product management (add, edit, delete)
- ✅ Customer details and order history
- ✅ Order status management
- ✅ Image upload for products
- ✅ Search and filter functionality
- ✅ Responsive design

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### Products
- `GET /api/products` - Get all products (public)
- `GET /api/products/:id` - Get single product
- `GET /api/admin/products` - Get all products (admin)
- `POST /api/admin/products` - Create product (admin)
- `PUT /api/admin/products/:id` - Update product (admin)
- `DELETE /api/admin/products/:id` - Delete product (admin)

### Customers (Admin only)
- `GET /api/admin/customers` - Get all customers
- `GET /api/admin/customers/:id` - Get customer details

### Orders
- `POST /api/orders` - Create order (authenticated)
- `GET /api/orders` - Get user orders (authenticated)
- `GET /api/orders/:orderNumber` - Track order (public)
- `GET /api/admin/orders` - Get all orders (admin)
- `PUT /api/admin/orders/:id/status` - Update order status (admin)

### Dashboard
- `GET /api/admin/stats` - Get dashboard statistics (admin)

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- CORS protection
- Rate limiting
- Input validation
- Admin-only routes protection

## 📱 Frontend Integration

Update your existing frontend files:

### 1. Update main.js
Replace the API calls in your frontend to use the new backend:

```javascript
// Example: Login function
async function login(email, password) {
    try {
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('userToken', data.token);
            localStorage.setItem('userData', JSON.stringify(data.user));
            // Update UI
        }
    } catch (error) {
        console.error('Login error:', error);
    }
}
```

### 2. Update products.js
Fetch products from the API:

```javascript
async function loadProducts() {
    try {
        const response = await fetch('http://localhost:5000/api/products');
        const data = await response.json();
        
        // Update your product display logic
        displayProducts(data.products);
    } catch (error) {
        console.error('Error loading products:', error);
    }
}
```

## 🚀 Deployment

### Backend Deployment (Heroku example)

```bash
# Install Heroku CLI, then:
heroku create thekua-ba-api
heroku config:set MONGODB_URI=your_mongodb_connection_string
heroku config:set JWT_SECRET=your_jwt_secret
git push heroku main
```

### Frontend Deployment

Update API URLs in your frontend files to point to your deployed backend:

```javascript
const API_BASE_URL = 'https://thekua-ba-api.herokuapp.com/api';
```

## 📋 Todo / Future Enhancements

- [ ] Email notifications for orders
- [ ] Payment gateway integration (Razorpay)
- [ ] SMS notifications
- [ ] Order tracking with real-time updates
- [ ] Inventory management
- [ ] Analytics and reporting
- [ ] Discount/coupon system
- [ ] Review and rating system

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Make sure MongoDB is running
   - Check your connection string in `.env`

2. **CORS Issues**
   - Make sure your frontend URL is allowed in CORS settings
   - Check if you're making requests to the correct API URL

3. **JWT Token Issues**
   - Make sure JWT_SECRET is set in your `.env` file
   - Check if token is being sent in Authorization header

4. **File Upload Issues**
   - Make sure `uploads` directory exists
   - Check file permissions

### Support

If you need help with setup or have questions, please check:

1. Console logs for error messages
2. Network tab in browser dev tools
3. Backend server logs

## 📄 License

MIT License - feel free to use this for your business!

---
Admin Credentials:
   Email: admin@thekuaba.com
   Password: admin123
**🍪 Happy selling with Thekua Ba! 🚀**