import type { Route } from './+types/home'
import { Welcome } from '../welcome/welcome'

export function meta({}: Route.MetaArgs) {
  return [{ title: 'KeepTrack' }, { name: 'description', content: 'All the items you want to track' }]
}

export function loader({ context }: Route.LoaderArgs) {
  return { message: context.VALUE_FROM_EXPRESS }
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return <Welcome message={loaderData.message} />
}
