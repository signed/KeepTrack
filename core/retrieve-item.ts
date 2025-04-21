import type { Storage } from './storage'

export const retrieveItem = (storage: Storage, itemId: string) => {
  return storage.retrieveItem(itemId)
}
