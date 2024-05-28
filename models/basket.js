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

            if(this.items.length == 0){
                this.totalPrice = 0;
                this.totalQty = 0;
            }
        }
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

    this.removeItem = function(id){
        this.totalQty -= this.items[id].qty;
        this.totalPrice -= this.items[id].price;
        delete this.items[id];

        if(this.items.length == 0){
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