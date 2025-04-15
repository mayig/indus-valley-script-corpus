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
	console.log('Congratulations, your extension "indushelper" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('indushelper.reload', async function () {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage('Reloading indushelper!');
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

	// create a diagnostic collection
	// this will be used to show errors in the problems tab
	const collection = vscode.languages.createDiagnosticCollection('indushelper');

	let activeEditor = vscode.window.activeTextEditor;
	async function updateDecorations() {
		if (!activeEditor) {
			return;
		}

		const primary_document = activeEditor.document;
		if (!primary_document) {
			return;
		}

		const text = primary_document.getText();

		const parpolaSymbols = [];
		const parpolaErrorSymbols = [];
		const parpolaMissingSymbols = [];
		const parpolaErrorItems = [];

		// check the document id against the document file name
		// for instance, the file "m141.json" should have a line that looks like:
		//   "id": "M-xxxA",   // n.b. the 'xxx' has no leading zeroes
		// we can drop an error otherwise
		const regExId = /\"id\"\:\s*\"[A-Z]\-(\d+)[A-Za-z]\"/g;
		let matchId;
		if ((matchId = regExId.exec(text))) {
			const id = matchId[1];
			const fileName = primary_document.fileName;
			// get the file name only with no path
			const fileNameOnly = posix.basename(fileName);
			// left-pad id with zeroes to length three
			const paddedId = id.padStart(3, '0');
			const expectedFileName = 'm' + paddedId + '.json';
			if (fileNameOnly !== expectedFileName) {
				let error_item = {
					code: '',
					message: 'Document id ' + paddedId + ' does not match file name ' + fileNameOnly + '.',
					range: new vscode.Range(primary_document.positionAt(matchId.index), primary_document.positionAt(matchId.index + matchId[0].length)),
					severity: vscode.DiagnosticSeverity.Error,
					source: '',
					relatedInformation: []
				};
				parpolaErrorItems.push(error_item);
			}
		}

		// check all Parpola signs in the document
		const regEx = /(P\d\d\d)(\"\,.\s*\"features\"\:\s*\[)((\s*\d+\,?)*?)\s*\]/sg;
		let match;
		while ((match = regEx.exec(text))) {
			// parpola_id will look something like "P123"
			const parpola_id = match[1];
			// parpola_feature_count will be the number of features found in the parpola sign
			console.log("Found features are '" + match[3] + "'");
			const found_features = match[3].split(',');
			console.log("Features array is " + found_features);
			const parpola_feature_count = found_features.length;

			// start and end pos are the positions of the parpola sign in the primary document
			const startPos = primary_document.positionAt(match.index);
			const endPos = primary_document.positionAt(match.index + parpola_id.length);


			const decoration = { range: new vscode.Range(startPos, endPos), hoverMessage: 'Parpola sign ' + parpola_id + ' not found.' };
			const parpola_file = parpola_id + '.json';
			const tsUri = primary_document.uri;
			const jsPath = posix.join(tsUri.path, '../../../features', parpola_file);
			const featureFileUri = tsUri.with({ path: jsPath });

			try {
				// this await will throw an error if the file is not found
				if (await vscode.workspace.fs.stat(featureFileUri)) {
					// load the file and parse it as JSON
					let document = await vscode.workspace.openTextDocument(featureFileUri);
					const featureFileJson = JSON.parse(document.getText());

					// get the description and features from the JSON
					const description = featureFileJson.description;
					const features = featureFileJson.features;

					// build up our hovertext message
					let message = 'Parpola sign ' + parpola_id + ': ' + description;
					for (const feature of features) {
						message += '\n- ' + feature.description;
					}

					// add an info for the sign

					const position_of_first_feature = match.index + match[1].length + match[2].length;
					let current_feature_position = position_of_first_feature;
					for (let i = 0; i < found_features.length; i++) {
						console.log("Tagging feature " + i + " of " + found_features.length);
						console.log("Found feature '" + found_features[i] + "'");

						let feature_info = 'damage: Lowest two digits: Rough estimate of how much of the grapheme is missing or damaged. Higher digits, between 1-9, signify which parts are damaged (1 is upper left, 2 is upper mid, ...)'
						if (i == 1) {
							feature_info = 'line: On what line of the artefact is this grapheme found?';
						} else if (i == 2) {
							feature_info = 'uncertainty: Very subjective estimate, in the range 0-100, of how uncertain the annotator was about the grapheme';
							if (features.length == 0) {
								feature_info = " " + feature_info;
							}
						} else if (i > 2) {
							let feature_index = i - 3;
							feature_info = "";
							if (features[feature_index]) {
								for (const prop_name of Object.getOwnPropertyNames(features[feature_index])) {
									if (prop_name != 'description') {
										feature_info += prop_name + ': ';
									}
								}
								feature_info += features[feature_index].description;
							} else {
								feature_info = 'Unknown feature ' + feature_index;
							}
							if (feature_index == features.length - 1) {
								feature_info = " " + feature_info;
							}
						}

						const subRegEx = /(\s*)(\d+)(\s*)/sg;
						let spacing_match = subRegEx.exec(found_features[i]);
						if (spacing_match) {
							const initial_spaces = spacing_match[1].length;
							const content_length = spacing_match[2].length;
							const final_spaces = spacing_match[3].length;
							console.log('initial_spaces', initial_spaces);
							console.log('content_length', content_length);
							console.log('final_spaces', final_spaces);

							const startPosOfFeature = primary_document.positionAt(current_feature_position + initial_spaces);
							const endPosOfFeature = primary_document.positionAt(current_feature_position + initial_spaces + content_length);
							let error_item = {
								code: '',
								message: feature_info,
								range: new vscode.Range(startPosOfFeature, endPosOfFeature),
								severity: vscode.DiagnosticSeverity.Information,
								source: '',
								relatedInformation: []
							};
							parpolaErrorItems.push(error_item);

						} else {
							console.log("No match for spacing '" + found_features[i] + "'");
						}
						current_feature_position += found_features[i].length + 1;
					}


					// check if the number of features in the parpola sign matches the expected number
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
					} else {
						message += '\n\nWarning: Found ' + parpola_feature_count + ' features, expected ' + expected_feature_count + '.';
						let error_item = {
							code: '',
							message: parpola_id + ': ' + description,
							range: new vscode.Range(startPos, endPos),
							severity: vscode.DiagnosticSeverity.Information,
							source: '',
							relatedInformation: []
						};
						parpolaErrorItems.push(error_item);
					}

					// for each feature found, display the hovertext for it
					// the first three are the default features
					// set the message
					decoration.hoverMessage = message;

					// add this to the appropriate list of decorations
					if (expected_feature_count != parpola_feature_count) {
						parpolaErrorSymbols.push(decoration);
					} else {
						parpolaSymbols.push(decoration);
					}
				} else {
					console.log('File not read ' + parpola_id, featureFileUri);
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

		// set our errors
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

	// whenever the active editor changes, trigger an update
	vscode.window.onDidChangeActiveTextEditor(editor => {
		activeEditor = editor;
		if (editor) {
			triggerUpdateDecorations();
		}
	}, null, context.subscriptions);

	// whenever the document changes, trigger an update
	vscode.workspace.onDidChangeTextDocument(event => {
		if (activeEditor && event.document === activeEditor.document) {
			triggerUpdateDecorations();
		}
	}, null, context.subscriptions);

	async function resetFeatureValues() {
		const editor = vscode.window.activeTextEditor;

		if (editor) {
			const document = editor.document;
			const text = document.getText();

			// Here, we want to change the contents of every feature array to [0,1,0]
			const regEx = /(P\d\d\d\"\,.\s*\"features\"\:\s*\[)([^\]]*)\]/sg;
			let match;
			let rangesToReplace = [];
			while ((match = regEx.exec(text))) {
				const startPos = document.positionAt(match.index + match[1].length);
				const endPos = document.positionAt(match.index + match[1].length + match[2].length);
				rangesToReplace.push(new vscode.Range(startPos, endPos));

			}
			rangesToReplace.reverse();
			for (const range of rangesToReplace) {
				await editor.edit(editBuilder => {
					editBuilder.replace(range, '0,1,0');
				});
			}

			const modifiedText = vscode.window.activeTextEditor.document.getText();
			const regExId = /(\"id\"\:\s*\"[A-Z]\-)(\d+)[A-Za-z]\"/g;
			let matchId;
			if ((matchId = regExId.exec(modifiedText))) {
				const id = matchId[2];
				console.log('id', id);
				const fileName = document.fileName;
				// get the numbers from the file name, so m123.json will give us 123
				const regExFileName = /[a-z](\d\d\d)\.json/;
				const matchFileName = regExFileName.exec(fileName);
				const fileNameId = matchFileName[1];
				// parse as an int
				const fileNameInt = parseInt(fileNameId);
				console.log('fileNameInt', fileNameInt);

				// now we replace the id in the document with the file name id integer
				await vscode.window.activeTextEditor.edit(editBuilder => {
					editBuilder.replace(new vscode.Range(document.positionAt(matchId.index + matchId[1].length), document.positionAt(matchId.index + matchId[1].length + matchId[2].length)), fileNameInt.toString());
				});
			}

			await vscode.commands.executeCommand('editor.action.formatDocument');
		}
	}

	let reset_disposable = vscode.commands.registerCommand('indushelper.reset', resetFeatureValues);

	context.subscriptions.push(disposable);
	context.subscriptions.push(reset_disposable);
}

// This method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate
}
