import { type Item } from './item'
import * as process from 'node:process'
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import * as E from 'fp-ts/lib/Either'
import { z } from 'zod'
import type { Observation } from './observation'
import { Temporal } from '@js-temporal/polyfill'

export type RetrieveItemError = 'failed'

export interface Storage {
  storeItem(item: Item): void

  retrieveItem(id: string): E.Either<RetrieveItemError, Item>

  itemExists(itemId: string): boolean

  items(): Item[]

  storeObservation(itemId: string, observation: Observation): void

  observations(itemId: string): Observation[]
}

const ItemStorageFormat = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
})
const ObservationStorageFormat = z.object({
  id: z.string(),
  start: z.string().datetime(),
  end: z.string().datetime(),
})

export class FileStorage implements Storage {
  private readonly dataRoot: string

  constructor(dataRoot = resolve(process.cwd(), '.data')) {
    this.dataRoot = dataRoot
  }

  storeItem(item: Item): void {
    const itemId = item.id
    const itemDirectoryPath = this.itemDirectoryPathFor(itemId)
    if (!existsSync(itemDirectoryPath)) {
      mkdirSync(itemDirectoryPath, { recursive: true })
    }
    const itemPath = this.itemPathFor(item.id)
    writeFileSync(itemPath, JSON.stringify(item, null, 2))
  }

  itemExists(itemId: string): boolean {
    return existsSync(this.itemPathFor(itemId))
  }

  retrieveItem(itemId: string): E.Either<RetrieveItemError, Item> {
    const itemPath = this.itemPathFor(itemId)
    if (!existsSync(itemPath)) {
      return E.left('failed')
    }

    const safeParse = ItemStorageFormat.safeParse(JSON.parse(readFileSync(itemPath, 'utf8')))
    if (safeParse.error) {
      return E.left('failed')
    }
    return E.right(safeParse.data)
  }

  items(): Item[] {
    return readdirSync(this.dataRoot, { withFileTypes: true })
      .filter((it) => it.isDirectory())
      .map((it) => it.name)
      .map((it) => this.retrieveItem(it))
      .filter((it) => E.isRight(it))
      .map((it) => it.right)
  }

  storeObservation(itemId: string, observation: Observation): void {
    const itemDirectory = this.itemDirectoryPathFor(itemId)
    const observationFile = resolve(itemDirectory, `${observation.id}.json`)
    writeFileSync(observationFile, JSON.stringify(observation, null, 2))
  }

  observations(itemId: string): Observation[] {
    const itemDirectory = this.itemDirectoryPathFor(itemId)

    return readdirSync(itemDirectory, { withFileTypes: true })
      .filter((it) => it.isFile())
      .filter((it) => 'item.json' !== it.name)
      .map((it) => {
        const path = resolve(itemDirectory, it.name)
        return readFileSync(path, 'utf-8')
      })
      .map((it) => JSON.parse(it))
      .map((it) => {
        const result = ObservationStorageFormat.safeParse(it)
        if (result.error) {
          return E.left('failed')
        }
        return E.right(result.data)
      })
      .filter((it) => E.isRight(it))
      .map((it) => {
        const dto = it.right
        const id = dto.id
        const start = Temporal.Instant.from(dto.start)
        const end = Temporal.Instant.from(dto.end)
        const observation: Observation = { id, start, end }
        return observation
      })
  }

  private itemPathFor(itemId: string) {
    const itemDirectoryPath = this.itemDirectoryPathFor(itemId)
    return resolve(itemDirectoryPath, 'item.json')
  }

  private itemDirectoryPathFor(itemId: string) {
    return resolve(this.dataRoot, itemId)
  }
}

export const padWithLeadingZero = (value: number, length: number) => value.toString().padStart(length, '0')
export const dateAsString = (instant: Temporal.Instant) => {
  const flup = instant.toZonedDateTimeISO('UTC')
  return `${flup.year}-${padWithLeadingZero(flup.month, 2)}-${padWithLeadingZero(flup.day, 2)}`
}
