import {Box, Button, OutlinedInput, Tooltip, Typography} from "@mui/material";
import {PlayArrowRounded, StopRounded} from "@mui/icons-material";
import {KeyboardEvent, useEffect, useRef, useState} from "react";
import {useAuth0} from "@auth0/auth0-react";
import {ConsoleLine, useInteractiveExecution} from "../hooks/useInteractiveExecution.ts";
import {fonts, syntax} from "../theme.ts";

type SnippetExecutionProps = {
  snippetId: string
  // Snippets ejecuta el código guardado: con cambios sin guardar, correr mostraría otra cosa que el editor
  unsavedChanges: boolean
}

// Solo dibuja: la conexión y su estado son de useInteractiveExecution
export const SnippetExecution = ({snippetId, unsavedChanges}: SnippetExecutionProps) => {
  const {getAccessTokenSilently} = useAuth0()
  const {lines, status, waitingInput, run, stop, sendInput} =
      useInteractiveExecution(snippetId, getAccessTokenSilently)
  const [input, setInput] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const consoleRef = useRef<HTMLDivElement>(null)

  const active = status === "connecting" || status === "running"

  // Cuando el snippet pide un input, el foco va al campo: no hay que buscarlo con el mouse
  useEffect(() => {
    if (waitingInput) inputRef.current?.focus()
  }, [waitingInput])

  // La consola sigue a la última línea, como una terminal
  useEffect(() => {
    consoleRef.current?.scrollTo({top: consoleRef.current.scrollHeight})
  }, [lines])

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter" && waitingInput) {
      sendInput(input)
      setInput("")
    }
  }

  return (
      <Box display="flex" flexDirection="column" gap={1}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography fontWeight={600}>Console</Typography>
          {active ? (
              <Button onClick={stop} color="error" startIcon={<StopRounded/>}>Stop</Button>
          ) : (
              <Tooltip title={unsavedChanges ? "Save your changes to run them: Run uses the saved code" : ""}>
                {/* El span deja mostrar el tooltip aunque el botón esté deshabilitado */}
                <span>
                  <Button onClick={run} disabled={unsavedChanges} variant="contained" startIcon={<PlayArrowRounded/>}>
                    Run
                  </Button>
                </span>
              </Tooltip>
          )}
        </Box>

        <Box
            ref={consoleRef}
            role="log"
            aria-live="polite"
            sx={{
              bgcolor: 'black',
              color: syntax.punctuation,
              fontFamily: fonts.mono,
              fontSize: 15,
              p: 1.5,
              borderRadius: 1,
              minHeight: 160,
              maxHeight: 320,
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
              overflowWrap: 'anywhere',
            }}
        >
          {lines.length === 0 ? (
              <Box component="span" sx={{color: syntax.comment}}>
                {status === "connecting" ? "Starting…" : "Press Run to execute the saved code. If it reads an input, you type it below."}
              </Box>
          ) : lines.map((line, index) => <ConsoleRow key={index} line={line}/>)}
        </Box>

        <OutlinedInput
            inputRef={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!waitingInput}
            placeholder={waitingInput ? "The snippet is waiting for an input. Press Enter to send it" : "Inputs go here when the snippet asks for one"}
            fullWidth
            size="small"
            sx={{fontFamily: fonts.mono}}
        />
      </Box>
  )
}

const ConsoleRow = ({line}: { line: ConsoleLine }) => {
  switch (line.kind) {
    case "input":
      return <Box sx={{color: syntax.string}}>{`> ${line.text}`}</Box>
    case "error":
      return <Box sx={{color: syntax.error}}>{line.text}</Box>
    case "info":
      return <Box sx={{color: syntax.comment}}>{line.text}</Box>
    default:
      return <Box>{line.text}</Box>
  }
}
