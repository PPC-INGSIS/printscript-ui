import {Box, Button, Divider, Tab, Tabs, Typography} from "@mui/material";
import {ModalWrapper} from "../common/ModalWrapper.tsx";
import {SyntheticEvent, useState} from "react";
import {AddRounded} from "@mui/icons-material";
import {useGetTestCases, usePostTestCase, useRemoveTestCase} from "../../utils/queries.tsx";
import {TabPanel} from "./TabPanel.tsx";
import {queryClient} from "../../App.tsx";
import {TestCase} from "../../types/TestCase.ts";
import {useSnackbarContext} from "../../contexts/snackbarContext.tsx";
import {fonts} from "../../theme.ts";

type TestSnippetModalProps = {
    snippetId: string
    snippetName: string
    open: boolean
    onClose: () => void
}

export const TestSnippetModal = ({snippetId, snippetName, open, onClose}: TestSnippetModalProps) => {
    const [value, setValue] = useState(0);
    const {createSnackbar} = useSnackbarContext()

    const {data: testCases, isLoading} = useGetTestCases(snippetId);
    const {mutate: postTestCase} = usePostTestCase(snippetId);
    const {mutate: removeTestCase} = useRemoveTestCase(snippetId);

    // El formulario de un test nuevo es el panel `count`, después de los guardados
    const count = testCases?.length ?? 0
    const refresh = () => queryClient.invalidateQueries(['testCases', snippetId])
    const onError = (error: Error) => createSnackbar('error', error.message)

    const handleChange = (_: SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    const saveTestCase = (testCase: Partial<TestCase>) => postTestCase(testCase, {
        onSuccess: (saved) => {
            createSnackbar('success', `Saved ${saved.name}`)
            // Un test nuevo queda último en la lista: se pasa a su pestaña
            if (!testCase.id) setValue(count)
            return refresh()
        },
        onError,
    })

    const deleteTestCase = (id: string) => removeTestCase(id, {
        onSuccess: () => {
            setValue(0)
            return refresh()
        },
        onError,
    })

    return (
        <ModalWrapper open={open} onClose={onClose} maxWidth={760}>
            <Box>
                <Typography id="modal-modal-title" variant="h6" fontWeight={600}>Tests</Typography>
                <Typography id="modal-modal-description" variant="body2" color="text.secondary">
                    Each test runs{" "}
                    <Box component="span" sx={{fontFamily: fonts.mono}}>{snippetName}</Box>
                    {" "}with its input and compares what it prints with the expected output.
                </Typography>
            </Box>
            <Divider/>

            {isLoading ? (
                <Typography color="text.secondary">Loading tests…</Typography>
            ) : (
                <Box display="grid" gridTemplateColumns={{xs: '1fr', sm: '180px 1fr'}} gap={3}>
                    <Box display="flex" flexDirection="column" gap={1} minWidth={0}>
                        {count > 0 && (
                            <Tabs
                                orientation="vertical"
                                variant="scrollable"
                                // El formulario nuevo no es una pestaña: con él abierto no se marca ninguna
                                value={value < count ? value : false}
                                onChange={handleChange}
                                aria-label="Saved tests"
                                sx={{maxHeight: 320, borderRight: 1, borderColor: 'divider'}}
                            >
                                {testCases?.map((testCase, index) => (
                                    <Tab key={testCase.id} label={testCase.name}
                                         id={`vertical-tab-${index}`} aria-controls={`vertical-tabpanel-${index}`}
                                         sx={{
                                             alignItems: 'flex-start',
                                             textAlign: 'left',
                                             minHeight: 40,
                                             fontFamily: fonts.mono,
                                             overflowWrap: 'anywhere',
                                         }}/>
                                ))}
                            </Tabs>
                        )}
                        <Button startIcon={<AddRounded/>} onClick={() => setValue(count)}
                                variant={value === count ? "contained" : "text"}
                                sx={{justifyContent: 'flex-start'}}>
                            New test
                        </Button>
                        {count === 0 && (
                            <Typography variant="body2" color="text.secondary" mt={1}>
                                No tests yet. Write the first one on the right.
                            </Typography>
                        )}
                    </Box>

                    <Box minWidth={0}>
                        {/* La key es el id: sin ella, al borrar un test el panel siguiente se quedaba con los datos del borrado */}
                        {testCases?.map((testCase, index) => (
                            <TabPanel key={testCase.id} snippetId={snippetId} index={index} value={value}
                                      test={testCase}
                                      setTestCase={saveTestCase}
                                      removeTestCase={deleteTestCase}
                            />
                        ))}
                        {/* La key cambia con la cantidad: al guardar un test nuevo, el formulario vuelve a quedar vacío */}
                        <TabPanel key={`new-${count}`} snippetId={snippetId} index={count} value={value}
                                  setTestCase={saveTestCase}
                        />
                    </Box>
                </Box>
            )}
        </ModalWrapper>
    )
}
