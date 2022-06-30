import * as vscode from 'vscode';
import axios from 'axios';

function createPaste(req: {content: string, title: string}){
	if (req.content.trim() !== "") {
		console.log(req);
		
		axios.post("https://pastefy.ga/api/v2/paste", req, {
			headers: {
				Authorization: `Bearer ${ vscode.workspace.getConfiguration("pastefy").get("pastefyAPIKey") }`
			}
		}).then((res)=>{			
			vscode.window.showInformationMessage('Pasted! '+"https://pastefy.ga/"+res.data.paste.id);
			vscode.env.clipboard.writeText("https://pastefy.ga/"+res.data.paste.id);
		}).catch(e => {
			console.log(e);
			
			vscode.window.showErrorMessage("Error while pasting!");
		});	
	} else  {
		vscode.window.showInformationMessage("You cannot send empty code.");
	}
}

function getSimpleFileName(name : string) : string {
	const splittedFileName = name.split("/")
	if (splittedFileName.length == 1)
		return name;
	return splittedFileName[splittedFileName.length-1]
}

export function activate(context: vscode.ExtensionContext) {
	const explorereContextMenu = vscode.commands.registerCommand('pastefy.pasteFromExplorerContextMenu', (clickedFile: vscode.Uri, selectedFiles: vscode.Uri[]) => {
		vscode.workspace.openTextDocument(clickedFile).then((document) => {
			createPaste({
				content: document.getText(), 
				title: getSimpleFileName(document.fileName)
			});
		});
	});

	const editorContextMenu = vscode.commands.registerCommand('pastefy.pasteFromEditorContextMenu', () => {
		createPaste({
			content: vscode.window.activeTextEditor?.document.getText(vscode.window.activeTextEditor?.selection) || "", 
			title: `Snippet from ${vscode.window.activeTextEditor?.document.fileName}`
		});
	});


	const login = vscode.commands.registerCommand('pastefy.login', async () => {
		const createAccessRequest = await axios.get("https://pastefy-login.interaapps.de/create").then(r => r.data)

		vscode.env.openExternal(vscode.Uri.parse(createAccessRequest.url))

		let i = 0
		const id = setInterval(async () => {
			const res = await axios.get(`https://pastefy-login.interaapps.de/check?key=${ createAccessRequest.key }`).then(r => r.data)

			if (res.success) {
				vscode.workspace.getConfiguration("pastefy").update('pastefyAPIKey', res.code)

				axios.get(`https://pastefy.ga/api/v2/user`, {
					headers: {
						Authorization: `Bearer ${ res.code }`
					}
				})
					.then(r => r.data)
					.then(user => {
						console.log(user);
						
						vscode.window.showInformationMessage(`Pastefy: Welcome back, ${ user.name }!`);
					})
				
				clearInterval(id)
			}

			if (i++ > 50) {
				clearInterval(id)
			}
		}, 2500)
	})
	
	
	context.subscriptions.push(...[
		explorereContextMenu,
		editorContextMenu,
		login
	]);
}

export function deactivate() {}
