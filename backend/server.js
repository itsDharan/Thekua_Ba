const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/thekuaba');

// File upload configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname))
    }
});

const upload = multer({ storage: storage });

// Models
const User = mongoose.model('User', {
    firstName: String,
    lastName: String,
    email: { type: String, unique: true },
    password: String,
    phone: String,
    role: { type: String, default: 'customer' }, // 'customer' or 'admin'
    createdAt: { type: Date, default: Date.now },
    addresses: [{
        firstName: String,
        lastName: String,
        address: String,
        apartment: String,
        city: String,
        state: String,
        pincode: String,
        phone: String,
        isDefault: Boolean
    }]
});

const Product = mongoose.model('Product', {
    name: String,
    description: String,
    price: Number,
    emoji: String,
    category: String,
    bestseller: { type: Boolean, default: false },
    images: [{
        url: String,
        filename: String
    }],
    stock: { type: Number, default: 100 },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', {
    orderNumber: { type: String, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    customerEmail: String,
    customerName: String,
    items: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name: String,
        price: Number,
        quantity: Number,
        total: Number
    }],
    shippingAddress: {
        firstName: String,
        lastName: String,
        address: String,
        apartment: String,
        city: String,
        state: String,
        pincode: String,
        phone: String
    },
    billing: {
        subtotal: Number,
        shipping: Number,
        tax: Number,
        discount: Number,
        total: Number
    },
    status: { type: String, default: 'pending' }, // pending, confirmed, processing, shipped, delivered, cancelled
    paymentMethod: String,
    paymentStatus: { type: String, default: 'pending' }, // pending, completed, failed
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Middleware for authentication
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// Middleware for admin authentication
const authenticateAdmin = async (req, res, next) => {
    authenticateToken(req, res, async () => {
        try {
            const user = await User.findById(req.user.userId);
            if (!user || user.role !== 'admin') {
                return res.status(403).json({ error: 'Admin access required' });
            }
            next();
        } catch (error) {
            res.status(500).json({ error: 'Server error' });
        }
    });
};

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
    try {
        const { firstName, lastName, email, password, phone } = req.body;
        
        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = new User({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            phone
        });

        await user.save();

        // Generate token
        const token = jwt.sign(
            { userId: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        res.status(201).json({
            token,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Generate token
        const token = jwt.sign(
            { userId: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Product Routes
app.get('/api/products', async (req, res) => {
    try {
        const { category, search, bestseller, page = 1, limit = 10 } = req.query;
        const filter = { isActive: true };

        if (category) filter.category = category;
        if (bestseller) filter.bestseller = true;
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const products = await Product.find(filter)
            .sort({ bestseller: -1, createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Product.countDocuments(filter);

        res.json({
            products,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/products/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin Routes
app.get('/api/admin/products', authenticateAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 10, search, category } = req.query;
        const filter = {};

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        if (category) filter.category = category;

        const products = await Product.find(filter)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Product.countDocuments(filter);

        res.json({
            products,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/admin/products', authenticateAdmin, upload.array('images', 5), async (req, res) => {
    try {
        const { name, description, price, emoji, category, bestseller, stock } = req.body;
        
        const images = req.files ? req.files.map(file => ({
            url: `/uploads/${file.filename}`,
            filename: file.filename
        })) : [];

        const product = new Product({
            name,
            description,
            price: parseFloat(price),
            emoji,
            category,
            bestseller: bestseller === 'true',
            stock: parseInt(stock) || 100,
            images
        });

        await product.save();
        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/admin/products/:id', authenticateAdmin, upload.array('images', 5), async (req, res) => {
    try {
        const { name, description, price, emoji, category, bestseller, stock, isActive } = req.body;
        
        const updateData = {
            name,
            description,
            price: parseFloat(price),
            emoji,
            category,
            bestseller: bestseller === 'true',
            stock: parseInt(stock),
            isActive: isActive !== 'false',
            updatedAt: new Date()
        };

        if (req.files && req.files.length > 0) {
            updateData.images = req.files.map(file => ({
                url: `/uploads/${file.filename}`,
                filename: file.filename
            }));
        }

        const product = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/admin/products/:id', authenticateAdmin, async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Customer Routes
app.get('/api/admin/customers', authenticateAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 10, search } = req.query;
        const filter = { role: 'customer' };

        if (search) {
            filter.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const customers = await User.find(filter)
            .select('-password')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await User.countDocuments(filter);

        res.json({
            customers,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/admin/customers/:id', authenticateAdmin, async (req, res) => {
    try {
        const customer = await User.findById(req.params.id).select('-password');
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        // Get customer orders
        const orders = await Order.find({ userId: req.params.id })
            .sort({ createdAt: -1 })
            .populate('items.productId', 'name');

        res.json({ customer, orders });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Order Routes
app.get('/api/admin/orders', authenticateAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 10, status, search } = req.query;
        const filter = {};

        if (status) filter.status = status;
        if (search) {
            filter.$or = [
                { orderNumber: { $regex: search, $options: 'i' } },
                { customerEmail: { $regex: search, $options: 'i' } },
                { customerName: { $regex: search, $options: 'i' } }
            ];
        }

        const orders = await Order.find(filter)
            .populate('userId', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Order.countDocuments(filter);

        res.json({
            orders,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/admin/orders/:id/status', authenticateAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status, updatedAt: new Date() },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Dashboard Stats
app.get('/api/admin/stats', authenticateAdmin, async (req, res) => {
    try {
        const totalProducts = await Product.countDocuments({ isActive: true });
        const totalCustomers = await User.countDocuments({ role: 'customer' });
        const totalOrders = await Order.countDocuments();
        
        const revenue = await Order.aggregate([
            { $match: { status: { $in: ['delivered', 'shipped'] } } },
            { $group: { _id: null, total: { $sum: '$billing.total' } } }
        ]);

        const recentOrders = await Order.find()
            .populate('userId', 'firstName lastName')
            .sort({ createdAt: -1 })
            .limit(5);

        const monthlyRevenue = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: new Date(new Date().getFullYear(), 0, 1) },
                    status: { $in: ['delivered', 'shipped'] }
                }
            },
            {
                $group: {
                    _id: { month: { $month: '$createdAt' } },
                    revenue: { $sum: '$billing.total' },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { '_id.month': 1 } }
        ]);

        res.json({
            totalProducts,
            totalCustomers,
            totalOrders,
            totalRevenue: revenue[0]?.total || 0,
            recentOrders,
            monthlyRevenue
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Order Creation Route (for frontend)
app.post('/api/orders', authenticateToken, async (req, res) => {
    try {
        const { items, shippingAddress, billing, paymentMethod } = req.body;

        // Generate order number
        const orderNumber = 'BH' + Date.now().toString(36).toUpperCase();

        const order = new Order({
            orderNumber,
            userId: req.user.userId,
            customerEmail: req.user.email,
            customerName: shippingAddress.firstName + ' ' + shippingAddress.lastName,
            items,
            shippingAddress,
            billing,
            paymentMethod,
            status: paymentMethod === 'cod' ? 'confirmed' : 'pending'
        });

        await order.save();
        res.status(201).json(order);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user orders
app.get('/api/orders', authenticateToken, async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.user.userId })
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Track order
app.get('/api/orders/:orderNumber', async (req, res) => {
    try {
        const order = await Order.findOne({ orderNumber: req.params.orderNumber });
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        res.json(order);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create admin user (run once)
app.post('/api/admin/create', async (req, res) => {
    try {
        const { email, password, firstName, lastName } = req.body;
        
        // Check if admin already exists
        const existingAdmin = await User.findOne({ email, role: 'admin' });
        if (existingAdmin) {
            return res.status(400).json({ error: 'Admin already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const admin = new User({
            firstName: firstName || 'Admin',
            lastName: lastName || 'User',
            email,
            password: hashedPassword,
            role: 'admin'
        });

        await admin.save();
        res.status(201).json({ message: 'Admin created successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;