const express = require('express');
const router = express.Router();

const usersController = require('../controllers/userController');
const authenticateToken = require('../middleware/authMiddleware');
const { 
    validateGetUsers, 
    validateUserId, 
    validateUpdateProfile 
} = require('../middleware/validationMiddleware');

router.get('/users', authenticateToken, validateGetUsers, usersController.getUsers);
router.get('/profile', authenticateToken, usersController.getCurrentProfile);
router.get('/users/:userId', authenticateToken, validateUserId, usersController.getUserById);
router.put('/users/:userId', authenticateToken, validateUserId, validateUpdateProfile, usersController.updateProfile);
router.delete('/users/:userId', authenticateToken, validateUserId, usersController.deleteUser);

module.exports = router;