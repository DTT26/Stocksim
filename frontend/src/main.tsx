import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AlertProvider } from "./contexts/AlertContext";
import { ModalProvider } from "./contexts/ModalContext";
import { I18nProvider } from "./contexts/I18nContext";
import App from "./App.tsx";
import "./index.css";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "1000999025932-o4ihs1bugi281inv0laoq6jbcj1290th.apps.googleusercontent.com";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <ThemeProvider>
          <I18nProvider>
            <AuthProvider>
              <AlertProvider>
                <ModalProvider>
                  <App />
                </ModalProvider>
              </AlertProvider>
            </AuthProvider>
          </I18nProvider>
        </ThemeProvider>
      </GoogleOAuthProvider>
    </BrowserRouter>
  </StrictMode>
);
