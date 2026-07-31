import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '@fontsource-variable/montserrat/wght.css'
import '@fontsource-variable/roboto-condensed/wght.css'
import App from './App'
import { AuthProvider } from './context/AuthProvider'
import { I18nProvider } from './context/I18nProvider'
import './styles/index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <I18nProvider>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </I18nProvider>
  </StrictMode>,
)
