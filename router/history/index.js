const router = require("express").Router();
const history = require("../../controllers/history/history.controllers")


router.get("/GetHistory" ,history.GetHistory)
router.get("/getHistory/:id",history.GetHistoryById)

module.exports = router;