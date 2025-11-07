const express = require('express');
const router = express.Router();

const usersController = require('../controllers/userController');
const authenticateToken = require('../middleware/authMiddleware');

router.get('/users', authenticateToken, usersController.getUsers);
router.get('/profile', authenticateToken, usersController.getCurrentProfile);
router.get('/users/:userId', authenticateToken, usersController.getUserById);
router.put('/users/:userId', authenticateToken, usersController.updateProfile);
router.delete('/users/:userId', authenticateToken, usersController.deleteUser);

module.exports = router;