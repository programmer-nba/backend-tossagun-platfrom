const contract = require("../../funtions/contract")

module.exports.getContractPDPA = async (req, res) => {
  try {
    const data = {
      code: "PDPA"
    };
    const response = await contract.GetContractPDPA(data);
    if (response.status === true) {
      return res.status(200).send(response.data);
    } else {
      return res.status(201).send(response.data);
    }
  } catch (error) {
    console.error(error);
    return res.status(403).send({ code: error.code, data: error.message });
  };
}