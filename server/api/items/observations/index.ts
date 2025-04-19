import type {ExpressContext} from "../../express-context";
import {z} from "zod";
import express, {type Request, type Response} from "express";
//todo import json directly?
import bodyparser from "body-parser";

const CreateObservationSchema = z.object({
    start: z.date(),
    end: z.string().datetime()
});

export const observationsRouter = (expressContext: ExpressContext) => {
    const {storage} = expressContext;

    const observationsRouter = express.Router({mergeParams: true});
    observationsRouter.post('/', [bodyparser.json(), (req: Request, res: Response) => {
        const parseResult = CreateObservationSchema.safeParse(req.body);
        if (parseResult.error) {
            res.status(400).end();
            return
        }
        res.json()
    }])

    return observationsRouter
}
