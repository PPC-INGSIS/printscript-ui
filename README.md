# Printscript UI

This is a React project using Vite and Node.js 22. This README will guide you on how to set up and start the project locally.

## Prerequisites

Before you begin, ensure you have met the following requirements:

- You have installed Node.js 20 or later
- You have installed npm

## Getting Started

To get a local copy up and running, follow these steps:

### 1. Fork this Repository in your github account

### 2. Clone the Repository

```bash
git clone https://github.com/your-username/printscript-ui.git
```

###  3. Navigate to the Project Directory
```bash
cd printscript-ui
```

### 4. Install Dependencies
```bash
npm install
```

### 5. Start the Development Server

```bash
npm run dev
```

This will start the Vite development server. You can now open your browser and navigate to http://localhost:5173/ to see the application running.

## Build production version

To use this UI in production you should use an optimized and static version, this command will generate this version in `dist` directory:  

```bash
npm run build
```

## Cypress

To start cypress, make sure that the UI is running and enter: 

```bash
npm run cypress
```

## Auth0

La UI exige login: `App.tsx` envuelve la app con `withAuthenticationRequired`, y `main.tsx` le pide a Auth0 un token para la API de Snippet Searcher (`audience`), con los permisos `read:snippets` y `write:snippets`.

Los valores son públicos. La imagen de Docker los recibe como build args (ver el `Dockerfile`), así que la misma imagen sirve en todos los entornos. Para correr con `npm run dev`, crear un archivo `.env` (lo ignora git) con:

```
VITE_AUTH0_DOMAIN=dev-m32ysp7h6y2qyjn0.us.auth0.com
VITE_AUTH0_CLIENT_ID=G0kbDLuLToHgld18uycoHvq7sav3xMvp
VITE_AUTH0_AUDIENCE=https://snippet-searcher-api
```

`http://localhost:5173` está registrada en Auth0 como callback permitida, así que en local hay que usar ese puerto.

Pendiente: `src/utils/queries.tsx` usa `FakeSnippetOperations`. Cuando se implementen las operaciones reales, obtienen el token con `getAccessTokenSilently()` y lo mandan como `Authorization: Bearer <token>`.

Si al pedir el token queda en un loop de 401:
* Cambiar el tipo de aplicación en Auth0 a "Regular Web Application"
* En Application Settings > Credentials > "Authentication Method", elegir "None"

## Start working

1. Fork the Project
2. Do your magic

## Contributing

1. Create your Feature Branch in this repo (git checkout -b feature/AmazingFeature)
2. Commit your Changes (git commit -m 'Add some AmazingFeature')
3. Push to the Branch (git push origin feature/AmazingFeature)
4. Open a Pull Request

## Tasks

- [ ] Integrate Auth0 UI and private routes
- [ ] Integrate your endpoints to the UI (Create custom "SnippetOperations")
- [ ] Dockerize
- [ ] CI/CD
- [ ] Sockets*