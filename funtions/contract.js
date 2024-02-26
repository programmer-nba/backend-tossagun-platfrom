const axios = require("axios");

async function GetContractPDPA(packageData) {
    const config = {
        method: "post",
        headers: {},
        url: `${process.env.CONTRACT_API}/base-contract/code`,
        data: packageData,
    };
    const response = await axios(config);
    return response.data;
}

module.exports = { GetContractPDPA };
