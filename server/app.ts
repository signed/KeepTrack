import "react-router";
import {createRequestHandler} from "@react-router/express";
import express, {type Request} from "express";
import {z} from 'zod'
import {createId, isCuid} from '@paralleldrive/cuid2'
import bodyparser from 'body-parser'
import {createItem} from "../core/create-item";
import {FileStorage, type Storage} from "../core/storage";
import {retrieveItem} from "../core/retrieve-item";
import * as E from 'fp-ts/Either'

declare module "react-router" {
    interface AppLoadContext {
        VALUE_FROM_EXPRESS: string;
    }
}

const CreateItemSchema = z.object({
    name: z.string(),
    description: z.string()
});
const CreateObservationSchema = z.object({
    start: z.date(),
    end: z.string().datetime()
});

const storage: Storage = new FileStorage()

const itemsRouter = express.Router();

itemsRouter.post('/items', bodyparser.json(), (req, res) => {
    const parseResult = CreateItemSchema.safeParse(req.body);
    if (parseResult.error) {
        res.status(400).end();
        return
    }
    const item = createItem(storage, parseResult.data)
    res.json(item)
})

itemsRouter.get('/items', bodyparser.json(), (req, res) => {
    res.json(storage.items())
})

itemsRouter.get('/items/:itemId', bodyparser.json(), (req: Request<{ itemId: string }>, res) => {
    const id = req.params.itemId;
    if (!isCuid(id)) {
        res.status(400).end()
        return
    }

    const item = retrieveItem(storage, id);
    if (E.isLeft(item)) {
        res.status(500).end();
        return
    }
    res.json(item.right)
})


itemsRouter.get('/', (req, res) => {
    res.send('Home Page');
});

export const app = express();


app.use("/api", itemsRouter)
app.use(
    createRequestHandler({
        build: () => import("virtual:react-router/server-build"),
        getLoadContext() {
            return {
                VALUE_FROM_EXPRESS: "Hello from Express",
            };
        },
    })
);
