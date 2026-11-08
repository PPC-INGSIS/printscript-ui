import {alpha, Box, Skeleton, styled, TableRow, TableRowProps} from "@mui/material";
import {StyledTableCell} from "./SnippetTable.tsx";
import {ComplianceEnum, Snippet} from "../../utils/snippet.ts";
import {tokens} from "../../theme.ts";

// Cada estado usa el color de un tipo de token: string (bien), number (en curso), error (mal)
const compliance: Record<ComplianceEnum, { label: string, color: string }> = {
  'compliant': {label: 'Compliant', color: tokens.string},
  'pending': {label: 'Pending', color: tokens.number},
  'not-compliant': {label: 'Not compliant', color: tokens.error},
  'failed': {label: 'Failed', color: tokens.error},
};

const StyledTableRow = styled(TableRow)(({theme}) => ({
  backgroundColor: theme.palette.background.paper,
  height: '68px',
  cursor: 'pointer',
  '& td': {
    borderTop: `1px solid ${theme.palette.divider}`,
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  '& td:first-of-type': {
    borderLeft: `1px solid ${theme.palette.divider}`,
    borderTopLeftRadius: theme.shape.borderRadius,
    borderBottomLeftRadius: theme.shape.borderRadius,
  },
  '& td:last-of-type': {
    borderRight: `1px solid ${theme.palette.divider}`,
    borderTopRightRadius: theme.shape.borderRadius,
    borderBottomRightRadius: theme.shape.borderRadius,
  },
  '&:hover > td': {
    backgroundColor: alpha(theme.palette.primary.main, 0.04),
    borderColor: alpha(theme.palette.primary.main, 0.35),
  },
}));

const ComplianceChip = ({status}: { status: ComplianceEnum }) => {
  const {label, color} = compliance[status];
  return (
      <Box component="span" sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1,
        px: 1.25,
        py: 0.5,
        borderRadius: 999,
        bgcolor: alpha(color, 0.1),
        color,
        fontSize: '0.8125rem',
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}>
        <Box component="span" sx={{width: 8, height: 8, borderRadius: '50%', bgcolor: color}}/>
        {label}
      </Box>
  )
}

export const SnippetRow = ({snippet, onClick, ...props}: { snippet: Snippet, onClick: () => void } & TableRowProps) => {
  return (
      <StyledTableRow onClick={onClick} {...props}>
        {/* La barra de la izquierda repite el color de la conformidad, para leerla de un vistazo */}
        <StyledTableCell sx={{
          fontWeight: 600,
          boxShadow: `inset 4px 0 0 ${compliance[snippet.compliance].color}`,
        }}>
          {snippet.name}
        </StyledTableCell>
        <StyledTableCell>{snippet.language}</StyledTableCell>
        <StyledTableCell sx={{color: 'text.secondary'}}>{snippet.author}</StyledTableCell>
        <StyledTableCell><ComplianceChip status={snippet.compliance}/></StyledTableCell>
      </StyledTableRow>
  )
}

export const LoadingSnippetRow = () => {
  return (
      <TableRow sx={{height: '68px', padding: 0}}>
        <StyledTableCell colSpan={4} sx={{padding: 0}}>
          <Skeleton height={"68px"} width={"100%"} variant={"rounded"}/>
        </StyledTableCell>
      </TableRow>
  )
}
