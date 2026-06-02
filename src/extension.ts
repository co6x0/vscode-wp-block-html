import * as vscode from "vscode";
import type { DocumentSelector, DocumentFormattingEditProvider } from "vscode";
import * as prettier from "prettier";

let pluginPromise: Promise<prettier.Plugin> | undefined;

async function getWpBlockHtmlPlugin(): Promise<prettier.Plugin> {
  pluginPromise ??= import("prettier-plugin-wp-block-html").then((plugin) => {
    return plugin.default ?? plugin;
  });

  return pluginPromise;
}

export function activate(context: vscode.ExtensionContext) {
  const selector: DocumentSelector = { scheme: "file", language: "html" };
  const provider: DocumentFormattingEditProvider = {
    async provideDocumentFormattingEdits(document, options, token) {
      const text = document.getText();

      try {
        const plugin = await getWpBlockHtmlPlugin();

        if (token.isCancellationRequested) {
          return [];
        }

        const formattedText = await prettier.format(text, {
          filepath: document.uri.fsPath,
          parser: "wp-block-html",
          plugins: [plugin],
          tabWidth: options.tabSize,
          useTabs: !options.insertSpaces,
        });

        if (token.isCancellationRequested || formattedText === text) {
          return [];
        }

        const range = new vscode.Range(
          document.positionAt(0),
          document.positionAt(text.length)
        );

        return [new vscode.TextEdit(range, formattedText)];
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown formatting error";
        void vscode.window.showErrorMessage(
          `WP Block HTML formatting failed: ${message}`
        );

        return [];
      }
    },
  };

  const disposableFormatting =
    vscode.languages.registerDocumentFormattingEditProvider(selector, provider);

  context.subscriptions.push(disposableFormatting);
}

export function deactivate() {}
