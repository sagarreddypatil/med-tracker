import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import MedTracker from './MedTracker'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MedTracker />
  </StrictMode>,
)
