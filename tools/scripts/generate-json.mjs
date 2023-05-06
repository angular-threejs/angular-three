import { createWriteStream, existsSync, unlinkSync, writeFileSync } from 'fs';
import ts from 'typescript';
import { format } from 'util';

if (existsSync('tmp/log.txt')) {
    unlinkSync('tmp/log.txt');
}

const logFile = createWriteStream('tmp/log.txt', { flags: 'a' });
// Or 'w' to truncate the file every time the process starts.
const logStdout = process.stdout;

function writeToLog() {
    logFile.write(format.apply(null, [`------${new Date().toLocaleDateString()}------`, '\n']));
    // Storing without color codes
    logFile.write(format.apply(null, arguments).replace(/\033\[[0-9;]*m/g, '') + '\n');
    // Display normally, with colors to Stdout
    logStdout.write(format.apply(null, arguments) + '\n');
}

const TYPE_CHECKER_FLAGS =
    ts.NodeBuilderFlags.NoTruncation | ts.NodeBuilderFlags.InTypeAlias | ts.NodeBuilderFlags.NoTypeReduction;

/**
 * @param {ts.Type} type
 * @param {ts.Node} [node]
 *
 * @return {ts.TypeNode}
 */
function typeToTypeNode(type, node) {
    return typeChecker.typeToTypeNode(type, node, TYPE_CHECKER_FLAGS);
}

/**
 * @param {ts.Type} type
 * @param {ts.Node} [node]
 *
 * @return {string}
 */
function typeToString(type, node) {
    return typeChecker.typeToString(type, node, TYPE_CHECKER_FLAGS);
}

const metadataJson = {
    $schema: 'https://raw.githubusercontent.com/microsoft/vscode-html-languageservice/main/docs/customData.schema.json',
    version: 1.1,
    tags: [],
};
const commonAttributes = [
    {
        name: 'attach',
        description: 'Property to attach to parent. Can be dotted path',
    },
    {
        name: '[attach]',
        description: 'An array of paths to attach to parent. Can also be an NgtAttachFunction',
    },
    {
        name: '[ref]',
        description: 'Assign an NgtInjectedRef',
    },
    {
        name: '(beforeRender)',
        description: 'Register an event to be run in animation loop',
    },
    {
        name: '(afterAttach)',
        description: 'Register an event to be invoked after this node is attached to the parent',
    },
    {
        name: '(afterUpdate)',
        description: "Register an event to be invoked after this node's properties are updated",
    },
];
const webTypesJson = {
    $schema: 'https://raw.githubusercontent.com/JetBrains/web-types/master/schema/web-types.json',
    version: '2.0',
    name: 'angular-three',
    framework: 'angular',
    'js-types-syntax': 'typescript',
    'framework-config': {
        'enable-when': {
            'node-packages': ['angular-three'],
        },
    },
    contributions: {
        html: {
            attributes: commonAttributes,
            elements: [],
        },
    },
};

const program = ts.createProgram(['libs/angular-three/src/lib/three-types.ts'], {
    module: ts.ModuleKind.ESNext,
    target: ts.ModuleKind.ESNext,
    strict: true,
    emitDeclarationOnly: true,
});
const typeChecker = program.getTypeChecker();
const sourceFile = program.getSourceFile('libs/angular-three/src/lib/three-types.ts');

/** @type {Map<string, { typeDeclaration: ts.TypeAliasDeclaration, type: ts.Type, typeNode: ts.TypeNode, typeString: string}>} */
const typeDeclarationMap = new Map();

const PROPERTIES_TO_SKIP = [
    '__ngt_args__',
    'type',
    'uuid',
    'toJSON',
    'clone',
    'copy',
    'dispatchEvent',
    'addEventListener',
    'removeEventListener',
    'fromArray',
    'toArray',
];
const skipIs = (str) => str.startsWith('is');
const skipAction = (str) =>
    str.startsWith('set') ||
    str.startsWith('add') ||
    str.startsWith('has') ||
    str.startsWith('apply') ||
    str.startsWith('update') ||
    str.startsWith('_on') ||
    str.startsWith('get');
const overlapWithCommonAttributes = (str) =>
    commonAttributes.some((attr) => attr.name === str || attr.name === `[${str}]`);

const THREE_MEMBERS_TO_SKIP = ['ngt-primitive', 'ngt-value'];
const THREE_ELEMENTS_NAME = 'ThreeElements';
const THREE_OBJECT_EVENTS_MAP_NAME = 'NgtObject3DEventsMap';

/**
 * @param {{name: string, attributes: any[]}} metadata
 * @param {ts.NodeArray<ts.TypeElement>} members
 */
function processTypeMembers(metadata, members) {
    if (!members?.length) return;
    for (const member of members) {
        /** @type {string} */
        const memberName = member.name?.text || member.name?.escapedText;
        if (
            !memberName ||
            PROPERTIES_TO_SKIP.includes(memberName) ||
            skipIs(memberName) ||
            skipAction(memberName) ||
            overlapWithCommonAttributes(memberName)
        ) {
            continue;
        }
        metadata.attributes.push({ name: memberName }, { name: `[${memberName}]` });
    }
}

/**
 * @param {{name: string, attributes: any[]}} metadata
 * @param {ts.IntersectionTypeNode} typeNode
 */
function processIntersectionTypeNode(metadata, typeNode) {
    for (const type of typeNode.types) {
        if (ts.isTypeReferenceNode(type)) {
            // writeToLog(
            //     'type reference -->',
            //     type.typeName,
            //     type.typeArguments[0].typeArguments[0].typeArguments[0].typeArguments[0].typeArguments[0].typeName.right
            //         .symbol
            // ); THREE.Light, THREE.Mesh, THREE.SpotLight
            // TODO: we don't know how to get the inheritance of some THREE object without turning the source file into an AST
        } else if (ts.isTypeLiteralNode(type)) {
            // this is the type literal that we pass in as an second type argument to NgtOverwrite for NgtObject3DNode
            // so we'll process it as well
            processTypeMembers(metadata, type.members);
        }
    }
}

/**
 * @param {{name: string, attributes: any[]}} metadata
 */
function processObject3DEvents(metadata) {
    const object3DEventsMapType = typeDeclarationMap.get(THREE_OBJECT_EVENTS_MAP_NAME).type;
    for (const member of object3DEventsMapType.properties) {
        metadata.attributes.push({
            name: `(${member.name})`,
        });
    }
}

// we have to recursively process each type alias in the file
ts.forEachChild(sourceFile, (node) => {
    if (ts.isInterfaceDeclaration(node) && node.name.text === THREE_ELEMENTS_NAME) {
        for (let i = 0; i < node.members.length; i++) {
            /** @type {ts.PropertySignature} */
            const threeMember = node.members[i];
            // skip parent for now
            delete threeMember.parent;

            const threeMemberName = threeMember.name.text;

            const metadataAtMember = { name: threeMemberName, attributes: [] };

            /** @type {ts.TypeReferenceNode} */
            const threeMemberType = threeMember.type;
            const threeMemberTypeName = threeMemberType.typeName.text;
            const cachedType = typeDeclarationMap.get(threeMemberTypeName);
            // delete parent from typeDeclaration
            delete cachedType.typeDeclaration.parent;
            if (!THREE_MEMBERS_TO_SKIP.includes(threeMemberName)) {
                const threeMemberTypeNode = cachedType.typeNode;
                if (threeMemberTypeNode) {
                    if (ts.isIntersectionTypeNode(threeMemberTypeNode)) {
                        // TODO: need to expand further, this is complex Object3DNode type
                        // writeToLog(`----${threeMemberName}----${threeMemberTypeName}----`, threeMemberTypeNode);
                        processIntersectionTypeNode(metadataAtMember, threeMemberTypeNode);
                        processObject3DEvents(metadataAtMember);
                    } else if (ts.isTypeLiteralNode(threeMemberTypeNode)) {
                        processTypeMembers(metadataAtMember, threeMemberTypeNode.members);
                    }
                } else {
                    processTypeMembers(metadataAtMember, cachedType.type.properties);
                }
            }

            metadataJson.tags.push({
                ...metadataAtMember,
                attributes: [...metadataAtMember.attributes, ...commonAttributes],
            });
            webTypesJson.contributions.html.elements.push(metadataAtMember);
        }
    }

    if (ts.isTypeAliasDeclaration(node)) {
        const typeName = node.name.escapedText;
        const type = typeChecker.getTypeAtLocation(node);
        const typeNode = typeToTypeNode(type, node);
        const typeString = typeToString(type, node);

        if (typeName === 'NgtMeshBasicMaterial') {
            console.log('typeString -->', typeString);
        }

        // remove checker from type
        delete type.checker;

        typeDeclarationMap.set(typeName, { type, typeDeclaration: node, typeNode, typeString });

        // TODO: we probably should recursively expand the type here as well
    }
});

writeFileSync('libs/angular-three/metadata.json', JSON.stringify(metadataJson));
writeFileSync('libs/angular-three/web-types.json', JSON.stringify(webTypesJson));
