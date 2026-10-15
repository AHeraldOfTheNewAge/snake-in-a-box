import * as vscode from 'vscode';

const DEF_OR_CLASS = /^\s*(async\s+def|def|class)\b/;

function getConfig() {
	const cfg = vscode.workspace.getConfiguration('blockBoxes');
	const colors = cfg.get<string[]>('colors', ['#4fc1ff', '#f14c4c']);

	return {
		colors: colors.length ? colors : ['#4fc1ff'],
		boxDefs: cfg.get<boolean>('boxDefsAndClasses', false),
	};
}

const HEADER = /^\s*(async\s+def|def|class|if|elif|else|for|async\s+for|while|try|except|finally|with|async\s+with|match|case)\b.*:\s*(#.*)?$/;

interface Block { 
	start: number; 
	end: number; 
	depth: number; 
	indentCols: number; 
};

const type = {
	top: vscode.window.createTextEditorDecorationType({}),
	mid: vscode.window.createTextEditorDecorationType({}),
	bottom: vscode.window.createTextEditorDecorationType({}),
};

function expandTabs(s: string, tab: number) {
	return s.replace(/\t/g, ' '.repeat(tab));
}

function indentCols(line: string, tab: number) {
	const t = expandTabs(line, tab);
  
	return t.length - t.trimStart().length;
}

function findBlocks(doc: vscode.TextDocument, tab: number, boxDefs: boolean): Block[] {
	const blocks: Block[] = [];
	const openEnds: number[] = [];

	for (let i = 0; i < doc.lineCount; i++) {
		const text = doc.lineAt(i).text;
  
	if (!HEADER.test(text)) { 
		continue; 
	}

    if (!boxDefs && DEF_OR_CLASS.test(text)) { // not boxed, not a level
		continue;
	}

    const headerIndent = indentCols(text, tab);
    
	let end = i;

    for (let j = i + 1; j < doc.lineCount; j++) {
      const t = doc.lineAt(j).text;
    
	  if (t.trim() === '') { 
		continue; 
	  }

      if (indentCols(t, tab) <= headerIndent) { 
		break; 
	}
     
	  end = j;
    }
    
	if (end === i) { 
		continue; 
	}

    while (openEnds.length && openEnds[openEnds.length - 1] < i) { 
		openEnds.pop(); 
	}

    blocks.push({ start: i, end, depth: openEnds.length, indentCols: headerIndent });
    openEnds.push(end);
  }

  return blocks;
}

function edge(b: Block, color: string, right: number, borders: string): vscode.DecorationOptions['renderOptions'] {
  const left = b.indentCols;
  const width = right - left;

  return {
    before: {
      contentText: '\u200b',
      textDecoration:
        `none; position:absolute; top:0; height:100%; box-sizing:border-box; pointer-events:none; z-index:1;` +
        `left:calc(${left}ch - 3px); width:${width}ch; border:0 solid ${color}; background:${color}1A; ${borders}`,
    },
  };
}

function update(editor: vscode.TextEditor | undefined) {
	if (!editor || editor.document.languageId !== 'python') { 
		return; 
	}

	const doc = editor.document;
	const tab = typeof editor.options.tabSize === 'number' ? editor.options.tabSize : 4;

	const { colors, boxDefs } = getConfig();
	const blocks = findBlocks(doc, tab, boxDefs);
	const maxDepth = blocks.reduce((m, b) => Math.max(m, b.depth), 0);
  
	let maxWidth = 0;

	for (let i = 0; i < doc.lineCount; i++) {
		maxWidth = Math.max(maxWidth, expandTabs(doc.lineAt(i).text, tab).length);
	}

	const outerRight = maxWidth + 3 + maxDepth; // outer boxes are widest

	const top: vscode.DecorationOptions[] = [];
	const mid: vscode.DecorationOptions[] = [];
	const bottom: vscode.DecorationOptions[] = [];

	for (const b of blocks) {
		const color = colors[b.depth % colors.length];
    	const right = outerRight - b.depth;
    	const at = (n: number, renderOptions: any) => ({ range: new vscode.Range(n, 0, n, 0), renderOptions } as vscode.DecorationOptions);
		const L = 'border-left-width:1px; border-right-width:1px;';
    
		top.push(at(b.start, edge(b, color, right, L + 'border-top-width:1px;')));
    
		for (let n = b.start + 1; n < b.end; n++) { 
			mid.push(at(n, edge(b, color, right, L))); 
		}
    
		bottom.push(at(b.end, edge(b, color, right, L + 'border-bottom-width:1px;')));
  	}

  	editor.setDecorations(type.top, top);
  	editor.setDecorations(type.mid, mid);
 	editor.setDecorations(type.bottom, bottom);
}

export function activate(context: vscode.ExtensionContext) {
	let timer: NodeJS.Timeout | undefined;
  
	const schedule = () => {
		clearTimeout(timer);
		timer = setTimeout(() => update(vscode.window.activeTextEditor), 150);
	};

 	update(vscode.window.activeTextEditor);

  	context.subscriptions.push(
		vscode.workspace.onDidChangeConfiguration(e => {
  			if (e.affectsConfiguration('blockBoxes')) { 
				update(vscode.window.activeTextEditor);
			}
		}),
    	vscode.window.onDidChangeActiveTextEditor(update),
    	vscode.workspace.onDidChangeTextDocument(e => {
      	
		if (e.document === vscode.window.activeTextEditor?.document) { 
			schedule(); 
		}
    }),
    type.top, 
	type.mid, type.bottom,
  );
}