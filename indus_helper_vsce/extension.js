// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const { posix } = require('path');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	let timeout = undefined;

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "parpolatest" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('parpolatest.reload', async function () {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage('Reloading parpolatest!');
		await updateDecorations();
	});

	const parpolaDecorationType = vscode.window.createTextEditorDecorationType({
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: 'blue'
	});

	const parpolaErrorDecorationType = vscode.window.createTextEditorDecorationType({
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: 'red',
		overviewRulerColor: 'red',
		overviewRulerLane: vscode.OverviewRulerLane.Right
	});

	const parpolaMissingDecorationType = vscode.window.createTextEditorDecorationType({
		borderWidth: '1px',
		borderStyle: 'dotted',
		borderColor: 'yellow',
		overviewRulerColor: 'yellow',
		overviewRulerLane: vscode.OverviewRulerLane.Right
	});

	const collection = vscode.languages.createDiagnosticCollection('parpolatest');

	let activeEditor = vscode.window.activeTextEditor;
	async function updateDecorations() {
		if (!activeEditor) {
			return;
		}
		const primary_document = activeEditor.document;
		if (!primary_document) {
			return;
		}
		const regEx = /(P\d\d\d)\"\,.\s*\"features\"\:\s*\[((.\s*\d+\,?)*?).\s*\]/sg;
		const text = primary_document.getText();
		const parpolaSymbols = [];
		const parpolaErrorSymbols = [];
		const parpolaMissingSymbols = [];
		const parpolaErrorItems = [];
		let match;
		while ((match = regEx.exec(text))) {
			const parpola_id = match[1];
			const parpola_feature_count = match[2].split(',').length;
			const startPos = primary_document.positionAt(match.index);
			const endPos = primary_document.positionAt(match.index + parpola_id.length);
			const decoration = { range: new vscode.Range(startPos, endPos), hoverMessage: 'Parpola sign ' + parpola_id + ' not found.' };
			const parpola_file = parpola_id + '.json';
			const tsUri = primary_document.uri;
			const jsPath = posix.join(tsUri.path, '../../features', parpola_file);
			const jsUri = tsUri.with({ path: jsPath });
			try {
				if (await vscode.workspace.fs.stat(jsUri)) {
					let document = await vscode.workspace.openTextDocument(jsUri);
					const json = JSON.parse(document.getText());
					const description = json.description;
					const features = json.features;
					let message = 'Parpola sign ' + parpola_id + ': ' + description;
					for (const feature of features) {
						message += '\n- ' + feature.description;
					}
					const expected_feature_count = features.length + 3;
					if (expected_feature_count != parpola_feature_count) {
						message += '\n\nWarning: Found ' + parpola_feature_count + ' features, expected ' + expected_feature_count + '.';
						let error_item = {
							code: '',
							message: 'Parpola ' + parpola_id + ' has ' + parpola_feature_count + ' features, expected ' + expected_feature_count + '.',
							range: new vscode.Range(startPos, endPos),
							severity: vscode.DiagnosticSeverity.Error,
							source: '',
							relatedInformation: []
						};
						parpolaErrorItems.push(error_item);
					}
					decoration.hoverMessage = message;
					if (expected_feature_count != parpola_feature_count) {
						parpolaErrorSymbols.push(decoration);
					} else {
						parpolaSymbols.push(decoration);
					}
				} else {
					console.log('File not read ' + parpola_id, jsUri);
					parpolaMissingSymbols.push(decoration);
				}
			}
			catch (error) {
				console.log('Failed to find parpola sign ' + parpola_id, error);
				parpolaMissingSymbols.push(decoration);
				let error_item = {
					code: '',
					message: 'Parpola ' + parpola_id + ' features file not found.',
					range: new vscode.Range(startPos, endPos),
					severity: vscode.DiagnosticSeverity.Error,
					source: '',
					relatedInformation: []
				};
				parpolaErrorItems.push(error_item);
			}
		}
		activeEditor.setDecorations(parpolaDecorationType, parpolaSymbols);
		activeEditor.setDecorations(parpolaErrorDecorationType, parpolaErrorSymbols);
		activeEditor.setDecorations(parpolaMissingDecorationType, parpolaMissingSymbols);

		if (primary_document) {
			collection.set(primary_document.uri, parpolaErrorItems);
		} else {
			collection.clear();
		}
	}
	function triggerUpdateDecorations(throttle = false) {
		if (timeout) {
			clearTimeout(timeout);
			timeout = undefined;
		}
		if (throttle) {
			timeout = setTimeout(updateDecorations, 1500);
		}
		else {
			updateDecorations();
		}
	}
	if (activeEditor) {
		triggerUpdateDecorations();
	}
	vscode.window.onDidChangeActiveTextEditor(editor => {
		activeEditor = editor;
		if (editor) {
			triggerUpdateDecorations();
		}
	}, null, context.subscriptions);
	vscode.workspace.onDidChangeTextDocument(event => {
		if (activeEditor && event.document === activeEditor.document) {
			triggerUpdateDecorations();
		}
	}, null, context.subscriptions);

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate
}
