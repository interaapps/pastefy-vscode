import * as vscode from 'vscode';
import axios from 'axios';
import { SidebarProvider } from './SidebarProvider';


let sidebarProvider: SidebarProvider|null = null
export async function login() {
	const createAccessRequest = await axios.get("https://pastefy-login.interaapps.de/create").then(r => r.data)

	vscode.env.openExternal(vscode.Uri.parse(createAccessRequest.url))

	let i = 0
	const id = setInterval(async () => {
		const res = await axios.get(`https://pastefy-login.interaapps.de/check?key=${ createAccessRequest.key }`).then(r => r.data)

		if (res.success) {
			vscode.workspace.getConfiguration("pastefy").update('pastefyAPIKey', res.code, vscode.ConfigurationTarget.Global)

			axios.get(`${baseURL()}/api/v2/user`, {
				headers: {
					Authorization: `Bearer ${ res.code }`
				}
			})
				.then(r => r.data)
				.then(user => {
					vscode.window.showInformationMessage(`Pastefy: Welcome back, ${ user.name }!`);
					setUser(user)
				})
			
			clearInterval(id)
		}

		if (i++ > 50) {
			clearInterval(id)
		}
	}, 2500)
}

export function setUser(user: any) {
	if (user?.logged_in) {
		sidebarProvider?._view?.webview.postMessage({type: 'user_update', user })
	}
}


export function baseURL () {
	return vscode.workspace.getConfiguration("pastefy").get("pastefyAPIBase", 'https://pastefy.app')
}

export function createPaste(req: any){
	if (req.content.trim() !== "") {
		return axios.post(`${baseURL()}/api/v2/paste`, req, {
			headers: {
				Authorization: `Bearer ${ vscode.workspace.getConfiguration("pastefy").get("pastefyAPIKey") }`
			}
		}).then(res => {			
			vscode.window.showInformationMessage(`Pasted! https://pastefy.app/${res.data.paste.id}`);
			vscode.env.clipboard.writeText(`https://pastefy.app/${res.data.paste.id}`);
			return res.data
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

	sidebarProvider = new SidebarProvider(context.extensionUri);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			"pastefy-sidebar",
			sidebarProvider,
		)
	);

	
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
			title: `Snippet from ${vscode.window.activeTextEditor?.document.fileName.split('/').slice(-1)}`
		});
	});


	const loginRegistered = vscode.commands.registerCommand('pastefy.login', login)
	
	
	context.subscriptions.push(...[
		explorereContextMenu,
		editorContextMenu,
		loginRegistered
	]);
}

export function deactivate() {}
