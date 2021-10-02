import { CanvasTexture } from 'three';

class EmptyTexture extends CanvasTexture {
    constructor() {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 1;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#33CCFF';
        ctx.fillRect( 0, 0, 1, 1 );
        super( canvas );
    }
}

export { EmptyTexture };