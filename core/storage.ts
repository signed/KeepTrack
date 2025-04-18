import {type Item} from "./item";
import * as process from "node:process";
import {existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync} from 'node:fs'
import {resolve} from 'node:path'
import * as E from "fp-ts/Either"
import {z} from 'zod'

export type RetrieveItemError = 'failed'

export interface Storage {
    storeItem(item: Item): void;

    retrieveItem(id: string): E.Either<RetrieveItemError, Item>

    items(): Item[]
}

const ItemStorageFormat = z.object({id: z.string(), name: z.string(), description: z.string()})

export class FileStorage implements Storage {
    private readonly dataRoot: string;

    constructor(dataRoot = resolve(process.cwd(), '.data')) {
        this.dataRoot = dataRoot;
    }

    storeItem(item: Item): void {
        const itemId = item.id;
        const itemDirectoryPath = this.itemDirectoryPathFor(itemId)
        if (!existsSync(itemDirectoryPath)) {
            mkdirSync(itemDirectoryPath, {recursive: true})
        }
        const itemPath = this.itemPathFor(item.id)
        writeFileSync(itemPath, JSON.stringify(item, null, 2))
    }

    retrieveItem(itemId: string): E.Either<RetrieveItemError, Item> {
        const itemPath = this.itemPathFor(itemId);
        if (!existsSync(itemPath)) {
            return E.left('failed')
        }

        const safeParse = ItemStorageFormat.safeParse(JSON.parse(readFileSync(itemPath, 'utf8')));
        if (safeParse.error) {
            return E.left('failed')
        }
        return E.right(safeParse.data)
    }

    items(): Item[] {
        return readdirSync(this.dataRoot, {withFileTypes: true})
            .filter(it => it.isDirectory())
            .map(it => it.name)
            .map(it => this.retrieveItem(it))
            .filter(it => E.isRight(it)).map(it => it.right);
    }

    private itemPathFor(itemId: string) {
        const itemDirectoryPath = this.itemDirectoryPathFor(itemId)
        return resolve(itemDirectoryPath, 'item.json');
    }

    private itemDirectoryPathFor(itemId: string) {
        return resolve(this.dataRoot, itemId);
    }
}
