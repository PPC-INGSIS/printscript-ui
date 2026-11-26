import {Box,  Divider, IconButton, Tab, Tabs, Typography} from "@mui/material";
import {ModalWrapper} from "../common/ModalWrapper.tsx";
import {SyntheticEvent, useState} from "react";
import {AddRounded} from "@mui/icons-material";
import {useGetTestCases, usePostTestCase, useRemoveTestCase} from "../../utils/queries.tsx";
import {TabPanel} from "./TabPanel.tsx";
import {queryClient} from "../../App.tsx";
import {TestCase} from "../../types/TestCase.ts";
import {useSnackbarContext} from "../../contexts/snackbarContext.tsx";

type TestSnippetModalProps = {
    snippetId: string
    open: boolean
    onClose: () => void
}

export const TestSnippetModal = ({snippetId, open, onClose}: TestSnippetModalProps) => {
    const [value, setValue] = useState(0);
    const {createSnackbar} = useSnackbarContext()

    const {data: testCases} = useGetTestCases(snippetId);
    const {mutate: postTestCase} = usePostTestCase(snippetId);
    const {mutate: removeTestCase} = useRemoveTestCase(snippetId);

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
        <ModalWrapper open={open} onClose={onClose}>
            <Typography variant={"h5"}>Test snippet</Typography>
            <Divider/>
            <Box mt={2} display="flex">
                <Tabs
                    orientation="vertical"
                    variant="scrollable"
                    value={value}
                    onChange={handleChange}
                    aria-label="Vertical tabs example"
                    sx={{borderRight: 1, borderColor: 'divider'}}
                >
                    {testCases?.map((testCase) => (
                        <Tab key={testCase.id} label={testCase.name}/>
                    ))}
                    <IconButton disableRipple onClick={() => setValue(count + 1)}>
                        <AddRounded />
                    </IconButton>
                </Tabs>
                {/* La key es el id: sin ella, al borrar un test el panel siguiente se quedaba con los datos del borrado */}
                {testCases?.map((testCase, index) => (
                    <TabPanel key={testCase.id} snippetId={snippetId} index={index} value={value} test={testCase}
                              setTestCase={saveTestCase}
                              removeTestCase={deleteTestCase}
                    />
                ))}
                {/* La key cambia con la cantidad: al guardar un test nuevo, el formulario vuelve a quedar vacío */}
                <TabPanel key={`new-${count}`} snippetId={snippetId} index={count + 1} value={value}
                          setTestCase={saveTestCase}
                />
            </Box>
        </ModalWrapper>
    )
}
