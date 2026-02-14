"use strict";

const INTERACTIVE_TAGS = new Set([
    "a",
    "button",
    "input",
    "option",
    "select",
    "summary",
    "textarea",
]);

const INTERACTIVE_COMPONENTS = new Set([
    "Button",
    "Input",
    "SelectItem",
    "SelectTrigger",
    "Slider",
    "Switch",
    "Textarea",
]);

const IGNORED_COMPONENTS = new Set([
    "Arrow",
    "Circle",
    "Group",
    "KonvaImage",
    "Line",
    "Stage",
    "Text",
]);

const INTERACTIVE_ROLES = new Set([
    "button",
    "checkbox",
    "link",
    "menuitem",
    "option",
    "radio",
    "slider",
    "switch",
    "tab",
    "textbox",
]);

const INTRINSIC_EVENT_HANDLER_NAMES = new Set([
    "onBlur",
    "onChange",
    "onClick",
    "onContextMenu",
    "onDoubleClick",
    "onInput",
    "onKeyDown",
    "onKeyUp",
    "onMouseDown",
    "onMouseUp",
    "onPointerDown",
    "onPointerUp",
    "onSubmit",
]);

const CUSTOM_EVENT_HANDLER_NAMES = new Set([
    "onClick",
    "onContextMenu",
    "onDoubleClick",
    "onKeyDown",
    "onKeyUp",
    "onMouseDown",
    "onMouseUp",
    "onPointerDown",
    "onPointerUp",
    "onSubmit",
]);

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

const getLiteralPropValue = (attributeNode) => {
    if (!attributeNode || !attributeNode.value) {
        return null;
    }

    if (attributeNode.value.type === "Literal") {
        return typeof attributeNode.value.value === "string"
            ? attributeNode.value.value
            : null;
    }

    if (
        attributeNode.value.type === "JSXExpressionContainer" &&
        attributeNode.value.expression &&
        attributeNode.value.expression.type === "Literal"
    ) {
        return typeof attributeNode.value.expression.value === "string"
            ? attributeNode.value.expression.value
            : null;
    }

    return null;
};

const hasSpreadAttribute = (attributes) =>
    attributes.some((attribute) => attribute.type === "JSXSpreadAttribute");

const hasTestIdAttribute = (attributes) =>
    attributes.some((attribute) => {
        if (attribute.type !== "JSXAttribute") {
            return false;
        }
        const attrName = getJsxName(attribute.name);
        return TEST_ID_ATTRIBUTES.has(attrName);
    });

const hasInteractiveRole = (attributes) =>
    attributes.some((attribute) => {
        if (attribute.type !== "JSXAttribute") {
            return false;
        }
        const attrName = getJsxName(attribute.name);
        if (attrName !== "role") {
            return false;
        }
        const roleValue = getLiteralPropValue(attribute);
        return roleValue ? INTERACTIVE_ROLES.has(roleValue) : false;
    });

const hasEventHandler = (attributes, eventNames) =>
    attributes.some((attribute) => {
        if (attribute.type !== "JSXAttribute") {
            return false;
        }
        const attrName = getJsxName(attribute.name);
        return eventNames.has(attrName);
    });

const isIntrinsicElement = (elementName) =>
    elementName.toLowerCase() === elementName;

const isInteractiveElement = (node) => {
    const elementName = getJsxName(node.name);
    if (!elementName) {
        return false;
    }

    if (IGNORED_COMPONENTS.has(elementName)) {
        return false;
    }

    if (INTERACTIVE_COMPONENTS.has(elementName)) {
        return true;
    }

    if (!isIntrinsicElement(elementName)) {
        return hasEventHandler(node.attributes, CUSTOM_EVENT_HANDLER_NAMES);
    }

    const normalizedTag = elementName.toLowerCase();
    if (INTERACTIVE_TAGS.has(normalizedTag)) {
        return true;
    }

    return (
        hasEventHandler(node.attributes, INTRINSIC_EVENT_HANDLER_NAMES) ||
        hasInteractiveRole(node.attributes)
    );
};

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description:
                "Require data-testid for interactive JSX elements to keep E2E selectors stable.",
        },
        schema: [],
        messages: {
            missingTestId:
                "Interactive element is missing data-testid. Add a stable test id for E2E automation.",
        },
    },
    create(context) {
        return {
            JSXOpeningElement(node) {
                if (!isInteractiveElement(node)) {
                    return;
                }

                if (hasTestIdAttribute(node.attributes)) {
                    return;
                }

                if (hasSpreadAttribute(node.attributes)) {
                    return;
                }

                context.report({
                    node,
                    messageId: "missingTestId",
                });
            },
        };
    },
};
