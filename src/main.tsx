import React from 'react';
import App from './App.tsx'
import './index.css'
import {createRoot} from "react-dom/client";
import {PaginationProvider} from "./contexts/paginationProvider.tsx";
import {SnackbarProvider} from "./contexts/snackbarProvider.tsx";
import {Auth0Provider} from "@auth0/auth0-react";

createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <Auth0Provider
            domain={import.meta.env.VITE_AUTH0_DOMAIN ?? ""}
            clientId={import.meta.env.VITE_AUTH0_CLIENT_ID ?? ""}
            authorizationParams={{
                redirect_uri: window.location.origin,
                // Para qué API es el token: sin esto Auth0 no emite un JWT que Snippets acepte
                audience: import.meta.env.VITE_AUTH0_AUDIENCE ?? "",
                // Permisos que pide la UI; por RBAC, Auth0 solo los da si el usuario tiene el rol
                scope: "openid profile email read:snippets write:snippets",
            }}
        >
            <PaginationProvider>
                <SnackbarProvider>
                    <App/>
                </SnackbarProvider>
            </PaginationProvider>
        </Auth0Provider>
    </React.StrictMode>,
)
