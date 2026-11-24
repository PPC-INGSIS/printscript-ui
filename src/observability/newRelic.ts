import {BrowserAgent} from '@newrelic/browser-agent/loaders/browser-agent'

// Agente de navegador de New Relic: cargas de página, errores de JavaScript y llamadas a la API vistas
// desde el navegador. Vite graba estos valores en el JavaScript al construir, así que todos son públicos:
// la browser key (NRJS-...) solo sirve para mandar datos de navegador, no para leer la cuenta.
// La license key de los agentes del backend NO va acá: en el bundle la vería cualquiera.
const accountID: string = import.meta.env.VITE_NEW_RELIC_ACCOUNT_ID ?? ''
const trustKey: string = import.meta.env.VITE_NEW_RELIC_TRUST_KEY ?? ''
const applicationID: string = import.meta.env.VITE_NEW_RELIC_APPLICATION_ID ?? ''
const browserKey: string = import.meta.env.VITE_NEW_RELIC_BROWSER_KEY ?? ''

// Cuentas de New Relic en EE.UU.; una cuenta en la UE usaría bam.eu01.nr-data.net
const BEACON = 'bam.nr-data.net'

export function startNewRelic(): void {
    // Sin configuración (npm run dev, el build del CI) no se manda nada: solo se mide la imagen deployada
    if (!accountID || !trustKey || !applicationID || !browserKey) return

    new BrowserAgent({
        init: {
            // Agrega traceparent a las llamadas a /api: cuando Snippets tenga su agente, el pedido se ve
            // de punta a punta (navegador → Snippets). Es el mismo origen, así que no hace falta CORS.
            distributed_tracing: {enabled: true},
            privacy: {cookies_enabled: true},
            ajax: {
                // Que el agente no mida sus propios envíos a New Relic
                deny_list: [BEACON],
                // Sin los bodies de los pedidos: llevan el código de los snippets
                capture_payloads: 'none',
            },
        },
        info: {
            beacon: BEACON,
            errorBeacon: BEACON,
            licenseKey: browserKey,
            applicationID,
            sa: 1,
        },
        loader_config: {
            accountID,
            trustKey,
            agentID: applicationID,
            licenseKey: browserKey,
            applicationID,
        },
    })
}
