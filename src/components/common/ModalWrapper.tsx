import {Box, Modal} from "@mui/material";
import {ReactNode} from "react";

type ModalWrapperProps = {
  open: boolean
  onClose: () => void
  children: ReactNode
  // Para los modales chicos (una pregunta y dos botones): sin esto ocupan la mitad de la pantalla
  maxWidth?: number
}

export const ModalWrapper = ({open, onClose, children, maxWidth}: ModalWrapperProps) => {
  return (
      <Modal
          open={open}
          onClose={onClose}
          aria-labelledby="modal-modal-title"
          aria-describedby="modal-modal-description"
          sx={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}
      >
        <Box sx={{
          backgroundColor: 'white',
          padding: '32px',
          borderRadius: '8px',
          width: maxWidth ? `min(${maxWidth}px, calc(100% - 32px))` : '50%',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {children}
        </Box>
      </Modal>
  )
}
