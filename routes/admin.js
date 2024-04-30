var express = require('express');
var router = express.Router();

/* GET admin listings. */
router.get('/', function(req, res, next) {
  res.render('admin/dashboard', { title: 'Dashboard', active: { dashboard: true }  });
});

router.get('/winners', function(req, res, next) {
    res.render('admin/winners', { title: 'Winners', active: { winners: true } });
  });
  
  router.get('/discounts', function(req, res, next) {
    res.render('admin/discounts', { title: 'Discounts', active: { discounts: true } });
  });
  
  router.get('/users', function(req, res, next) {
    res.render('admin/users', { title: 'Users', active: { users: true } });
  });


module.exports = router;
