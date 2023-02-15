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
      console.log(document, options, token);
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

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  const disposableCommand = vscode.commands.registerCommand(
    "wp-block-html.helloWorld",
    () => {
      // The code you place here will be executed every time your command is executed
      // Display a message box to the user
      vscode.window.showInformationMessage("Hello World from test!");
    }
  );

  context.subscriptions.push(disposableCommand);
}

// This method is called when your extension is deactivated
export function deactivate() {}
