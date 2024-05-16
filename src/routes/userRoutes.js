const express = require('express');
const router = express.Router();
const { signup, signin, getUser } = require('../controllers/userController');

router.post('/signup', signup);
router.post('/signin', signin);
router.get('/user/:id', getUser);

module.exports = router;
