const fs = require('fs');
const babel = require('@babel/core');
const { default: generate } = require('@babel/generator');

const replaceIdentifiers = require('./transformers/replaceIdentifiers');
const extractWasm = require('./transformers/extractWasm');
const decryptVars = require('./transformers/decryptVars');
const cleanUp = require('./transformers/cleanUp');
const removeDeadCode = require('./transformers/removeDeadCode');
const extractWorkers = require('./transformers/extractWorkers');
const replaceDicts = require('./transformers/replaceDicts');
const {deobfuscateWorker, deobfuscateWorkerTwo } = require('./transformers/deobfuscateWorker');

const processArgs = () => {
    const args = process.argv.slice(2);
    let options = {
        inputFile: null,
        outputFile: null,
        extractWasm: false,
        cleanWorkers: false,
        saveWorkers: false,
        renameWorkers: false,
        wasmFileName: null
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        switch (arg) {
            case '--extract-wasm':
                options.extractWasm = true;
                break;
            case '--clean-workers':
                options.cleanWorkers = true;
                break;
            case '--rename-workers':
                options.renameWorkers = true;
                break;
            case '--save-workers':
                options.saveWorkers = true;
                break;
            default:
                if (arg.startsWith('--wasm-file=')) {
                    options.wasmFileName = arg.split('=')[1];
                } else if (!options.inputFile) {
                    options.inputFile = arg;
                } else if (!options.outputFile) {
                    options.outputFile = arg;
                }
        }
    }

    return options;
};

const run = () => {
    const options = processArgs();
    let inputFile = options.inputFile || './hsv.js';
    let outputFile = options.outputFile || './hsv.out.js';
    console.log(" | ================= | hCaptcha hsv Deobfuscator | ================= |")
    console.log(` | ---> Inputfile: ${inputFile}`);
    let code = fs.readFileSync(inputFile, 'utf-8');
    let ast = babel.parse(code, {});

    if (options.extractWasm) {
        console.log(" | ---> Extracting Wasm");
        extractWasm(ast, options.wasmFileName || `${inputFile.replace('.js', '-wasm')}.txt`); 
    }

    console.log(` | ---> Replaced ${replaceIdentifiers(ast)} identifiers`);
    console.log(` | ---> Decrypted ${decryptVars(ast)} variables`);
    cleanUp(ast);
    console.log(` | ---> Cleaned and removed dead code`);

    if (options.cleanWorkers) {
        let workers = extractWorkers(ast);
        console.log(` | ---> Extracted ${workers.size} workers`);
        let dashCount = 5; // Starting number of dashes
        for (let [workerName, workerCode] of workers) {
            let workerAst = babel.parse(workerCode, {});
            let dashPrefix = ` | ${'-'.repeat(dashCount)}> `;
            console.log(`${dashPrefix} Processing worker "${workerName}"`);

            if (options.saveWorkers) {
                let { code: cde } = generate(workerAst);
                let outputWorker = `${outputFile.replace('.out.js', '-og-worker')}-${workerName}.js`;
                fs.writeFileSync(outputWorker, cde);
                console.log(`${dashPrefix} Saved to ${outputWorker}`);
            }

            let replaces = replaceDicts(workerAst) + replaceIdentifiers(workerAst);
            console.log(`${dashPrefix} Replaced ${replaces} vars`);

            replaces = deobfuscateWorker(workerAst) + deobfuscateWorkerTwo(workerAst);
            console.log(`${dashPrefix} Deobfuscated ${replaces} variables`);

            cleanUp(workerAst, options.renameWorkers);
            console.log(`${dashPrefix} Cleaned and removed dead code`);

            let { code: cde } = generate(workerAst);
            let outputWorker = `${outputFile.replace('.out.js', '-worker')}-${workerName}.out.js`;
            fs.writeFileSync(outputWorker, cde);
            console.log(`${dashPrefix} Saved to ${outputWorker}`);
            dashCount++; // Increase the number of dashes for the next iteration
        }
        console.log(` | ---> Cleaned workers`);
    }
    
    let { code: newCode } = generate(ast);
    fs.writeFileSync(outputFile, newCode);
    console.log(` | ---> Saved to ${outputFile}`);
    console.log(" | ================= | hCaptcha hsv Deobfuscator | ================= |")
};

run();
