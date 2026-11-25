const express = require('express');
const roleAccess = require('./roleAccess');
const auth = require('../../middelwares/auth');
const requireSuperAdmin = require('../../middelwares/requireSuperAdmin');

const router = express.Router();

router.get('/', auth, roleAccess.index)
router.get("/assignedUsers/:id", auth, requireSuperAdmin, roleAccess.roleAssignedUsers)
router.post("/add", auth, requireSuperAdmin, roleAccess.add)
router.put('/edit/:id', auth, requireSuperAdmin, roleAccess.edit)
router.put('/assignedUsers/:id', auth, requireSuperAdmin, roleAccess.assignRoleToUsers)

module.exports = router
