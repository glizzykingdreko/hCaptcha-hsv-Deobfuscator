const traverse = require("@babel/traverse").default;
const { default: generate } = require("@babel/generator");
const types = require("@babel/types");
const vm = require("vm");

let deobfuscateWorker = (ast) => {
    let context = vm.createContext({});
    let matches = 0;
    
    // extract list func
    let encodedList;
    traverse(ast, {
        FunctionDeclaration(path) {
            if (
                path.node.body.body.length === 3 &&
                types.isVariableDeclaration(path.node.body.body[0]) &&
                types.isExpressionStatement(path.node.body.body[1]) &&
                types.isReturnStatement(path.node.body.body[2])
            ) {
                encodedList = path.node.id.name;
                vm.runInContext(generate(path.node).code, context);
                path.remove();
                path.stop();
            }
        }
    });

    let decryptFunction;
    // extract decrypt func
    traverse(ast, {
        FunctionDeclaration(path) {
            if (
                path.node.body.body.length === 2 &&
                types.isVariableDeclaration(path.node.body.body[0]) &&
                types.isReturnStatement(path.node.body.body[1]) &&
                path.node.body.body[0].declarations[0].init.callee.name === encodedList
            ) {
                decryptFunction = path.node.id.name;
                vm.runInContext(generate(path.node).code, context);
                path.remove();
                path.stop();
            }
        }
    })

    // shuffle shit
    traverse(ast, {
        CallExpression(path) {
            if (
                path.node.arguments.length === 2 &&
                types.isIdentifier(path.node.arguments[0]) &&
                types.isNumericLiteral(path.node.arguments[1]) &&
                path.node.arguments[0].name === encodedList
            ) {
                let shuffler = generate(path.node.callee).code;
                vm.runInContext(`let shuffler = ${shuffler}; shuffler(${encodedList}, ${path.node.arguments[1].value})`, context);
                path.remove();
                path.stop();
            }
        }
    });

    traverse(ast, {
        CallExpression(path) {
            if (
                path.node.callee.type === "Identifier" &&
                path.node.arguments.length === 1 &&
                types.isNumericLiteral(path.node.arguments[0]) &&
                path.node.arguments[0].value > 3
            ) {
                try {
                    let output = vm.runInContext(`${decryptFunction}(${path.node.arguments[0].value})`, context);
                    path.replaceWith(
                        types.stringLiteral(output)
                    )
                    matches++;
                } catch (e) {
                }
            }
        }
    })

    return matches;
}


let deobfuscateWorkerTwo = (ast) => {
    let context = vm.createContext({});
    let matches = 0;

    // extract list func
    let encodedList;
    traverse(ast, {
        FunctionDeclaration(path) {
            if (
                path.node.body.body.length === 2 &&
                types.isVariableDeclaration(path.node.body.body[0]) &&
                path.node.body.body[0].declarations.length === 2 &&
                types.isReturnStatement(path.node.body.body[1])
            ) {
                encodedList = path.node.id.name;
                vm.runInContext(generate(path.node).code, context);
                path.remove();
                path.stop();
            }
        }
    });
    
    let decryptFunction;
    // extract decrypt func
    traverse(ast, {
        FunctionDeclaration(path) {
            if (
                path.node.body.body.length === 2 &&
                types.isVariableDeclaration(path.node.body.body[0]) &&
                types.isReturnStatement(path.node.body.body[1]) &&
                path.node.body.body[0].declarations[0].init &&
                types.isCallExpression(path.node.body.body[0].declarations[0].init) &&
                path.node.body.body[0].declarations[0].init.callee.name === encodedList
            ) {
                decryptFunction = path.node.id.name;
                vm.runInContext(generate(path.node).code, context);
                path.remove();
                path.stop();
            }
        }
    })

    // shuffle shit
    traverse(ast, {
        UnaryExpression(path) {
            if (
                types.isCallExpression(path.node.argument) &&
                path.node.argument.arguments.length === 1 &&
                types.isIdentifier(path.node.argument.arguments[0]) &&
                path.node.argument.arguments[0].name === encodedList
            ) {
                let shuffler = generate(path.node.callee).code;
                vm.runInContext(shuffler, context);
                path.remove();
                path.stop();
            }
        }
    });

    traverse(ast, {
        CallExpression(path) {
            if (
                path.node.callee.type === "Identifier" &&
                path.node.arguments.length === 1 &&
                types.isNumericLiteral(path.node.arguments[0]) &&
                path.node.arguments[0].value > 3
            ) {
                try {
                    let output = vm.runInContext(`${decryptFunction}(${path.node.arguments[0].value})`, context);
                    path.replaceWith(
                        types.stringLiteral(output) ? types.stringLiteral(output) : types.numericLiteral(output)
                    )
                    matches++;
                } catch (e) {
                }
            }
        }
    })
    
    return matches;
}

module.exports = {deobfuscateWorker, deobfuscateWorkerTwo};