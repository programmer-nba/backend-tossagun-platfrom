const router = require("express").Router();
const commission = require("../../controllers/Member/commission.controller.js")
const authMember = require("../../lib/auth-member.js")

router.post("/token", authMember, commission.getToken);
router.get("/list", authMember, commission.getCommissionList);

module.exports = router;