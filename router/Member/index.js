const router = require("express").Router();
const authMember = require("../../lib/auth-member");
const member = require("../../controllers/Member/member.controller");

router.post("/verify", member.verify); //ส่ง otp
router.post("/check", member.check); //ตรวจสอบ otp
router.post("/create", member.create); //สร้าง user
router.post("/checkForgotPassword/:id", member.checkForgotPassword)
router.put("/EditMember/:id", member.EditMember); //เเก้ไขข้อมูลสมาชิก
router.put("/ImportBank/:id", member.ImportBank); //เพิ่มข้อมูลธนาคาร
router.put("/ImportIden/:id", member.ImportIden); //เพิ่มข้อมูลบัตรประชาชน
router.delete("/deleteMember/:id", member.deleteMember);
router.get("/GetAllMember", member.GetAllMember);
router.get("/GetMember/:id", member.GetMemberById);
module.exports = router;
