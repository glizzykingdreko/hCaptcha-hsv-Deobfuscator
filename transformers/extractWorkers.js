const traverse = require('@babel/traverse').default;
const fs = require('fs');

let extractWorkers = (ast) => {
    let workers = new Map();
    traverse(ast, {
        VariableDeclarator(path) {
            if (
                path.node.init &&
                path.node.init.type === 'CallExpression' &&
                path.node.init.callee.type === 'Identifier' &&
                path.node.init.arguments.length === 3 &&
                path.node.init.arguments[0].type === 'StringLiteral'
            ) {
                workerCode = atob(path.node.init.arguments[0].value);
                workers.set(path.node.id.name, workerCode);
            }
        }
    })
    return workers;
}

module.exports = extractWorkers;