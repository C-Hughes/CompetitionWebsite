// cronJobs.js
const cron = require('node-cron');
var Competition = require('../models/competition');
var Order = require('../models/order');
var Basket = require('../models/basket');

// Function to perform the scheduled task
async function cancelExpiredPendingOrders() {
    console.log('Performing the scheduled task');
    try {
        const fifteenMinutesAgo = new Date(Date.now() - (15 * 60 * 1000));

        // Find all orders that are pending and were created over 15 mins ago
        const ordersToCancel = await Order.find({orderStatus: 'Pending', created: { $lt: fifteenMinutesAgo }});

        // Cancel each order and remove ticket qty from each competitions pendingEntries.
        for (const order of ordersToCancel) {
            // a. Update order status
            order.orderStatus = 'Cancelled';
            await order.save();
        
            var basket = new Basket(order.basket);
            var competitionEntries = basket.generateArray();
            for (let comp of competitionEntries) {
                //Get competition from basket item
                const foundCompetition = await Competition.findOne({ _id: comp.item._id });
                if (!foundCompetition) {
                    req.flash('error', 'startPendingOrderTimer - This competition does not exist.');
                }

                ///////////////UPDATE COMPETITION RECORD - SUB TICKET QTY FROM pendingEntries count/////////////////
                var competitionPendingUpdate = {
                    $inc: { 'pendingEntries': -comp.qty },
                    lastUpdated: new Date().toISOString(),
                };
                await Competition.findOneAndUpdate({ _id: comp.item._id }, competitionPendingUpdate, { upsert: false });
            }
        }
    } catch (error) {
        console.error('Error performing the scheduled task', error);
    }
}

// Schedule a task to run every 15 minutes
cron.schedule('*/15 * * * *', cancelExpiredPendingOrders);

module.exports = { cancelExpiredPendingOrders };