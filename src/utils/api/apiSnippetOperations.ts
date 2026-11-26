import axios, {AxiosInstance} from "axios";
import autoBind from "auto-bind";
import {SnippetOperations} from "../snippetOperations.ts";
import {CreateSnippet, PaginatedSnippets, Snippet, UpdateSnippet} from "../snippet.ts";
import {PaginatedUsers} from "../users.ts";
import {paginationParams} from "../pagination.ts";
import {TestCase} from "../../types/TestCase.ts";
import type {TestCaseResult} from "../queries.tsx";
import {FileType} from "../../types/FileType.ts";
import {Rule} from "../../types/Rule.ts";

// Ruta relativa: en la VM la atiende nginx y con `npm run dev`, el proxy de Vite.
// Así la misma imagen sirve en dev y en prod.
const API_URL: string = import.meta.env.VITE_API_URL ?? "/api";

// Lo que devuelve POST /snippets
type SnippetResponse = {
    id: string;
    name: string;
    description: string;
    language: string;
    version: string;
}

// Lo que devuelve GET /snippets/{id} y PUT /snippets/{id}: lo mismo, más el contenido
type SnippetDetailResponse = SnippetResponse & {
    content: string;
}

// Lo que devuelve GET /snippets. Sin contenido: el listado no lo muestra
type PaginatedSnippetsResponse = {
    page: number;
    page_size: number;
    count: number;
    snippets: SnippetResponse[];
}

// Snippets responde 400 con los errores de PrintScript o con un motivo, y 502 con un motivo.
// Algunos 400 y 502 vienen en formato Problem Details (RFC 9457), con el motivo en `detail`
type ApiErrorBody = {
    errors?: { message: string; line: number; column: number }[];
    message?: string;
    detail?: string;
}

export class ApiSnippetOperations implements SnippetOperations {
    private readonly http: AxiosInstance

    // La API todavía no devuelve el autor, la extensión ni el estado del linteo (snippet-service#63).
    // La extensión sale de /languages, que se pide una sola vez por sesión; el resto queda vacío o pendiente
    private languages?: Promise<FileType[]>

    constructor(
        getAccessToken: () => Promise<string>,
        // Lo que todavía no existe en la API sigue con los datos falsos: cada ticket mueve una operación acá
        private readonly fallback: SnippetOperations,
    ) {
        this.http = axios.create({baseURL: API_URL})
        // Cada pedido lleva el token de Auth0: sin él, Snippets responde 401
        this.http.interceptors.request.use(async (config) => {
            config.headers.Authorization = `Bearer ${await getAccessToken()}`
            return config
        })
        autoBind(this)
    }

    async createSnippet(createSnippet: CreateSnippet): Promise<Snippet> {
        const {name, description, language, version, content} = createSnippet
        try {
            const {data} = await this.http.post<SnippetResponse>("/snippets", {name, description, language, version, content})
            // La API no devuelve todo lo que la UI muestra: el contenido y la extensión salen de lo que mandamos
            return {...createSnippet, ...data, compliance: "pending", author: ""}
        } catch (error) {
            throw toError(error)
        }
    }

    async listSnippetDescriptors(page: number, pageSize: number, snippetName?: string): Promise<PaginatedSnippets> {
        const name = snippetName ? `&snippetName=${encodeURIComponent(snippetName)}` : ""
        try {
            const {data} = await this.http.get<PaginatedSnippetsResponse>(`/snippets?${paginationParams(page, pageSize)}${name}`)
            const snippets = await Promise.all(data.snippets.map(snippet => this.toSnippet(snippet, "")))
            return {page: data.page, page_size: data.page_size, count: data.count, snippets}
        } catch (error) {
            throw toError(error)
        }
    }

    async getSnippetById(id: string): Promise<Snippet | undefined> {
        try {
            const {data} = await this.http.get<SnippetDetailResponse>(`/snippets/${encodeURIComponent(id)}`)
            return this.toSnippet(data, data.content)
        } catch (error) {
            // 404: no existe o no es tuyo. La firma ya tiene una forma de decir "no está"
            if (axios.isAxiosError(error) && error.response?.status === 404) return undefined
            throw toError(error)
        }
    }

    async updateSnippetById(id: string, updateSnippet: UpdateSnippet): Promise<Snippet> {
        const {name, description, language, version, content} = updateSnippet
        try {
            const {data} = await this.http.put<SnippetDetailResponse>(
                `/snippets/${encodeURIComponent(id)}`,
                {name, description, language, version, content},
            )
            return this.toSnippet(data, data.content)
        } catch (error) {
            throw toError(error)
        }
    }

    async getFileTypes(): Promise<FileType[]> {
        try {
            // Snippets responde con la forma de FileType: lenguaje, extensión y versiones
            const {data} = await this.http.get<FileType[]>("/languages")
            return data
        } catch (error) {
            // Sin olvidarse del fallo: el próximo pedido vuelve a intentar
            this.languages = undefined
            throw toError(error)
        }
    }

    private async toSnippet(snippet: SnippetResponse, content: string): Promise<Snippet> {
        this.languages ??= this.getFileTypes()
        const extension = (await this.languages.catch(() => [])).find(f => f.language === snippet.language)?.extension ?? ""
        return {...snippet, content, extension, compliance: "pending", author: ""}
    }

    async getUserFriends(name: string = "", page: number = 0, pageSize: number = 10): Promise<PaginatedUsers> {
        try {
            // Snippets responde con la forma de PaginatedUsers: page arranca en 0 y page_size en snake_case
            const {data} = await this.http.get<PaginatedUsers>(
                `/users?name=${encodeURIComponent(name)}&${paginationParams(page, pageSize)}`,
            )
            return data
        } catch (error) {
            throw toError(error)
        }
    }

    async shareSnippet(snippetId: string, userId: string): Promise<Snippet> {
        try {
            const {data} = await this.http.post<SnippetResponse>(
                `/snippets/${encodeURIComponent(snippetId)}/share`,
                {userId},
            )
            // La respuesta no trae el contenido: quien lo necesite lo vuelve a pedir con getSnippetById
            return this.toSnippet(data, "")
        } catch (error) {
            throw toError(error)
        }
    }

    getFormatRules(): Promise<Rule[]> {
        return this.fallback.getFormatRules()
    }

    getLintingRules(): Promise<Rule[]> {
        return this.fallback.getLintingRules()
    }

    getTestCases(): Promise<TestCase[]> {
        return this.fallback.getTestCases()
    }

    formatSnippet(snippet: string): Promise<string> {
        return this.fallback.formatSnippet(snippet)
    }

    postTestCase(testCase: Partial<TestCase>): Promise<TestCase> {
        return this.fallback.postTestCase(testCase)
    }

    removeTestCase(id: string): Promise<string> {
        return this.fallback.removeTestCase(id)
    }

    async deleteSnippet(id: string): Promise<string> {
        try {
            // 204 sin cuerpo: se devuelve el id, que es lo que promete la firma
            await this.http.delete(`/snippets/${encodeURIComponent(id)}`)
            return id
        } catch (error) {
            throw toError(error)
        }
    }

    testSnippet(testCase: Partial<TestCase>): Promise<TestCaseResult> {
        return this.fallback.testSnippet(testCase)
    }

    modifyFormatRule(newRules: Rule[]): Promise<Rule[]> {
        return this.fallback.modifyFormatRule(newRules)
    }

    modifyLintingRule(newRules: Rule[]): Promise<Rule[]> {
        return this.fallback.modifyLintingRule(newRules)
    }
}

// Convierte la respuesta de error de la API en un mensaje que se puede mostrar al usuario
const toError = (error: unknown): Error => {
    if (!axios.isAxiosError<ApiErrorBody>(error)) {
        return error instanceof Error ? error : new Error(String(error))
    }
    const body = error.response?.data
    if (body?.errors?.length) {
        return new Error(body.errors.map(e => `Line ${e.line}, column ${e.column}: ${e.message}`).join("; "))
    }
    if (body?.message) {
        return new Error(body.message)
    }
    if (body?.detail) {
        return new Error(body.detail)
    }
    if (error.response?.status === 401) {
        return new Error("Your session expired. Log in again.")
    }
    return new Error("The request failed. Try again.")
}