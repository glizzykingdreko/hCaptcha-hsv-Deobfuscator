const fs = require('fs');
const types = require('@babel/types');
const { default: traverse } = require('@babel/traverse');

const extractWasm = (ast) => {
    traverse(ast, {
        CallExpression(path) {
            if (
                path.node.callee.type === 'FunctionExpression' &&
                path.node.arguments.length === 4 &&
                path.node.arguments[2].type === 'StringLiteral'
            ) {
                let encryptedWasm = path.node.arguments[2].value;
                // save the encrypted wasm file
                fs.writeFileSync('./wasm.txt', encryptedWasm);
                // replace the third argument with the following code:
                //  require("fs").readFileSync("./hsv.wasm")
                path.node.arguments[2] = types.callExpression(
                    types.memberExpression(
                        types.callExpression(
                            types.identifier('require'),
                            [types.stringLiteral('fs')]
                        ),
                        types.identifier('readFileSync')
                    ),
                    [types.stringLiteral('./wasm.txt')]
                );
            }
        }
    });
}

module.exports = extractWasm;