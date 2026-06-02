import * as assert from "assert";
import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";

import * as vscode from "vscode";

suite("Extension Test Suite", () => {
  test("formats WordPress block HTML documents", async () => {
    const extension = vscode.extensions.getExtension(
      "co6x0.vscode-wp-block-html"
    );
    assert.ok(extension);
    await extension.activate();

    const workspacePath = await fs.mkdtemp(
      path.join(os.tmpdir(), "vscode-wp-block-html-")
    );
    const filePath = path.join(workspacePath, "template.html");
    const input = [
      "<!-- wp:group -->",
      "<div class=\"wp-block-group\">",
      "<!-- wp:paragraph -->",
      "<p>Hello</p>",
      "<!-- /wp:paragraph -->",
      "</div>",
      "<!-- /wp:group -->",
    ].join("");

    await fs.writeFile(filePath, input);

    const document = await vscode.workspace.openTextDocument(
      vscode.Uri.file(filePath)
    );
    const edits = await vscode.commands.executeCommand<vscode.TextEdit[]>(
      "vscode.executeFormatDocumentProvider",
      document.uri,
      { tabSize: 2, insertSpaces: true }
    );

    assert.ok(edits);
    assert.ok(edits.length > 0);

    const workspaceEdit = new vscode.WorkspaceEdit();
    for (const edit of edits) {
      workspaceEdit.replace(document.uri, edit.range, edit.newText);
    }
    await vscode.workspace.applyEdit(workspaceEdit);

    assert.strictEqual(
      document.getText(),
      [
        "<!-- wp:group -->",
        "  <div class=\"wp-block-group\">",
        "    <!-- wp:paragraph -->",
        "      <p>Hello</p>",
        "    <!-- /wp:paragraph -->",
        "  </div>",
        "<!-- /wp:group -->",
        "",
      ].join("\n")
    );
  });
});
