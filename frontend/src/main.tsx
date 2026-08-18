import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './style.css'

// Material Design 3 Web Components
import '@material/web/button/filled-button.js'
import '@material/web/button/outlined-button.js'
import '@material/web/button/elevated-button.js'
import '@material/web/button/text-button.js'
import '@material/web/button/filled-tonal-button.js'
import '@material/web/fab/fab.js'
import '@material/web/iconbutton/icon-button.js'
import '@material/web/progress/linear-progress.js'
import '@material/web/progress/circular-progress.js'
import '@material/web/dialog/dialog.js'
import '@material/web/switch/switch.js'
import '@material/web/tabs/tabs.js'
import '@material/web/tabs/primary-tab.js'
import '@material/web/ripple/ripple.js'
import '@material/web/checkbox/checkbox.js'


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
