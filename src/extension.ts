import * as vscode from 'vscode';
import axios from 'axios';
import * as querystring from 'querystring';

function createPaste(content: string){
	if (content.trim() !== "") {
		axios.post("https://pastefy.ga/create:paste", {
			content: content
		}).then((res)=>{
			vscode.window.showInformationMessage('Pasted! '+"https://pastefy.ga/"+res.data.id);
			vscode.env.clipboard.writeText("https://pastefy.ga/"+res.data.id);
		});	
	} else  {
		vscode.window.showInformationMessage("You cannot send empty code.");
	}
}

export function activate(context: vscode.ExtensionContext) {
	let explorereContextMenu = vscode.commands.registerCommand('pastefy.pasteFromExplorerContextMenu', (clickedFile: vscode.Uri, selectedFiles: vscode.Uri[]) => {
		vscode.workspace.openTextDocument(clickedFile).then((document) => {
			createPaste(document.getText());
			let text = document.getText();
		});
	});

	let editorContextMenu = vscode.commands.registerCommand('pastefy.pasteFromEditorContextMenu', () => {
		createPaste(vscode.window.activeTextEditor?.document.getText(vscode.window.activeTextEditor?.selection) || "");
	});



	context.subscriptions.push(...[
		explorereContextMenu,
		editorContextMenu
	]);
}

export function deactivate() {}
