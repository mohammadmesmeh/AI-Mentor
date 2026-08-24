import { Navbar } from "@/shared/components/layout/navbar/Navbar"
import { Footer } from "@/shared/components/layout/Footer"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </>
  )
}
