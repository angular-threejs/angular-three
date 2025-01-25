import { signal } from '@angular/core';

export const shape = signal<'box' | 'sphere'>('box');
