import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/userModel.js';
import dotenv from 'dotenv';

dotenv.config();

const testLogin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to database');
    
    // Find admin
    const admin = await User.findOne({ email: 'admin@delaurel.com' });
    
    if (!admin) {
      console.log('❌ Admin not found in database!');
      console.log('Creating admin now...');
      
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      const newAdmin = await User.create({
        name: 'System Administrator',
        email: 'admin@delaurel.com',
        password: hashedPassword,
        role: 'admin'
      });
      
      console.log('✅ Admin created:', newAdmin.email);
    } else {
      console.log('✅ Admin found in database');
      console.log('Email:', admin.email);
      console.log('Role:', admin.role);
      console.log('Name:', admin.name);
      console.log('Banned:', admin.isBanned || false);
      
      // Test password
      const testPassword = 'admin123';
      const isMatch = await bcrypt.compare(testPassword, admin.password);
      
      console.log('\n🔐 Testing Password...');
      console.log('Password to test: admin123');
      console.log('Result:', isMatch ? '✅ CORRECT PASSWORD' : '❌ WRONG PASSWORD');
      
      if (!isMatch) {
        console.log('\n🔄 Resetting password to: admin123');
        const salt = await bcrypt.genSalt(10);
        admin.password = await bcrypt.hash('admin123', salt);
        await admin.save();
        console.log('✅ Password reset successful!');
        console.log('\nTry logging in again with:');
        console.log('Email: admin@delaurel.com');
        console.log('Password: admin123');
      } else {
        console.log('\n✅ Password is correct!');
        console.log('Login should work with these credentials:');
        console.log('Email: admin@delaurel.com');
        console.log('Password: admin123');
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

testLogin();