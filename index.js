require("dotenv").config();
const express = require("express");
const app = express();
app.set('trust proxy', false);
const bodyParser = require("body-parser");
const cors = require("cors");
const connection = require("./config/db");
connection();

app.use(express.json());
app.use(cors());

const prefix = "/tossagun-platform";

app.use(prefix + "/", require("./router"));
app.use(prefix + "/Member", require("./router/Member/index"));
app.use(prefix + "/Shop", require("./router/shop/index"));
app.use(prefix + "/commission", require("./router/Member/commission"));

app.use(prefix + "/contract", require("./router/contract/index"));

app.use(prefix + "/history", require("./router/history/index"));
const port = process.env.PORT || 9997;
app.listen(port, console.log(`Listening on port ${port}`));
