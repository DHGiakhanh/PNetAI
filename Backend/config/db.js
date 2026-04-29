const mongoose = require('mongoose');
require('dotenv').config();

const isSrvDnsError = (error) =>
    error &&
    error.code === 'ECONNREFUSED' &&
    error.syscall === 'querySrv';

const connectDB = async () => {
    const primaryUri = process.env.MONGO_URI;
    const fallbackUri = process.env.MONGO_DIRECT_URI;

    try {
        await mongoose.connect(primaryUri);
        console.log('MongoDB connected successfully');
    } catch (error) {
        if (isSrvDnsError(error) && fallbackUri) {
            console.warn('MongoDB SRV lookup failed, retrying with MONGO_DIRECT_URI');

            try {
                await mongoose.connect(fallbackUri);
                console.log('MongoDB connected successfully via direct URI');
                return;
            } catch (fallbackError) {
                console.error('MongoDB direct connection failed: ', fallbackError);
                process.exit(1);
            }
        }

        console.error("MongoDB connection failed: ", error);
        process.exit(1);
    }
};

module.exports = connectDB;
