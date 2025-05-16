import { expect, test } from 'vitest'
import { Temporal } from '@js-temporal/polyfill'
import { dateAsString } from './storage'

test('instant to date folder', () => {
  expect(dateAsString(Temporal.Instant.from('2025-05-06T22:53:40.311020299Z'))).toEqual('2025-05-06')
})
