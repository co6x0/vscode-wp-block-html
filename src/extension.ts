// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import type { DocumentSelector, DocumentFormattingEditProvider } from "vscode";
const prettier = require("prettier");

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  const selector: DocumentSelector = { scheme: "file", language: "html" };
  const provider: DocumentFormattingEditProvider = {
    provideDocumentFormattingEdits(document, options, token) {
      const text = document.getText();
      const formattedText = prettier.format(text, {
        parser: "html",
        plugins: [require("prettier-plugin-wp-block-html")],
      });

      const range = new vscode.Range(
        document.positionAt(0),
        document.positionAt(text.length)
      );
      const textEdit = new vscode.TextEdit(range, formattedText);
      return [textEdit];
    },
  };

  const disposableFormatting =
    vscode.languages.registerDocumentFormattingEditProvider(selector, provider);

  context.subscriptions.push(disposableFormatting);
}

// This method is called when your extension is deactivated
export function deactivate() {}
