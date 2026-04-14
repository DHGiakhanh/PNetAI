import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import { GoogleOAuthProvider } from '@react-oauth/google'
import App from './App.tsx'
import './index.css'

// Replace with your real Google Client ID from Google Cloud Console
const GOOGLE_CLIENT_ID = "536916141054-rn2hfsdluj0gdk8ca7iplqu2pn5g4tv4.apps.googleusercontent.com";

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
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
