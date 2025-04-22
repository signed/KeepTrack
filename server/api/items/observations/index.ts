import type { ExpressContext } from '../../express-context'
import { z } from 'zod'
import express, { type Request, type Response } from 'express'
import bodyparser from 'body-parser'
import { createId, isCuid } from '@paralleldrive/cuid2'
import { parseInstantFrom } from './temporal'
import * as E from 'fp-ts/lib/Either'
import type { Observation } from '../../../../core/observation'

const CreateObservationSchema = z.object({
  start: z.string().datetime(),
  end: z.string().datetime(),
})

export const observationsRouter = (expressContext: ExpressContext) => {
  const { storage } = expressContext
  const observationsRouter = express.Router({ mergeParams: true })

  observationsRouter.post('/', [
    bodyparser.json(),
    (req: Request<{ itemId: string }>, res: Response) => {
      const itemId = req.params.itemId
      const parseResult = CreateObservationSchema.safeParse(req.body)
      if (parseResult.error) {
        res.status(400).end()
        return
      }

      const body = parseResult.data
      const startE = parseInstantFrom(body.start)
      const endE = parseInstantFrom(body.end)

      if (E.isLeft(startE) || E.isLeft(endE)) {
        res.status(400).end()
        return
      }
      const id = createId()
      const start = startE.right
      const end = endE.right
      const observation: Observation = { id, start, end }
      storage.storeObservation(itemId, observation)
      res.json(observation)
    },
  ])

  observationsRouter.get('/', (req: Request<{ itemId: string }>, res: Response) => {
    const itemId = req.params.itemId
    res.json(storage.observations(itemId))
  })

  return observationsRouter
}
