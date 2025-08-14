import { useLocation } from '@docusaurus/router'
import Layout from '@theme/Layout'
import DemoInterface from '../components/DemoInterface'

export default function Demos() {
  const location = useLocation()

  // Extract game name from query parameter (e.g., /demos?game=paint -> paint)
  const searchParams = new URLSearchParams(location.search)
  const initialDemo = searchParams.get('game') || undefined

  return (
    <Layout title="Demos">
      <DemoInterface initialDemo={initialDemo} />
    </Layout>
  )
}
