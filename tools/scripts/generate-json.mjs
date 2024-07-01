import ts from 'typescript';
import { commonAttributes, createBareJsons, createLog, createProgram } from './utils.mjs';

const logger = createLog();

const { metadataJson, webTypesJson, write } = createBareJsons();

const { typeChecker, sourceFile, typeToTypeNode, typeToString, processIntersectionTypeNode, processTypeMembers } =
	createProgram(['libs/core-new/src/lib/three-types.ts']);

/** @type {Map<string, { typeDeclaration: ts.TypeAliasDeclaration, type: ts.Type, typeNode: ts.TypeNode, typeString: string}>} */
const typeDeclarationMap = new Map();

const THREE_MEMBERS_TO_SKIP = ['ngt-primitive', 'ngt-value'];
const THREE_ELEMENTS_NAME = 'ThreeElements';
const THREE_OBJECT_EVENTS_MAP_NAME = 'NgtObject3DEventsMap';

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

		// remove checker from type
		delete type.checker;

		typeDeclarationMap.set(typeName, { type, typeDeclaration: node, typeNode, typeString });

		// TODO: we probably should recursively expand the type here as well
	}
});

write(metadataJson, webTypesJson);
