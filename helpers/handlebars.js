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
    },
    isdefined: function(value){
        return value !== undefined;
    },
    ifGreaterThan0: function(cond1, options){
        return cond1 > 0 ? options.fn(this) : options.inverse(this);
    },
    ifDateInPast: function(cond1, options){
        return new Date(cond1) > Date.now() ? options.fn(this) : options.inverse(this);
    }
}