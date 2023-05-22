import { enableProdMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { renderApplication } from '@angular/platform-server';
import 'zone.js/node';
import { config } from './app.config.server';
import { AppComponent } from './app/app.component';

if (import.meta.env.PROD) {
    enableProdMode();
}

const bootstrap = () => bootstrapApplication(AppComponent, config);

export default async function render(url: string, document: string) {
    const html = await renderApplication(bootstrap, {
        document,
        url,
    });
    return html;
}
