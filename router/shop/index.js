const router = require("express").Router();
const member = require("../../controllers/Member/member.controller")
const authShop = require("../../lib/auth-shop")


router.post("/genPublicToken",member.genPublicToken)
router.post("/regisMember",authShop,member.create)
router.get("/memberShop", authShop,member.CheckInvit)


module.exports = router;