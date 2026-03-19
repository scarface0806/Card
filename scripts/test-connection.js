const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://santhoshuxui2023_db_user:KGTPS6565P@cluster0.8ud9zng.mongodb.net/taxiapp?retryWrites=true&w=majority';

async function test() {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });
  try {
    console.log('Connecting to MongoDB Atlas...');
    await client.connect();
    const db = client.db('taxiapp');
    
    // Test ping
    await db.command({ ping: 1 });
    console.log('✅ Connection successful!');
    
    // Find admin user
    const users = db.collection('users');
    const user = await users.findOne({ email: 'santhoshuxui2023@gmail.com' });
    
    if (user) {
      console.log('✅ Admin user found!');
      console.log('  Email:', user.email);
      console.log('  Role:', user.role);
      console.log('  HasPassword:', !!user.password);
      console.log('  IsActive:', user.isActive);
    } else {
      console.log('❌ Admin user NOT found in taxiapp db');
      // List all users
      const allUsers = await users.find({}).limit(5).toArray();
      console.log('All users in collection:', allUsers.map(u => ({ email: u.email, role: u.role })));
    }
    
    await client.close();
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

test();
