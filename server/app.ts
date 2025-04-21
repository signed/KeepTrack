import 'react-router'
import { createRequestHandler } from '@react-router/express'
import express from 'express'
import { FileStorage, type Storage } from '../core/storage'
import type { ExpressContext } from './api/express-context'
import { itemsRouter } from './api/items'

declare module 'react-router' {
  interface AppLoadContext {
    VALUE_FROM_EXPRESS: string
  }
}

const storage: Storage = new FileStorage()

const expressContext: ExpressContext = { storage }

export const app = express()

app.use('/api/items', itemsRouter(expressContext))
app.use(
  createRequestHandler({
    build: () => import('virtual:react-router/server-build'),
    getLoadContext() {
      return {
        VALUE_FROM_EXPRESS: 'Hello from Express',
      }
    },
  }),
)
