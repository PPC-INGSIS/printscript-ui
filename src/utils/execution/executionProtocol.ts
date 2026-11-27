// El protocolo de la ejecución interactiva con Snippets (WebSocket en /api/snippets/{id}/execution).
// Solo formato: armar la URL y los mensajes, y leer lo que llega. No abre conexiones ni guarda estado,
// así quien maneja la conexión (useInteractiveExecution) no tiene que saber de JSON.

const API_URL: string = import.meta.env.VITE_API_URL ?? "/api"

export type ExecutionError = {
    message: string;
    // Sin posición cuando no hay una línea que señalar (por ejemplo, demasiado anidamiento)
    line: number | null;
    column: number | null;
}

export type ServerMessage =
    | { type: "output"; text: string }
    | { type: "input_request" }
    | { type: "finished"; error: ExecutionError | null }
    | { type: "rejected"; detail: string }

// Misma base que la API, con ws:// o wss:// según la página: detrás de nginx, el mismo dominio y su HTTPS
export const executionUrl = (snippetId: string, location: Location = window.location): string => {
    const url = new URL(API_URL, location.href)
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:"
    url.pathname = `${url.pathname.replace(/\/$/, "")}/snippets/${encodeURIComponent(snippetId)}/execution`
    return url.toString()
}

// El token va en el primer mensaje y nunca en la URL: las URLs quedan en los logs de nginx
export const authMessage = (token: string): string => JSON.stringify({type: "auth", token})

export const inputMessage = (value: string): string => JSON.stringify({type: "input", value})

// Lo que no se reconoce se ignora: un mensaje nuevo del servidor no tiene que romper la consola
export const parseServerMessage = (data: unknown): ServerMessage | undefined => {
    if (typeof data !== "string") return undefined
    try {
        const message = JSON.parse(data)
        switch (message?.type) {
            case "output":
                return typeof message.text === "string" ? {type: "output", text: message.text} : undefined
            case "input_request":
                return {type: "input_request"}
            case "finished":
                return {type: "finished", error: message.error ?? null}
            case "rejected":
                return {type: "rejected", detail: String(message.detail ?? "The execution was rejected")}
            default:
                return undefined
        }
    } catch {
        return undefined
    }
}

export const describeError = (error: ExecutionError): string =>
    error.line == null ? error.message : `Line ${error.line}, column ${error.column}: ${error.message}`
