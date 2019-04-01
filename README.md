# Pony Language Server - Work in Progress

**Tooltips**

![tooltips](https://raw.githubusercontent.com/brakmic/pony-language-server/master/img/docinfo.png)

**Hover**

![hover](https://raw.githubusercontent.com/brakmic/pony-language-server/master/img/hover.png)

**Intellisense**

![intellisense](https://raw.githubusercontent.com/brakmic/pony-language-server/master/img/intellisense.png)

**Function Signatures**

![signatures](https://raw.githubusercontent.com/brakmic/pony-language-server/master/img/signature_completion.png)

Based on Article & Code from https://code.visualstudio.com/api/language-extensions/language-server-extension-guide

## Functionality

This Language Server works for [Pony](https://www.ponylang.io/) files. It has the following language features:

- Completions
- Hover
- Function Signature Help
- Diagnostics regenerated on each file change or configuration change

The associated client also includes an End-to-End test.

## Structure

```
.
├── client // Language Client
│   ├── src
│   │   ├── test // End to End tests for Pony Language Client / Server
│   │   └── extension.ts // Pony Language Client entry point
├── package.json // The extension manifest.
└── server // Pony Language Server
    └── src
        └── server.ts // Pony Language Server entry point
```

## Running the Sample

* Run `npm install` in this folder. This installs all necessary npm modules in both the client and server folder
* Open VS Code on this folder.
* Press *Ctrl+Shift+B* or *Cmd+Shift+B to* compile the client and server.
* Switch to the Debug viewlet.
* Select `Launch Client` from the drop down.
* Run the launch config.
* If you want to debug the server as well use the launch configuration `Attach to Server`
* In the [Extension Development Host] instance of VSCode, open a document in `pony` language mode.
* Type one of the keywords like `actor` or `class` to see completion. 
* Enter text content such as `AAA aaa BBB`. The extension will emit diagnostics for all words in all-uppercase.

### License

[MIT](https://github.com/brakmic/pony-language-server/blob/master/LICENSE)