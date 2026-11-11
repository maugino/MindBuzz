import background2 from "@mindbuzz/web/assets/background2.webp"
import logo from "@mindbuzz/web/assets/logo.svg"
import logo2 from "@mindbuzz/web/assets/logo2.svg"
import Loader from "@mindbuzz/web/features/game/components/Loader"
import { useSocket } from "@mindbuzz/web/features/game/contexts/socketProvider"
import { Outlet, useLocation } from "react-router"
const AuthLayout = () => {
  const { isConnected } = useSocket()
  const { pathname } = useLocation()
  if (!isConnected) {
    return (
      <section className="relative flex min-h-dvh flex-col items-center justify-center">
        <div className="absolute h-full w-full overflow-hidden">
          <div className="bg-primary/15 absolute -top-[15vmin] -left-[15vmin] min-h-[75vmin] min-w-[75vmin] rounded-full"></div>
          <div className="bg-primary/15 absolute -right-[15vmin] -bottom-[15vmin] min-h-[75vmin] min-w-[75vmin] rotate-45"></div>
        </div>
        <img src={logo} className="mb-10 h-16" alt="logo" />
        <Loader className="h-23" />
        <h2 className="mt-2 text-center text-2xl font-bold text-primary drop-shadow-lg md:text-3xl">
          Loading...
        </h2>
      </section>
    )
  }
  if (pathname === "/") {
    return (
      <section className="relative flex min-h-dvh flex-col items-center justify-center">
        <div className="fixed top-0 left-0 h-full w-full">
          <img className="pointer-events-none h-full w-full object-cover" src={background2} alt="background" />
        </div>
        <img src={logo2} className="relative z-10 mb-10 h-16" alt="logo" />
        <Outlet />
      </section>
    )
  }
  return (
    <section className="relative flex min-h-dvh flex-col items-center justify-center">
      <div className="absolute h-full w-full overflow-hidden">
        <div className="bg-primary/15 absolute -top-[15vmin] -left-[15vmin] min-h-[75vmin] min-w-[75vmin] rounded-full"></div>
        <div className="bg-primary/15 absolute -right-[15vmin] -bottom-[15vmin] min-h-[75vmin] min-w-[75vmin] rotate-45"></div>
      </div>
      <Outlet />
    </section>
  )
}
export default AuthLayout
