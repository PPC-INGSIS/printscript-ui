import {useState} from "react";
import {TestCase} from "../../types/TestCase.ts";
import {Autocomplete, Box, Button, Chip, TextField, Typography} from "@mui/material";
import {alpha} from "@mui/material/styles";
import {CheckCircleOutline, DeleteOutline, ErrorOutline, PlayArrowRounded} from "@mui/icons-material";
import {TestCaseResult, useTestSnippet} from "../../utils/queries.tsx";
import {useSnackbarContext} from "../../contexts/snackbarContext.tsx";
import {fonts} from "../../theme.ts";

type TabPanelProps = {
    snippetId: string;
    index: number;
    value: number;
    test?: TestCase;
    setTestCase: (test: Partial<TestCase>) => void;
    removeTestCase?: (testIndex: string) => void;
}

export const TabPanel = ({snippetId, value, index, test: initialTest, setTestCase, removeTestCase}: TabPanelProps) => {
    const [testData, setTestData] = useState<Partial<TestCase>>(initialTest ?? {});

    const {mutate: testSnippet, data: result, reset, isLoading: isTesting} = useTestSnippet(snippetId);
    const {createSnackbar} = useSnackbarContext()

    // Un resultado viejo engaña: al cambiar el test se borra hasta que se vuelva a correr
    const edit = (changes: Partial<TestCase>) => {
        setTestData({...testData, ...changes})
        reset()
    }

    const run = () => testSnippet(testData, {onError: (error) => createSnackbar('error', error.message)})

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`vertical-tabpanel-${index}`}
            aria-labelledby={`vertical-tab-${index}`}
            style={{minWidth: 0}}
        >
            {value === index && (
                <Box display="flex" flexDirection="column" gap={2.5}>
                    <TextField size="small" label="Name" value={testData.name ?? ""}
                               onChange={(e) => edit({name: e.target.value})}/>

                    <LinesField
                        label="Input"
                        helper="What each readInput call receives, in order."
                        value={testData.input ?? []}
                        onChange={(input) => edit({input})}
                    />
                    <LinesField
                        label="Expected output"
                        helper="One line per println, in order."
                        value={testData.output ?? []}
                        onChange={(output) => edit({output})}
                    />

                    <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                        {testData.id && removeTestCase && (
                            <Button onClick={() => removeTestCase(testData.id ?? "")} color="error"
                                    startIcon={<DeleteOutline/>}>
                                Delete
                            </Button>
                        )}
                        <Box flexGrow={1}/>
                        <Button disabled={!testData.name} onClick={() => setTestCase(testData)} variant="outlined">
                            Save
                        </Button>
                        <Button onClick={run} variant="contained" startIcon={<PlayArrowRounded/>} disabled={isTesting}>
                            {isTesting ? "Running…" : "Run test"}
                        </Button>
                    </Box>

                    {result && <TestResult result={result}/>}
                </Box>
            )}
        </div>
    );
}

type LinesFieldProps = {
    label: string;
    helper: string;
    value: string[];
    onChange: (lines: string[]) => void;
}

// Cada chip es una línea. `autoSelect`: lo escrito se agrega también al salir del campo, no solo con Enter
const LinesField = ({label, helper, value, onChange}: LinesFieldProps) => (
    <Autocomplete
        multiple
        freeSolo
        autoSelect
        options={[]}
        value={value}
        onChange={(_, lines) => onChange(lines as string[])}
        renderTags={(lines: readonly string[], getTagProps) =>
            lines.map((line: string, index: number) => (
                <Chip size="small" variant="outlined" label={line} sx={{fontFamily: fonts.mono}}
                      {...getTagProps({index})} />
            ))
        }
        renderInput={(params) => (
            <TextField {...params} size="small" label={label}
                       helperText={`${helper} Press Enter or leave the field to add a line.`}/>
        )}
    />
)

const TestResult = ({result}: { result: TestCaseResult }) => {
    if (result.passed) {
        return (
            <Box role="status" display="flex" alignItems="center" gap={1} color="success.main">
                <CheckCircleOutline fontSize="small"/>
                <Typography fontWeight={600}>Passed: it printed exactly the expected output.</Typography>
            </Box>
        )
    }

    const rows = Math.max(result.expected.length, result.outputs.length)

    return (
        <Box role="status" display="flex" flexDirection="column" gap={1.5}>
            <Box display="flex" alignItems="center" gap={1} color="error.main">
                <ErrorOutline fontSize="small"/>
                <Typography fontWeight={600}>Failed</Typography>
            </Box>
            {result.error && (
                <Typography variant="body2" color="error.main">The snippet stopped: {result.error}</Typography>
            )}
            {/* Línea por línea, para ver dónde se separan. Las distintas van marcadas */}
            <Box component="table" sx={{
                borderCollapse: 'collapse',
                width: '100%',
                fontFamily: fonts.mono,
                fontSize: 13,
                '& th': {textAlign: 'left', fontFamily: 'inherit', fontWeight: 600, color: 'text.secondary', pb: 0.5},
                '& td': {py: 0.5, px: 1, borderTop: 1, borderColor: 'divider', overflowWrap: 'anywhere'},
            }}>
                <thead>
                <tr>
                    <th style={{width: 32}}>#</th>
                    <th>Expected</th>
                    <th>Printed</th>
                </tr>
                </thead>
                <tbody>
                {Array.from({length: rows}, (_, i) => {
                    const expected = result.expected[i]
                    const printed = result.outputs[i]
                    return (
                        <Box component="tr" key={i} sx={expected === printed ? undefined : {
                            backgroundColor: (theme) => alpha(theme.palette.error.main, 0.08),
                        }}>
                            <td>{i + 1}</td>
                            <td>{expected ?? <Missing/>}</td>
                            <td>{printed ?? <Missing/>}</td>
                        </Box>
                    )
                })}
                </tbody>
            </Box>
            {rows === 0 && (
                <Typography variant="body2" color="text.secondary">Nothing was expected and nothing was printed.</Typography>
            )}
        </Box>
    )
}

const Missing = () => <Box component="span" color="text.disabled">no line</Box>
