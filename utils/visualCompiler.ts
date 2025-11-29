

import { GraphNode, GraphConnection, ProgrammingLanguage } from '../types';

/**
 * Compiles the Visual Node Graph into executable JS for the game runtime.
 */
export const compileToRuntime = (nodes: GraphNode[], connections: GraphConnection[]): string => {
    let jsCode = `
    // LogicCircuit Runtime v3.0 (UI Edition)
    const ctx = document.getElementById('canvas')?.getContext('2d');
    const elements = {};
    const variables = {}; // Runtime memory
    
    const playTone = (freq) => {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.value = freq;
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.5);
        osc.stop(audioCtx.currentTime + 0.5);
    };

    const logOutput = (msg) => {
        console.log(msg);
        // Try to find a log container or create one
        let consoleDiv = document.getElementById('debug-console');
        if (!consoleDiv) {
            consoleDiv = document.createElement('div');
            consoleDiv.id = 'debug-console';
            consoleDiv.style.position = 'fixed';
            consoleDiv.style.bottom = '0';
            consoleDiv.style.left = '0';
            consoleDiv.style.width = '100%';
            consoleDiv.style.maxHeight = '100px';
            consoleDiv.style.overflowY = 'auto';
            consoleDiv.style.background = 'rgba(0,0,0,0.8)';
            consoleDiv.style.color = '#0f0';
            consoleDiv.style.fontFamily = 'monospace';
            consoleDiv.style.fontSize = '10px';
            consoleDiv.style.padding = '5px';
            consoleDiv.style.pointerEvents = 'none';
            document.body.appendChild(consoleDiv);
        }
        const line = document.createElement('div');
        line.innerText = '> ' + msg;
        consoleDiv.appendChild(line);
        consoleDiv.scrollTop = consoleDiv.scrollHeight;
    };
    `;

    // Helpers
    const getNextNode = (nodeId: string, handle?: string): GraphNode | undefined => {
        const conn = connections.find(c => c.fromNode === nodeId && (!handle || c.sourceHandle === handle));
        if (!conn) return undefined;
        return nodes.find(n => n.id === conn.toNode);
    };

    // Recursive traversal to build the chain
    const traverse = (node: GraphNode): string => {
        if (!node) return '';
        let code = '';
        const d = node.data;
        const elID = d.elementID || node.id;

        switch (node.type) {
            // --- ACTION / LOGIC ---
            case 'action_alert':
                code = `alert("${d.value || 'Hello'}");\n`;
                break;
            case 'action_log':
            case 'io_print':
                const valToPrint = d.variableName ? `variables["${d.variableName}"]` : `"${d.value || ''}"`;
                code = `logOutput(${valToPrint});\n`;
                break;
            case 'var_set':
                code = `variables["${d.variableName || 'x'}"] = ${!isNaN(Number(d.value)) ? Number(d.value) : `"${d.value}"`};\n`;
                break;
            case 'math_add':
                code = `variables["${d.variableName || 'x'}"] = (variables["${d.variableName || 'x'}"] || 0) + ${Number(d.value || 1)};\n`;
                break;
             case 'math_sub':
                code = `variables["${d.variableName || 'x'}"] = (variables["${d.variableName || 'x'}"] || 0) - ${Number(d.value || 1)};\n`;
                break;
            case 'action_sound':
                code = `playTone(${d.value || 440});\n`;
                break;
            
            // --- CONTROL FLOW ---
            case 'logic_if':
                const varName = d.variableName || 'x';
                const compareVal = d.value || 0;
                const op = d.operator || '==';
                let condition = `variables["${varName}"] ${op} ${compareVal}`;
                if (op === '=') condition = `variables["${varName}"] == ${compareVal}`;
                
                code = `if (${condition}) {\n`;
                const trueNode = getNextNode(node.id, 'true');
                if (trueNode) code += traverse(trueNode);
                code += `} else {\n`;
                const falseNode = getNextNode(node.id, 'false');
                if (falseNode) code += traverse(falseNode);
                code += `}\n`;
                return code; // Stop linear flow here as we branched

            case 'logic_timer':
                const delay = Number(d.value) || 1000;
                const nextTimer = getNextNode(node.id);
                if (nextTimer) {
                    code = `setTimeout(() => {\n${traverse(nextTimer)}\n}, ${delay});\n`;
                }
                return code; // Stop linear flow, it continues in callback

            case 'logic_loop':
                const count = Number(d.value) || 3;
                code = `for(let i=0; i<${count}; i++) {\n`;
                const loopNode = getNextNode(node.id, 'loop');
                if (loopNode) code += traverse(loopNode);
                code += `}\n`;
                const doneNode = getNextNode(node.id, 'done');
                if (doneNode) code += traverse(doneNode);
                return code;

            // --- UI BUILDER ---
            case 'ui_button':
                code = `
                if (!elements['${elID}']) {
                    const btn = document.createElement('button');
                    btn.innerText = "${d.label || 'Button'}";
                    btn.id = "${elID}";
                    btn.style.padding = "10px 20px";
                    btn.style.margin = "5px";
                    btn.style.background = "${d.color || '#e91e63'}";
                    btn.style.color = "white";
                    btn.style.border = "none";
                    btn.style.borderRadius = "4px";
                    btn.style.cursor = "pointer";
                    document.body.appendChild(btn);
                    elements['${elID}'] = btn;
                    
                    // Click Listener
                    btn.addEventListener('click', () => {
                        ${traverse(getNextNode(node.id, 'click')!)}
                    });
                }
                `;
                break;

            case 'ui_text':
                code = `
                if (!elements['${elID}']) {
                    const txt = document.createElement('div');
                    txt.innerText = "${d.value || 'Text Label'}";
                    txt.id = "${elID}";
                    txt.style.color = "${d.color || '#fff'}";
                    txt.style.margin = "5px";
                    txt.style.fontSize = "16px";
                    document.body.appendChild(txt);
                    elements['${elID}'] = txt;
                } else {
                    // Update existing text if re-visited
                    elements['${elID}'].innerText = "${d.value || ''}" + (variables["${d.variableName}"] !== undefined ? variables["${d.variableName}"] : "");
                }
                `;
                break;
            
             case 'ui_input':
                code = `
                if (!elements['${elID}']) {
                    const inp = document.createElement('input');
                    inp.placeholder = "${d.label || 'Enter text...'}";
                    inp.id = "${elID}";
                    inp.style.padding = "8px";
                    inp.style.margin = "5px";
                    inp.style.borderRadius = "4px";
                    inp.style.border = "1px solid #555";
                    inp.style.background = "#222";
                    inp.style.color = "white";
                    document.body.appendChild(inp);
                    elements['${elID}'] = inp;
                    
                    inp.addEventListener('change', (e) => {
                        variables["${d.variableName || 'input_val'}"] = e.target.value;
                        ${traverse(getNextNode(node.id, 'change')!)}
                    });
                }
                `;
                break;
        }

        // Standard flow for non-branching/non-async nodes
        const next = getNextNode(node.id, 'flow'); // Most nodes use 'flow' default output
        if (next) {
            code += traverse(next);
        }
        return code;
    };

    // Find entry points
    const startNodes = nodes.filter(n => n.type === 'event_start');
    startNodes.forEach(n => {
        jsCode += `\nwindow.onload = () => {\n  document.body.innerHTML = ''; // Clear prev\n  document.body.style.padding = '20px';\n${traverse(n)}\n};\n`;
    });
    
    // If no start node but UI nodes exist, just render them
    if (startNodes.length === 0) {
        const uiNodes = nodes.filter(n => n.type.startsWith('ui_'));
        jsCode += `\nwindow.onload = () => {\n  document.body.innerHTML = '';\n  document.body.style.padding = '20px';\n`;
        uiNodes.forEach(n => {
            jsCode += traverse(n);
        });
        jsCode += `};\n`;
    }

    return `<html><body style="background:#111;color:#eee;font-family:sans-serif;overflow:auto;">${jsCode}</body></html>`;
};

/**
 * Compiles the Visual Node Graph into readable source code for display.
 */
export const compileToLanguage = (nodes: GraphNode[], connections: GraphConnection[], lang: ProgrammingLanguage): string => {
    const getNextNode = (nodeId: string, handle?: string) => {
        const conn = connections.find(c => c.fromNode === nodeId && (!handle || c.sourceHandle === handle));
        if (!conn) return undefined;
        return nodes.find(n => n.id === conn.toNode);
    };

    const traverse = (node: GraphNode, indentLevel: number): string => {
        if (!node) return '';
        const d = node.data;
        const indent = '  '.repeat(indentLevel);
        let code = '';
        const elID = d.elementID || node.id;

        switch (node.type) {
            case 'ui_button':
                if (lang === 'python') code = `${indent}${elID} = Button(text="${d.label}", bg="${d.color}")\n${indent}${elID}.pack()\n`;
                else if (lang === 'cpp') code = `${indent}auto ${elID} = new QPushButton("${d.label}", this);\n`;
                else code = `${indent}const ${elID} = document.createElement("button");\n`;
                
                // Button Click Logic
                const clickNode = getNextNode(node.id, 'click');
                if (clickNode) {
                    if (lang === 'javascript') code += `${indent}${elID}.onclick = () => {\n${traverse(clickNode, indentLevel + 1)}${indent}};\n`;
                    else code += `${indent}// On Click:\n${traverse(clickNode, indentLevel)}`;
                }
                break;
            case 'ui_text':
                 code = `${indent}// Text Label: "${d.value}"\n`;
                 break;
            case 'logic_timer':
                 if (lang === 'javascript') code = `${indent}setTimeout(() => {\n${traverse(getNextNode(node.id)!, indentLevel+1)}${indent}}, ${d.value});\n`;
                 else code = `${indent}sleep(${d.value});\n`;
                 return code; // Async break
            case 'logic_loop':
                 code = `${indent}for i in range(${d.value}):\n`;
                 code += traverse(getNextNode(node.id, 'loop')!, indentLevel+1);
                 code += `${indent}// Loop done\n`;
                 code += traverse(getNextNode(node.id, 'done')!, indentLevel);
                 return code;

            case 'action_alert':
                if (lang === 'python') code = `${indent}print("[ALERT] ${d.value}")\n`;
                else if (lang === 'cpp') code = `${indent}std::cout << "[ALERT] " << "${d.value}" << std::endl;\n`;
                else if (lang === 'rust') code = `${indent}println!("[ALERT] {}", "${d.value}");\n`;
                else if (lang === 'go') code = `${indent}fmt.Println("[ALERT] ${d.value}")\n`;
                else if (lang === 'sql') code = `${indent}SELECT "${d.value}" AS alert_msg;\n`;
                else if (lang === 'lua') code = `${indent}print("[ALERT] " .. "${d.value}")\n`;
                else code = `${indent}alert("${d.value}");\n`;
                break;
            case 'action_log':
            case 'io_print':
                const val = d.variableName || `"${d.value}"`;
                if (lang === 'python') code = `${indent}print(${val})\n`;
                else if (lang === 'cpp') code = `${indent}std::cout << ${val} << std::endl;\n`;
                else if (lang === 'rust') code = `${indent}println!("{}", ${val});\n`;
                else if (lang === 'go') code = `${indent}fmt.Println(${val})\n`;
                else if (lang === 'lua') code = `${indent}print(${val})\n`;
                else code = `${indent}console.log(${val});\n`;
                break;
            case 'var_set':
                const vVal = !isNaN(Number(d.value)) ? d.value : `"${d.value}"`;
                if (lang === 'python') code = `${indent}${d.variableName} = ${vVal}\n`;
                else if (lang === 'cpp') code = `${indent}auto ${d.variableName} = ${vVal};\n`;
                else if (lang === 'rust') code = `${indent}let mut ${d.variableName} = ${vVal};\n`;
                else if (lang === 'go') code = `${indent}${d.variableName} := ${vVal}\n`;
                else if (lang === 'sql') code = `${indent}SET @${d.variableName} = ${vVal};\n`;
                else if (lang === 'lua') code = `${indent}local ${d.variableName} = ${vVal}\n`;
                else code = `${indent}let ${d.variableName} = ${vVal};\n`;
                break;
            case 'math_add':
                if (lang === 'sql') code = `${indent}SET @${d.variableName} = @${d.variableName} + ${d.value};\n`;
                else code = `${indent}${d.variableName} += ${d.value}${lang === 'python' || lang === 'lua' ? '' : ';'}\n`;
                break;
            case 'logic_if':
                const cond = `${d.variableName} ${d.operator || '=='} ${d.value}`;
                if (lang === 'python') {
                    code = `${indent}if ${cond}:\n`;
                    code += traverse(getNextNode(node.id, 'true')!, indentLevel + 1);
                    code += `${indent}else:\n`;
                    code += traverse(getNextNode(node.id, 'false')!, indentLevel + 1);
                } else if (lang === 'sql') {
                    code = `${indent}IF ${cond} THEN\n`;
                    code += traverse(getNextNode(node.id, 'true')!, indentLevel + 1);
                    code += `${indent}ELSE\n`;
                    code += traverse(getNextNode(node.id, 'false')!, indentLevel + 1);
                    code += `${indent}END IF;\n`;
                } else if (lang === 'lua') {
                    code = `${indent}if ${cond} then\n`;
                    code += traverse(getNextNode(node.id, 'true')!, indentLevel + 1);
                    code += `${indent}else\n`;
                    code += traverse(getNextNode(node.id, 'false')!, indentLevel + 1);
                    code += `${indent}end\n`;
                } else {
                    code = `${indent}if (${cond}) {\n`;
                    code += traverse(getNextNode(node.id, 'true')!, indentLevel + 1);
                    code += `${indent}} else {\n`;
                    code += traverse(getNextNode(node.id, 'false')!, indentLevel + 1);
                    code += `${indent}}\n`;
                }
                return code; // Stop linear flow
        }

        const next = getNextNode(node.id, 'flow');
        if (next) code += traverse(next, indentLevel);
        return code;
    };

    let fullCode = '';
    
    // Headers
    if (lang === 'cpp') fullCode += `#include <iostream>\n#include <string>\nusing namespace std;\n\n`;
    if (lang === 'go') fullCode += `package main\nimport "fmt"\n\n`;
    
    // Main Wrapper
    if (lang === 'python') fullCode += `def main():\n`;
    else if (lang === 'cpp') fullCode += `int main() {\n`;
    else if (lang === 'rust') fullCode += `fn main() {\n`;
    else if (lang === 'go') fullCode += `func main() {\n`;
    else if (lang === 'sql') fullCode += `BEGIN\n`;
    else if (lang === 'lua') fullCode += `local function main()\n`;
    else fullCode += `// Entry Point\n`;

    const startNode = nodes.find(n => n.type === 'event_start');
    if (startNode) {
        fullCode += traverse(startNode, 1);
    } else {
        // Just render UI nodes line by line if no start event
        const uiNodes = nodes.filter(n => n.type.startsWith('ui_'));
        uiNodes.forEach(n => {
            fullCode += traverse(n, 1);
        })
    }

    // Footers
    if (['cpp', 'rust', 'go', 'javascript', 'sql'].includes(lang)) fullCode += (lang === 'sql' ? 'END;' : '}');
    if (lang === 'lua') fullCode += `end\nmain()`;
    if (lang === 'python') fullCode += `\nif __name__ == "__main__":\n  main()`;
    
    return fullCode;
};