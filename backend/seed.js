const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/thekuaba');

// Models
const User = mongoose.model('User', {
    firstName: String,
    lastName: String,
    email: { type: String, unique: true },
    password: String,
    phone: String,
    role: { type: String, default: 'customer' },
    createdAt: { type: Date, default: Date.now },
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

// Sample products data
const sampleProducts = [
    {
        name: "Traditional Thekua",
        description: "Classic sweet made with wheat flour, jaggery, and ghee. A traditional Bihar delicacy perfect for festivals and special occasions.",
        price: 180,
        emoji: "🍪",
        category: "sweet",
        bestseller: true,
        stock: 100,
        sku: "THK001"
    },
    {
        name: "Coconut Thekua",
        description: "Thekua enriched with fresh coconut and cardamom. A tropical twist on the classic recipe.",
        price: 220,
        emoji: "🥥",
        category: "sweet",
        bestseller: true,
        stock: 80,
        sku: "THK002"
    },
    {
        name: "Sesame Thekua",
        description: "Crunchy thekua with roasted sesame seeds for extra flavor and nutrition.",
        price: 200,
        emoji: "🌱",
        category: "sweet",
        bestseller: false,
        stock: 60,
        sku: "THK003"
    },
    {
        name: "Jaggery Thekua",
        description: "Pure jaggery thekua with authentic Bihar taste. Made with organic jaggery for health-conscious customers.",
        price: 190,
        emoji: "🍯",
        category: "sweet",
        bestseller: true,
        stock: 90,
        sku: "THK004"
    },
    {
        name: "Millet Thekua",
        description: "Healthy thekua made with nutritious millet flour. Perfect for health-conscious sweet lovers.",
        price: 240,
        emoji: "🌾",
        category: "sweet",
        bestseller: false,
        stock: 50,
        sku: "THK005"
    },
    {
        name: "Crispy Khaja",
        description: "Layered sweet pastry with sugar syrup. A delicate and flaky traditional sweet from Bihar.",
        price: 160,
        emoji: "🥐",
        category: "sweet",
        bestseller: true,
        stock: 70,
        sku: "KHJ001"
    },
    {
        name: "Sweet Gajja",
        description: "Traditional sweet made with milk and sugar. Rich, creamy, and absolutely delicious.",
        price: 200,
        emoji: "🍬",
        category: "sweet",
        bestseller: false,
        stock: 40,
        sku: "GJJ001"
    },
    {
        name: "Crunchy Pidikiya",
        description: "Savory snack perfect with tea. A crunchy treat that pairs perfectly with your evening chai.",
        price: 140,
        emoji: "🥨",
        category: "savory",
        bestseller: true,
        stock: 120,
        sku: "PDK001"
    },
    {
        name: "Spiced Mathri",
        description: "Crispy savory biscuits with traditional spices. Perfect tea-time snack with authentic flavors.",
        price: 160,
        emoji: "🍘",
        category: "savory",
        bestseller: false,
        stock: 80,
        sku: "MTH001"
    },
    {
        name: "Bihar Special Mix",
        description: "A delightful mix of various traditional Bihar snacks. Perfect for gifting or trying multiple flavors.",
        price: 300,
        emoji: "🎁",
        category: "sweet",
        bestseller: true,
        stock: 30,
        sku: "MIX001"
    }
];

async function seedDatabase() {
    try {
        console.log('🌱 Starting database seeding...');

        // Clear existing data
        await User.deleteMany({});
        await Product.deleteMany({});
        console.log('✅ Cleared existing data');

        // Drop any existing indexes to avoid conflicts
        try {
            await Product.collection.dropIndexes();
            console.log('✅ Dropped existing indexes');
        } catch (error) {
            console.log('ℹ️  No indexes to drop');
        }

        // Create admin user
        const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);
        const admin = new User({
            firstName: 'Admin',
            lastName: 'User',
            email: process.env.ADMIN_EMAIL || 'admin@thekuaba.com',
            password: adminPassword,
            role: 'admin',
            phone: '+91 98765 43210'
        });
        await admin.save();
        console.log('✅ Created admin user');

        // Create sample customer users
        const customerPassword = await bcrypt.hash('customer123', 10);
        const sampleCustomers = [
            {
                firstName: 'Rajesh',
                lastName: 'Kumar',
                email: 'rajesh@example.com',
                password: customerPassword,
                phone: '+91 98765 43211',
                role: 'customer'
            },
            {
                firstName: 'Priya',
                lastName: 'Sharma',
                email: 'priya@example.com',
                password: customerPassword,
                phone: '+91 98765 43212',
                role: 'customer'
            },
            {
                firstName: 'Amit',
                lastName: 'Singh',
                email: 'amit@example.com',
                password: customerPassword,
                phone: '+91 98765 43213',
                role: 'customer'
            }
        ];

        for (const customer of sampleCustomers) {
            const newCustomer = new User(customer);
            await newCustomer.save();
        }
        console.log('✅ Created sample customers');

        // Create products
        for (const productData of sampleProducts) {
            const product = new Product(productData);
            await product.save();
        }
        console.log('✅ Created sample products');

        console.log('\n🎉 Database seeding completed successfully!');
        console.log('\n📋 Admin Credentials:');
        console.log(`   Email: ${process.env.ADMIN_EMAIL || 'admin@thekuaba.com'}`);
        console.log(`   Password: ${process.env.ADMIN_PASSWORD || 'admin123'}`);
        console.log('\n📋 Sample Customer Credentials:');
        console.log('   Email: rajesh@example.com, Password: customer123');
        console.log('   Email: priya@example.com, Password: customer123');
        console.log('   Email: amit@example.com, Password: customer123');
        console.log('\n🚀 You can now start the server with: npm run dev');

    } catch (error) {
        console.error('❌ Error seeding database:', error);
    } finally {
        mongoose.connection.close();
    }
}

// Run the seed function
seedDatabase();