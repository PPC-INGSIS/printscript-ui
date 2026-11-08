export type FileType = {
    language: string;
    extension: string;
    // Versiones que se pueden elegir al crear un snippet: vienen con el lenguaje, no fijas en la UI
    versions: string[];
}
