import * as express from "express";
import {UpdatesRouter} from "./updates";

const app = express();

app.use("/update", UpdatesRouter);

app.listen(process.env.PORT || 9090, () => {
    console.log("Update server running");
});