module.exports = {
    ifeq: function(a, b, options){
      if (a === b) {
        return options.fn(this);
        }
      return options.inverse(this);
    },
    getPercentage: function(currentEntries, maxEntries){
      return Math.floor((currentEntries / maxEntries) * 100);
    }
  }