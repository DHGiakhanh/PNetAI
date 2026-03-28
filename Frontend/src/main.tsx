import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 2600,
        style: {
          borderRadius: "14px",
          border: "1px solid #E4D5BC",
          background: "#FFFFFF",
          color: "#2C2418",
          fontWeight: "600",
        },
      }}
    />
  </React.StrictMode>,
)
