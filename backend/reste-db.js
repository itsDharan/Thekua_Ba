const mongoose = require('mongoose');
require('dotenv').config();

async function resetDatabase() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/thekuaba');
        
        console.log('🗑️  Dropping database...');
        await mongoose.connection.db.dropDatabase();
        
        console.log('✅ Database reset successfully!');
        console.log('ℹ️  You can now run: node seed.js');
        
    } catch (error) {
        console.error('❌ Error resetting database:', error.message);
    } finally {
        mongoose.connection.close();
    }
}

resetDatabase();