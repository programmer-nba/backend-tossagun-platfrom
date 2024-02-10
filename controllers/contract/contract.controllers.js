const bcrypt = require("bcrypt");
const dayjs = require("dayjs");
const Joi = require("joi");
const { google } = require("googleapis");
const axios = require('axios');
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


module.exports.GetAllContract = async (req, res) => {
    try {
        const id = req.params.id
        const request = {
            method: 'get',
            url: `${process.env.CONTRACT_API}/HaveplaceNocapital/GetContractByIDNew/${id}`,
        }
        await axios(request).then(async (response) => {
            console.log(response.data)
            return res.status(200).send(response.data)
        })
    } catch (error) {
        console.error(error);
        return res.status(403).send({ code: error.code, data: error.message });
    };
}