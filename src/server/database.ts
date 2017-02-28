import * as mysql from "promise-mysql";
import {MysqlConnection} from "promise-mysql";


export async function connect(): Promise<MysqlConnection> {
    return await mysql.createConnection({
        host: "localhost",
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: "troposync"
    });
}