import {Router, Request, Response} from "express";
import * as database from "./database";
import {async_handler} from "./utils";

export const NewsRouter: Router = Router();

NewsRouter.get("/latest", async_handler(async (req: Request, res: Response) => {
    let db = await database.connect();
    let limit = parseInt(req.query.limit);
    if (isNaN(limit) || limit < 0 || limit > 20) {
        return;
    }
    res.send(await db.query("select * from news order by created asc limit ?", [limit]));
}));
