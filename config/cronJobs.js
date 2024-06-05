// cronJobs.js
const cron = require('node-cron');
var Competition = require('../models/competition');
var Order = require('../models/order');
var Basket = require('../models/basket');

// Function to perform the scheduled task
async function cancelExpiredPendingOrders() {
    console.log('Starting CRON - cancelExpiredPendingOrders');
    try {
        const fifteenMinutesAgo = new Date(Date.now() - (15 * 60 * 1000));

        // Find all orders that are pending and were created over 15 mins ago
        const ordersToCancel = await Order.find({orderStatus: 'Pending', created: { $lt: fifteenMinutesAgo }});

        // Cancel each order and remove ticket qty from each competitions pendingEntries.
        for (const order of ordersToCancel) {
            // a. Update order status
            order.orderStatus = 'Cancelled';
            await order.save();
        
            for (let comp of order.basket) {
                //Get competition from basket item
                const foundCompetition = await Competition.findOne({ _id: comp.item._id });
                if (!foundCompetition) {
                    console.log('CRON cancelExpiredPendingOrders - This competition does not exist.');
                }

                ///////////////UPDATE COMPETITION RECORD - SUB TICKET QTY FROM pendingEntries count/////////////////
                var competitionPendingUpdate = {
                    $inc: { 'pendingEntries': -comp.qty },
                    lastUpdated: new Date().toISOString(),
                };
                console.log('CRON Cancelled Order Found - Competition qty to reduce = '+comp.qty);
                await Competition.findOneAndUpdate({ _id: comp.item._id }, competitionPendingUpdate, { upsert: false });
            }
        }
        console.log('Completed CRON - cancelExpiredPendingOrders');
    } catch (error) {
        console.error('Error CRON - cancelExpiredPendingOrders', error);
    }
}

// Schedule a task to run every 15 minutes
cron.schedule('*/15 * * * *', cancelExpiredPendingOrders);

module.exports = { cancelExpiredPendingOrders };