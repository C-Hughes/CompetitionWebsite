var Competition = require('../models/competition');

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/CompetitionMain', {
    serverSelectionTimeoutMS: 5000
});

var Competitions = [
    new Competition({
        imagePath: 'https://www.gamespot.com/a/uploads/screen_kubrick/1574/15747411/3756082-xbox-series-x-review-promothumb.jpg',
        title: 'Xbox Series X 1TB',
        description: 'Introducing Xbox Series X, the fastest, most powerful Xbox ever. Play thousands of titles from four generations of consoles—all games look and play best on Xbox Series X.\n' +
            '  Experience next-gen speed and performance with the Xbox Velocity Architecture, powered by a custom SSD and integrated software\n' +
            '  Play thousands of games from four generations of Xbox with Backward Compatibility, including optimised titles at launch\n',
        cashAlternative: 250,
        price: 3.5,
        drawDate: new Date(),
        currentEntries: 660,
        maxEntries: 1000,
        maxEntriesPerPerson: 100,
        maxPostalVotes: 1,
        questionText: 'Which of the below is a day of the week?',
        questionAnswers: ["January", "March", "Wednesday", "December"],
        correctAnswer: 'Wednesday',
        created: new Date()
    }),
    new Competition({
        imagePath: 'https://images.idgesg.net/images/article/2021/01/samsung-870-evo-sata-ssd-primary-100873962-orig.jpg?quality=50&strip=all',
        title: '2TB Samsung SSD Evo',
        description: 'Introducing Samsung SSD\n' +
            '  More Text\n' +
            '  More Text Here\n',
        cashAlternative: 75,
        price: 1.20,
        drawDate: new Date(),
        currentEntries: 476,
        maxEntries: 1000,
        maxEntriesPerPerson: 100,
        maxPostalVotes: 1,
        questionText: 'What is the first letter of the alphabet?',
        questionAnswers: ["A", "R", "B", "P"],
        correctAnswer: 'A',
        created: new Date()
    }),
    new Competition({
        imagePath: 'http://im.ziffdavisinternational.com/ign_es/screenshot/default/75105box3injpg-8bb66b_jj3d.jpg',
        title: 'LEGO StarWars Millennium Falcon',
        description: 'Introducing LEGO StarWars Millennium Falcon\n' +
            '  More Text\n' +
            '  More Text Here\n',
        cashAlternative: 75,
        price: 2,
        drawDate: new Date(),
        currentEntries: 175,
        maxEntries: 1000,
        maxEntriesPerPerson: 100,
        maxPostalVotes: 1,
        questionText: 'What is 5 + 5?',
        questionAnswers: ["10", "25", "100", "2"],
        correctAnswer: '10',
        created: new Date()
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