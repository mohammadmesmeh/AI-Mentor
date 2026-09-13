import { Navbar } from "@/shared/components/layout/navbar/Navbar"
import { Footer } from "@/shared/components/layout/Footer"
import { ShellBackground } from "@/shared/components/layout/ShellBackground"
import { AuthAmbientDecor } from "@/features/auth/components/AuthAmbientDecor"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <ShellBackground decor={<AuthAmbientDecor />}>
        <Navbar />
        <main id="main-content" className="flex flex-1 flex-col">
          {children}
        </main>
      </ShellBackground>
      <Footer />
    </div>
  )
}