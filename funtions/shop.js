const axios = require("axios");

async function GetToken() {
    const config = {
        method: "post",
        headers: {},
        url: `${process.env.TOSSAGUN_SHOP}/platform/genPublicToken`,
    };
    let response;
    await axios(config)
        .then((res) => {
            response = res.data;
        })
        .catch((err) => {
            response = err.response.data;
        });
    return response;
}

async function GetCommission(tel, token) {
    const config = {
        method: "get",
        headers: { 'auth-token': `Bearer ${token}` },
        url: `${process.env.TOSSAGUN_SHOP}/platform/commission/list/${tel}`,
    };
    let response;
    await axios(config)
        .then((res) => {
            response = res.data;
        })
        .catch((err) => {
            response = err.response.data;
        });
    return response;
}

module.exports = { GetToken, GetCommission };