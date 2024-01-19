const router = require("express").Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { Member, validateMember } = require("../models/Member/member.model");
const authMember = require("../lib/auth-member");

router.post("/login", async (req, res) => {
  try {
    const members = await Member.findOne({
      tel: req.body.tel,
    });
    // if (!members) return await checkMember(req, res);
    const validateMember = await bcrypt.compare(
      req.body.password,
      members.password
    );
    if (!members || !members.otp) {
      return res.status(401).send({
        status: false,
        message: "กรุณายืนยันตัวตนก่อนเข้าสู่ระบบ",
      });
    }
    if (!validateMember) {
      return res.status(401).send({
        status: false,
        message: "รหัสผ่านไม่ถูกต้อง",
      });
    }
    const token = members.generateAuthToken();
    console.log(token);
    const responseData = {
      name: members.name,
      address: members.address,
      tel: members.tel,
    };
    return res.status(200).send({
      status: true,
      token: token,
      message: "เข้าสู่ระบบสำเร็จ",
      result: responseData,
      level: "member",
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .send({ status: false, message: "Internal Server Error" });
  }
});
router.get("/me", authMember, async (req, res) => {
  try {
    const { decoded } = req;
    if (decoded && decoded.row === "member") {
      const id = decoded._id;
      const members = await Member.findOne({ _id: id });
      if (!members) {
        return res
          .status(400)
          .send({ message: "มีบางอย่างผิดพลาด", status: false });
      } else {
        return res.status(200).send({
          name: hr.hr_name,
          username: hr.Hr_username,
          position: "member",
          level: hr.hr_position,
        });
      }
    }
  } catch (error) {
    res.status(500).send({ message: "Internal Server Error", status: false });
  }
});

module.exports = router;
