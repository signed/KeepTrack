import {Temporal} from '@js-temporal/polyfill';

export type Observation = {
    id: string
    start: Temporal.Instant;
    end: Temporal.Instant
}
