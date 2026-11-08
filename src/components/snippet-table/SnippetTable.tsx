import {
  alpha,
  Box,
  Button,
  InputBase,
  Menu,
  MenuItem,
  styled,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow
} from "@mui/material";
import {AddSnippetModal} from "./AddSnippetModal.tsx";
import {useRef, useState} from "react";
import {Add, Search} from "@mui/icons-material";
import {LoadingSnippetRow, SnippetRow} from "./SnippetRow.tsx";
import {CreateSnippetWithLang, getFileLanguage, Snippet} from "../../utils/snippet.ts";
import {usePaginationContext} from "../../contexts/paginationContext.tsx";
import {useSnackbarContext} from "../../contexts/snackbarContext.tsx";
import {useGetFileTypes} from "../../utils/queries.tsx";

type SnippetTableProps = {
  handleClickSnippet: (id: string) => void;
  snippets?: Snippet[];
  loading: boolean;
  handleSearchSnippet: (snippetName: string) => void;
}

export const SnippetTable = (props: SnippetTableProps) => {
  const {snippets, handleClickSnippet, loading,handleSearchSnippet} = props;
  const [addModalOpened, setAddModalOpened] = useState(false);
  const [popoverMenuOpened, setPopoverMenuOpened] = useState(false)
  const [snippet, setSnippet] = useState<CreateSnippetWithLang | undefined>()

  const popoverRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const {page, page_size: pageSize, count, handleChangePageSize, handleGoToPage} = usePaginationContext()
  const {createSnackbar} = useSnackbarContext()
  const {data: fileTypes} = useGetFileTypes();

  const handleLoadSnippet = async (target: EventTarget & HTMLInputElement) => {
    const files = target.files
    if (!files || !files.length) {
      createSnackbar('error',"Please select at leat one file")
      return
    }
    const file = files[0]
    const splitName = file.name.split(".")
    const fileType = getFileLanguage(fileTypes ?? [], splitName.at(-1))
    if (!fileType) {
      createSnackbar('error', `File type ${splitName.at(-1)} not supported`)
      return
    }
    file.text().then((text) => {
      setSnippet({
        name: splitName[0],
        content: text,
        language: fileType.language,
        extension: fileType.extension
      })
    }).catch(e => {
      console.error(e)
    }).finally(() => {
      setAddModalOpened(true)
      target.value = ""
    })
  }

  function handleClickMenu() {
    setPopoverMenuOpened(false)
  }

  return (
      <>
        <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'space-between', alignItems: 'center'}}>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            width: {xs: '100%', sm: 360},
            bgcolor: 'background.paper',
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            '&:focus-within': {
              borderColor: 'primary.main',
              boxShadow: (theme) => `0 0 0 3px ${alpha(theme.palette.primary.main, 0.15)}`,
            },
          }}>
            <Search fontSize="small" sx={{ml: 1.5, color: 'text.secondary'}}/>
            <InputBase
                sx={{ml: 1, flex: 1, py: 0.75}}
                placeholder="Search snippets by name"
                inputProps={{'aria-label': 'Search snippets by name'}}
                onChange={e => handleSearchSnippet(e.target.value)}
            />
          </Box>
          <Button ref={popoverRef} variant="contained" startIcon={<Add/>}
                  onClick={() => setPopoverMenuOpened(true)}>
            Add snippet
          </Button>
        </Box>
        {/* En pantallas chicas la tabla se desplaza de costado en vez de romper el diseño */}
        <Box sx={{overflowX: 'auto'}}>
          <Table size="medium" sx={{borderSpacing: "0 8px", borderCollapse: "separate", minWidth: 640}}>
            <TableHead>
              <TableRow>
                <HeaderCell>Name</HeaderCell>
                <HeaderCell>Language</HeaderCell>
                <HeaderCell>Author</HeaderCell>
                <HeaderCell>Conformance</HeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>{
              loading ? (
                  <>
                    {Array.from({length: 10}).map((_, index) => (
                        <LoadingSnippetRow key={index}/>
                    ))}
                  </>
              ) : (
                  <>
                    {
                        snippets && snippets.map((snippet) => (
                            <SnippetRow data-testid={"snippet-row"}
                                        onClick={() => handleClickSnippet(snippet.id)} key={snippet.id} snippet={snippet}/>
                        ))
                    }
                  </>
              )
            }
            </TableBody>
          </Table>
        </Box>
        <TablePagination component="div" count={count} page={page} rowsPerPage={pageSize}
                         onPageChange={(_, page) => handleGoToPage(page)}
                         onRowsPerPageChange={e => handleChangePageSize(Number(e.target.value))}/>
        <AddSnippetModal defaultSnippet={snippet} open={addModalOpened}
                         onClose={() => setAddModalOpened(false)}/>
        <Menu anchorEl={popoverRef.current} open={popoverMenuOpened} onClick={handleClickMenu}>
          <MenuItem onClick={() => setAddModalOpened(true)}>Create snippet</MenuItem>
          <MenuItem onClick={() => inputRef?.current?.click()}>Load snippet from file</MenuItem>
        </Menu>
        <input hidden type={"file"} ref={inputRef} multiple={false} data-testid={"upload-file-input"}
               onChange={e => handleLoadSnippet(e?.target)}/>
      </>
  )
}


export const StyledTableCell = styled(TableCell)`
    border: 0;
    align-items: center;
`

const HeaderCell = styled(StyledTableCell)(({theme}) => ({
  paddingBottom: 0,
  color: theme.palette.text.secondary,
  fontSize: '0.8125rem',
  fontWeight: 600,
}))
