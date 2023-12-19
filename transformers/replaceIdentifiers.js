const traverse = require("@babel/traverse").default;
const types = require("@babel/types");

let replaceIdentifiers = (ast) => {
    let matches = 0;

    traverse(ast, {
        CallExpression(path) {
            // Check if the call expression has only one argument
            if (path.node.arguments.length === 1) {
                const arg = path.node.arguments[0];

                if (types.isIdentifier(arg) && path.scope.hasBinding(arg.name)) {
                    const binding = path.scope.getBinding(arg.name);

                    // Check if the binding is a variable initialized with a numeric literal
                    // and the numeric value is neither 1 nor 0
                    if (
                        binding &&
                        types.isVariableDeclarator(binding.path.node) &&
                        types.isNumericLiteral(binding.path.node.init) &&
                        binding.path.node.init.value !== 1 &&
                        binding.path.node.init.value !== 0
                    ) {
                        path.node.arguments[0] = types.numericLiteral(binding.path.node.init.value);
                        matches++;
                    }
                }
            }
        }
    });

    traverse(ast, {
        MemberExpression(path) {
            if (types.isCallExpression(path.node.property) &&
                path.node.property.arguments.length === 1 &&
                types.isMemberExpression(path.node.property.arguments[0]) &&
                types.isIdentifier(path.node.property.arguments[0].object) &&
                types.isIdentifier(path.node.property.arguments[0].property)) {

                const objectName = path.node.property.arguments[0].object.name;
                const propertyName = path.node.property.arguments[0].property.name;

                // Find the variable declarator that corresponds to the object
                const binding = path.scope.getBinding(objectName);
                if (binding && types.isVariableDeclarator(binding.path.node) &&
                    types.isObjectExpression(binding.path.node.init)) {
                    // Look for the property in the object
                    for (const prop of binding.path.node.init.properties) {
                        if (types.isIdentifier(prop.key) && prop.key.name === propertyName) {
                            if (types.isNumericLiteral(prop.value)) {
                                path.node.property = types.numericLiteral(prop.value.value);
                                matches++;
                            }
                        }
                    }
                }
            }
        }
    })

    return matches;
}

module.exports = replaceIdentifiers;