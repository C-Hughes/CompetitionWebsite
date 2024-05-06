module.exports = {
    getPercentage: function(currentEntries, maxEntries){
      return Math.floor((currentEntries / maxEntries) * 100);
    },
    formatPrice: function(price){
        return (Math.round(price * 100) / 100).toFixed(2);;
    }
  }