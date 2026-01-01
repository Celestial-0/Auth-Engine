import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler"
import { Dashboard } from "@/components/core/Dashboard"

function App() {
  return (
    <>
      <Dashboard />
      <div className="fixed top-4 right-4">
        <AnimatedThemeToggler />
      </div>
    </>
  )
}

export default App
