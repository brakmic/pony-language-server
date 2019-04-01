/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

/* 01. Apr. 2019 - changes by @brakmic */

import {
	createConnection,
	TextDocuments,
	TextDocument,
	Diagnostic,
	DiagnosticSeverity,
	ProposedFeatures,
	InitializeParams,
	DidChangeConfigurationNotification,
	CompletionItem,
	CompletionItemKind,
	TextDocumentPositionParams,
	Hover,
	HoverRequest,
	SignatureHelp
} from 'vscode-languageserver';

import { uri2path, normalizeUri } from './util';

// Create a connection for the server. The connection uses Node's IPC as a transport.
// Also include all preview / proposed LSP features.
let connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager. The text document manager
// supports full document sync only
let documents: TextDocuments = new TextDocuments();

let hasConfigurationCapability: boolean = false;
let hasWorkspaceFolderCapability: boolean = false;
let hasDiagnosticRelatedInformationCapability: boolean = false;

connection.onInitialize((params: InitializeParams) => {
	let capabilities = params.capabilities;

	// Does the client support the `workspace/configuration` request?
	// If not, we will fall back using global settings
	hasConfigurationCapability = !!(
		capabilities.workspace && !!capabilities.workspace.configuration
	);
	hasWorkspaceFolderCapability = !!(
		capabilities.workspace && !!capabilities.workspace.workspaceFolders
	);
	hasDiagnosticRelatedInformationCapability = !!(
		capabilities.textDocument &&
		capabilities.textDocument.publishDiagnostics &&
		capabilities.textDocument.publishDiagnostics.relatedInformation
	);

	return {
		capabilities: {
			textDocumentSync: documents.syncKind,
			// Tell the client that the server supports code completion
			completionProvider: {
				resolveProvider: true,
				triggerCharacters: ['.'],
			},
			hoverProvider: true,
			signatureHelpProvider: {
				triggerCharacters: ['(', ','],
			},
		}
	};
});

connection.onInitialized(() => {
	if (hasConfigurationCapability) {
		// Register for all configuration changes.
		connection.client.register(DidChangeConfigurationNotification.type, undefined);
	}
	if (hasWorkspaceFolderCapability) {
		connection.workspace.onDidChangeWorkspaceFolders(_event => {
			connection.console.log('Workspace folder change event received.');
		});
	}
});

// The example settings
interface ExampleSettings {
	maxNumberOfProblems: number;
}

// The global settings, used when the `workspace/configuration` request is not supported by the client.
// Please note that this is not the case when using this server with the client provided in this example
// but could happen with other clients.
const defaultSettings: ExampleSettings = { maxNumberOfProblems: 1000 };
let globalSettings: ExampleSettings = defaultSettings;

// Cache the settings of all open documents
let documentSettings: Map<string, Thenable<ExampleSettings>> = new Map();

connection.onDidChangeConfiguration(change => {
	if (hasConfigurationCapability) {
		// Reset all cached document settings
		documentSettings.clear();
	} else {
		globalSettings = <ExampleSettings>(
			(change.settings.languageServerExample || defaultSettings)
		);
	}

	// Revalidate all open text documents
	documents.all().forEach(validateTextDocument);
});

function getDocumentSettings(resource: string): Thenable<ExampleSettings> {
	if (!hasConfigurationCapability) {
		return Promise.resolve(globalSettings);
	}
	let result = documentSettings.get(resource);
	if (!result) {
		result = connection.workspace.getConfiguration({
			scopeUri: resource,
			section: 'languageServerPony'
		});
		documentSettings.set(resource, result);
	}
	return result;
}

// Only keep settings for open documents
documents.onDidClose(e => {
	documentSettings.delete(e.document.uri);
});

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(change => {
	validateTextDocument(change.document);
});

async function validateTextDocument(textDocument: TextDocument): Promise<void> {
	// In this simple example we get the settings for every validate run.
	let settings = await getDocumentSettings(textDocument.uri);

	// The validator creates diagnostics for all uppercase words length 2 and more
	let text = textDocument.getText();
	let pattern = /\b[A-Z]{2,}\b/g;
	let m: RegExpExecArray | null;

	let problems = 0;
	let diagnostics: Diagnostic[] = [];
	while ((m = pattern.exec(text)) && problems < settings.maxNumberOfProblems) {
		problems++;
		let diagnostic: Diagnostic = {
			severity: DiagnosticSeverity.Warning,
			range: {
				start: textDocument.positionAt(m.index),
				end: textDocument.positionAt(m.index + m[0].length)
			},
			message: `${m[0]} is all uppercase.`,
			source: 'ex'
		};
		if (hasDiagnosticRelatedInformationCapability) {
			diagnostic.relatedInformation = [
				{
					location: {
						uri: textDocument.uri,
						range: Object.assign({}, diagnostic.range)
					},
					message: 'Spelling matters'
				},
				{
					location: {
						uri: textDocument.uri,
						range: Object.assign({}, diagnostic.range)
					},
					message: 'Particularly for names'
				}
			];
		}
		diagnostics.push(diagnostic);
	}

	// Send the computed diagnostics to VSCode.
	connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

connection.onDidChangeWatchedFiles(_change => {
	// Monitored files have change in VSCode
	connection.console.log('We received an file change event');
});

// This handler provides the initial list of the completion items.
connection.onCompletion(
	(params: TextDocumentPositionParams): CompletionItem[] => {
		return [
			{
				label: 'actor',
				kind: CompletionItemKind.Class,
				data: 1
			},
			{
				label: 'class',
				kind: CompletionItemKind.Class,
				data: 2
			},
			{
				label: 'fun',
				kind: CompletionItemKind.Function,
				data: 3
			},
			{
				label: 'be',
				kind: CompletionItemKind.Method,
				data: 4
			},
			{
				label: 'let',
				kind: CompletionItemKind.Constant,
				data: 5
			},
			{
				label: 'var',
				kind: CompletionItemKind.Variable,
				data: 6
			},
			{
				label: 'iso',
				kind: CompletionItemKind.Reference,
				data: 7
			},
			{
				label: 'ref',
				kind: CompletionItemKind.Reference,
				data: 8
			},
			{
				label: 'tag',
				kind: CompletionItemKind.Reference,
				data: 9
			},
			{
				label: 'box',
				kind: CompletionItemKind.Reference,
				data: 10
			},
			{
				label: 'val',
				kind: CompletionItemKind.Reference,
				data: 11
			},
			{
				label: 'struct',
				kind: CompletionItemKind.Struct,
				data: 12
			},
			{
				label: 'type',
				kind: CompletionItemKind.Class,
				data: 13
			},
			{
				label: 'if',
				kind: CompletionItemKind.Keyword,
				data: 14
			},
			{
				label: 'then',
				kind: CompletionItemKind.Keyword,
				data: 15
			},
			{
				label: 'else',
				kind: CompletionItemKind.Keyword,
				data: 16
			},
			{
				label: 'try',
				kind: CompletionItemKind.Keyword,
				data: 17
			},
			{
				label: 'end',
				kind: CompletionItemKind.Keyword,
				data: 18
			},
			{
				label: 'error',
				kind: CompletionItemKind.Keyword,
				data: 19
			},
			{
				label: 'is',
				kind: CompletionItemKind.Keyword,
				data: 20
			},
			{
				label: 'not',
				kind: CompletionItemKind.Keyword,
				data: 21
			},
			{
				label: 'where',
				kind: CompletionItemKind.Keyword,
				data: 22
			},
			{
				label: 'do',
				kind: CompletionItemKind.Keyword,
				data: 23
			},
			{
				label: 'object',
				kind: CompletionItemKind.Class,
				data: 24
			},
			{
				label: 'create',
				kind: CompletionItemKind.Constructor,
				data: 25
			},
			{
				label: 'new',
				kind: CompletionItemKind.Keyword,
				data: 26
			},
		];
	}
);
// This handler presents additional information elements when users hover over them.
connection.onHover((params: TextDocumentPositionParams): Hover => {
	const uri = normalizeUri(params.textDocument.uri);
	const fileName: string = uri2path(uri);
	

	return {
		contents: ["If I only knew how to generate proper Hover results :("]
	};
});

// This handler resolves additional information for the item selected in
// the completion list.
connection.onCompletionResolve(
	(item: CompletionItem): CompletionItem => {
		if (item.data === 1) {
			item.detail = 'actor';
			item.documentation = 'An actor is similar to a class, but with one critical difference: an actor can have behaviours.';
		} else if (item.data === 2) {
			item.detail = 'class';
			item.documentation = 'Just like other object-oriented languages, Pony has classes. A class is declared with the keyword class, and it has to have a name that starts with a capital letter.';
		}
		return item;
	}
);
// This handler resolves additional information for the current function
connection.onSignatureHelp((params: TextDocumentPositionParams): SignatureHelp => {
	return {
		activeParameter: 0,
		activeSignature: 0,
		signatures: [
			{
				documentation: "Signature Documentation comes here",
				label: "Signature Label",
				parameters: [
					{
						documentation: "Parameter doc",
						label: "Paramenter label"
					}
				]
			}
		]
	};
});

/*
connection.onDidOpenTextDocument((params) => {
	// A text document got opened in VSCode.
	// params.uri uniquely identifies the document. For documents store on disk this is a file URI.
	// params.text the initial full content of the document.
	connection.console.log(`${params.textDocument.uri} opened.`);
});
connection.onDidChangeTextDocument((params) => {
	// The content of a text document did change in VSCode.
	// params.uri uniquely identifies the document.
	// params.contentChanges describe the content changes to the document.
	connection.console.log(`${params.textDocument.uri} changed: ${JSON.stringify(params.contentChanges)}`);
});
connection.onDidCloseTextDocument((params) => {
	// A text document got closed in VSCode.
	// params.uri uniquely identifies the document.
	connection.console.log(`${params.textDocument.uri} closed.`);
});
*/

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
