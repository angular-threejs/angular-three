import { tsquery } from '@phenomnomnominal/tsquery';

const content = `
import { Component } from '@angular/core';
import { NxWelcomeComponent } from './nx-welcome.component';

@Component({
  standalone: true,
  imports: [NxWelcomeComponent],
  selector: 'app-root',
	template: \`\`,
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
}`;

let updatedContent = tsquery.replace(content, 'Identifier[name="imports"] ~ ArrayLiteralExpression', (node) => {
	return `[${node.elements.map((element) => element.escapedText).join(', ')}, NgtCanvas]`;
});

updatedContent = tsquery.replace(
	updatedContent,
	'Identifier[name="template"] ~ NoSubstitutionTemplateLiteral',
	(node) => {
		return `\`<ngt-canvas [sceneGraph]="scene" />\``;
	},
);

updatedContent = tsquery.replace(updatedContent, 'SourceFile', (node) => {
	return `
import { NgtCanvas } from 'angular-three';
import { Experience } from './experience/experience.component';

${node.getFullText()}
`;
});

const contentNode = tsquery.ast(content);
const classMembersQuery = 'ClassDeclaration > :matches(PropertyDeclaration,MethodDeclaration)';
const members = tsquery.match(contentNode, classMembersQuery);

if (members.length === 0) {
	updatedContent = tsquery.replace(updatedContent, 'ClassDeclaration', (node) => {
		const withoutBraces = node.getFullText().slice(0, -1);
		return `
${withoutBraces}
  scene = Experience;
}
`;
	});
} else {
	updatedContent = tsquery.replace(updatedContent, classMembersQuery, (node) => {
		return `
scene = Experience;
${node.getFullText()}
`;
	});
}

console.log(updatedContent);
