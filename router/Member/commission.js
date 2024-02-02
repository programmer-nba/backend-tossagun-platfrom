const router = require("express").Router();
const member = require("../../controllers/Member/calculate.commission.controllers")

router.post('/givecommission', member.giveCommission);
router.get('/GetBYtel/:tel', member.GetBYtel)



module.exports = router;