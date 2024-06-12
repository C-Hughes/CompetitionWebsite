//Update the value of tickets to add to basket
function updateTicketCount(change){

    var sliderWithValue = document.getElementById("sliderWithValue");
    var ticketButtonCount = document.getElementById("ticketButtonCount");
    var ticketSliderCount = document.getElementById("ticketSliderCount");
    var addToBasketButton = document.getElementById("addToBasketButton");
    var addTicketButton = document.getElementById("addTicketButton");
    var subTicketButton = document.getElementById("subTicketButton");

    var ticketCount = sliderWithValue.value;
    addTicketButton.removeAttribute("disabled");
    subTicketButton.removeAttribute("disabled");

    //If buttons pressed or slider moved
    if (change == '-') {
        ticketCount--;

        //Make sure you cannot add less than min number of tickets.
        if (Number(ticketCount) <= Number(sliderWithValue.min)) {
            ticketCount = sliderWithValue.min;
            ticketButtonCount.innerText = "Number of tickets: "+ ticketCount +"";
            sliderWithValue.value = ticketCount;
            subTicketButton.setAttribute("disabled", true);

            //Make sure you cannot add more than max number of tickets.
        }
    } else if (change == '+'){
        ticketCount++;

        if (Number(ticketCount) >= Number(sliderWithValue.max)) {
            ticketCount = sliderWithValue.max;
            ticketButtonCount.innerText = "Number of tickets: "+ ticketCount +"";
            sliderWithValue.value = ticketCount;
            addTicketButton.setAttribute("disabled", true);
        }
    }

    //Make sure you cannot add less than min number of tickets.
    if (Number(ticketCount) <= Number(sliderWithValue.min)) {
        subTicketButton.setAttribute("disabled", true);
        //Make sure you cannot add more than max number of tickets.
    } else if (Number(ticketCount) >= Number(sliderWithValue.max)) {
        addTicketButton.setAttribute("disabled", true);
    }
    
    //Update values
    ticketButtonCount.innerText = "Number of tickets: "+ ticketCount +"";
    sliderWithValue.value = ticketCount;
    ticketSliderCount.innerText = ticketCount;
    
    //Update addToBasketButton URL
    var url = addToBasketButton.getAttribute("href");
    var tempArray = url.split("/");
    var newHREF = "/"+tempArray[1]+"/"+tempArray[2]+"/"+tempArray[3]+"/"+ticketCount;
    addToBasketButton.href=newHREF;
}


////////////////////////// Set competition question button to active //////////////////////////////////////
function answerQuestionsButtons(buttonNumber){

    //Get every button in questionsButtons div
    var answer1Button = document.getElementById("answer1Button");
    var answer2Button = document.getElementById("answer2Button");
    var answer3Button = document.getElementById("answer3Button");
    var answer4Button = document.getElementById("answer4Button");
    var addToBasketButton = document.getElementById("addToBasketButton");

    var buttons = new Array(answer1Button, answer2Button, answer3Button, answer4Button);

    //Remove is active from every button
    for (i = 0; i <= buttons.length - 1; i++) {
        buttons[i].classList.remove("is-focused");

        //If button has a tick icon, remove
        if (buttons[i].children.length > 1){
            buttons[i].children[0].remove();
        }
    }

    //set is-active to the button just clicked
    // Add tick icon to button clicked
    buttons[buttonNumber-1].className += " is-focused";
    buttons[buttonNumber-1].insertAdjacentHTML('afterbegin', '<span class="icon"><i class="fa-solid fa-check"></i></span>' );

    var questionAnswer = buttons[buttonNumber-1].innerText;

    //Update addToBasketButton URL
    var url = addToBasketButton.getAttribute("href");
    var tempArray = url.split("/");
    var newHREF = "/"+tempArray[1]+"/"+tempArray[2]+"/"+questionAnswer+"/"+tempArray[4];
    addToBasketButton.href=newHREF;
}

///////////////////////////////// Open modal //////////////////////////////////////////////////
document.addEventListener('DOMContentLoaded', () => {
    // Functions to open and close a modal
    function openModal($el) {
        $el.classList.add('is-active');
    }

    function closeModal($el) {
        $el.classList.remove('is-active');
    }

    function closeAllModals() {
        (document.querySelectorAll('.modal') || []).forEach(($modal) => {
        closeModal($modal);
        });
    }

    // Add a click event on buttons to open a specific modal
    (document.querySelectorAll('.js-modal-trigger') || []).forEach(($trigger) => {
        const modal = $trigger.dataset.target;
        const $target = document.getElementById(modal);

        $trigger.addEventListener('click', () => {
        openModal($target);
        });
    });

    // Add a click event on various child elements to close the parent modal
    (document.querySelectorAll('.modal-background, .modal-close, .modal-card-head .delete') || []).forEach(($close) => {
        const $target = $close.closest('.modal');

        $close.addEventListener('click', () => {
        closeModal($target);
        });
    });

    // Add a keyboard event to close all modals
    document.addEventListener('keydown', (event) => {
        if(event.key === "Escape") {
        closeAllModals();
        }
    });

    ////////////////////////////Set Theme///////////////////////////////////
    var HTMLTheme = document.getElementById("HTMLTheme");
    var changeThemeButton = document.getElementById("changeThemeButton");

    // Check the session storage for the theme
    var storedTheme = sessionStorage.getItem('theme');

    console.log(storedTheme);

    if (storedTheme) {
        HTMLTheme.classList.add(storedTheme);
        if (storedTheme == 'theme-light') {
            HTMLTheme.classList.remove('theme-dark');
            HTMLTheme.classList.add('theme-light');

            changeThemeButton.innerHTML = '<span class="icon"><i class="fa-solid fa-moon"></i></span><span>Dark Theme</span>';
            changeThemeButton.classList.remove('is-light');
            changeThemeButton.classList.add('is-dark');
        } else {
            HTMLTheme.classList.remove('theme-light');
            HTMLTheme.classList.add('theme-dark');

            changeThemeButton.innerHTML = '<span class="icon"><i class="fa-solid fa-sun"></i></span><span>Light Theme</span>';
            changeThemeButton.classList.remove('is-dark');
            changeThemeButton.classList.add('is-light');
        }
    } else {
        // Default to dark theme if no theme is stored
        HTMLTheme.classList.add('theme-dark');
        changeThemeButton.innerHTML = '<span class="icon"><i class="fa-solid fa-sun"></i></span><span>Light Theme</span>';
        changeThemeButton.classList.remove('is-dark');
        changeThemeButton.classList.add('is-light');
        sessionStorage.setItem('theme', 'theme-dark');
    }
});

function closeBasketModal(){
    var modal = document.getElementById("modal-js-example");
    
    modal.classList.remove('is-active');
}

function toggleElement(id, hasButton){
    var elem = document.getElementById(id);

    if (elem.style.display === "none") {
        elem.style.display = "block";
    } else {
        elem.style.display = "none";
    }

    if(hasButton == true){
        var iconElem = document.getElementById('icon'+id);
        if (elem.style.display === "none") {
            iconElem.innerHTML = '<i class="fas fa-angle-down" aria-hidden="true"></i>';
        
        } else {
            iconElem.innerHTML = '<i class="fas fa-angle-up" aria-hidden="true"></i>';
        }        
    }
}

function toggleHidePassword(id, buttonId){
    var input = document.getElementById(id);
    var button = document.getElementById(buttonId);

    if (input.type === "password") {
        input.type = "text";
        button.innerHTML = '<i class="fa-solid fa-eye"></i>';
    } else {
        input.type = "password";
        button.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
    }
}


function editForm(defaultDisplay, defaultClosed, button, buttonType){
    var defaultDisplayElem = document.getElementById(defaultDisplay);
    var defaultClosedElem = document.getElementById(defaultClosed);

    if (defaultDisplayElem.style.display === "none") {
        defaultDisplayElem.style.display = "block";
        defaultClosedElem.style.display = "none";
    } else {
        defaultDisplayElem.style.display = "none";
        defaultClosedElem.style.display = "block";
    }

    console.log(button);

    if(button != ""){
        //if(buttonType != ""){
            
        //}
        var buttonElem = document.getElementById(button);
        buttonElem.innerHTML = "<button type='"+buttonType+"' class='card-footer-item has-text-link'><span class='icon'><i class='fa-solid fa-floppy-disk'></i></span><span>Save Address</span></button>";  
    }
}


function verifyCompAnswer(){
    //Get every button in questionsButtons div
    var answer1Button = document.getElementById("answer1Button");
    var answer2Button = document.getElementById("answer2Button");
    var answer3Button = document.getElementById("answer3Button");
    var answer4Button = document.getElementById("answer4Button");
    var errorMessage = document.getElementById("errorMessage");

    var buttons = new Array(answer1Button, answer2Button, answer3Button, answer4Button);
    var isFocused = false;
    //Remove is active from every button
    for (i = 0; i <= buttons.length - 1; i++) {
        //If button has is-focused class
        if (buttons[i].classList.contains("is-focused")){
            isFocused = true;
            console.log(isFocused);
        }
    }
    if(isFocused == false){
        errorMessage.innerText = "Please select an answer";
    }
    return isFocused;
}

function copyShareLink(type, text){

    if(type == 'link'){
        var copyLinkInfo = document.getElementById("copyLinkInfo");
        copyLinkInfo.style.display="block";

        // Get the text field
        var copyText = document.getElementById("shareLinkText");

    } else if (type == 'referral'){
        var copyLinkInfo = document.getElementById("referralCopied");
        copyLinkInfo.style.display="block";

        var copyText = document.getElementById("referralCodeText");
    }
    // Select the text field
    copyText.select();
    copyText.setSelectionRange(0, 99999); // For mobile devices
    // Copy the text inside the text field
    navigator.clipboard.writeText(copyText.value);
}

function changeTheme(){
    var HTMLTheme = document.getElementById("HTMLTheme");
    var changeThemeButton = document.getElementById("changeThemeButton");
    
    if(HTMLTheme.classList.contains('theme-dark')){
        HTMLTheme.classList.remove('theme-dark');
        HTMLTheme.classList.add('theme-light');

        changeThemeButton.innerHTML = '<span class="icon"><i class="fa-solid fa-moon"></i></span><span>Dark Theme</span>';
        changeThemeButton.classList.remove('is-light');
        changeThemeButton.classList.add('is-dark');

        sessionStorage.setItem('theme', 'theme-light');
    } else {
        HTMLTheme.classList.remove('theme-light');
        HTMLTheme.classList.add('theme-dark');

        changeThemeButton.innerHTML = '<span class="icon"><i class="fa-solid fa-sun"></i></span><span>Light Theme</span>';
        changeThemeButton.classList.remove('is-dark');
        changeThemeButton.classList.add('is-light');

        sessionStorage.setItem('theme', 'theme-dark');
    }
}
