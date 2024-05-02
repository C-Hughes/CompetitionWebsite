function updateTicketCount(change){

  var sliderWithValue = document.getElementById("sliderWithValue");
  var ticketButtonCount = document.getElementById("ticketButtonCount");
  var ticketSliderCount = document.getElementById("ticketSliderCount");

  var ticketCount = sliderWithValue.value;

  //If buttons pressed or slider moved
  if (change == '-') {
    ticketCount--;

    //Make sure you cannot add more than max or less than min number of tickets.
    if (ticketCount < sliderWithValue.min) {
      ticketCount = sliderWithValue.min;
      ticketButtonCount.innerText = "Number of tickets: "+ ticketCount +"";
      sliderWithValue.value = ticketCount;
    }
  } else if (change == '+'){
    ticketCount++;

    //Make sure you cannot add more than max or less than min number of tickets.
    if (ticketCount > sliderWithValue.max) {
      ticketCount = sliderWithValue.max;
      ticketButtonCount.innerText = "Number of tickets: "+ ticketCount +"";
      sliderWithValue.value = ticketCount;
    }
  }
 
  ticketButtonCount.innerText = "Number of tickets: "+ ticketCount +"";
  sliderWithValue.value = ticketCount;
  ticketSliderCount.innerText = ticketCount;
}