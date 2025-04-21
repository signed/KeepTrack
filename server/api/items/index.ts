import type { ExpressContext } from '../express-context'
import { z } from 'zod'
import express, { type Request, type Response } from 'express'
import bodyparser from 'body-parser'
import { createItem } from '../../../core/create-item'
import { isCuid } from '@paralleldrive/cuid2'
import { retrieveItem } from '../../../core/retrieve-item'
import * as E from 'fp-ts/Either'
import { observationsRouter } from './observations'

const CreateItemSchema = z.object({
  name: z.string(),
  description: z.string(),
})

export const itemsRouter = (expressContext: ExpressContext) => {
  const { storage } = expressContext
  const itemsRouter = express.Router()

  itemsRouter.post('/', [
    bodyparser.json(),
    (req: Request, res: Response) => {
      const parseResult = CreateItemSchema.safeParse(req.body)
      if (parseResult.error) {
        res.status(400).end()
        return
      }
      const item = createItem(storage, parseResult.data)
      res.json(item)
    },
  ])
  itemsRouter.get('/', (_req, res) => {
    res.json(storage.items())
  })

  itemsRouter.get('/:itemId', [
    bodyparser.json(),
    (req: Request<{ itemId: string }>, res: Response) => {
      const id = req.params.itemId
      if (!isCuid(id)) {
        res.status(400).end()
        return
      }

      const item = retrieveItem(storage, id)
      if (E.isLeft(item)) {
        res.status(500).end()
        return
      }
      res.json(item.right)
    },
  ])
  itemsRouter.use(
    '/:itemId/observations',
    function (req: Request<{ itemId: string }>, res, next) {
      const itemId = req.params.itemId
      if (!isCuid(itemId)) {
        res.status(400).end()
        return
      }
      if (!storage.itemExists(itemId)) {
        res.status(404).end()
        return
      }
      next()
    },
    observationsRouter(expressContext),
  )

  return itemsRouter
}
