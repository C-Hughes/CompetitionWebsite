var Competition = require('../models/competition');
var Ticket = require('../models/ticket');
var Coupon = require('../models/coupon');
var Order = require('../models/order');

module.exports = function Basket(oldBasket){
    this.items = oldBasket.items || {};
    this.basketTotalQty = oldBasket.basketTotalQty || 0;
    this.basketTotalPrice = oldBasket.basketTotalPrice || 0;
    this.basketSubtotalPrice = oldBasket.basketSubtotalPrice || 0;
    this.basketCouponsApplied = oldBasket.basketCouponsApplied || [];

    this.add = function(item, id, answer, qty){
        var storedItem = this.items[id+answer];
        if(!storedItem){
            //var price = qty * item.itemTotalPrice;
            storedItem = this.items[id+answer] = {item: item, uniqueID: Date.now(), qty: 0, itemSubtotalPrice:0, itemTotalPrice: 0, questionAnswer: answer, ticketNumbers: []};
        }
        storedItem.qty+= Number(qty);
        this.basketTotalQty+= Number(qty);

        //Update item to latest info
        storedItem.item = item;
        //this.checkPrice();
        if(storedItem.item.discountPrice){
            this.itemTotalPrice += storedItem.item.discountPrice * storedItem.qty;
            this.basketTotalPrice += storedItem.item.discountPrice * storedItem.qty;
            this.basketSubtotalPrice = this.basketTotalPrice;
        } else {
            this.itemTotalPrice += storedItem.item.price * storedItem.qty;
            this.basketTotalPrice += storedItem.item.price * storedItem.qty;
            this.basketSubtotalPrice = this.basketTotalPrice;
        }
    };

    this.addCoupon = async function(couponCode){
        if(!this.basketCouponsApplied.includes(couponCode)){
            //Find coupon and add to array
            var returnedCoupon = await Coupon.findOne({ "couponCode" : { $regex : new RegExp('^'+couponCode+'$', "i") }}).populate('competitionReference');
            if(returnedCoupon){
                this.basketCouponsApplied.push(returnedCoupon);
            }
        }
    };

    this.removeCoupon = function(couponCode){
        const foundCoupon = this.basketCouponsApplied.find(coupon => coupon.couponCode === couponCode);
        if (foundCoupon) {
            console.log('Coupon in basket currently');
            //console.log("Coupon code is already in the array.");
            this.basketCouponsApplied = this.basketCouponsApplied.filter(coupon => coupon.couponCode !== couponCode);
        }
    };

    this.increaseByOne = function(id){
        this.items[id].qty++;
        this.basketTotalQty++;
    };

    this.reduceByOne = function(id){
        this.items[id].qty--;
        this.basketTotalQty--;

        if (this.items[id].qty <= 0){
            delete this.items[id];

            if(this.items.length == 0 || Object.keys(this.items).length == 0){
                this.basketTotalPrice = 0;
                this.basketTotalQty = 0;
            }
        }
    };

    this.removeItem = function(id){
        //console.log('Basket - Removing Item');
        this.basketTotalQty -= this.items[id].qty;
        this.basketTotalPrice -= this.items[id].itemTotalPrice;
        delete this.items[id];

        if(this.items.length == 0 || Object.keys(this.items).length == 0){
            this.basketTotalPrice = 0;
            this.basketTotalQty = 0;
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
    //First check all competition in basket. Make sure it is still valid and can be entered.
    //Update basket price with updated basket entries after checks.
    //Second check any coupons that are applied to the basket.
    //Finally update the price with coupons applied
    this.updateBasket = async function(user) {
 
        //console.log('Updating Basket...');
        this.basketTotalPrice = 0;
        this.basketSubtotalPrice = 0;
        var totalFlatReduction = 0;
        var totalPercentReduction = 0;
        var messages = [];
        //Store competitionIds of each item in basket, if two competition IDs are the same, user is buying tickets for the same competition with different answers...
        //Extra checks required to make sure user can not buy more tickets than max allowed...  
        var basketComps = {};

        try {
            for (var id in this.items){
            
                var currentCompID = this.items[id].item._id
                const foundCompetition = await Competition.findOne({ _id: currentCompID });

                //If competition is found update basketItem
                if(foundCompetition){
                    this.items[id].item = foundCompetition;
                }
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
                            basketTotalQty: 0,
                            instances: []
                        };
                    }
                    basketComps[currentCompID].basketTotalQty += this.items[id].qty;
                    basketComps[currentCompID].instances.push(id);

                    //Get Number of tickets User has already purchased for competition.
                    const userEntries = await Ticket.findOne({ userReference: user._id, competitionReference: currentCompID});

                    let userPurchasedEntries = userEntries ? userEntries.ticketQty : 0;
                    let maxAllowedPerPerson = foundCompetition.maxEntriesPerPerson;

                    //Check to see if user is trying to purchase more than maximum allowed.
                    if(userPurchasedEntries + basketComps[currentCompID].basketTotalQty > maxAllowedPerPerson){
                        //console.log("UpdateBasket Error - User trying to purchase more tickets than allowed per person");
                        
                        let excessQty = (userPurchasedEntries + basketComps[currentCompID].basketTotalQty) - maxAllowedPerPerson;
                        this.items[id].qty -= excessQty;
                        this.basketTotalQty -= excessQty;
                        basketComps[currentCompID].basketTotalQty -= excessQty;
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
                            //var pendingDifference = basketComps[currentCompID].basketTotalQty - foundCompetition.pendingEntries;
                            this.items[id].qty -= basketComps[currentCompID].basketTotalQty;
                            this.basketTotalQty -= basketComps[currentCompID].basketTotalQty;
                            basketComps[currentCompID].basketTotalQty -= basketComps[currentCompID].basketTotalQty;
                            messages.push('Last Remaining Tickets for '+foundCompetition.title+' are Currently Reserved for Purchase. If A Pending Order is Cancelled you May be able to Purchase Later.');


                        //Competition + pending Entries + user basket exceeds max tickets available, reduce ticket.qty.
                        } else if((foundCompetition.currentEntries + foundCompetition.pendingEntries + basketComps[currentCompID].basketTotalQty) > foundCompetition.maxEntries){
                            var subQty = ((foundCompetition.currentEntries + foundCompetition.pendingEntries + basketComps[currentCompID].basketTotalQty) - foundCompetition.maxEntries);
                            //var subbedQty = basketComps[currentCompID].basketTotalQty - maxTickets;
                            this.items[id].qty -= subQty;
                            this.basketTotalQty -= subQty;
                            basketComps[currentCompID].basketTotalQty -= subQty;
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
                        this.items[id].itemTotalPrice = this.items[id].item.discountPrice * this.items[id].qty;
                    } else {
                        this.items[id].itemTotalPrice = this.items[id].item.price * this.items[id].qty;
                    }
                    this.items[id].itemSubtotalPrice = this.items[id].itemTotalPrice;
                    this.basketTotalPrice += this.items[id].itemTotalPrice;
                    this.basketSubtotalPrice = this.basketTotalPrice;

                } else {
                    //If competition is not found or is invisible, remove it from the basket.
                    //console.log("UpdateBasket Error - Comp Not Found");
                    this.removeItem(id);
                    messages.push('Competition Not Found - Removed From Basket');
                }
            }
            ///////////////////////////////////////////////////////////////////////////////////////////////


            ////////////////////////////////IF COUPON IS APPLIED TO BASKET/////////////////////////////////
            if(this.basketCouponsApplied.length > 0){
                //console.log('UPDATE BASKET - COUPON IS APPLIED TO BASKET');
                //Only 1 whole basket % reduction coupon can be applied  
                var sitewidePercentApplied = false;

                for (var id in this.basketCouponsApplied){
                    console.log('CHECKING COUPON = '+this.basketCouponsApplied[id].couponCode);

                    var couponRemovedFromBasket = false;
                    var coupon = this.basketCouponsApplied[id].couponCode;
                    //Lookup couponCode from DB
                    var returnedCoupon = await Coupon.findOne({ "couponCode" : { $regex : new RegExp('^'+coupon+'$', "i") }}).populate('competitionReference');

                    if(!returnedCoupon){
                        //Not Found Remove from Basket
                        couponRemovedFromBasket = true;
                        this.removeCoupon(coupon);
                        messages.push('Coupon Not Found - Removed From Basket');
                    } else if(!returnedCoupon.active){
                        //Check if coupon is currently active...
                        couponRemovedFromBasket = true;
                        this.removeCoupon(coupon);
                        messages.push('Coupon Code Is Not Active');
                    } else if (new Date(returnedCoupon.couponExpiryDate.getTime()) < Date.now()){
                        //Check if coupon date has expired...
                        couponRemovedFromBasket = true;
                        this.removeCoupon(coupon);
                        messages.push('Coupon Code Has Expired');
                    } else if (returnedCoupon.totalNumberOfUses > 0 && (returnedCoupon.totalNumberOfUses >= timesUsed)){
                        //Check users completed orders to find coupons used. Check it doesn't exceeed numberOfUsesPerPerson
                        couponRemovedFromBasket = true;
                        this.removeCoupon(coupon);
                        messages.push('This Coupon has Already Been Redeemed');
                    } else {
                        if (returnedCoupon.numberOfUsesPerPerson){
                            //Check users completed orders to find coupons used. Check it doesn't exceeed numberOfUsesPerPerson
                            var userCouponOrders = await Order.find({couponCodeUsed: returnedCoupon.couponCode});
    
                            if(userCouponOrders.length >= returnedCoupon.numberOfUsesPerPerson){
                                couponRemovedFromBasket = true;
                                this.removeCoupon(coupon);
                                messages.push('This Coupon has Already Been Redeemed');
                            }
                        }
                        if (returnedCoupon.userReference){
                            //If it applies to a specific user check if current user is that user...
    
                            if(user._id.toString() != returnedCoupon.userReference.toString()){
                                couponRemovedFromBasket = true;
                                this.removeCoupon(coupon);
                                messages.push('Invalid Coupon Code');
                            }
                        } 
                        if (returnedCoupon.competitionReference){
                            //If it applies to a specific competition, make sure that competition is in the basket...
                            var compInBasket = false;
                            for (var CID in this.items){
                                //Get competition from basket item
                                if (this.items[CID].item._id == returnedCoupon.competitionReference.id) {
                                    compInBasket = true;
                                }
                            }
                            if(!compInBasket){
                                couponRemovedFromBasket = true;
                                this.removeCoupon(coupon);
                                messages.push('Coupon '+coupon+' is only valid for competition: '+returnedCoupon.competitionReference.title);
                            }
                        }
                    }
                    //If 1 whole basket % reduction coupon has already been applied, remove the second coupon 
                    if(sitewidePercentApplied && returnedCoupon.couponPercent){
                        couponRemovedFromBasket = true;
                        this.removeCoupon(coupon);
                        messages.push('Only one basket % reduction Coupon can be applied');
                    }

                    //If coupon has not been removed from the basket after checks
                    if(!couponRemovedFromBasket){
                        //If coupon is a % reduction, then update variable
                        if(returnedCoupon.couponPercent){
                            sitewidePercentApplied = true;
                        }

                        //Update coupon item in basket from latest DB version.
                        //console.log('Updating coupon info in basket');
                        this.basketCouponsApplied = this.basketCouponsApplied.map(appliedCoupon => 
                            appliedCoupon.couponCode === coupon ? returnedCoupon : appliedCoupon
                        );

                        //If coupon has not been removed, then update basket pricing...
                        //If coupon applies to specific competition
                        if (returnedCoupon.competitionReference){
                            for (var CID in this.items){
                                //Get competition from basket item
                                if (this.items[CID].item._id == returnedCoupon.competitionReference.id) {
                                    //Reduce price of this item by the coupon amount
                                    if(returnedCoupon.couponAmount){
                                        this.items[CID].itemTotalPrice -= returnedCoupon.couponAmount;
                                    } else if(returnedCoupon.couponPercent){
                                        let discountDecimal = returnedCoupon.couponPercent / 100;
                                        this.items[CID].itemTotalPrice *= (1 - discountDecimal);
                                    }

                                    //Check to make sure price isn't below 0
                                    if(this.items[CID].itemTotalPrice < 0){
                                        this.items[CID].itemTotalPrice = 0;
                                    }
                                }
                            }
                        } else {
                            if(returnedCoupon.couponAmount){
                                totalFlatReduction += returnedCoupon.couponAmount
                            } else if(returnedCoupon.couponPercent){
                                totalPercentReduction = returnedCoupon.couponPercent;
                            }
                        }
                    }                
                }
                //Update basket total price with coupons applied.
                this.basketTotalPrice=0;
                for (var id in this.items){
                    this.basketTotalPrice += this.items[id].itemTotalPrice;
                }
                if(totalFlatReduction > 0){
                    this.basketTotalPrice-=totalFlatReduction;
                }
                if(totalPercentReduction > 0){
                    let discountDecimal = totalPercentReduction / 100;
                    this.basketTotalPrice*= (1 - discountDecimal);
                }
                if(this.basketTotalPrice < 0){
                    this.basketTotalPrice = 0;
                }
            }
        } catch (err) {
            console.log(err);
        }
        return messages;
    }
};