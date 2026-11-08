import {
    Box,
    Button,
    capitalize,
    CircularProgress,
    Input,
    InputLabel,
    MenuItem,
    Select,
    SelectChangeEvent,
    Typography
} from "@mui/material";
import {highlight, languages} from "prismjs";
import {useEffect, useState} from "react";
import Editor from "react-simple-code-editor";

import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/themes/prism-okaidia.css";
import {Save} from "@mui/icons-material";
import {CreateSnippet, CreateSnippetWithLang} from "../../utils/snippet.ts";
import {ModalWrapper} from "../common/ModalWrapper.tsx";
import {useCreateSnippet, useGetFileTypes} from "../../utils/queries.tsx";
import {queryClient} from "../../App.tsx";

export const AddSnippetModal = ({open, onClose, defaultSnippet}: {
    open: boolean,
    onClose: () => void,
    defaultSnippet?: CreateSnippetWithLang
}) => {
    const [language, setLanguage] = useState(defaultSnippet?.language ?? "printscript");
    // Sin valor por defecto, como en la API: el usuario la elige siempre
    const [version, setVersion] = useState(defaultSnippet?.version ?? "");
    const [code, setCode] = useState(defaultSnippet?.content ?? "");
    const [snippetName, setSnippetName] = useState(defaultSnippet?.name ?? "")
    const [description, setDescription] = useState(defaultSnippet?.description ?? "")
    const {mutateAsync: createSnippet, isLoading: loadingSnippet} = useCreateSnippet({
        onSuccess: () => queryClient.invalidateQueries('listSnippets')
    })
    const {data: fileTypes} = useGetFileTypes();
    const versions = fileTypes?.find((f) => f.language === language)?.versions ?? [];

    // Cada lenguaje tiene sus versiones: al cambiar de lenguaje, la versión elegida deja de valer
    const handleChangeLanguage = (newLanguage: string) => {
        setLanguage(newLanguage);
        setVersion("");
    }

    const handleCreateSnippet = async () => {
        const newSnippet: CreateSnippet = {
            name: snippetName,
            description: description,
            content: code,
            language: language,
            version: version,
            extension: fileTypes?.find((f) => f.language === language)?.extension ?? "prs"
        }
        await createSnippet(newSnippet);
        onClose();
    }

    useEffect(() => {
        if (defaultSnippet) {
            setCode(defaultSnippet?.content)
            setLanguage(defaultSnippet?.language)
            setVersion(defaultSnippet?.version)
            setSnippetName(defaultSnippet?.name)
            setDescription(defaultSnippet?.description)
        }
    }, [defaultSnippet]);

    return (
        <ModalWrapper open={open} onClose={onClose}>
            {
                <Box sx={{display: 'flex', flexDirection: "row", justifyContent: "space-between"}}>
                    <Typography id="modal-modal-title" variant="h5" component="h2"
                                sx={{display: 'flex', alignItems: 'center'}}>
                        Add Snippet
                    </Typography>
                    <Button disabled={!snippetName || !description || !code || !language || !version || loadingSnippet} variant="contained"
                            disableRipple
                            sx={{boxShadow: 0}} onClick={handleCreateSnippet}>
                        <Box pr={1} display={"flex"} alignItems={"center"} justifyContent={"center"}>
                            {loadingSnippet ? <CircularProgress size={24}/> : <Save/>}
                        </Box>
                        Save Snippet
                    </Button>
                </Box>
            }
            <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
            }}>
                <InputLabel htmlFor="name">Name</InputLabel>
                <Input onChange={e => setSnippetName(e.target.value)} value={snippetName} id="name"
                       sx={{width: '50%'}}/>
            </Box>
            <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
            }}>
                <InputLabel htmlFor="description">Description</InputLabel>
                <Input onChange={e => setDescription(e.target.value)} value={description} id="description"
                       sx={{width: '100%'}}/>
            </Box>
            <Box sx={{display: 'flex', flexWrap: 'wrap', gap: '16px'}}>
                <Box sx={{display: 'flex', flexDirection: 'column', gap: '16px', flex: '1 1 200px'}}>
                    <InputLabel id="language-label">Language</InputLabel>
                    <Select
                        labelId="language-label"
                        id="demo-simple-select"
                        value={language}
                        onChange={(e: SelectChangeEvent<string>) => handleChangeLanguage(e.target.value)}
                    >
                        {
                            fileTypes?.map(x => (
                                <MenuItem data-testid={`menu-option-${x.language}`} key={x.language}
                                          value={x.language}>{capitalize((x.language))}</MenuItem>
                            ))
                        }
                    </Select>
                </Box>
                <Box sx={{display: 'flex', flexDirection: 'column', gap: '16px', flex: '1 1 140px'}}>
                    <InputLabel id="version-label">Version</InputLabel>
                    <Select
                        labelId="version-label"
                        id="version-select"
                        value={version}
                        displayEmpty
                        onChange={(e: SelectChangeEvent<string>) => setVersion(e.target.value)}
                    >
                        <MenuItem value="" disabled>Choose a version</MenuItem>
                        {
                            versions.map(v => (
                                <MenuItem data-testid={`menu-option-version-${v}`} key={v} value={v}>{v}</MenuItem>
                            ))
                        }
                    </Select>
                </Box>
            </Box>
            <InputLabel>Code Snippet</InputLabel>
            <Box width={"100%"} sx={{
                backgroundColor: 'black', color: 'white', borderRadius: "8px",
            }}>
                <Editor
                    value={code}
                    padding={10}
                    data-testid={"add-snippet-code-editor"}
                    onValueChange={(code) => setCode(code)}
                    highlight={(code) => highlight(code, languages.js, 'javascript')}
                    style={{
                        borderRadius: "8px",
                        overflow: "auto",
                        minHeight: "300px",
                        maxHeight: "600px",
                        width: "100%",
                        fontFamily: "monospace",
                        fontSize: 17,
                    }}
                />
            </Box>
        </ModalWrapper>
    )
}

