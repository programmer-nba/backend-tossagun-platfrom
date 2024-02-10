const router = require("express").Router();
const authMember = require("../../lib/auth-member");
const contract = require("../../controllers/contract/contract.controllers")

router.post("/contractPlatFrom/:id",contract.GetAllContract)

module.exports = router;
