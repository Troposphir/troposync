import {RequestHandler, Request, Response} from "express";

export type AsyncHandler = (req: Request, res: Response) => Promise<any>;

export function async_handler(handler: AsyncHandler): RequestHandler {
    return (req: Request, res: Response) => {
        let promise: Promise<any>;
        try {
            promise = handler(req, res);
        } catch (e) {
            promise = Promise.reject(e);
        }
        promise.catch(e => {
            console.error(e);
            res.send(500);
        });
    }
}