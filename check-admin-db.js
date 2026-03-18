const { MongoClient } = require('mongodb');

const uri = process.env.DATABASE_URL || 'mongodb://localhost:27017/tapvyo-dev';

async function checkAdmin() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db();
    const adminsCollection = db.collection('admins');
    
    const admin = await adminsCollection.findOne({
      email: { $regex: '^santhoshuxui2023@gmail.com$', $options: 'i' }
    });
    
    if (admin) {
      console.log('✅ Admin found in MongoDB:');
      console.log('_id:', admin._id.toString());
      console.log('email:', admin.email);
      console.log('role:', admin.role);
      console.log('isActive:', admin.isActive);
      console.log('createdVia:', admin.createdVia);
      console.log('password hash exists:', !!admin.password);
    } else {
      console.log('❌ Admin NOT found in MongoDB');
      
      // List all admins in the collection
      const allAdmins = await adminsCollection.find({}).toArray();
      console.log(`\nTotal admins in collection: ${allAdmins.length}`);
      if (allAdmins.length > 0) {
        console.log('Existing admins:');
        allAdmins.forEach(a => {
          console.log(`  - ${a.email} (${a.role})`);
        });
      }
    }
  } finally {
    await client.close();
  }
}

checkAdmin().catch(console.error);
