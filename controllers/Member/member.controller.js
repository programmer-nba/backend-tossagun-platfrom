const bcrypt = require("bcrypt");
const dayjs = require("dayjs");
require("dotenv").config();
const Joi = require("joi");
const {google} = require("googleapis");
const {default: axios} = require("axios");
const req = require("express/lib/request.js");
const token_decode = require("../../lib/token_decode");
const multer = require("multer");
const jwt = require("jsonwebtoken");
const {Member, validateMember} = require("../../models/Member/member.model");
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
const {dfareporting} = require("googleapis/build/src/apis/dfareporting");

//ส่ง OTP
exports.verify = async (req, res) => {
  try {
    const vali = (data) => {
      const schema = Joi.object({
        phone: Joi.string().required().label("ไม่พบเบอร์โทร"),
      });
      return schema.validate(data);
    };
    const {error} = vali(req.body);
    if (error) {
      return res
        .status(400)
        .send({status: false, message: error.details[0].message});
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
            .send({status: true, result: result.data.result});
        } else {
          return res.status(400).send({status: false, ...result.data});
        }
      })
      .catch((err) => {
        console.log(err);
        return res.status(400).send(err);
      });
  } catch (err) {
    console.log(err);
    return res.status(500).send({message: "มีบางอย่างผิดพลาด"});
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
    const {error} = vali(req.body);
    if (error) {
      return res
        .status(400)
        .send({status: false, message: error.details[0].message});
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
              .send({status: true, message: "ยืนยัน OTP สำเร็จ"});
          } else {
            return res.status(400).send({
              status: false,
              message: "รหัส OTP ไม่ถูกต้องกรุณาตรวจสอบอีกครั้ง",
            });
          }
        } else {
          return res.status(400).send({status: false, ...response.data});
        }
      })
      .catch(function (error) {
        console.log(error);
        return res.status(400).send({status: false, ...error});
      });
  } catch (err) {
    console.log(err);
    return res.status(500).send({message: "มีบางอย่างผิดพลาด"});
  }
};
//ตรวจจสอบรหัสผู้เชิญชวน
exports.CheckInvit = async (req, res) => {
  try {
    const tels = req.params.tel;
    console.log(tels);
    const member = await Member.findOne({tel: tels});
    if (member) {
      return res.status(200).send({
        status: true,
        message: "ดึงข้อมูลสมาชิกสำเร็จ",
        data: member,
      });
    } else {
      return res
        .status(404)
        .send({message: "ไม่พบข้อมูลสมาชิกผู้เเนะนำ", status: false});
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
    const {error} = validateMember(req.body);
    if (error) {
      return res
        .status(400)
        .send({message: error.details[0].message, status: false});
    }
    const checkTel = await Member.findOne({tel: req.body.tel});
    if (checkTel) {
      return res
        .status(400)
        .send({status: false, message: "เบอร์โทรศัพท์เป็นสมาชิกอยู่แล้ว"});
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
    return res.status(500).send({status: false, error: error.message});
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
    const {error} = vali(req.body);
    if (error) {
      return res
        .status(400)
        .send({status: false, message: error.details[0].message});
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
            const member = await Member.findOne({tel: req.body.tel});
            if (member) {
              console.log("ยืนยันสำเร็จ");
              const token = jwt.sign(
                {_id: member._id},
                `${process.env.TOKEN_KEY}`,
                {expiresIn: "10m"}
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
                .send({status: false, message: "ไม่พบเบอร์โทรนี้ในระบบ"});
            }
          } else {
            return res.status(400).send({
              status: false,
              message: "รหัส OTP ไม่ถูกต้องกรุณาตรวจสอบอีกครั้ง",
            });
          }
        } else {
          return res.status(400).send({status: false, ...response.data});
        }
      })
      .catch(function (error) {
        console.log(error);
        return res.status(400).send({status: false, ...error});
      });
  } catch (err) {
    console.log(err);
    return res.status(500).send({message: "มีบางอย่างผิดพลาด"});
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
    const {error} = vali(req.body);
    if (error) {
      return res
        .status(400)
        .send({status: false, message: error.details[0].message});
    }
    const decode = token_decode(req.headers["auth-token"]);
    const encrytedPassword = await bcrypt.hash(req.body.password, 10);
    const member = await Member.findByIdAndUpdate(decode._id, {
      password: encrytedPassword,
    });
    if (member) {
      return res
        .status(200)
        .send({status: true, message: "เปลี่ยนรหัสผ่านสำเร็จ"});
    } else {
      return res
        .status(400)
        .send({status: false, message: "เปลี่ยนรหัสผ่านไม่สำเร็จ"});
    }
  } catch (err) {
    console.log(err);
    return res.status(500).send({message: "มีบางอย่างผิดพลาด"});
  }
};
exports.EditMember = async (req, res) => {
  try {
    let upload = multer({storage: storage}).array("imgCollection", 20);
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
          const src = await uploadFileCreate(req.files, res, {i, reqFiles});
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
            .send({message: "แก้ไขผู้ใช้งานนี้เรียบร้อยเเล้ว", status: true});
        } else {
          return res
            .status(500)
            .send({message: "ไม่สามารถเเก้ไขผู้ใช้งานนี้ได้", status: false});
        }
      }
    });
  } catch (error) {
    return res.status(500).send({status: false, error: error.message});
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
        {new: true}
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
    return res.status(500).send({status: false, error: error.message});
  }
};
exports.ImportProfile = async (req, res) => {
  try {
    let upload = multer({storage: storage}).array("imgCollection", 20);
    upload(req, res, async function (err) {
      const reqFiles = [];
      const result = [];
      if (err) {
        return res.status(500).send(err);
      }
      if (req.files) {
        const url = req.protocol + "://" + req.get("host");
        for (var i = 0; i < req.files.length; i++) {
          const src = await uploadFileCreate(req.files, res, {i, reqFiles});
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
    return res.status(500).send({status: false, error: error.message});
  }
};
exports.ImportBank = async (req, res) => {
  try {
    let upload = multer({storage: storage}).array("imgCollection", 20);
    upload(req, res, async function (err) {
      const reqFiles = [];
      const result = [];
      if (err) {
        return res.status(500).send(err);
      }
      if (req.files) {
        const url = req.protocol + "://" + req.get("host");
        for (var i = 0; i < req.files.length; i++) {
          const src = await uploadFileCreate(req.files, res, {i, reqFiles});
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
    return res.status(500).send({status: false, error: error.message});
  }
};
exports.ImportIden = async (req, res) => {
  try {
    let upload = multer({storage: storage}).array("imgCollection", 20);
    upload(req, res, async function (err) {
      const reqFiles = [];
      const result = [];
      if (err) {
        return res.status(500).send(err);
      }
      if (req.files) {
        const url = req.protocol + "://" + req.get("host");
        for (var i = 0; i < req.files.length; i++) {
          const src = await uploadFileCreate(req.files, res, {i, reqFiles});
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
    return res.status(500).send({status: false, error: error.message});
  }
};
exports.deleteMember = async (req, res) => {
  try {
    const id = req.params.id;
    const member = await Member.findByIdAndDelete(id);
    if (!member) {
      return res
        .status(404)
        .send({status: false, message: "ไม่พบข้อมุลสมาชิก"});
    } else {
      return res
        .status(200)
        .send({status: true, message: "ลบข้อมูลสมาชิกสำเร็จ"});
    }
  } catch (err) {
    return res.status(500).send({status: false, message: "มีบางอย่างผิดพลาด"});
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
        .send({message: "ไม่พบข้อมูลสมาชิก", status: false});
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
    const member = await Member.findOne({_id: id});
    if (member) {
      return res.status(200).send({
        status: true,
        message: "ดึงข้อมูลสมาชิกสำเร็จ",
        data: member,
      });
    } else {
      return res
        .status(404)
        .send({message: "ไม่พบข้อมูลสมาชิก", status: false});
    }
  } catch (error) {
    res.status(500).send({
      message: "มีบางอย่างผิดพลาด",
      status: false,
    });
  }
};

//สร้างtoken
exports.genPublicToken = async (req, res) => {
  try {
    const token = jwt.sign(
      {code: "Shop", name: "shop", key: "shop_tossagun"},
      process.env.TOKEN_KEY
    );
    if (token) {
      return res.status(200).send({status: true, token: token});
    } else {
      return res
        .status(400)
        .send({status: false, message: "สร้าง Token ไม่สำเร็จ"});
    }
  } catch (err) {
    console.log(err);
    return res.status(500).send({message: err.message});
  }
};

exports.GetTeamMember = async (req, res) => {
  try {
    const member = await Member.findOne({tel: req.params.tel});
    if (!member) {
      return res
        .status(403)
        .send({message: "เบอร์โทรนี้ยังไม่ได้เป็นสมาชิกของ Tossagun Platfrom"});
    } else {
      const upline = [member.upline.lv1, member.upline.lv2, member.upline.lv3];
      console.log("upline", upline);
      const validUplines = upline.filter((item) => item !== "-");
      const uplineData = [];
      let i = 0;
      for (const item of validUplines) {
        const include = await Member.findOne({_id: item});
        console.log("include", include);
        if (include !== null) {
          uplineData.push({
            iden: include.iden.number,
            name: include.name,
            address: {
              address: include.address,
              subdistrict: include.subdistrict,
              district: include.district,
              province: include.province,
              postcode: include.postcode,
            },
            tel: include.tel,
            level: i + 1,
          });
          i++;
        }
      }

      const owner = {
        iden: member.iden.number,
        name: member.name,
        address: {
          address: member.address,
          subdistrict: member.subdistrict,
          district: member.district,
          province: member.province,
          postcode: member.postcode,
        },
        tel: member.tel,
        level: "owner",
      };

      return res.status(200).send({
        message: "ดึงข้อมูลสำเร็จ",
        data: [
          owner || null,
          uplineData[0] || null,
          uplineData[1] || null,
          uplineData[2] || null,
        ],
      });
    }
  } catch (err) {
    return res.status(500).send({status: false, message: "มีบางอย่างผิดพลาด"});
  }
};

//เเก้ไขมรดกตกทอด
exports.EditHeritage = async (req, res) => {
  try {
    const id = req.params.id;
    if (id && !req.body.password) {
      const updatedMember = await Member.findByIdAndUpdate(
        id,
        {
          $set: {
            "heritage.lv1.name": req.body.heritage.lv1.name || "-",
            "heritage.lv1.percent": req.body.heritage.lv1.percent || 0,
            "heritage.lv2.name": req.body.heritage.lv2.name || "-",
            "heritage.lv2.percent": req.body.heritage.lv2.percent || 0,
            "heritage.lv3.name": req.body.heritage.lv3.name || "-",
            "heritage.lv3.percent": req.body.heritage.lv3.percent || 0,
          },
        },
        {new: true}
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
    return res.status(500).send({status: false, error: error.message});
  }
};
exports.DeleteHeriyage = async (req, res) => {
  try {
    const id = req.params.id;
    if (id && !req.body.password) {
      const updateFields = {};
      if (req.body.heritage) {
        Object.keys(req.body.heritage).forEach((level) => {
          const levelFields = req.body.heritage[level];
          if (levelFields) {
            Object.keys(levelFields).forEach((key) => {
              updateFields[`heritage.${level}.${key}`] =
                key === "name" ? " " : key === "percent" ? 0 : levelFields[key];
            });
          }
        });
      }
      const updatedMember = await Member.findByIdAndUpdate(
        id,
        {
          $set: updateFields,
        },
        {new: true}
      );

      if (updatedMember) {
        return res.status(200).send({
          message: "อัปเดตข้อมูลสำเร็จ",
          status: true,
          data: updatedMember,
        });
      } else {
        return res.status(500).send({
          message: "ไม่สามารถอัปเดตข้อมูลได้",
          status: false,
        });
      }
    }
  } catch (error) {
    return res.status(500).send({status: false, error: error.message});
  }
};
