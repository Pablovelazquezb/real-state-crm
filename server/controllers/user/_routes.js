const express = require('express');
const user = require('./user');
const auth = require('../../middelwares/auth');
const requireSuperAdmin = require('../../middelwares/requireSuperAdmin');

const router = express.Router();

router.post('/admin-register', auth, requireSuperAdmin, user.adminRegister)
router.get('/', auth, requireSuperAdmin, user.index)
router.post('/register', auth, requireSuperAdmin, user.register)
router.post('/login', user.login)
router.post('/deleteMany', auth, requireSuperAdmin, user.deleteMany)
router.get('/view/:id', auth, user.view)
router.delete('/delete/:id', auth, requireSuperAdmin, user.deleteData)
router.put('/edit/:id', auth, user.edit)
router.put('/change-roles/:id', auth, requireSuperAdmin, user.changeRoles)

module.exports = router
