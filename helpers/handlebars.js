module.exports = {
    getPercentage: function(currentEntries, maxEntries){
      return Math.floor((currentEntries / maxEntries) * 100);
    },
    formatPrice: function(price){
        return (Math.round(price * 100) / 100).toFixed(2);
    },
    formatDescription: function(description){
        description.replaceAll("script", '');
        return description.replaceAll("\n", '</li><li>');
    }
  }