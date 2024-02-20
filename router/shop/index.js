const router = require("express").Router();
const member = require("../../controllers/Member/member.controller");
const authShop = require("../../lib/auth-shop");

router.post("/genPublicToken", member.genPublicToken);
router.post("/regisMember", member.create);
router.get("/memberShop/:tel", authShop, member.CheckInvit);
router.get("/AllMember", authShop, member.GetAllMember);
router.get("/memberTeam/:tel", authShop, member.GetTeamMember);
router.put("/update", member.updateCommission);

module.exports = router;
