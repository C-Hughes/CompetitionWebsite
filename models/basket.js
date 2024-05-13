module.exports = function Basket(oldBasket){
    this.items = oldBasket.items || {};
    this.totalQty = oldBasket.totalQty || 0;
    this.totalPrice = oldBasket.totalPrice || 0;
    this.questionAnswer = oldBasket.questionAnswer || "";

    this.add = function(item, id, answer, qty){
        var storedItem = this.items[id];
        if(!storedItem){
            var price = qty * item.price;
            storedItem = this.items[id] = {item: item, qty: Number(qty), price: Number(price), questionAnswer: answer};
        }
        storedItem.qty+= Number(qty);
        storedItem.price = storedItem.item.price * storedItem.qty;
        this.totalQty+= qty;
        //this.totalPrice = storedItem.item.price * storedItem.qty;
        this.totalPrice += storedItem.item.price * storedItem.qty;
    };

    this.reduceByOne = function(id){
        this.items[id].qty--;
        this.items[id].price -= this.items[id].item.price;
        this.totalQty--;
        this.totalPrice -= this.items[id].item.price;

        if (this.items[id].qty <= 0){
            delete this.items[id];
        }
    };

    this.increaseByOne = function(id){
        this.items[id].qty++;
        this.items[id].price += this.items[id].item.price;
        this.totalQty++;
        this.totalPrice += this.items[id].item.price;

        //Need to make sure user cannot buy more tickets than the maximum
    };

    this.removeItem = function(id){
        this.totalQty -= this.items[id].qty;
        this.totalPrice -= this.items[id].price;
        delete this.items[id];
    };

    this.generateArray = function() {
        var arr = [];
        for (var id in this.items){
            arr.push(this.items[id]);
        }
        return arr;
    }
};