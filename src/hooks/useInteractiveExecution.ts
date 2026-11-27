import {useCallback, useEffect, useRef, useState} from "react";
import {
    authMessage,
    describeError,
    executionUrl,
    inputMessage,
    parseServerMessage,
} from "../utils/execution/executionProtocol.ts";

export type ConsoleLine = {
    kind: "output" | "input" | "error" | "info";
    text: string;
}

export type ExecutionStatus = "idle" | "connecting" | "running" | "finished"

// Lo único que el hook necesita de un WebSocket. Se recibe de afuera para poder probarlo sin red
export type OpenSocket = (url: string) => WebSocket

const openWebSocket: OpenSocket = (url) => new WebSocket(url)

/**
 * La conexión de una ejecución interactiva y su estado: qué se imprimió, si está esperando un input y
 * si terminó. La pantalla solo dibuja lo que devuelve.
 *
 * El token y la forma de abrir el socket llegan como parámetros (como en ApiSnippetOperations): el hook
 * no depende de Auth0 ni del WebSocket del browser, sino de lo que hace con ellos.
 */
export const useInteractiveExecution = (
    snippetId: string,
    getAccessToken: () => Promise<string>,
    openSocket: OpenSocket = openWebSocket,
) => {
    const [lines, setLines] = useState<ConsoleLine[]>([])
    const [status, setStatus] = useState<ExecutionStatus>("idle")
    const [waitingInput, setWaitingInput] = useState(false)
    const socket = useRef<WebSocket | null>(null)
    // Si el servidor ya dijo cómo terminó: un cierre sin eso es un corte, y hay que avisarlo
    const ended = useRef(false)

    const add = useCallback((line: ConsoleLine) => setLines((previous) => [...previous, line]), [])

    const finish = useCallback(() => {
        setWaitingInput(false)
        setStatus("finished")
    }, [])

    const stop = useCallback(() => {
        const current = socket.current
        if (!current) return
        // Primero se suelta: el onclose de este socket ya no tiene que tocar el estado
        socket.current = null
        current.close(1000)
        add({kind: "info", text: "Stopped"})
        finish()
    }, [add, finish])

    const run = useCallback(async () => {
        socket.current?.close(1000)
        socket.current = null
        ended.current = false
        setLines([])
        setWaitingInput(false)
        setStatus("connecting")

        let token: string
        try {
            token = await getAccessToken()
        } catch {
            add({kind: "error", text: "Your session expired. Log in again."})
            finish()
            return
        }

        const ws = openSocket(executionUrl(snippetId))
        socket.current = ws
        ws.onopen = () => {
            ws.send(authMessage(token))
            setStatus("running")
        }
        ws.onmessage = (event) => {
            if (socket.current !== ws) return
            const message = parseServerMessage(event.data)
            switch (message?.type) {
                case "output":
                    add({kind: "output", text: message.text})
                    break
                case "input_request":
                    setWaitingInput(true)
                    break
                case "finished":
                    ended.current = true
                    add(message.error
                        ? {kind: "error", text: describeError(message.error)}
                        : {kind: "info", text: "Finished"})
                    break
                case "rejected":
                    ended.current = true
                    add({kind: "error", text: message.detail})
                    break
            }
        }
        ws.onclose = () => {
            // Un socket que ya se soltó (Stop, otro Run, la pantalla se cerró) no toca el estado
            if (socket.current !== ws) return
            socket.current = null
            if (!ended.current) add({kind: "error", text: "The connection closed before the snippet finished."})
            finish()
        }
    }, [snippetId, getAccessToken, openSocket, add, finish])

    const sendInput = useCallback((value: string) => {
        const current = socket.current
        if (!current || !waitingInput) return
        current.send(inputMessage(value))
        add({kind: "input", text: value})
        setWaitingInput(false)
    }, [waitingInput, add])

    // Al cerrar la pantalla se corta la ejecución: si no, seguiría ocupando uno de los lugares del usuario
    useEffect(() => () => {
        const current = socket.current
        socket.current = null
        current?.close(1000)
    }, [])

    return {lines, status, waitingInput, run, stop, sendInput}
}
