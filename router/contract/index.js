const router = require("express").Router();
const authMember = require("../../lib/auth-member");
const contract = require("../../controllers/contract/contract.controllers")

router.post("/PDPA", contract.getContractPDPA)

module.exports = router;
