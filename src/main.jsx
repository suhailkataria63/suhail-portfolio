import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const isCinematicPreview = new URLSearchParams(window.location.search).get('preview') === 'cinematic'
// This bootstrap mounts the root; it is not itself a Fast Refresh boundary.
// eslint-disable-next-line react-refresh/only-export-components
const CinematicPreview = lazy(() => import('./previews/cinematic/CinematicPreview.jsx'))

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isCinematicPreview ? (
      <Suspense fallback={null}>
        <CinematicPreview />
      </Suspense>
    ) : <App />}
  </StrictMode>,
)
