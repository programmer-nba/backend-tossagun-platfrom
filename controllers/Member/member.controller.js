const bcrypt = require("bcrypt");
const dayjs = require("dayjs");
const Joi = require("joi");
const { google } = require("googleapis");
const { default: axios } = require("axios");
const req = require("express/lib/request.js");
const token_decode = require("../../lib/token_decode");
const multer = require("multer");
const jwt = require("jsonwebtoken");
const { Member, validateMember } = require("../../models/Member/member.model");
const storage = multer.diskStorage({
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
    // console.log(file.originalname);
  },
});
const {
  uploadFileCreate,
  deleteFile,
} = require("../../funtions/uploadfilecreate");
const { dfareporting } = require("googleapis/build/src/apis/dfareporting");

//ส่ง OTP
exports.verify = async (req, res) => {
  try {
    const vali = (data) => {
      const schema = Joi.object({
        phone: Joi.string().required().label("ไม่พบเบอร์โทร"),
      });
      return schema.validate(data);
    };
    const { error } = vali(req.body);
    if (error) {
      return res
        .status(400)
        .send({ status: false, message: error.details[0].message });
    }
    const config = {
      method: "post",
      url: `${process.env.SMS_URL}/otp-send`,
      headers: {
        "Content-Type": "application/json",
        api_key: `${process.env.SMS_API_KEY}`,
        secret_key: `${process.env.SMS_SECRET_KEY}`,
      },
      data: JSON.stringify({
        project_key: `${process.env.SMS_PROJECT_OTP}`,
        phone: `${req.body.phone}`,
      }),
    };
    await axios(config)
      .then((result) => {
        if (result.data.code === "000") {
          return res
            .status(200)
            .send({ status: true, result: result.data.result });
        } else {
          return res.status(400).send({ status: false, ...result.data });
        }
      })
      .catch((err) => {
        console.log(err);
        return res.status(400).send(err);
      });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ message: "มีบางอย่างผิดพลาด" });
  }
};
//ตรวจสอบ OTP
exports.check = async (req, res) => {
  try {
    const vali = (data) => {
      const schema = Joi.object({
        otp_code: Joi.string().required().label("ไม่พบ otp_code"),
        token: Joi.string().required().label("ไม่พบ token"),
      });
      return schema.validate(data);
    };
    const { error } = vali(req.body);
    if (error) {
      return res
        .status(400)
        .send({ status: false, message: error.details[0].message });
    }
    const config = {
      method: "post",
      url: "https://portal-otp.smsmkt.com/api/otp-validate",
      headers: {
        "Content-Type": "application/json",
        api_key: `${process.env.SMS_API_KEY}`,
        secret_key: `${process.env.SMS_SECRET_KEY}`,
      },
      data: JSON.stringify({
        token: `${req.body.token}`,
        otp_code: `${req.body.otp_code}`,
      }),
    };
    await axios(config)
      .then(function (response) {
        console.log(response.data);
        //หมดอายุ
        if (response.data.code === "5000") {
          return res.status(400).send({
            status: false,
            message: "OTP นี้หมดอายุแล้ว กรุณาทำรายการใหม่",
          });
        }

        if (response.data.code === "000") {
          //ตรวจสอบ OTP
          if (response.data.result.status) {
            return res
              .status(200)
              .send({ status: true, message: "ยืนยัน OTP สำเร็จ" });
          } else {
            return res.status(400).send({
              status: false,
              message: "รหัส OTP ไม่ถูกต้องกรุณาตรวจสอบอีกครั้ง",
            });
          }
        } else {
          return res.status(400).send({ status: false, ...response.data });
        }
      })
      .catch(function (error) {
        console.log(error);
        return res.status(400).send({ status: false, ...error });
      });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ message: "มีบางอย่างผิดพลาด" });
  }
};
//ตรวจจสอบรหัสผู้เชิญชวน
exports.CheckInvit = async (req, res) => {
  try {
    const tels = req.params.tel;
    console.log(tels);
    const member = await Member.findOne({ tel: tels });
    if (member) {
      return res.status(200).send({
        status: true,
        message: "ดึงข้อมูลสมาชิกสำเร็จ",
        data: member,
      });
    } else {
      return res
        .status(404)
        .send({ message: "ไม่พบข้อมูลสมาชิกผู้เเนะนำ", status: false });
    }
  } catch (error) {
    res.status(500).send({
      message: "มีบางอย่างผิดพลาด",
      status: false,
    });
  }
};
exports.create = async (req, res) => {
  try {
    const { error } = validateMember(req.body);
    if (error) {
      return res
        .status(400)
        .send({ message: error.details[0].message, status: false });
    }
    const checkTel = await Member.findOne({ tel: req.body.tel });
    if (checkTel) {
      return res
        .status(400)
        .send({ status: false, message: "เบอร์โทรศัพท์เป็นสมาชิกอยู่แล้ว" });
    }
    const card_number = `888${req.body.tel}`;
    const salt = await bcrypt.genSalt(Number(process.env.SALT));
    const hashPassword = await bcrypt.hash(req.body.password, salt);
    if (req.body.ref_tel) {
      const memberRef = await Member.findOne({
        tel: req.body.ref_tel,
      });
      if (memberRef) {
        const upline = {
          lv1: memberRef._id,
          lv2: memberRef.upline.lv1,
          lv3: memberRef.upline.lv2,
        };
        data = {
          ...req.body,
          card_number: card_number,
          password: hashPassword,
          new_address: {
            new_sub_address: req.body.new_address.new_sub_address,
            new_subdistrict: req.body.new_address.new_subdistrict,
            new_district: req.body.new_address.new_district,
            new_province: req.body.new_address.new_province,
            new_postcode: req.body.new_address.new_postcode,
          },
          upline: upline,
        };
      } else {
        return res.status(400).send({
          status: false,
          message: "ไม่พบข้อมูลผู้แนะนำเบอร์โทรที่แนะนำนี้",
        });
      }
    }
    const add = await Member.create(data);
    return res.status(200).send({
      status: true,
      message: "คุณได้สร้างไอดี user เรียบร้อย",
      data: add,
    });
  } catch (error) {
    return res.status(500).send({ status: false, error: error.message });
  }
};
//ลืมรหัสผ่าน ตรวจสอบ sms otp สำหรับเพื่อแก้ไขรหัสผ่าน
exports.checkForgotPassword = async (req, res) => {
  try {
    const vali = (data) => {
      const schema = Joi.object({
        otp_code: Joi.string().required().label("ไม่พบ otp_code"),
        token: Joi.string().required().label("ไม่พบ token"),
        tel: Joi.string().required().label("ไม่พบเบอร์โทร"),
      });
      return schema.validate(data);
    };
    const { error } = vali(req.body);
    if (error) {
      return res
        .status(400)
        .send({ status: false, message: error.details[0].message });
    }
    const config = {
      method: "post",
      url: "https://portal-otp.smsmkt.com/api/otp-validate",
      headers: {
        "Content-Type": "application/json",
        api_key: `${process.env.SMS_API_KEY}`,
        secret_key: `${process.env.SMS_SECRET_KEY}`,
      },
      data: JSON.stringify({
        token: `${req.body.token}`,
        otp_code: `${req.body.otp_code}`,
      }),
    };
    await axios(config)
      .then(async function (response) {
        console.log(response.data);
        //หมดอายุ
        if (response.data.code === "5000") {
          return res.status(400).send({
            status: false,
            message: "OTP นี้หมดอายุแล้ว กรุณาทำรายการใหม่",
          });
        }
        if (response.data.code === "000") {
          //ตรวจสอบ OTP
          if (response.data.result.status) {
            const member = await Member.findOne({ tel: req.body.tel });
            if (member) {
              console.log("ยืนยันสำเร็จ");
              const token = jwt.sign(
                { _id: member._id },
                `${process.env.TOKEN_KEY}`,
                { expiresIn: "10m" }
              );
              return res.status(200).send({
                status: true,
                message: "ยืนยัน OTP สำเร็จ",
                token: token,
              });
            } else {
              console.log("ยืนยันไม่สำเร็จ");
              return res
                .status(200)
                .send({ status: false, message: "ไม่พบเบอร์โทรนี้ในระบบ" });
            }
          } else {
            return res.status(400).send({
              status: false,
              message: "รหัส OTP ไม่ถูกต้องกรุณาตรวจสอบอีกครั้ง",
            });
          }
        } else {
          return res.status(400).send({ status: false, ...response.data });
        }
      })
      .catch(function (error) {
        console.log(error);
        return res.status(400).send({ status: false, ...error });
      });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ message: "มีบางอย่างผิดพลาด" });
  }
};
exports.ChangePassword = async (req, res) => {
  try {
    const vali = (data) => {
      const schema = Joi.object({
        password: Joi.string().required().label("ไม่พบรหัสผ่าน"),
      });
      return schema.validate(data);
    };
    const { error } = vali(req.body);
    if (error) {
      return res
        .status(400)
        .send({ status: false, message: error.details[0].message });
    }
    const decode = token_decode(req.headers["auth-token"]);
    const encrytedPassword = await bcrypt.hash(req.body.password, 10);
    const member = await Member.findByIdAndUpdate(decode._id, {
      password: encrytedPassword,
    });
    if (member) {
      return res
        .status(200)
        .send({ status: true, message: "เปลี่ยนรหัสผ่านสำเร็จ" });
    } else {
      return res
        .status(400)
        .send({ status: false, message: "เปลี่ยนรหัสผ่านไม่สำเร็จ" });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).send({ message: "มีบางอย่างผิดพลาด" });
  }
};
exports.EditMember = async (req, res) => {
  try {
    let upload = multer({ storage: storage }).array("imgCollection", 20);
    upload(req, res, async function (err) {
      const reqFiles = [];
      const result = [];
      if (err) {
        return res.status(500).send(err);
      }
      let profile_image = ""; // ตั้งตัวแปรรูป
      if (req.files) {
        const url = req.protocol + "://" + req.get("host");
        for (var i = 0; i < req.files.length; i++) {
          const src = await uploadFileCreate(req.files, res, { i, reqFiles });
          result.push(src);
        }
        profile_image = reqFiles[0];
      }
      const id = req.params.id;
      if (!req.body.password) {
        const member = await Member.findByIdAndUpdate(id, {
          ...req.body,
          profile_image: profile_image,
        });
        if (member) {
          if (member) {
            return res.status(200).send({
              message: "แก้ไขผู้ใช้งานนี้เรียบร้อยเเล้ว",
              status: true,
            });
          } else {
            return res.status(500).send({
              message: "ไม่สามารถเเก้ไขผู้ใช้งานนี้ได้",
              status: false,
            });
          }
        }
      } else {
        const salt = await bcrypt.genSalt(Number(process.env.SALT));
        const hashPassword = await bcrypt.hash(req.body.cashier_password, salt);
        const member = await Member.findByIdAndUpdate(id, {
          ...req.body,
          password: hashPassword,
        });
        if (member) {
          return res
            .status(200)
            .send({ message: "แก้ไขผู้ใช้งานนี้เรียบร้อยเเล้ว", status: true });
        } else {
          return res
            .status(500)
            .send({ message: "ไม่สามารถเเก้ไขผู้ใช้งานนี้ได้", status: false });
        }
      }
    });
  } catch (error) {
    return res.status(500).send({ status: false, error: error.message });
  }
};
exports.EditMemberNew = async (req, res) => {
  try {
    const id = req.params.id;
    if (id && !req.body.password) {
      const updatedMember = await Member.findByIdAndUpdate(
        id,
        {
          $set: {
            "new_address.new_sub_address": req.body.new_address.new_sub_address,
            "new_address.new_subdistrict": req.body.new_address.new_subdistrict,
            "new_address.new_district": req.body.new_address.new_district,
            "new_address.new_province": req.body.new_address.new_province,
            "new_address.new_postcode": req.body.new_address.new_postcode,
          },
        },
        { new: true }
      );
  
      if (updatedMember) {
        return res.status(200).send({
          message: "แก้ไขข้อมูลสำเร็จ",
          status: true,
          data: updatedMember,
        });
      } else {
        return res.status(500).send({
          message: "ไม่สามารถแก้ไขข้อมูลได้",
          status: false,
        });
      }
    }
  } catch (error) {
    return res.status(500).send({ status: false, error: error.message });
  }
  
};
exports.ImportProfile = async (req, res) => {
  try {
    let upload = multer({ storage: storage }).array("imgCollection", 20);
    upload(req, res, async function (err) {
      const reqFiles = [];
      const result = [];
      if (err) {
        return res.status(500).send(err);
      }
      if (req.files) {
        const url = req.protocol + "://" + req.get("host");
        for (var i = 0; i < req.files.length; i++) {
          const src = await uploadFileCreate(req.files, res, { i, reqFiles });
          result.push(src);
        }
      }
      const id = req.params.id;
      if (id && !req.body.password) {
        const member = await Member.findByIdAndUpdate(id, {
          ...req.body,
          profile_image: reqFiles[0],
        });
        if (member) {
          return res.status(200).send({
            message: "เพิ่มรูปภาพสำเร็จ",
            status: true,
          });
        } else {
          return res.status(500).send({
            message: "ไม่สามารถเพิ่มรูปภาพได้",
            status: false,
          });
        }
      }
    });
  } catch (error) {
    return res.status(500).send({ status: false, error: error.message });
  }
};
exports.ImportBank = async (req, res) => {
  try {
    let upload = multer({ storage: storage }).array("imgCollection", 20);
    upload(req, res, async function (err) {
      const reqFiles = [];
      const result = [];
      if (err) {
        return res.status(500).send(err);
      }
      if (req.files) {
        const url = req.protocol + "://" + req.get("host");
        for (var i = 0; i < req.files.length; i++) {
          const src = await uploadFileCreate(req.files, res, { i, reqFiles });
          result.push(src);
        }
      }
      const id = req.params.id;
      if (id && !req.body.password) {
        const member = await Member.findByIdAndUpdate(id, {
          "bank.name": req.body.name,
          "bank.number": req.body.number,
          "bank.image": reqFiles[0],
        });
        if (member) {
          return res.status(200).send({
            message: "เพิ่มรูปภาพสำเร็จ",
            status: true,
          });
        } else {
          return res.status(500).send({
            message: "ไม่สามารถเพิ่มรูปภาพได้",
            status: false,
          });
        }
      }
    });
  } catch (error) {
    return res.status(500).send({ status: false, error: error.message });
  }
};
exports.ImportIden = async (req, res) => {
  try {
    let upload = multer({ storage: storage }).array("imgCollection", 20);
    upload(req, res, async function (err) {
      const reqFiles = [];
      const result = [];
      if (err) {
        return res.status(500).send(err);
      }
      if (req.files) {
        const url = req.protocol + "://" + req.get("host");
        for (var i = 0; i < req.files.length; i++) {
          const src = await uploadFileCreate(req.files, res, { i, reqFiles });
          result.push(src);
        }
      }
      const id = req.params.id;
      if (id && !req.body.password) {
        const member = await Member.findByIdAndUpdate(id, {
          ...req.body,
          "iden.number": req.body.number,
          "iden.image": reqFiles[0],
        });
        if (member) {
          return res.status(200).send({
            message: "เพิ่มรูปภาพสำเร็จ",
            status: true,
          });
        } else {
          return res.status(500).send({
            message: "ไม่สามารถเพิ่มรูปภาพได้",
            status: false,
          });
        }
      }
    });
  } catch (error) {
    return res.status(500).send({ status: false, error: error.message });
  }
};
exports.deleteMember = async (req, res) => {
  try {
    const id = req.params.id;
    const member = await Member.findByIdAndDelete(id);
    if (!member) {
      return res
        .status(404)
        .send({ status: false, message: "ไม่พบข้อมุลสมาชิก" });
    } else {
      return res
        .status(200)
        .send({ status: true, message: "ลบข้อมูลสมาชิกสำเร็จ" });
    }
  } catch (err) {
    return res
      .status(500)
      .send({ status: false, message: "มีบางอย่างผิดพลาด" });
  }
};
exports.GetAllMember = async (req, res) => {
  try {
    const members = await Member.find();
    if (members.length > 0) {
      return res.status(200).send({
        status: true,
        message: "ดึงข้อมูลสมาชิกสำเร็จ",
        data: members,
      });
    } else {
      return res
        .status(404)
        .send({ message: "ไม่พบข้อมูลสมาชิก", status: false });
    }
  } catch (error) {
    res.status(500).send({
      message: "มีบางอย่างผิดพลาด",
      status: false,
    });
  }
};
exports.GetMemberById = async (req, res) => {
  try {
    const id = req.params.id;
    const member = await Member.findOne({ _id: id });
    if (member) {
      return res.status(200).send({
        status: true,
        message: "ดึงข้อมูลสมาชิกสำเร็จ",
        data: member,
      });
    } else {
      return res
        .status(404)
        .send({ message: "ไม่พบข้อมูลสมาชิก", status: false });
    }
  } catch (error) {
    res.status(500).send({
      message: "มีบางอย่างผิดพลาด",
      status: false,
    });
  }
};
