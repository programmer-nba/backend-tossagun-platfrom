const router = require("express").Router();
const authMember = require("../../lib/auth-member");
const member = require("../../controllers/Member/member.controller");

router.post("/verify", member.verify); //ส่ง otp
router.post("/check", member.check); //ตรวจสอบ otp
router.get("/CheckInvite/:tel", member.CheckInvit); //ตรวจสอบผู้เชิญชวน
router.post("/create", member.create); //สร้าง user
router.post("/checkForgotPassword/:id", member.checkForgotPassword); //ส่ง otp ยืนยันว่าลืมรหัสผ่าน
router.post("/change_password", member.ChangePassword); //เปลี่ยนรหัสผ่าน
router.put("/EditMember/:id", authMember, member.EditMember); //เเก้ไขข้อมูลสมาชิก
router.put("/EditMemberNew/:id", authMember, member.EditMemberNew); //เเก้ไขข้อมูลปัจจุบัน
router.put("/ImportBank/:id", authMember, member.ImportBank); //เพิ่มข้อมูลธนาคาร
router.put("/ImportIden/:id", authMember, member.ImportIden); //เพิ่มข้อมูลบัตรประชาชน
router.put("/ImportProfile/:id", authMember, member.ImportProfile); //เพิ่มรูปภาพprofile
router.delete("/deleteMember/:id", authMember, member.deleteMember);
router.get("/GetAllMember", member.GetAllMember);
router.get("/GetMember/:id", authMember, member.GetMemberById);

//เเก้ไขข้อมุลมรดกตกทอด
router.put("/EditHeritage/:id", authMember, member.EditHeritage);
router.put("/DeleteHeriyage/:id", authMember, member.DeleteHeriyage);

module.exports = router;
