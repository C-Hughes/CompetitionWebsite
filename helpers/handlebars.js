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
    },
    formatDate: function(cond1, options){
        var date = new Date(cond1);
        var year = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(date);
        var month = new Intl.DateTimeFormat('en', { month: 'short' }).format(date);
        var day = new Intl.DateTimeFormat('en', { day: '2-digit' }).format(date);
        var time = new Intl.DateTimeFormat('en', { hour: "2-digit", minute: "2-digit" }).format(date);
        var newDate = `${day}-${month}-${year} @ ${time}`;
        return newDate;
    },
    formatDateCompCard: function(cond1, options){
        var date = new Date(cond1);
        var weekday = new Intl.DateTimeFormat('en', { weekday: 'long' }).format(date);
        var day = new Intl.DateTimeFormat('en', { day: 'numeric' }).format(date);
        var month = new Intl.DateTimeFormat('en', { month: 'short' }).format(date);
        var time = new Intl.DateTimeFormat('en', { hour: "numeric"}).format(date);
        var newDate = `${weekday} ${day} ${month} - ${time}`;
        return newDate;

        
    },
    formatTicketNumberOutput: function(cond1, options){
        var toString = cond1.toString();
        return toString.replaceAll(",",", ");;        
    },
    isTrue: function(value, options){
        if(value === true) {
            return options.fn(this);
        }
        return options.inverse(this);
    },
    checkActiveCompetitions: function(competitions, options){
        let hasActive = false;

        // Iterate through competitions to check for active ones
        for (let i = 0; i < competitions.length; i++) {
            if (competitions[i].active) {
                hasActive = true;
                break;
            }
        }

        // Pass the result to the template context
        this.hasActiveCompetitions = hasActive;
        return options.fn(this);
    },
    checkInactiveCompetitions: function(competitions, options){
        let hasInactive = false;

        // Iterate through competitions to check for active ones
        for (let i = 0; i < competitions.length; i++) {
            if (!competitions[i].active) {
                hasInactive = true;
                break;
            }
        }

        // Pass the result to the template context
        this.hasInactiveCompetitions = hasInactive;
        return options.fn(this);
    },
    checkCurrentTickets: function(tickets, options){
        let hasCurrent = false;

        // Iterate through competitions to check for active ones
        for (let i = 0; i < tickets.length; i++) {
            if (new Date(tickets[i].competitionDrawDate) > Date.now()) {
                hasCurrent = true;
                break;
            }
        }

        // Pass the result to the template context
        this.hasCurrentTickets = hasCurrent;
        return options.fn(this);
    },
    checkPastTickets: function(tickets, options){
        let hasPast = false;

        // Iterate through competitions to check for active ones
        for (let i = 0; i < tickets.length; i++) {
            if (new Date(tickets[i].competitionDrawDate) < Date.now()) {
                hasPast = true;
                break;
            }
        }

        // Pass the result to the template context
        this.hasPastTickets = hasPast;
        return options.fn(this);
    },
}