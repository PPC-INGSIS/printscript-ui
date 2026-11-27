import {useCallback, useEffect, useRef, useState} from "react"
import {useAuth0} from "@auth0/auth0-react"
import {BACKEND_URL} from "./constants.ts"

/**
 * La URL del WebSocket a partir de la de la API: el mismo host, con el otro esquema.
 *
 * Así en dev sale `wss://` y en local `ws://` sin configurar nada aparte, y pasa por el mismo nginx
 * que el resto de la API.
 */
export const executionUrl = (snippetId: string, backendUrl: string = BACKEND_URL): string => {
    const base = backendUrl.replace(/^http/, "ws").replace(/\/+$/, "")
    return `${base}/snippets/${encodeURIComponent(snippetId)}/execution`
}

/** Los mensajes que manda Snippets. Los de PrintScript llegan tal cual, sin que el relay los toque. */
type ServerMessage =
    | {type: "output"; text: string}
    | {type: "input_request"}
    | {type: "finished"; error: {message: string} | null}
    | {type: "rejected"; detail: string}

export type InteractiveExecution = {
    /** Lo que se vio hasta ahora: salidas del snippet y lo que el usuario fue escribiendo. */
    transcript: string[]
    running: boolean
    /** El snippet está esperando un input: hasta que no lo pida, no hay nada que escribir. */
    waitingInput: boolean
    error?: string
    start: () => void
    sendInput: (value: string) => void
}

/**
 * La ejecución interactiva de un snippet, contra `WS /snippets/{id}/execution`.
 *
 * **El token va en el primer mensaje, no en el handshake**: al abrir un WebSocket el browser no
 * puede mandar headers, así que no hay dónde poner el `Bearer`. Snippets no procesa nada hasta
 * validarlo, y cierra la conexión si no llega.
 *
 * **Arranca cuando el usuario lo pide, no al abrir el snippet.** Cada ejecución ocupa un lugar de
 * los que cada usuario tiene (snippet-service#73) y de los que PrintScript admite a la vez, así que
 * abrir tres snippets no puede gastarlos sin que nadie haya ejecutado nada.
 */
export const useInteractiveExecution = (snippetId: string): InteractiveExecution => {
    const {getAccessTokenSilently} = useAuth0()
    const socket = useRef<WebSocket | null>(null)

    const [transcript, setTranscript] = useState<string[]>([])
    const [running, setRunning] = useState(false)
    const [waitingInput, setWaitingInput] = useState(false)
    const [error, setError] = useState<string | undefined>(undefined)

    // Al salir de la pantalla se cierra, y cerrar de este lado cancela la ejecución
    useEffect(() => () => socket.current?.close(), [])

    const handle = useCallback((message: ServerMessage) => {
        switch (message.type) {
            case "output":
                setTranscript(previous => [...previous, message.text])
                break
            case "input_request":
                setWaitingInput(true)
                break
            case "finished":
                setWaitingInput(false)
                setRunning(false)
                if (message.error) setError(message.error.message)
                break
            case "rejected":
                setWaitingInput(false)
                setRunning(false)
                setError(message.detail)
                break
        }
    }, [])

    const start = useCallback(() => {
        if (running) return

        setTranscript([])
        setError(undefined)
        setWaitingInput(false)
        setRunning(true)

        // El token se pide antes de abrir: es lo primero que hay que mandar
        getAccessTokenSilently()
            .then(token => {
                const ws = new WebSocket(executionUrl(snippetId))
                socket.current = ws

                ws.onopen = () => ws.send(JSON.stringify({type: "auth", token}))
                ws.onmessage = event => handle(JSON.parse(event.data as string) as ServerMessage)
                // Si se cerró sin un finished, el motivo ya vino en un rejected o no hay ninguno que dar
                ws.onclose = () => {
                    setRunning(false)
                    setWaitingInput(false)
                }
                ws.onerror = () => setError("Se cortó la conexión con el servidor")
            })
            .catch(() => {
                setRunning(false)
                setError("No se pudo obtener el token para ejecutar")
            })
    }, [getAccessTokenSilently, handle, running, snippetId])

    const sendInput = useCallback((value: string) => {
        const ws = socket.current
        if (!ws || ws.readyState !== WebSocket.OPEN) return

        ws.send(JSON.stringify({type: "input", value}))
        // Se muestra lo que el usuario escribió: si no, la consola queda sin la mitad de la conversación
        setTranscript(previous => [...previous, value])
        setWaitingInput(false)
    }, [])

    return {transcript, running, waitingInput, error, start, sendInput}
}
