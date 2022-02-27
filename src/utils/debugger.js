
class Debugger {
    /**
     * Debugger to display info real time
     * @param { Number } updateRate - how many times per second should the values be refreshed
     * @param { String } topOffset - element.style.top
     */
    constructor( updateRate = 5, topOffset = '48px' ) {

        this.lines = [];
        this.element = document.createElement('div');
        this.element.style.position = 'absolute';
        this.element.style.top = topOffset;
        this.element.style.left = '0';
        this.element.style.width = '170px';
        this.element.style.height = '200px';
        this.element.style.backgroundColor = 'rgba( 0.2, 0.2, 0.2, 0.8 )';
        this.element.style.border = '1px solid #ddd';
        this.element.style.pointerEvents = 'none';
        this.element.style.padding = '5px';
        this.element.style.fontFamily = 'Courier New, Courier, monospace';
        this.element.style.wordBreak = 'break-all'; 
        // this.element.style.overflowY = 'auto';

        document.body.appendChild( this.element );

        setInterval( () => {
            this.update();
        }, 1000/updateRate );
    }

    /**
     * Adds new debugger line
     * @param { Object } object - object to get data from
     * @param { String } property - property to display. If typeof 'object', it gets JSON.stringify
     * @param { String } preface - string to display before data
     * @param { Boolean } autoUpdate - whether data should be autorefreshed. Default true. 
     * Disable if you manually update the value
     */
    addLine( object, property, preface, autoUpdate = true ) {

        const newLine = { object, property, preface, autoUpdate };
        newLine.element = document.createElement('div');
        newLine.element.style.marginBottom = '1px';
        newLine.element.style.fontSize = '13px';
        newLine.element.style.color = '#ddd';
        newLine.update = () => {
            const value = typeof newLine.object[ newLine.property ] === 'object' ? 
                JSON.stringify( newLine.object[ newLine.property ] ) : newLine.object[ newLine.property ];
            newLine.element.textContent = `${ newLine.preface }: ${ value }`;
        }
        newLine.update();
        this.lines.push( newLine );
        this.element.appendChild( newLine.element );
    }

    /**
     * Gets a particular line of the debugger, searched by 'preface' value. Useful if you want to
     * update the line yourself.
     * @param { String } preface - name to search by
     */
    getLine( preface ) {
        for ( let i = 0, len = this.lines.length; i < len; i++ ) {
            const line = this.lines[i];
            if ( line.preface === preface ) {
                return line;
            }
        }
    }

    update() {

        for ( let i = 0, len = this.lines.length; i < len; i++ ) {
            const line = this.lines[i];
            if ( !line.autoUpdate ) continue;

            line.update();
        }
    }
}

export { Debugger };