// organize-imports-ignore
import React from 'react';

export default function CodeDemo({ src, srcId, title }) {
    const iframeSrc = srcId ? `https://stackblitz.com/edit/angular-three-demo-template-${srcId}` : src;

    return (
        <iframe
            className="code-demo"
            src={iframeSrc.concat(
                '?ctl=1&embed=1&file=src/app/scene.component.ts&hideExplorer=1&hideNavigation=1&view=preview'
            )}
            title={'angular_three_'.concat(title || Math.random().toString())}
        ></iframe>
    );
}
