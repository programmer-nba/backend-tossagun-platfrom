const router = require("express").Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { Member, validateMember } = require("../models/Member/member.model");
const { History } = require("../models/history/history.model");
const authMe = require("../lib/authMe")
const authMember = require("../lib/auth-member");
const getmac = require("getmac");
const MACAddress = getmac.default();

router.post("/login", async (req, res) => {
  const currentTime = new Date();
  try {
    const macAddress = getmac.default();
    const IpAddress = req.body.ipAdress;
    if (!req.body.tel) {
      return res.status(400).send({
        status: false,
        message: "กรุณากรอกเบอร์โทรศัพท์ หรือ ชื่อผู้ใช้",
      });
    }
    const members = await Member.findOne({
      tel: req.body.tel,
    });
    // if (!members) return await checkMember(req, res);
    const validateMember = await bcrypt.compare(
      req.body.password,
      members.password
    );
    if (!validateMember) {
      return res.status(401).send({
        status: false,
        message: "รหัสผ่านไม่ถูกต้อง",
      });
    }
    members.lastLogin = Date.now();
    const historyData = {
      name: members.name,
      lastLogin: currentTime,
      MacAddress: macAddress,
      ipAdress: IpAddress,
      status: true,
    };
    const history = new History(historyData);
    await history.save();
    await members.save();
    const token = members.generateAuthToken();
    const responseData = {
      _id: members._id,
      name: members.name,
      lastname: members.lastname,
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
    return res.status(500).send({ status: false, message: err.message });
  }
});

router.post("/history", async (req, res) => {
  try {
    const { lastLogin, ipAddress, status } = req.body;
    return res.status(200).send({
      status: true,
      message: "บันทึกประวัติเสร็จสิ้น",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ status: false, error: error.message });
  }
});

router.get("/me", authMe, async (req, res) => {
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
        return res.status(200).send({ status: true, message: "ดึงข้อมูลสำเร็จ", data: members });
        // return res.status(200).send({
        //   card_number: members.card_number,
        //   name: members.name,
        //   id_card: members.id_card,
        //   tel: members.tel,
        //   lastname: members.lastname,
        //   username: members.tel,
        //   address: members.address,
        //   subdistrict: members.subdistrict,
        //   district: members.district,
        //   province: members.province,
        //   postcode: members.postcode,
        //   new_address: members.new_address,
        //   wallet: members.wallet,
        //   money: members.money,
        //   passcode: members.passcode,
        //   Member_pin: members.Member_pin,
        //   profile_image: members.profile_image,
        //   allsale: members.allsale,
        //   happy_point: members.happy_point,
        //   bank: members.bank,
        //   iden: members.iden,
        //   heritage: members.heritage
        // });
      }
    }
  } catch (error) {
    res.status(500).send({ message: error.message, status: false });
  }
});

router.post("/referral_code", authMe, async (req, res) => {
  try {
    const token = jwt.sign(
      { tel: req.decoded.tel, name: req.decoded.name }, process.env.TOKEN_KEY
    );
    if (!token)
      return res.status(401).send({ status: false, message: "ไม่สามารถสร้างรหัสแนะนำได้" })
    return res.status(200).send({ status: true, message: "สร้างรหัสแนะนำสำเร็จ", data: token })
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
})

module.exports = router;
