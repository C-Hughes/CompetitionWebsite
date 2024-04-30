var express = require('express');
var router = express.Router();

/* GET admin listings. */
router.get('/', function(req, res, next) {
  res.render('admin/dashboard', { title: 'Dashboard' });
});



module.exports = router;
