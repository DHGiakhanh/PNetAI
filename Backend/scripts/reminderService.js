const cron = require('node-cron');
const db = require('../models');
const { sendAppointmentReminderEmail } = require('../config/emailService');

const initReminderCron = () => {
    // Run every day at 08:00 AM
    cron.schedule('0 8 * * *', async () => {
        console.log('⏰ Running daily appointment reminders check...');
        
        try {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);

            const dayAfterTomorrow = new Date(tomorrow);
            dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

            // Find bookings for tomorrow
            const bookings = await db.Booking.find({
                bookingDate: {
                    $gte: tomorrow,
                    $lt: dayAfterTomorrow
                },
                status: 'confirmed'
            }).populate('user', 'email').populate('service', 'title').populate('pet', 'name');

            console.log(`🔍 Found ${bookings.length} appointments for tomorrow.`);

            for (const booking of bookings) {
                if (booking.user && booking.user.email) {
                    await sendAppointmentReminderEmail(booking.user.email, {
                        serviceTitle: booking.service.title,
                        petName: booking.pet.name,
                        date: booking.bookingDate.toLocaleDateString(),
                        time: booking.bookingTime
                    });
                }
            }
            
            console.log('✅ Daily reminder check completed.');
        } catch (error) {
            console.error('❌ Error in reminder cron:', error);
        }
    });
};

module.exports = { initReminderCron };
