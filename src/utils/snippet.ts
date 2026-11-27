import {Pagination} from "./pagination.ts";
import {FileType} from "../types/FileType.ts";

export type ComplianceEnum =
    'pending' |
    'failed' |
    'not-compliant' |
    'compliant'


export type CreateSnippet = {
  name: string;
  description: string;
  content: string;
  language: string;
  // Versión del lenguaje: la API la necesita para validar (const, if y readInput existen desde la 1.1)
  version: string;
  extension: string;
}

export type CreateSnippetWithLang = CreateSnippet & { language: string }

// El PUT de Snippets reemplaza el snippet entero: manda todos los datos, no solo el contenido
export type UpdateSnippet = {
  name: string;
  description: string;
  language: string;
  version: string;
  content: string;
}

export type Snippet = CreateSnippet & {
  id: string
} & SnippetStatus

type SnippetStatus = {
  compliance: ComplianceEnum;
  // Nombre del dueño, para mostrar. No sirve para saber si es mío: dos usuarios pueden llamarse igual
  author: string;
  // Si el que mira es el dueño. Lo calcula Snippets; sin esto la UI ofrecería borrar o compartir lo compartido
  owned: boolean;
}
export type PaginatedSnippets = Pagination & {
  snippets: Snippet[]
}

export const getFileLanguage = (fileTypes: FileType[], fileExt?: string) => {
  return fileExt && fileTypes?.find(x => x.extension == fileExt)
}