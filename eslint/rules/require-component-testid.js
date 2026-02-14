"use strict";

const TEST_ID_ATTRIBUTES = new Set(["data-testid", "data-e2e"]);

const getJsxName = (nameNode) => {
    if (!nameNode) {
        return null;
    }

    if (nameNode.type === "JSXIdentifier") {
        return nameNode.name;
    }

    if (nameNode.type === "JSXNamespacedName") {
        return `${nameNode.namespace.name}:${nameNode.name.name}`;
    }

    if (nameNode.type === "JSXMemberExpression") {
        return nameNode.property.name;
    }

    return null;
};

const isPascalCase = (name) =>
    typeof name === "string" && /^[A-Z][A-Za-z0-9]*$/.test(name);

const isIntrinsicElementName = (name) =>
    typeof name === "string" && name.toLowerCase() === name;

const hasTestIdAttribute = (attributes) =>
    attributes.some((attribute) => {
        if (attribute.type !== "JSXAttribute") {
            return false;
        }
        const attrName = getJsxName(attribute.name);
        return TEST_ID_ATTRIBUTES.has(attrName);
    });

const extractJsxNodesFromExpression = (expression, result) => {
    if (!expression) {
        return;
    }

    switch (expression.type) {
        case "JSXElement":
        case "JSXFragment":
            result.push(expression);
            return;
        case "ConditionalExpression":
            extractJsxNodesFromExpression(expression.consequent, result);
            extractJsxNodesFromExpression(expression.alternate, result);
            return;
        case "LogicalExpression":
            extractJsxNodesFromExpression(expression.left, result);
            extractJsxNodesFromExpression(expression.right, result);
            return;
        case "SequenceExpression":
            expression.expressions.forEach((expr) =>
                extractJsxNodesFromExpression(expr, result)
            );
            return;
        case "ParenthesizedExpression":
            extractJsxNodesFromExpression(expression.expression, result);
            return;
        case "ArrowFunctionExpression":
        case "FunctionExpression": {
            const returned = extractReturnedJsxNodes(expression);
            returned.forEach((jsxNode) => result.push(jsxNode));
            return;
        }
        case "CallExpression":
            extractJsxNodesFromExpression(expression.callee, result);
            expression.arguments.forEach((arg) =>
                extractJsxNodesFromExpression(arg, result)
            );
            return;
        case "ArrayExpression":
            expression.elements.forEach((element) =>
                extractJsxNodesFromExpression(element, result)
            );
            return;
        default:
            return;
    }
};

const collectReturnStatements = (node, result) => {
    if (!node || typeof node !== "object") {
        return;
    }

    if (node.type === "ReturnStatement") {
        result.push(node);
        return;
    }

    if (
        node.type === "FunctionDeclaration" ||
        node.type === "FunctionExpression" ||
        node.type === "ArrowFunctionExpression"
    ) {
        return;
    }

    for (const key of Object.keys(node)) {
        if (key === "parent") {
            continue;
        }
        const value = node[key];
        if (!value) {
            continue;
        }

        if (Array.isArray(value)) {
            value.forEach((child) => collectReturnStatements(child, result));
            continue;
        }

        if (typeof value === "object") {
            collectReturnStatements(value, result);
        }
    }
};

const extractReturnedJsxNodes = (componentNode) => {
    const result = [];

    if (
        componentNode.type === "ArrowFunctionExpression" &&
        componentNode.body.type !== "BlockStatement"
    ) {
        extractJsxNodesFromExpression(componentNode.body, result);
        return result;
    }

    if (!componentNode.body || componentNode.body.type !== "BlockStatement") {
        return result;
    }

    const returns = [];
    collectReturnStatements(componentNode.body, returns);
    returns.forEach((ret) => extractJsxNodesFromExpression(ret.argument, result));

    return result;
};

const inspectJsxTree = (jsxNode) => {
    let intrinsicCount = 0;
    let hasTestId = false;

    const visit = (node) => {
        if (!node || hasTestId) {
            return;
        }

        if (node.type === "JSXElement") {
            const elementName = getJsxName(node.openingElement.name);
            if (hasTestIdAttribute(node.openingElement.attributes)) {
                hasTestId = true;
                return;
            }

            if (isIntrinsicElementName(elementName)) {
                intrinsicCount += 1;
            }

            node.children.forEach((child) => visit(child));
            return;
        }

        if (node.type === "JSXFragment") {
            node.children.forEach((child) => visit(child));
            return;
        }

        if (node.type === "JSXExpressionContainer") {
            const nestedJsx = [];
            extractJsxNodesFromExpression(node.expression, nestedJsx);
            nestedJsx.forEach((jsxNode) => visit(jsxNode));
        }
    };

    visit(jsxNode);

    return {
        hasIntrinsicElement: intrinsicCount > 0,
        hasTestId,
    };
};

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description:
                "Require data-testid in each UI component that renders intrinsic DOM elements.",
        },
        schema: [],
        messages: {
            missingTestId:
                "Component '{{name}}' renders DOM elements but has no data-testid. Add at least one stable selector.",
        },
    },
    create(context) {
        const componentNodes = [];

        const pushComponent = (name, node) => {
            if (!isPascalCase(name)) {
                return;
            }
            componentNodes.push({ name, node });
        };

        return {
            FunctionDeclaration(node) {
                if (!node.id) {
                    return;
                }
                pushComponent(node.id.name, node);
            },
            VariableDeclarator(node) {
                if (
                    node.id.type !== "Identifier" ||
                    !node.init ||
                    (node.init.type !== "ArrowFunctionExpression" &&
                        node.init.type !== "FunctionExpression")
                ) {
                    return;
                }
                pushComponent(node.id.name, node.init);
            },
            "Program:exit"() {
                componentNodes.forEach(({ name, node }) => {
                    const jsxNodes = extractReturnedJsxNodes(node);
                    if (jsxNodes.length === 0) {
                        return;
                    }

                    let hasIntrinsicElement = false;
                    let hasTestId = false;

                    jsxNodes.forEach((jsxNode) => {
                        const inspection = inspectJsxTree(jsxNode);
                        hasIntrinsicElement =
                            hasIntrinsicElement || inspection.hasIntrinsicElement;
                        hasTestId = hasTestId || inspection.hasTestId;
                    });

                    if (!hasIntrinsicElement || hasTestId) {
                        return;
                    }

                    context.report({
                        node,
                        messageId: "missingTestId",
                        data: { name },
                    });
                });
            },
        };
    },
};
