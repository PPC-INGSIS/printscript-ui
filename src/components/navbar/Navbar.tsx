import {
    AppBar,
    Avatar,
    Box,
    Button,
    Container,
    Divider,
    IconButton,
    ListItemIcon,
    Menu,
    MenuItem,
    Toolbar,
    Tooltip,
    Typography
} from "@mui/material";
import {Code, Logout, Rule} from "@mui/icons-material";
import {MouseEvent, ReactNode, useState} from "react";
import {useLocation, useNavigate} from "react-router-dom";
import {useAuth0} from "@auth0/auth0-react";
import {keyframes} from "@emotion/react";
import {fonts, syntax, tokens} from "../../theme.ts";

type PageType = {
    title: string;
    path: string;
    icon: ReactNode;
}

const pages: PageType[] = [{
    title: 'Snippets',
    path: '/',
    icon: <Code/>
}, {
    title: 'Rules',
    path: '/rules',
    icon: <Rule/>
}];

// Cantidad de caracteres de println("Snippets"); : el ancho que ocupa en una fuente monoespaciada
const WORDMARK_LENGTH = 20;

const typing = keyframes`
    from { width: 0; }
    to { width: ${WORDMARK_LENGTH}ch; }
`;

const blink = keyframes`
    50% { opacity: 0; }
`;

const noMotion = {'@media (prefers-reduced-motion: reduce)': {animation: 'none'}};

// El logo es una línea de PrintScript que se escribe una sola vez al cargar
const Wordmark = () => (
    <Box component="span" sx={{display: 'inline-flex', alignItems: 'center', fontFamily: fonts.mono, fontWeight: 500}}>
        <Box component="span" aria-hidden sx={{
            display: 'inline-block',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            width: `${WORDMARK_LENGTH}ch`,
            animation: `${typing} 1.1s steps(${WORDMARK_LENGTH}) 0.3s both`,
            ...noMotion,
        }}>
            <Box component="span" sx={{color: syntax.keyword}}>println</Box>
            <Box component="span" sx={{color: syntax.punctuation}}>(</Box>
            <Box component="span" sx={{color: syntax.string}}>"Snippets"</Box>
            <Box component="span" sx={{color: syntax.punctuation}}>);</Box>
        </Box>
        <Box component="span" aria-hidden sx={{
            width: '0.55ch',
            height: '1.1em',
            ml: '2px',
            bgcolor: syntax.caret,
            // Titila unas veces cuando termina de escribirse y queda fijo
            animation: `${blink} 1s steps(1) 1.4s 5`,
            ...noMotion,
        }}/>
    </Box>
);

const getInitials = (text: string) =>
    text.split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map(part => part[0].toUpperCase()).join('');

const UserMenu = () => {
    const {user, logout} = useAuth0();
    const [anchor, setAnchor] = useState<HTMLElement | null>(null);
    const name = user?.name ?? user?.email ?? '';

    const handleOpen = (event: MouseEvent<HTMLElement>) => setAnchor(event.currentTarget);
    const handleClose = () => setAnchor(null);
    const handleSignOut = () => logout({logoutParams: {returnTo: window.location.origin}});

    return (
        <>
            <Tooltip title="Account">
                <IconButton onClick={handleOpen} size="small" aria-label="Account menu" aria-haspopup="menu"
                            aria-expanded={anchor ? 'true' : undefined}>
                    <Avatar src={user?.picture} alt={name}
                            sx={{width: 34, height: 34, bgcolor: syntax.keyword, color: tokens.ink, fontSize: 14, fontWeight: 600}}>
                        {getInitials(name)}
                    </Avatar>
                </IconButton>
            </Tooltip>
            <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={handleClose}
                  anchorOrigin={{vertical: 'bottom', horizontal: 'right'}}
                  transformOrigin={{vertical: 'top', horizontal: 'right'}}
                  slotProps={{paper: {sx: {mt: 1, minWidth: 240}}}}>
                <Box sx={{px: 2, py: 1.5}}>
                    <Typography variant="body2" fontWeight={600} noWrap>{user?.name}</Typography>
                    {user?.email && user.email !== user.name && (
                        <Typography variant="body2" color="text.secondary" noWrap>{user.email}</Typography>
                    )}
                </Box>
                <Divider/>
                <MenuItem onClick={handleSignOut}>
                    <ListItemIcon><Logout fontSize="small"/></ListItemIcon>
                    Sign out
                </MenuItem>
            </Menu>
        </>
    );
};

export const Navbar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    return (
        <AppBar position="sticky" elevation={0}>
            <Container maxWidth="lg">
                <Toolbar disableGutters sx={{gap: {xs: 1.5, sm: 4}}}>
                    <Box component="a" href="/" aria-label="Snippets, home"
                         onClick={(event: MouseEvent) => {
                             event.preventDefault();
                             navigate('/');
                         }}
                         sx={{
                             color: 'inherit',
                             textDecoration: 'none',
                             display: 'flex',
                             borderRadius: 1,
                             '&:focus-visible': {outline: `2px solid ${syntax.keyword}`, outlineOffset: 4},
                         }}>
                        <Wordmark/>
                    </Box>
                    <Box component="nav" sx={{display: 'flex', gap: 0.5, flexGrow: 1}}>
                        {pages.map((page) => {
                            const active = location.pathname === page.path;
                            return (
                                <Button
                                    key={page.title}
                                    onClick={() => navigate(page.path)}
                                    startIcon={page.icon}
                                    aria-label={page.title}
                                    aria-current={active ? 'page' : undefined}
                                    sx={{
                                        position: 'relative',
                                        px: 1.5,
                                        minWidth: 0,
                                        color: active ? '#FFFFFF' : 'rgba(255, 255, 255, 0.68)',
                                        '& .MuiButton-startIcon': {mr: {xs: 0, sm: 1}, ml: 0},
                                        '&::after': {
                                            content: '""',
                                            position: 'absolute',
                                            left: 12,
                                            right: 12,
                                            bottom: 0,
                                            height: 2,
                                            borderRadius: 1,
                                            bgcolor: active ? syntax.keyword : 'transparent',
                                        },
                                        '&:hover': {color: '#FFFFFF', bgcolor: 'rgba(255, 255, 255, 0.08)'},
                                    }}
                                >
                                    <Box component="span" sx={{display: {xs: 'none', sm: 'inline'}}}>{page.title}</Box>
                                </Button>
                            );
                        })}
                    </Box>
                    <UserMenu/>
                </Toolbar>
            </Container>
        </AppBar>
    );
}
