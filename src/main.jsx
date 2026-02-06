import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { SpiderProvider } from './context/SpiderContext'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <SpiderProvider>
        <App />
      </SpiderProvider>
    </BrowserRouter>
  </StrictMode>,
)
