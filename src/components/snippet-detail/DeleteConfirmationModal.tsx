import {Box, Button, Typography} from "@mui/material";
import {alpha} from "@mui/material/styles";
import {DeleteOutline} from "@mui/icons-material";
import {ModalWrapper} from "../common/ModalWrapper.tsx";
import {useDeleteSnippet} from "../../utils/queries.tsx";
import {queryClient} from "../../App.tsx";
import {useSnackbarContext} from "../../contexts/snackbarContext.tsx";
import {fonts} from "../../theme.ts";

type DeleteConfirmationModalProps = {
  open: boolean
  onClose: () => void
  id: string;
  name: string;
  setCloseDetails: () => void;
}

export const DeleteConfirmationModal = (props: DeleteConfirmationModalProps) => {
  const {open, onClose, id, name, setCloseDetails} = props;
  const {createSnackbar} = useSnackbarContext()

  const {mutate: deleteSnippet, isLoading} = useDeleteSnippet({
    onSuccess: async () => {
      onClose();
      setCloseDetails();
      createSnackbar('success', `Deleted "${name}"`)
      await queryClient.invalidateQueries('listSnippets')
    },
  })

  const handleDelete = () =>
      deleteSnippet(id, {onError: (error) => createSnackbar('error', error.message)})

  return (
      // Mientras borra no se puede cerrar: el pedido sigue igual y el resultado quedaría sin mostrar
      <ModalWrapper open={open} onClose={isLoading ? () => undefined : onClose} maxWidth={400}>
        <Box display={"flex"} flexDirection={"column"} alignItems={"center"} textAlign={"center"} gap={1.5}>
          <Box
              aria-hidden
              sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                color: 'error.main',
                backgroundColor: (theme) => alpha(theme.palette.error.main, 0.1),
              }}
          >
            <DeleteOutline/>
          </Box>

          <Typography id="modal-modal-title" variant={"h6"} fontWeight={600} sx={{overflowWrap: 'anywhere'}}>
            Delete{" "}
            <Box component={"span"} sx={{fontFamily: fonts.mono, fontWeight: 500}}>"{name}"</Box>?
          </Typography>

          <Typography id="modal-modal-description" color={"text.secondary"} sx={{maxWidth: 300}}>
            Its code is deleted and everyone you shared it with loses access. This can't be undone.
          </Typography>
        </Box>

        <Box display={"grid"} gridTemplateColumns={"1fr 1fr"} gap={1.5} mt={1}>
          {/* El foco arranca acá: un Enter apurado cancela, no borra */}
          <Button onClick={onClose} variant={"outlined"} autoFocus disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleDelete} variant={"contained"} color={"error"} disabled={isLoading}>
            {isLoading ? "Deleting…" : "Delete"}
          </Button>
        </Box>
      </ModalWrapper>
  )
}
