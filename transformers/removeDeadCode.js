const traverse = require('@babel/traverse').default;

let removeDeadCode = (ast) => {
    let declaredVariables = new Set();
    let referencedIdentifiers = new Set();

    traverse(ast, {
        VariableDeclarator(path) {
            if (
                path.node.id && 
                path.node.id.name && 
                // the name can't be hsw
                path.node.id.name !== 'hsw'
            ) {
                declaredVariables.add(path.node.id.name);
            }
        },
        Identifier(path) {
            if (!path.parentPath.isFunctionDeclaration() && !path.parentPath.isVariableDeclarator()) {
                referencedIdentifiers.add(path.node.name);
            }
        }
    });

    let unusedVariables = [...declaredVariables].filter(varName => !referencedIdentifiers.has(varName));

    traverse(ast, {
        VariableDeclarator(path) {
            if (unusedVariables.includes(path.node.id.name)) {
                path.remove();
            }
        }
    });
}

module.exports = removeDeadCode;