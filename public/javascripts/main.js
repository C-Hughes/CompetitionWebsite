function updateTicketCount(change){

  var sliderWithValue = document.getElementById("sliderWithValue");
  var ticketButtonCount = document.getElementById("ticketButtonCount");
  var ticketSliderCount = document.getElementById("ticketSliderCount");

  var ticketCount = sliderWithValue.value;

  if (change == '-') {
    console.log('- pressed');
    ticketCount--;
    ticketSliderCount.innerText = ticketCount;
  } else if (change == '+'){
    console.log('+ pressed');
    ticketCount++;
    ticketSliderCount.innerText = ticketCount;
  }
  ticketButtonCount.innerText = "Number of tickets: "+ ticketCount +"";
  sliderWithValue.value = ticketCount;
}