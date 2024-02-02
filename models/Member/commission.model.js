const mongoose = require('mongoose');
const Joi = require('joi');

const commission = new mongoose.Schema({
    data: { type: [{
        lv: {type: String},
        iden: {type: String},
        name: {type: String},
        address: {type: String},
        tel: {type: String},
        commission_amount: {type: Number},
        vat3percent: {type: Number},
        remainding_commission: {type: Number}
    }] },
    platformcommission: { type: Number },
    bonus: { type: Number },
    allSale: { type: Number },
    orderid: { type: String },
    timestamp: { type: Date, default: Date.now }
}, { timestamps: true })

const Commission = new mongoose.model("commission", commission)

module.exports = { Commission }