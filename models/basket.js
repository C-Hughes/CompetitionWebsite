var Competition = require('../models/competition');

module.exports = function Basket(oldBasket){
    this.items = oldBasket.items || {};
    this.totalQty = oldBasket.totalQty || 0;
    this.totalPrice = oldBasket.totalPrice || 0;

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

    this.increaseByOne = function(id){
        this.items[id].qty++;
        this.totalQty++;

        //If discount price is active
        /*
        if(this.items[id].item.discountPrice){
            this.items[id].price += this.items[id].item.discountPrice;
            this.totalPrice += this.items[id].item.discountPrice;
        } else {
            this.items[id].price += this.items[id].item.price;
            this.totalPrice += this.items[id].item.price;
        }*/

        //Need to make sure user cannot buy more tickets than the maximum
    };

    this.reduceByOne = function(id){
        this.items[id].qty--;
        this.totalQty--;

        //No Longer needed as basket is updated everytime user navigates to /basket or /checkout
        /*
        if(this.items[id].item.discountPrice){
            this.items[id].price -= this.items[id].item.discountPrice;
            this.totalPrice -= this.items[id].item.discountPrice;
        } else {
            this.items[id].price -= this.items[id].item.price;
            this.totalPrice -= this.items[id].item.price;
        }*/

        if (this.items[id].qty <= 0){
            delete this.items[id];

            if(this.items.length == 0 || Object.keys(this.items).length == 0){
                this.totalPrice = 0;
                this.totalQty = 0;
            }
        }
    };

    this.removeItem = function(id){
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

    //Check each item in basket, make sure price is correct (If discounted price has been added while old priced items are in the basket)
    this.updateBasket = async function() {
        //console.log('Updating Basket...');
        this.totalPrice = 0;

        for (var id in this.items){
            try {
                const foundCompetition = await Competition.findOne({ _id: this.items[id].item._id });
                if (foundCompetition) {
                    //Update basket item to current info
                    this.items[id].item = foundCompetition;
                    //console.log('item = '+this.items[id].item);

                    //if foundCompetition has a discountPrice set
                    if(foundCompetition.discountPrice){
                        //Update Total price for this specific item
                        this.items[id].price = this.items[id].item.discountPrice * this.items[id].qty;
                    } else {
                        this.items[id].price = this.items[id].item.price * this.items[id].qty;
                    }
                    this.totalPrice += this.items[id].price;
                } else {
                    console.log("Error updateBasket() COMP Not Found");
                }
            } catch (err) {
                console.log(err);
            }
        }

        //Make sure a user cannot add more tickets if a competition is sold out

        //Make sure a user cannot add more tickets than is allowed per person
    }

    //Make sure a user cannot add more tickets than is allowed per person
    this.checkMaxTicketsPerPerson = function() {
        //Check tickets db to see if user has already purchased any tickets

        //Check to see if user has added more tickets to basket than is allowed per person

        //Set basket to be max allowed
    }

    //Make sure a user cannot add more tickets if a competition is sold out
    this.checkCurrentCompTicketsSold = function() {

        //If competition is almost sold out set ticket qty to be max allowed

    }
};