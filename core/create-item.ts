import * as E from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'
import { type Item } from './item'
import { createId } from '@paralleldrive/cuid2'
import type { Storage } from './storage'

export const createItem = (storage: Storage, input: Omit<Item, 'id'>) => {
  const id = createId()
  const item = { id, ...input }
  storage.storeItem(item)
  return item
}

const head = <A>(as: ReadonlyArray<A>) => {
  if (as.length === 0) {
    return E.left('empty array')
  }
  return E.right(as[0])
}

const double = (n: number): number => n * 2

const inverse = (n: number) => {
  if (n === 0) {
    return E.left('cannot divide by zero')
  }
  return E.right(1 / n)
}

export const functional = (numbers: ReadonlyArray<number>): string => {
  return pipe(
    numbers,
    head,
    E.map(double),
    E.flatMap(inverse),
    E.match(
      (err) => `Error is ${err}`, // onLeft handler
      (head) => `Result is ${head}`, // onRight handler
    ),
  )
}
