const vm = require('vm');
const { default: generate } = require('@babel/generator');
const types = require('@babel/types');
const { default: traverse } = require('@babel/traverse');

let findDecryptionVarFunction = (ast, context) => {

    let decoders = new Set();
    traverse(ast, {
        CallExpression(path) {
            if (
                path.node.callee.type === 'Identifier' &&
                path.node.arguments.length === 1 &&
                path.node.arguments[0].type === 'NumericLiteral'
            ) {
                decoders.add(path.node.callee.name);
            }
        }
    })

    let associations = [];

    traverse(ast, {
        VariableDeclarator(path) {
            if (
                path.node.init &&
                path.node.init.type === 'Identifier' &&
                decoders.has(path.node.id.name)
            ) {
                associations.push(
                    path.node.init.name
                )
            }
        }
    })

    // find most common associations
    let counts = {};
    for (let association of associations) {
        if (counts[association] === undefined) {
            counts[association] = 0;
        }
        counts[association]++;
    }
    let max = 0;
    let maxAssociation = null;
    for (let association in counts) {
        if (counts[association] > max) {
            max = counts[association];
            maxAssociation = association;
        }
    }
    let listName;
    // find the function declaration
    traverse(ast, {
        FunctionDeclaration(path) {
            if (path.node.id.name === maxAssociation) {
                vm.runInContext(generate(path.node).code, context);
                listName = path.node.body.body[0].declarations[0].init.callee.name;
                path.remove();
            }
        }
    })

    traverse(ast, {
        FunctionDeclaration(path) {
            if (path.node.id.name === listName) {
                vm.runInContext(generate(path.node).code, context);
                path.remove();
            }
        }
    })

    traverse(ast, {
        UnaryExpression(path) {
            if (
                path.node.argument.type === 'CallExpression' &&
                path.node.argument.arguments.length === 1 &&
                path.node.argument.arguments[0].type === 'Identifier' &&
                path.node.argument.arguments[0].name === listName
            ) {
                vm.runInContext(generate(path.node).code, context);
                path.remove();
            }
        }
    })

    return maxAssociation;
}

let decryptCalls = (ast, context, decoderFunction)  => {
    let matches = 0;
    traverse(ast, {
        CallExpression(path) {
            if (
                path.node.callee.type === 'Identifier' &&
                path.node.arguments.length === 1 &&
                path.node.arguments[0].type === 'NumericLiteral'
            ) {
                let argument = path.node.arguments[0].value;
                try {
                    let decoded = vm.runInContext(
                        decoderFunction + '(' + argument + ')',
                        context
                    );
                    path.replaceWith(types.stringLiteral(decoded));
                    matches++;
                } catch (e) {
                }
            }
        }
    })
    return matches;
}

let decryptVars = (ast) => {
    let context = {};
    vm.createContext(context);
    let decodeFunction = findDecryptionVarFunction(ast, context);
    return decryptCalls(ast, context, decodeFunction);
};

module.exports = decryptVars;