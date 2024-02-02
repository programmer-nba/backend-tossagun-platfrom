const bcrypt = require("bcrypt");
const dayjs = require("dayjs");
const Joi = require("joi");
const { google } = require("googleapis");
const { default: axios } = require("axios");
const req = require("express/lib/request.js");
const multer = require("multer");
const jwt = require("jsonwebtoken");
const { Member, validateMember } = require("../../models/Member/member.model");
const { History } = require("../../models/history/history.model");
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

exports.GetHistory = async (req, res) => {
  try {
    const history = await History.find();
    if (history.length > 0) {
      return res.status(200).send({
        status: true,
        message: "ดึงข้อมูลประวัติการเข้าสู่ระบบสำเร็จ",
        data: history,
      });
    } else {
      return res
        .status(404)
        .send({ message: "ไม่พบข้อมูลประวัติการเข้าสู่ระบบ", status: false });
    }
  } catch (error) {
    res.status(500).send({
      message: "มีบางอย่างผิดพลาด",
      status: false,
    });
  }
};
exports.GetHistoryById = async (req, res) => {
  try {
    const id = req.params.id;
    const history = await History.findById(id);
    if (history) {
      return res.status(200).send({
        status: true,
        message: "ดึงข้อมูลประวัติการเข้าสู่ระบบสำเร็จ",
        data: history,
      });
    } else {
      return res
        .status(404)
        .send({ message: "ไม่พบข้อมูลประวัติการเข้าสู่ระบบ", status: false });
    }
  } catch (error) {
    res.status(500).send({
      message: "มีบางอย่างผิดพลาด",
      status: false,
    });
  }
};
exports.DeletaAll = async (req, res) => {
  try {
    const result = await History.deleteMany({});

    if (result.deletedCount > 0) {
      return res.status(200).send({
        status: true,
        message: "ลบข้อมูลประวัติการเข้าสู่ระบบทั้งหมดสำเร็จ",
      });
    } else {
      return res.status(404).send({
        status: false,
        message: "ไม่พบข้อมูลประวัติการเข้าสู่ระบบที่ต้องการลบ",
      });
    }
  } catch (err) {
    return res
      .status(500)
      .send({ status: false, message: "มีบางอย่างผิดพลาด" });
  }
};
exports.GetHistoryByName = async (req, res) => {
  try {
    const name = req.body.name;
    const history = await History.find({ name: name });
    if (history.length > 0) {
      return res.status(200).json({
        status: true,
        message: "ดึงข้อมูลประวัติการเข้าสู่ระบบสำเร็จ",
        data: history,
      });
    } else {
      return res.status(404).json({
        status: false,
        message: "ไม่พบข้อมูลประวัติการเข้าสู่ระบบ",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: false,
      message: "มีบางอย่างผิดพลาด",
    });
  }
};
