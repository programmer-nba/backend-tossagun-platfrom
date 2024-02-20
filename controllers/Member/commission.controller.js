const axios = require("axios");
const { Commission } = require("../../models/Member/commission.model");
const shop = require("../../funtions/shop")

exports.getToken = async (req, res) => {
    try {
        const response = await shop.GetToken();
        return res.status(200).send(response);
    } catch (err) {
        return res.status(500).send({ message: "มีบางอย่างผิดพลาด", status: false });
    }
};
exports.getCommissionList = async (req, res) => {
    try {
        const token = await shop.GetToken();
        const tel = req.decoded.tel;
        const response = await shop.GetCommission(tel, token.token);
        if (response.status === true) {
            return res.status(200).send(response.data);
        } else {
            return res.status(201).send(response.data);
        }
    } catch (err) {
        return res.status(500).send({ message: "มีบางอย่างผิดพลาด", status: false });
    }
}