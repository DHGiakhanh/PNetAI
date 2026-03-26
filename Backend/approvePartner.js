require("dotenv").config();
const mongoose = require('mongoose');

async function approvePartner() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    // Update service provider to verified
    const result = await mongoose.connection.db.collection('users').updateOne(
      { email: 'vetclinic@example.com' },
      { $set: { isVerified: true } }
    );
    
    console.log('Updated service provider:', result.modifiedCount, 'documents');
    
    // Update partner application to approved
    const appResult = await mongoose.connection.db.collection('partnerapplications').updateOne(
      { email: 'vetclinic@example.com' },
      { $set: { status: 'approved' } }
    );
    
    console.log('Updated partner application:', appResult.modifiedCount, 'documents');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

approvePartner();
