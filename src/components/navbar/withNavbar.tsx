import {ComponentType} from "react";
import {Navbar} from "./Navbar.tsx";
import {Container} from "@mui/material";

export const withNavbar = (WrappedComponent: ComponentType<unknown>) => {
    return () => (
        <>
            <Navbar/>
            <Container component="main" maxWidth="lg" sx={{py: {xs: 3, md: 5}}}>
                <WrappedComponent/>
            </Container>
        </>
    );
};
