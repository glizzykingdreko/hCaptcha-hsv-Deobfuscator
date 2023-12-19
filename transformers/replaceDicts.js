const vm = require('vm');
const { default: generate } = require('@babel/generator');
const types = require('@babel/types');
const { default: traverse } = require('@babel/traverse');

let replaceDicts = (ast) => {
    const context = vm.createContext({});
    let matches = 0;
    traverse(ast, {
        VariableDeclarator(path) {
            if (
                path.node.init &&
                path.node.init.type === 'ObjectExpression' &&
                // check if each property is a number
                path.node.init.properties.every(prop => types.isNumericLiteral(prop.value))
            ) {
                vm.runInContext(generate(path.node).code, context);
                path.remove();
                matches++;
            }
        }
    });

    traverse(ast, {
        MemberExpression(path) {
            if (
                !path.node.computed &&
                path.node.object.name in context
            ) {
                let oldCode = generate(path.node).code;
                let output = vm.runInContext(oldCode, context);
                path.replaceWith(
                    types.numericLiteral(output)
                );
                matches++;
            }
        }
    });

    return matches;
}

module.exports = replaceDicts;