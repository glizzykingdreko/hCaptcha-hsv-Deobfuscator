const types = require('@babel/types');
const traverse = require('@babel/traverse').default;

let cleanUp = (ast, rename=false) => {
    traverse(ast, {
        MemberExpression(path) {
            // Check if the property is accessed using bracket notation and is a string literal
            if (path.node.computed && types.isStringLiteral(path.node.property)) {
                const property = path.node.property.value;

                // Check if the property is a valid JavaScript identifier
                if (/^[a-zA-Z_$][0-9a-zA-Z_$]*$/.test(property)) {
                    // Transform to dot notation
                    path.node.property = types.identifier(property);
                    path.node.computed = false;
                }
            }
        },
        NumericLiteral(path) {
            if (path.node.extra && /^0x/i.test(path.node.extra.raw)) {
                // Replace the hexadecimal literal with its decimal equivalent
                path.replaceWith(types.numericLiteral(path.node.value));
            }
        }
    });

    if (rename) {
        let varCounter = 1;
        let funcCounter = 1;
        const renamed = new Map();
        traverse(ast, {
            Identifier(path) {
                // Skip key names in object properties
                if (path.parent.type === 'ObjectProperty' && path.parent.key === path.node) return;

                // Skip function names if they are part of declarations
                if (path.parent.type === 'FunctionDeclaration' && path.parent.id === path.node) return;

                // Skip updating identifiers that have already been renamed
                if (renamed.has(path.node.name)) {
                    path.node.name = renamed.get(path.node.name);
                    return;
                }

                const name = path.scope.hasBinding(path.node.name) ? `var${varCounter++}` : `func${funcCounter++}`;
                renamed.set(path.node.name, name);
                path.node.name = name;
            }
        })
    }
};

module.exports = cleanUp;