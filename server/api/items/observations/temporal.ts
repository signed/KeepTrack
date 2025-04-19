import * as E from 'fp-ts/Either'
import {Temporal, Intl, toTemporalInstant} from '@js-temporal/polyfill';

export const parseInstantFrom = (input: string): E.Either<string, Temporal.Instant> => {
    try {
        return E.right(Temporal.Instant.from(input))
    } catch (_) {
        return E.left('failed')
    }
}
