import axios, {AxiosInstance} from "axios";
import autoBind from "auto-bind";
import {SnippetOperations} from "../snippetOperations.ts";
import {CreateSnippet, PaginatedSnippets, Snippet, UpdateSnippet} from "../snippet.ts";
import {PaginatedUsers} from "../users.ts";
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

// Snippets responde 400 con los errores de PrintScript o con un motivo
type ApiErrorBody = {
    errors?: { message: string; line: number; column: number }[];
    message?: string;
}

export class ApiSnippetOperations implements SnippetOperations {
    private readonly http: AxiosInstance

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

    listSnippetDescriptors(page: number, pageSize: number, snippetName?: string): Promise<PaginatedSnippets> {
        return this.fallback.listSnippetDescriptors(page, pageSize, snippetName)
    }

    getSnippetById(id: string): Promise<Snippet | undefined> {
        return this.fallback.getSnippetById(id)
    }

    updateSnippetById(id: string, updateSnippet: UpdateSnippet): Promise<Snippet> {
        return this.fallback.updateSnippetById(id, updateSnippet)
    }

    getUserFriends(name?: string, page?: number, pageSize?: number): Promise<PaginatedUsers> {
        return this.fallback.getUserFriends(name, page, pageSize)
    }

    shareSnippet(snippetId: string, userId: string): Promise<Snippet> {
        return this.fallback.shareSnippet(snippetId, userId)
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

    deleteSnippet(id: string): Promise<string> {
        return this.fallback.deleteSnippet(id)
    }

    testSnippet(testCase: Partial<TestCase>): Promise<TestCaseResult> {
        return this.fallback.testSnippet(testCase)
    }

    getFileTypes(): Promise<FileType[]> {
        return this.fallback.getFileTypes()
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
    if (error.response?.status === 401) {
        return new Error("Your session expired. Log in again.")
    }
    return new Error("The request failed. Try again.")
}