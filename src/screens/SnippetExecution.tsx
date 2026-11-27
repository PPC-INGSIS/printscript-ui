import {Alert, Box, Button, OutlinedInput} from "@mui/material";
import {PlayArrow} from "@mui/icons-material";
import {highlight, languages} from "prismjs";
import Editor from "react-simple-code-editor";
import {Bòx} from "../components/snippet-table/SnippetBox.tsx";
import {useState} from "react";
import {useInteractiveExecution} from "../utils/interactiveExecution.ts";

type SnippetExecutionProps = {
  snippetId: string;
};

export const SnippetExecution = ({snippetId}: SnippetExecutionProps) => {
  const [input, setInput] = useState<string>("")
  const {transcript, running, waitingInput, error, start, sendInput} = useInteractiveExecution(snippetId)

  const code = transcript.join("\n")

  const handleEnter = (event: { key: string }) => {
    if (event.key === 'Enter' && waitingInput && input !== "") {
      sendInput(input)
      setInput("")
    }
  };

  return (
      <>
        <Box display="flex" alignItems="center" gap={1} pb={1}>
          <Button onClick={start} disabled={running} variant="contained" startIcon={<PlayArrow/>}>
            {running ? "Ejecutando" : "Ejecutar"}
          </Button>
          {/* Hasta que el snippet no pida un input no hay nada que escribir, y decirlo evita que
              parezca que la pantalla no responde */}
          {waitingInput && <Alert severity="info" sx={{py: 0}}>Esperando un input</Alert>}
        </Box>
        {error && <Alert severity="error" sx={{mb: 1}}>{error}</Alert>}
        <Bòx flex={1} overflow={"none"} minHeight={200} bgcolor={'black'} color={'white'} code={code}>
            <Editor
              value={code}
              padding={10}
              // La salida no se edita: es lo que imprimió el snippet, no un campo
              readOnly
              onValueChange={() => undefined}
              highlight={(code) => highlight(code, languages.js, 'javascript')}
              style={{
                  fontFamily: "monospace",
                  fontSize: 17,
              }}
            />
        </Bòx>
        <OutlinedInput
            onKeyDown={handleEnter}
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={!waitingInput}
            placeholder={waitingInput ? "Escribí el input y Enter" : "Ejecutá el snippet para empezar"}
            fullWidth/>
      </>
  )
}
