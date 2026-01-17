const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Clear existing users (optional)
    // await User.deleteMany({});

    // Create default users
    const supervisor = await User.findOne({ phone: '8888888888' });
    let supervisorId;
    
    if (!supervisor) {
      const newSupervisor = new User({
        name: 'Demo Supervisor',
        phone: '8888888888',
        password: 'super123',
        role: 'supervisor'
      });
      await newSupervisor.save();
      supervisorId = newSupervisor._id;
      console.log(`✓ Created supervisor: Demo Supervisor`);
    } else {
      supervisorId = supervisor._id;
      console.log(`- Supervisor already exists: Demo Supervisor`);
    }

    // Create driver with supervisor assignment
    const driver = await User.findOne({ phone: '9999999999' });
    if (!driver) {
      const newDriver = new User({
        name: 'Demo Driver',
        phone: '9999999999',
        password: 'driver123',
        role: 'driver',
        supervisor: supervisorId
      });
      await newDriver.save();
      console.log(`✓ Created driver: Demo Driver (assigned to Demo Supervisor)`);
    } else {
      console.log(`- Driver already exists: Demo Driver`);
    }

    // Create admin user
    const admin = await User.findOne({ phone: '7777777777' });
    if (!admin) {
      const newAdmin = new User({
        name: 'Admin',
        phone: '7777777777',
        password: 'admin123',
        role: 'admin'
      });
      await newAdmin.save();
      console.log(`✓ Created admin: Admin`);
    } else {
      console.log(`- Admin already exists: Admin`);
    }

    console.log('\nSeed completed!');
    console.log('\nDefault Credentials:');
    console.log('Admin - Phone: 7777777777, Password: admin123');
    console.log('Supervisor - Phone: 8888888888, Password: super123');
    console.log('Driver - Phone: 9999999999, Password: driver123');
    
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedData();
