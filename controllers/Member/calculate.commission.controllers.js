const { Member } = require("../../models/Member/member.model");
const Joi = require("joi");
const vatTreePercen = require("../../lib/vatTreePerCent");
const { MoneyHistory } = require("../../models/Member/money.history.models");
const { MoneySavings } = require("../../models/Member/money.models");
const { NotifyMember } = require("../../models/Member/notify.member.models");
const dayjs = require("dayjs");
const { numberDigitFormat } = require("../../lib/format_function");

const validate_commission = (data) => {
  const schema = Joi.object({
    invoice: Joi.string().required().label("ไม่พบเลขที่ใบเสร็จ"),
    tel: Joi.string().required().label("ไม่พบเบอร์ผู้ของผู้ใช้ platform"),
    platform: {
      owner: Joi.number().required().label("ไม่พบไม่ได้ของบัญชีที่รับเอง"),
      lv1: Joi.number().required().label("ไม่พบรายได้ชั้นที่ 1"),
      lv2: Joi.number().required().label("ไม่พบรายได้ชั้นที่ 2"),
      lv3: Joi.number().required().label("ไม่พบรายได้ชั้นที่ 3"),
    },
    // allsale: Joi.number().required().label("ไม่พบรายได้ allsale"),
    central: {
      central: Joi.number().required().label("ไม่พบยอดกองทุน"),
      allsale: Joi.number().required().label("ไม่พบยอด all sale"),
    },
    emp_bonus: Joi.number().required().label("ไม่พบยอดโบนัสพนักงาน"),
  });
  return schema.validate(data);
};
exports.giveCommission = async (req, res) => {
  try {
    const { error } = validate_commission(req.body);
    if (error) {
      return res
        .status(400)
        .send({ status: false, message: error.details[0].message });
    }
    // check เบอร์โทร
    const tel = req.body.tel;
    const member = await Member.findOne({ tel: tel });
    if (!member) {
      return res.status(400).json({
        status: false,
        message: "เบอร์โทรนี้ยังไม่ได้เป็นสมาชิกของ Tossagun Platfrom",
      });
    }
    //OWNER
    const vat_owner = vatTreePercen(req.body.platform.owner);
    const new_money_owner = member.money + vat_owner.amount;
    const new_allsale = member.allsale + req.body.central.allsale;

    await Member.findByIdAndUpdate(member._id, {
            money: new_money_owner,
            allsale: new_allsale,
    });
    //history
    const owner_history = {
            from: member.name,
            mem_id: member._id,
            invoice: req.body.invoice,
            type: "เข้า",
            amount: req.body.platform.owner,
            vat: vat_owner.vat,
            total: vat_owner.amount,
            detail: `คอมมิชชั่นจากใบเสร็จเลขที่ ${req.body.invoice} (หักภาษี ณ ที่จ่ายเรียบร้อยแล้ว)`,
            timestamp: dayjs(Date.now()).format(),
    };
    await MoneyHistory.create(owner_history);
    //LV1
    if (member.upline.lv1 !== "-") {
            const mem_lv1 = await Member.findById(member.upline.lv1);
            const vat_lv1 = vatTreePercen(req.body.platform.lv1);
            const new_money_lv1 = mem_lv1.money + vat_lv1.amount;
            const new_allsale_lv1 = mem_lv1.allsale + req.body.central.allsale;
      await Member.findByIdAndUpdate(mem_lv1._id, {
            money: new_money_lv1,
            allsale: new_allsale_lv1,
      });
      //history
      const lv1_history = {
            from: member.name,
            mem_id: mem_lv1._id,
            invoice: req.body.invoice,
            type: "เข้า",
            amount: req.body.platform.lv1,
            detail: `ส่วนแบ่งค่าคอมมิชชั่นจากผู้ใช้ที่เราแนะนำ ใบเสร็จเลขที่ ${req.body.invoice} (หักภาษี ณ ที่จ่ายเรียบร้อยแล้ว)`,
            vat: vat_lv1.vat,
            total: vat_lv1.amount,
            timestamp: dayjs(Date.now()).format(),
      };
      await MoneyHistory.create(lv1_history);
    }
    //LV2
    if (member.upline.lv2 !== "-") {
            const mem_lv2 = await Member.findById(member.upline.lv2);
            const vat_lv2 = vatTreePercen(req.body.platform.lv2);
            const new_money_lv2 = mem_lv2.money + vat_lv2.amount;
            const new_allsale_lv2 = mem_lv2.allsale + req.body.central.allsale;
      await Member.findByIdAndUpdate(mem_lv2._id, {
            money: new_money_lv2,
            allsale: new_allsale_lv2,
      });
      //history
      const lv2_history = {
            from: member.name,
            mem_id: mem_lv2._id,
            invoice: req.body.invoice,
            type: "เข้า",
            amount: req.body.platform.lv2,
            detail: `ส่วนแบ่งค่าคอมมิชชั่นจากผู้ใช้ที่เราแนะนำ ใบเสร็จเลขที่ ${req.body.invoice} (หักภาษี ณ ที่จ่ายเรียบร้อยแล้ว)`,
            vat: vat_lv2.vat,
            total: vat_lv2.amount,
            timestamp: dayjs(Date.now()).format(),
      };
      await MoneyHistory.create(lv2_history);
    }
    //LV3
    if (member.upline.lv3 !== "-") {
            const mem_lv3 = await Member.findById(member.upline.lv3);
            const vat_lv3 = vatTreePercen(req.body.platform.lv3);
            const new_money_lv3 = mem_lv3.money + vat_lv3.amount;
            const new_allsale_lv3 = mem_lv3.allsale + req.body.central.allsale;
      await Member.findByIdAndUpdate(mem_lv3._id, {
            money: new_money_lv3,
            allsale: new_allsale_lv3,
      });
      //history
      const lv3_history = {
            from: member.name,
            mem_id: mem_lv3._id,
            invoice: req.body.invoice,
            type: "เข้า",
            amount: req.body.platform.lv3,
            detail: `ส่วนแบ่งค่าคอมมิชชั่นจากผู้ใช้ที่เราแนะนำ ใบเสร็จเลขที่ ${req.body.invoice} (หักภาษี ณ ที่จ่ายเรียบร้อยแล้ว)`,
            vat: vat_lv3.vat,
            total: vat_lv3.amount,
            timestamp: dayjs(Date.now()).format(),
      };
      await MoneyHistory.create(lv3_history);
    }
    //บันทึกข้อมูลลง money saving เพื่อสะสม
    const saving = {
            allsale: req.body.central.allsale,
            central: req.body.central.central,
            emp_bonus: req.body.emp_bonus,
            timestamp: dayjs(Date.now()).format(),
    };
    await MoneySavings.create(saving);
    return res.status(200).send({
      status: true,
      message: "ทำรายการสำเร็จ",
    });
  } catch (err) {
    console.log(err.message);
    return res.status(500).send({ message: "มีบางอย่างผิดพลาด" });
  }
};

exports.GetBYtel = async(req,res) =>{
    try {
        const tel = req.params.tel;
        const member = await Member.findOne({tel: tel});
        if (member) {
          const res_data = {
            name: member.name,
            tel: member.tel,
            address: member.address,
            subdistrict: member.subdistrict,
            district: member.district,
            province: member.province,
            postcode: member.postcode,
            commission: member.commission,
            happy_point: member.happy_point,
            allsale: member.allsale,
            wallet:member.wallet,
            money:member.money
          };
          return res.status(200).send({status: true, data: res_data});
        } else {
          return res
            .status(400)
            .send({status: false, message: "ไม่มีสมาชิกเบอร์นี้ในระบบ"});
        }
      } catch (err) {
        console.log(err);
        return res.status(500).send({message: "มีบางอย่างผิดพลาด"});
      }
}