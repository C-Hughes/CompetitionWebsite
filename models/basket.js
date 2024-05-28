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

        console.log('Old Stored item'+ storedItem.item.price + '-'+storedItem.item.discountPrice);
        //Update item incase prices have changed
        storedItem.item = item;
        console.log('New Stored item'+ item);

        this.checkPrice();

        //If there is a discounted price, use that price
        if(storedItem.item.discountPrice){
            storedItem.price = storedItem.item.discountPrice * storedItem.qty;
            this.totalPrice += storedItem.item.discountPrice * storedItem.qty;
        } else {
            storedItem.price = storedItem.item.price * storedItem.qty;
            this.totalPrice += storedItem.item.price * storedItem.qty;
        }
        this.totalQty+= Number(qty);
    };

    this.increaseByOne = function(id){
        this.items[id].qty++;
        this.totalQty++;

        //If discount price is active
        if(this.items[id].item.discountPrice){
            this.items[id].price += this.items[id].item.discountPrice;
            this.totalPrice += this.items[id].item.discountPrice;
        } else {
            this.items[id].price += this.items[id].item.price;
            this.totalPrice += this.items[id].item.price;
        }

        //Need to make sure user cannot buy more tickets than the maximum
    };

    this.reduceByOne = function(id){
        this.items[id].qty--;
        this.totalQty--;

        //If discount price is active
        if(this.items[id].item.discountPrice){
            this.items[id].price -= this.items[id].item.discountPrice;
            this.totalPrice -= this.items[id].item.discountPrice;
        } else {
            this.items[id].price -= this.items[id].item.price;
            this.totalPrice -= this.items[id].item.price;
        }

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
        var arr = [];
        for (var id in this.items){
            arr.push(this.items[id]);
        }
        return arr;
    }

    //Check each item in basket, make sure price is correct (If discounted price has been added while old priced items are in the basket)
    this.checkPrice = async function() {
        console.log('Checking price...');
        this.totalPrice = 1000;
    
        for (var id in this.items){
            try {
                const foundCompetition = await Competition.findOne({ _id: this.items[id].item._id });
                if (foundCompetition) {
                    //Once found update the price and discount price of the basket.
                    console.log('FoundPrice =' + foundCompetition.price);
                    this.items[id].item.price = foundCompetition.price;
                    this.items[id].item.discountPrice = foundCompetition.discountPrice;
                    //console.log('Price updated'+this.items[id].item.price + this.items[id].qty);
                    this.items[id].price = this.items[id].item.price * this.items[id].qty;
                    console.log('This price = ' + this.items[id].price);
                    this.totalPrice = this.items[id].price;
                    console.log('Basket total price = ' + this.totalPrice);
                } else {
                    console.log("Error CheckPrice COMP Not Found");
                }
            } catch (err) {
                console.log(err);
            }
        }


        /*
        for (var id in this.items){
            if(this.items[id].item.discountPrice){
                if(this.items[id].price != (this.items[id].item.discountPrice * this.items[id].qty)){
                    console.log('Discount Price descrepancy!');

                    console.log('Price = '+this.items[id].item.price);
                    console.log('Discount Price = '+this.items[id].item.discountPrice);
                    console.log('Qty = '+this.items[id].qty);
                    //Update Basket Price
                    this.items[id].price = this.items[id].item.discountPrice * this.items[id].item.qty;
                }
            } else {
                if(this.items[id].price != (this.items[id].item.price * this.items[id].qty)){
                    console.log('Price descrepancy!');

                    console.log('Price = '+this.items[id].item.price);
                    console.log('Discount Price = '+this.items[id].item.discountPrice);
                    console.log('Qty = '+this.items[id].qty);
                    //console.log(JSON.stringify(this.items[id]));

                    //Update Basket Price
                    this.items[id].price = this.items[id].item.price * this.items[id].item.qty;
                }
            }
            //console.log(JSON.stringify(this.items[id]));
        }
        */
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