const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const passwordComplexity = require("joi-password-complexity");
const complexityOptions = {
  min: 6,
  max: 30,
  lowerCase: 0,
  upperCase: 0,
  numeric: 0,
  symbol: 0,
  requirementCount: 2,
};

const MemberSchema = new mongoose.Schema({
  card_number: { type: String, required: false }, //บัตรประชาชน
  name: { type: String, required: false }, //ชื่อ
  tel: { type: String, required: false }, //เบอร์โทร
  password: { type: String, required: false }, //รหัสผ่าน
  address: { type: String, required: false }, //ที่อยู่
  subdistrict: { type: String, required: false }, //ที่อยู่ เเขวน ตำบล
  district: { type: String, required: false }, //เขต
  province: { type: String, required: false }, //จังหวัด
  postcode: { type: String, required: false }, //รหัสไปรษณีย์
  partner_group: { type: String }, //พันธมิตร กลุ่ม
  partner_shop_name: { type: String }, //พันธมิตร ชื่อร้าน
  partner_shop_address: { type: String }, //พันธมิตร ที่อยู่
  wallet: { type: Number, required: false, default: 0 }, //ยอดเงินในประเป๋าอิเล็กทรอนิกส์
  money: { type: Number, required: false, default: 0 }, //ยอดรายได้สะสม
  passcode: { type: Number, required: false, default: "" },
  Member_pin: { type: String },
  profile_image: { type: String, required: false, default: "" },
  addsale: { type: String, required: false }, //ยอดสะสมการขาย
  happy_point: { type: Number, required: false, default: 0 },
  bank: {
    name: { type: String, required: false, default: "-" },
    number: { type: String, required: false, default: "-" },
    image: { type: String, required: false, default: "-" },
    status: { type: Boolean, required: false, default: false },
    remark: { type: String, required: false, default: "-" }, //อยู่ระหว่างการตรวจสอบ , ไม่ผ่านการตรวจสอบ ,ตรวจสอบสำเร็จ
  },
  iden: {
    number: { type: String, required: false, default: "-" },
    image: { type: String, required: false, default: "-" },
    status: { type: Boolean, required: false, default: false },
    remark: { type: String, required: false, default: "-" }, //อยู่ระหว่างการตรวจสอบ , ไม่ผ่านการตรวจสอบ ,ตรวจสอบสำเร็จ
  },
  upline: {
    lv1: { type: String, required: false, default: "-" },
    lv2: { type: String, required: false, default: "-" },
    lv3: { type: String, required: false, default: "-" },
  },
  lastLogin: { type: String, required: false }, //เวลาล็อคินล่าสุด
  timmestamp: { type: Date, required: false, default: Date.now() },
  ipAdress: { type: String, required: false }, //id ของเครื่องที่ login
  status: { type: Boolean, required: false, default: true },
});
MemberSchema.methods.generateAuthToken = function () {
  const token = jwt.sign(
    { _id: this._id, name: this.name, row: "member" },
    process.env.JWTPRIVATEKEY,
    {
      expiresIn: "4h",
    }
  );
  return token;
};

const Member = mongoose.model("Member", MemberSchema);

const validateMember = (data) => {
  const schema = Joi.object({
    card_number: Joi.string().required().label("กรุณากรอกเลขบัตรประชาชน"),
    name: Joi.string().required().label("กรุณากรอกชื่อ"),
    tel: Joi.string().required().label("กรุณากรอกเบอร์โทร"),
    password: passwordComplexity(complexityOptions)
      .required()
      .label("ไม่มีข้อมูลรหัสผ่าน"),
    address: Joi.string().required().label("กรุณากรอกที่อยู่"),
    subdistrict: Joi.string().required().label("กรุณากรอก ที่อยู่ เเขวน ตำบล"),
    district: Joi.string().required().label("กรุณากรอก เขต"),
    province: Joi.string().required().label("กรุณากรอก จังหวัด"),
    postcode: Joi.string().required().label("กรุณากรอก รหัสไปรษณีย์"),
  });
  return schema.validate(data);
};

module.exports = { Member, validateMember };
