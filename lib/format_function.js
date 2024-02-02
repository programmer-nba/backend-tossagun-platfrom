const dayjs = require("dayjs");

//funะรนื เกี่ยวกับการจัดการเบอร์ เช่น 1,234,567.89 จัดการเลข เป็นตัวเลขสหรัฐอเมริกา
function numberDigitFormat(num) {
  return num.toLocaleString("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
}

//ไม่เเสดงทศนิยม
function numberFormat(num) {
  return num.toLocaleString("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });
}

//จัดการวันที่  Output: เช่น "01/02/2022 เวลา 14:30:45"
function datetimeFormat(date) {
  return dayjs(date).format("DD/MM/YYYY เวลา HH:mm:ss");
}

//จัดการวันที่  Output: เช่น "01/02/2022 "
function dateFormat(date) {
  return dayjs(date).format("DD/MM/YYYY");
}

module.exports = {
  numberDigitFormat,
  numberFormat,
  dateFormat,
  datetimeFormat,
};
