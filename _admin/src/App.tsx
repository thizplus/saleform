import { BrowserRouter } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { FiltersProvider } from '@/lib/filters'
import { AppRoutes } from '@/routes/AppRoutes'

export default function App() {
  return (
    <BrowserRouter>
      <TooltipProvider delay={150}>
        <FiltersProvider>
          <AppRoutes />
        </FiltersProvider>
        <Toaster position="top-right" richColors />
      </TooltipProvider>
    </BrowserRouter>
  )
}
