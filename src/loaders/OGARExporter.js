
class OGARExporter {
    constructor() {
        this.downloadEl = document.createElement( 'a' );
    }

    export( data, fileName, mimeType ) {

        // Put data into an array if it's not. Blob requires an array
        data = Array.isArray( data ) ? data : [data];

        // Default mimeType to binary
        const blob = new Blob( data, { type: mimeType || "application/octet-stream" } );
        const url = URL.createObjectURL( blob );
        this.downloadEl.setAttribute( 'download', fileName + '.ogar' );
        this.downloadEl.setAttribute( 'href', url );
        this.downloadEl.click();
    }

    exportMesh( mesh, fileName = 'model' ) {
        if( mesh.isMesh ) {

            const json = {
                type: 'mesh',
                geometry: {

                }
            };
            const buffers = [];

            // Add standard attributes
            let attributesCount = 0;
            for( const attributeName in mesh.geometry.attributes ) {

                const attribute = mesh.geometry.getAttribute( attributeName );
                json.geometry[attributeName] = {
                    bufferIndex: attributesCount,
                    byteLength: attribute.array.byteLength,
                    byteSizePerNumber: attribute.array.BYTES_PER_ELEMENT,
                    itemSize: attribute.itemSize,
                    typedArrayName: attribute.array.constructor.name
                }
                buffers.push( attribute.array.buffer );

                attributesCount++;
            }
            // Add index attribute
            if ( mesh.geometry.index ) {

                json.geometry['index'] = {
                    bufferIndex: attributesCount,
                    byteLength: mesh.geometry.index.array.byteLength,
                    byteSizePerNumber: mesh.geometry.index.array.BYTES_PER_ELEMENT,
                    itemSize: mesh.geometry.index.itemSize,
                    typedArrayName: mesh.geometry.index.array.constructor.name
                }
                buffers.push( mesh.geometry.index.array.buffer );
            }

            const data = [ JSON.stringify( json ) + " " ].concat( buffers );

            // console.log( data );

            this.export( data, fileName, "application/octet-stream" );

        } else {
            console.error('Model cannot be exported, for it is not a mesh');
        }
    }
}

export { OGARExporter };