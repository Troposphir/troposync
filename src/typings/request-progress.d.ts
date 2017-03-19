declare module "request-progress" {
    import {Request} from "request";
    import {Stream} from "stream";

    function requestProgress(req: Request, options?: {
        throttle?: number,
        delay?: number,
        lengthHeader?: string
    }): Stream;

    export = requestProgress;
}