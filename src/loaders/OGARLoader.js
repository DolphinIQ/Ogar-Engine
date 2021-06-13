import { BufferAttribute, BufferGeometry } from 'three';

class OGARLoader {
    constructor() {

    }

    load( url = '' ) {

        return new Promise( ( resolve, reject ) => {
            fetch( url )
                .then(response => response.arrayBuffer())
                .then( ( buffer ) => {
    
                    const textToDecode = new Uint8Array( buffer );
                    let bufferArray;
                    
                    // Avoid the String.fromCharCode.apply(null, array) shortcut, which
                    // throws a "maximum call stack size exceeded" error for large arrays.
                    let str = '';
                    for ( let i = 0, il = textToDecode.length; i < il; i++ ) {
                        const char = String.fromCharCode( textToDecode[ i ] );
                        if ( char === ' ' ) { // space is a character separating json form buffer
                            bufferArray = textToDecode.slice( i + 1, textToDecode.length ).buffer;
                            break;
                        }
                        str += char;
                    }
    
                    const json = JSON.parse( str );
    
                    // Reconstruct buffer geometry
                    const modelGeometry = new BufferGeometry();
                    let bufferIndex = 0;
                    for ( const attributeName in json.geometry ) {
    
                        const attribute = json.geometry[attributeName];
    
                        const typedArray = new window[ attribute.typedArrayName ]( // some type of TypedArray
                            bufferArray, 
                            bufferIndex, 
                            attribute.byteLength / attribute.byteSizePerNumber
                        );
    
                        if ( attributeName === 'index' ) {
                            modelGeometry.index = new BufferAttribute( typedArray, attribute.itemSize );
                        } else {
                            modelGeometry.setAttribute( attributeName, new BufferAttribute( typedArray, attribute.itemSize ) );
                        }
    
                        bufferIndex += attribute.byteLength;
                    }
    
                    // console.log({ buffer, textToDecode, str, json, bufferArray, modelGeometry });
    
                    resolve({ geometry: modelGeometry });
                });

        });
    }
}

export { OGARLoader };