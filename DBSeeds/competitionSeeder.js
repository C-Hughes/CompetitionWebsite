var Competition = require('../models/competition');

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/CompetitionMain', {
    serverSelectionTimeoutMS: 5000
});

var Competitions = [
    new Competition({
        imagePath: 'http://localhost:3000/images/xboxMain.jpg',
        additionalImagePaths : [ "http://localhost:3000/images/xboxImage1.jpg", "http://localhost:3000/images/xboxImage2.jpg", "http://localhost:3000/images/xboxImage3.jpg", "http://localhost:3000/images/xboxImage4.jpg", "http://localhost:3000/images/xboxImage5.jpg" ],
        title: 'Xbox Series X 1TB',
        description: 'Introducing Xbox Series X, the fastest, most powerful Xbox ever. Play thousands of titles from four generations of consoles—all games look and play best on Xbox Series X.\n' +
            '  Experience next-gen speed and performance with the Xbox Velocity Architecture, powered by a custom SSD and integrated software\n' +
            '  Play thousands of games from four generations of Xbox with Backward Compatibility, including optimised titles at launch',
        cashAlternative: 250,
        price: 1.5,
        drawDate: new Date("2024-12-25:19:00"),
        entryCloseDate: new Date("2024-12-25:18:00"),
        currentEntries: 0,
        maxEntries: 2000,
        maxEntriesPerPerson: 150,
        maxPostalVotes: 1,
        questionText: 'Which of the below is a day of the week?',
        questionAnswers: ["January", "March", "Wednesday", "December"],
        correctAnswer: 'Wednesday',
        created: new Date(),
        active: true,
        visible: true
    }),
    new Competition({
        imagePath: 'http://localhost:3000/images/samsung-870-evo.jpg',
        title: '2TB Samsung SSD Evo',
        description: 'Introducing Samsung SSD\n' +
            '  More Text\n' +
            '  More Text Here',
        cashAlternative: 75,
        price: 1.00,
        drawDate: new Date("2024-09-25:19:00"),
        entryCloseDate: new Date("2024-09-25:18:00"),
        currentEntries: 0,
        maxEntries: 1000,
        maxEntriesPerPerson: 100,
        maxPostalVotes: 1,
        questionText: 'What is the first letter of the alphabet?',
        questionAnswers: ["A", "R", "B", "P"],
        correctAnswer: 'A',
        created: new Date(),
        active: true,
        visible: true
    }),
    new Competition({
        imagePath: 'http://localhost:3000/images/LegoStarWarsF.jpg',
        title: 'LEGO StarWars Millennium Falcon',
        description: 'Introducing LEGO StarWars Millennium Falcon\n' +
            '  More Text\n' +
            '  More Text Here',
        cashAlternative: 75,
        price: 1.00,
        drawDate: new Date("2024-03-25:19:00"),
        entryCloseDate: new Date("2024-03-25:18:00"),
        currentEntries: 0,
        maxEntries: 1000,
        maxEntriesPerPerson: 100,
        maxPostalVotes: 1,
        questionText: 'What is 5 + 5?',
        questionAnswers: ["10", "25", "100", "2"],
        correctAnswer: '10',
        created: new Date(),
        active: true,
        visible: true
    })
];

var finished = 0;
for (var i =0; i < Competitions.length; i++){
    Competitions[i].save().then(()=>{
        console.log(finished);
        finished++
        if(finished === Competitions.length){
            exit();
            console.log('Exit');
        }
    }).catch((err)=>{
        console.log(err);
    })


}

function exit(){
    mongoose.disconnect();
}


//   cd ../../../../../ 
//   cd '.\Program Files\MongoDB\Server\4.2\bin'