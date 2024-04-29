var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Giveaway' });
});


router.get('/faq', function(req, res, next) {
  res.render('faq', { title: 'FAQ' });
});

module.exports = router;
