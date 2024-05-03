//Update the value of tickets to add to basket
function updateTicketCount(change){

  var sliderWithValue = document.getElementById("sliderWithValue");
  var ticketButtonCount = document.getElementById("ticketButtonCount");
  var ticketSliderCount = document.getElementById("ticketSliderCount");

  var ticketCount = sliderWithValue.value;

  //If buttons pressed or slider moved
  if (change == '-') {
    ticketCount--;

    //Make sure you cannot add less than min number of tickets.
    if (ticketCount < sliderWithValue.min) {
      ticketCount = sliderWithValue.min;
      ticketButtonCount.innerText = "Number of tickets: "+ ticketCount +"";
      sliderWithValue.value = ticketCount;
    }
  } else if (change == '+'){
    ticketCount++;

    //Make sure you cannot add more than max number of tickets.
    if (ticketCount > sliderWithValue.max) {
      ticketCount = sliderWithValue.max;
      ticketButtonCount.innerText = "Number of tickets: "+ ticketCount +"";
      sliderWithValue.value = ticketCount;
    }
  }
 
  //Update values
  ticketButtonCount.innerText = "Number of tickets: "+ ticketCount +"";
  sliderWithValue.value = ticketCount;
  ticketSliderCount.innerText = ticketCount;
}


////////////////////////// Set competition question button to active //////////////////////////////////////
function answerQuestionsButtons(buttonNumber){

  //Get every button in questionsButtons div
  var answer1Button = document.getElementById("answer1Button");
  var answer2Button = document.getElementById("answer2Button");
  var answer3Button = document.getElementById("answer3Button");
  var answer4Button = document.getElementById("answer4Button");

  var buttons = new Array(answer1Button, answer2Button, answer3Button, answer4Button);

  //Remove is active from every button
  for (i = 0; i <= buttons.length - 1; i++) {
    buttons[i].classList.remove("is-focused");
  }
  //set is-active to the button just clicked
  buttons[buttonNumber-1].className += " is-focused";

}