import { Header } from './Header'
import { Hero } from '../home/Hero'

export function HomeLayout() {
  return (
    <>
      <div className="pt-[24px]">
        <Header />
      </div>

      <div className="mt-[32px]">
        <Hero />
      </div>
    </>
  )
}
