var Competition = require('../models/competition');
var Ticket = require('../models/ticket');
var Coupon = require('../models/coupon');

module.exports = function Basket(oldBasket){
    this.items = oldBasket.items || {};
    this.totalQty = oldBasket.totalQty || 0;
    this.totalPrice = oldBasket.totalPrice || 0;
    this.subtotalPrice = oldBasket.subtotalPrice || 0;
    this.couponsApplied = oldBasket.couponsApplied || [];

    this.add = function(item, id, answer, qty){
        var storedItem = this.items[id+answer];
        if(!storedItem){
            //var price = qty * item.price;
            storedItem = this.items[id+answer] = {item: item, uniqueID: Date.now(), qty: 0, price: 0, questionAnswer: answer, ticketNumbers: []};
        }
        storedItem.qty+= Number(qty);
        this.totalQty+= Number(qty);
        //Update item to latest info
        storedItem.item = item;
        //this.checkPrice();
        if(storedItem.item.discountPrice){
            storedItem.price += storedItem.item.discountPrice * storedItem.qty;
            this.totalPrice += storedItem.item.discountPrice * storedItem.qty;
        } else {
            storedItem.price += storedItem.item.price * storedItem.qty;
            this.totalPrice += storedItem.item.price * storedItem.qty;
        }
    };

    this.addCoupon = function(couponCode){
        if(!this.couponsApplied.includes(couponCode)){
            this.couponsApplied.push(couponCode);
        }
    };

    this.removeCoupon = function(couponCode){
        if(this.couponsApplied.includes(couponCode)){
            this.couponsApplied.splice(this.couponsApplied.indexOf(couponCode), 1);
        }
    };

    this.increaseByOne = function(id){
        this.items[id].qty++;
        this.totalQty++;
    };

    this.reduceByOne = function(id){
        this.items[id].qty--;
        this.totalQty--;

        if (this.items[id].qty <= 0){
            delete this.items[id];

            if(this.items.length == 0 || Object.keys(this.items).length == 0){
                this.totalPrice = 0;
                this.totalQty = 0;
            }
        }
    };

    this.removeItem = function(id){
        console.log('Basket - Removing Item');
        this.totalQty -= this.items[id].qty;
        this.totalPrice -= this.items[id].price;
        delete this.items[id];

        if(this.items.length == 0 || Object.keys(this.items).length == 0){
            this.totalPrice = 0;
            this.totalQty = 0;
        }
    };

    this.generateArray = function() {
        //console.log('Generating Array...');
        var arr = [];
        for (var id in this.items){
            arr.push(this.items[id]);
        }
        return arr;
    }

    //Update whole basket with latest info from DB. Returns any error messages[]
    this.updateBasket = async function(user) {
 
        //console.log('Updating Basket...');
        this.totalPrice = 0;
        this.subtotalPrice = 0;
        var messages = [];
        //Store competitionIds of each item in basket, if two competition IDs are the same, user is buying tickets for the same competition with different answers...
        //Extra checks required to make sure user can not buy more tickets than max allowed...  
        var basketComps = {};

        for (var id in this.items){
            try {
                var currentCompID = this.items[id].item._id
                const foundCompetition = await Competition.findOne({ _id: currentCompID });
                
                //If competition is not active, remove it from the basket.
                if (foundCompetition && !foundCompetition.active) {
                    //console.log("UpdateBasket Error - Comp Not Active");
                    this.removeItem(id);
                    messages.push('Competition '+foundCompetition.title+' Is No Longer Active - Removed From Basket');

                //If competition last entry date has passed, remove it from the basket.    
                } else if (foundCompetition && new Date(foundCompetition.entryCloseDate.getTime()) < Date.now()) {
                    //console.log("UpdateBasket Error - Entries Closed");
                    this.removeItem(id);
                    messages.push('Entries to Competition '+foundCompetition.title+' Have Closed - Removed From Basket');

                //If competition is found and is active and visible then it can be added to basket - Do further checks    
                } else if (foundCompetition && foundCompetition.visible && foundCompetition.active) {

                    //Check if competition is in basket more than once
                    if(!basketComps[currentCompID]){
                        //First time Competition is in basket
                        basketComps[currentCompID] = {
                            totalQty: 0,
                            instances: []
                        };
                    }
                    basketComps[currentCompID].totalQty += this.items[id].qty;
                    basketComps[currentCompID].instances.push(id);

                    //Get Number of tickets User has already purchased for competition.
                    const userEntries = await Ticket.findOne({ userReference: user._id, competitionReference: currentCompID});

                    let userPurchasedEntries = userEntries ? userEntries.ticketQty : 0;
                    let maxAllowedPerPerson = foundCompetition.maxEntriesPerPerson;

                    //Check to see if user is trying to purchase more than maximum allowed.
                    if(userPurchasedEntries + basketComps[currentCompID].totalQty > maxAllowedPerPerson){
                        //console.log("UpdateBasket Error - User trying to purchase more tickets than allowed per person");
                        
                        let excessQty = (userPurchasedEntries + basketComps[currentCompID].totalQty) - maxAllowedPerPerson;
                        this.items[id].qty -= excessQty;
                        this.totalQty -= excessQty;
                        basketComps[currentCompID].totalQty -= excessQty;
                        messages.push('Maximum Tickets Per Person for '+foundCompetition.title+' is '+maxAllowedPerPerson+'. Ticket Quantity Reduced.');
                    }
                    //If less than 0 remove item, otherwise do additional checks
                    if(this.items[id].qty <= 0){
                        messages.push(''+foundCompetition.title+' has been Removed from Basket.');
                        this.removeItem(id);
                        console.log('Deleting item...');
                    } else {

                        ///////////////////Additional Checks//////////////////////////////////
                        //Maximum entries have been reached - Competition is sold out
                        if(foundCompetition.currentEntries >= foundCompetition.maxEntries){
                            //console.log("UpdateBasket Error - Comp is sold out");
                            this.removeItem(id);
                            messages.push('Competition '+foundCompetition.title+' Now Sold Out - Removed From Basket');

                        //Competition entries + pending entries exceeds max tickets available, notify user.
                        //Update basket qty to be max available if pendingEntries are cancelled.    
                        } else if((foundCompetition.currentEntries + foundCompetition.pendingEntries) >= foundCompetition.maxEntries){
                            //console.log("Current + Pending = maxEntries");
                            //var pendingDifference = basketComps[currentCompID].totalQty - foundCompetition.pendingEntries;
                            this.items[id].qty -= basketComps[currentCompID].totalQty;
                            this.totalQty -= basketComps[currentCompID].totalQty;
                            basketComps[currentCompID].totalQty -= basketComps[currentCompID].totalQty;
                            messages.push('Last Remaining Tickets for '+foundCompetition.title+' are Currently Reserved for Purchase. If A Pending Order is Cancelled you May be able to Purchase Later.');


                        //Competition + pending Entries + user basket exceeds max tickets available, reduce ticket.qty.
                        } else if((foundCompetition.currentEntries + foundCompetition.pendingEntries + basketComps[currentCompID].totalQty) > foundCompetition.maxEntries){
                            var subQty = ((foundCompetition.currentEntries + foundCompetition.pendingEntries + basketComps[currentCompID].totalQty) - foundCompetition.maxEntries);
                            //var subbedQty = basketComps[currentCompID].totalQty - maxTickets;
                            this.items[id].qty -= subQty;
                            this.totalQty -= subQty;
                            basketComps[currentCompID].totalQty -= subQty;
                            messages.push('Last Remaining Tickets are in the Process of Being Purchased for '+foundCompetition.title+'. Ticket Quantity Updated. Purchase Soon to Secure Last Tickets!');
                        }

                        ///////////////////////////////////////////////////////////////////////
                        if(this.items[id].qty <= 0){
                            messages.push(''+foundCompetition.title+' has been Removed from Basket.');
                            this.removeItem(id);
                            //console.log('Deleting item...');
                        }

                    }
                    
                    //Update Item Price
                    if(foundCompetition.discountPrice){
                        //Update using discounted price
                        this.items[id].price = this.items[id].item.discountPrice * this.items[id].qty;
                    } else {
                        this.items[id].price = this.items[id].item.price * this.items[id].qty;
                    }
                    this.totalPrice += this.items[id].price;


                } else {
                    //If competition is not found or is invisible, remove it from the basket.
                    //console.log("UpdateBasket Error - Comp Not Found");
                    this.removeItem(id);
                    messages.push('Competition Not Found - Removed From Basket');
                }
            } catch (err) {
                console.log(err);
            }
        }
        ///////////////////////////////////////////////////////////////////////////////////////////////
        ////////////////////////////////IF COUPON IS APPLIED TO BASKET/////////////////////////////////
        if(this.couponsApplied){
            console.log('UPDATE BASKET - COUPON IS APPLIED TO BASKET');
            for (var coupon in this.couponsApplied){

                //Lookup couponCode from DB
                var returnedCoupon = await Coupon.findOne({ "couponCode" : { $regex : new RegExp('^'+coupon+'$', "i") }}).populate('competitionReference');
                if(!returnedCoupon){
                    //Not Found Remove from Basket
                    this.removeCoupon(coupon);
                    messages.push('Coupon Not Found - Removed From Basket');
                } else if(!returnedCoupon.active){
                    //Check if coupon is currently active...
                    this.removeCoupon(coupon);
                    messages.push('Coupon Code Is Not Active');
                } else if (new Date(returnedCoupon.couponExpiryDate.getTime()) < Date.now()){
                    //Check if coupon date has expired...
                    this.removeCoupon(coupon);
                    messages.push('Coupon Code Has Expired');
                } else if (returnedCoupon.userReference){
                    //If it applies to a specific user check if current user is that user...
                    if(user._id != returnedCoupon.userReference){
                        this.removeCoupon(coupon);
                        messages.push('Invalid Coupon Code');
                    }
                } else if (returnedCoupon.competitionReference){
                    //If it applies to a specific competition, make sure that competition is in the basket...
                    for (var comp in this.items){
                        //Get competition from basket item
                        var compInBasket = false;
                        if (comp.item._id == returnedCoupon.competitionReference.id) {
                            compInBasket = true;
                        }
                    }
                    if(!compInBasket){
                        if(user._id != returnedCoupon.userReference){
                            this.removeCoupon(coupon);
                            messages.push('This coupon is only valid for competition: '+returnedCoupon.competitionReference.title);
                        }
                    }
                } else if (totalNumberOfUses > 0 && (totalNumberOfUses >= timesUsed)){
                    //Check users completed orders to find coupons used. Check it doesn't exceeed numberOfUsesPerPerson
                    this.removeCoupon(coupon);
                    messages.push('This Coupon has Already Been Redeemed');
                } else if (numberOfUsesPerPerson){
                    //Check users completed orders to find coupons used. Check it doesn't exceeed numberOfUsesPerPerson
                    var userCouponOrders = await Order.find({couponCodeUsed: returnedCoupon.couponCode});

                    if(userCouponOrders.length >= numberOfUsesPerPerson){
                        this.removeCoupon(coupon);
                        messages.push('This Coupon has Already Been Redeemed');
                    }
                }
                //If still valid update basket total/subtotal...


            }

        }
       return messages;
    }
};