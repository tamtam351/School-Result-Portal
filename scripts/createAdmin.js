// corrected createAdmin.js
// Place this in the same location as your existing admin creation script
import mongoose from 'mongoose';
import User from '../models/userModel.js';
import dotenv from 'dotenv';

dotenv.config();

const createAdmin = async () => {
  try {
    console.log('🔄 Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to database');
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@delaurel.com' });
    if (existingAdmin) {
      console.log('⚠️  Admin already exists');
      console.log('Email:', existingAdmin.email);
      console.log('You can login with: admin@delaurel.com / admin123');
      process.exit(0);
    }
    
    // Pass plaintext password here and let the model pre-save hook hash it once
    const admin = await User.create({
      name: 'System Administrator',
      email: 'admin@delaurel.com',
      password: 'admin123', // plaintext -> model will hash once
      role: 'admin'
    });
    
    console.log('');
    console.log('✅ Admin created successfully!');
    console.log('=====================================');
    console.log('Email:    admin@delaurel.com');
    console.log('Password: admin123');
    console.log('Role:     admin');
    console.log('=====================================');
    console.log('');
    console.log('🚀 You can now login at http://localhost:3000');
    console.log('');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

createAdmin();