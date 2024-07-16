import ts from 'typescript';
import { commonAttributes, createBareJsons, createLog, createProgram } from './utils.mjs';

const logger = createLog();

const { metadataJson, webTypesJson, write } = createBareJsons();

const { sourceFile, typesMap, processIntersectionTypeNode, processTypeMembers } = createProgram([
	'libs/core/src/lib/three-types.ts',
]);

const THREE_MEMBERS_TO_SKIP = ['ngt-primitive'];
const THREE_ELEMENTS_NAME = 'ThreeElements';
const THREE_OBJECT_EVENTS_MAP_NAME = 'NgtObject3DEventsMap';

/**
 * @param {{name: string, attributes: any[]}} metadata
 */
function processObject3DEvents(metadata) {
	const object3DEventsMapType = typesMap[THREE_OBJECT_EVENTS_MAP_NAME].type;
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
			const cachedType = typesMap[threeMemberTypeName];

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
					if (cachedType.typeString.includes(THREE_OBJECT_EVENTS_MAP_NAME)) {
						processObject3DEvents(metadataAtMember);
					}
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
});

write(metadataJson, webTypesJson);
