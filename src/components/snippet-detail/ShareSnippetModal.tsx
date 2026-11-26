import {Autocomplete, Box, Button, TextField, Typography} from "@mui/material";
import {useAuth0} from "@auth0/auth0-react";
import {ModalWrapper} from "../common/ModalWrapper.tsx";
import {useGetUsers} from "../../utils/queries.tsx";
import {useEffect, useState} from "react";
import {User} from "../../utils/users.ts";
import {fonts} from "../../theme.ts";

// Espera a que se deje de escribir antes de buscar: cada búsqueda es un pedido a Auth0
const SEARCH_DELAY_MS = 400
const MAX_RESULTS = 5

type ShareSnippetModalProps = {
  open: boolean
  onClose: () => void
  onShare: (user: User) => void
  loading: boolean
  snippetName: string
}

export const ShareSnippetModal = (props: ShareSnippetModalProps) => {
  const {open, onClose, onShare, loading, snippetName} = props
  const {user: me} = useAuth0()
  const [name, setName] = useState("")
  const [debouncedName, setDebouncedName] = useState("")
  // La API cuenta las páginas desde 0
  const {data, isLoading} = useGetUsers(debouncedName, 0, MAX_RESULTS)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  useEffect(() => {
    const getData = setTimeout(() => {
      setDebouncedName(name)
    }, SEARCH_DELAY_MS)
    return () => clearTimeout(getData)
  }, [name])

  // Al cerrar, el próximo snippet arranca de cero
  useEffect(() => {
    if (!open) {
      setName("")
      setDebouncedName("")
      setSelectedUser(null)
    }
  }, [open])

  // Compartir con uno mismo no cambia nada: ya es el dueño
  const users = (data?.users ?? []).filter(user => user.id !== me?.sub)

  return (
      <ModalWrapper open={open} onClose={onClose} maxWidth={480}>
        <Box display={"flex"} flexDirection={"column"} gap={0.5}>
          <Typography id="modal-modal-title" variant={"h6"} fontWeight={600} sx={{overflowWrap: 'anywhere'}}>
            Share{" "}
            <Box component={"span"} sx={{fontFamily: fonts.mono, fontWeight: 500}}>"{snippetName}"</Box>
          </Typography>
          <Typography id="modal-modal-description" color={"text.secondary"}>
            They get read-only access: they can't change or delete it.
          </Typography>
        </Box>

        <Autocomplete
            renderInput={(params) => <TextField {...params} label="Search people by name" autoFocus/>}
            options={users}
            filterOptions={(options) => options}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            getOptionLabel={(option) => option.name}
            loading={isLoading}
            loadingText={"Searching…"}
            noOptionsText={debouncedName ? `No one named "${debouncedName}"` : "Type a name to search"}
            value={selectedUser}
            onInputChange={(_, newValue) => setName(newValue)}
            onChange={(_, newValue) => setSelectedUser(newValue)}
        />

        <Box display={"flex"} justifyContent={"flex-end"} gap={1.5} mt={1}>
          <Button onClick={onClose} variant={"outlined"} disabled={loading}>Cancel</Button>
          <Button
              disabled={!selectedUser || loading}
              onClick={() => selectedUser && onShare(selectedUser)}
              variant={"contained"}
          >
            {loading ? "Sharing…" : "Share"}
          </Button>
        </Box>
      </ModalWrapper>
  )
}
