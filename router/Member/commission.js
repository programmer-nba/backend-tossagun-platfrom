const router = require("express").Router();
const member = require("../../controllers/Member/calculate.commission.controllers")



router.post('/givecommission', member.giveCommission);




module.exports = router;