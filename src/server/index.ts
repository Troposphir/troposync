import * as express from "express";
import * as morgan from "morgan";
import {UpdatesRouter} from "./updates";
import {NewsRouter} from "./news";

const app = express();

app.use(morgan("short"));

app.use("/update", UpdatesRouter);
app.use("/news", NewsRouter);

app.listen(
    process.env.PORT || 9090,
    process.env.IP || "localhost",
    () => {
        console.log("Update server running");
    }
);