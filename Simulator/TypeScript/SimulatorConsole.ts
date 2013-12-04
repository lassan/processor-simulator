module SimulatorConsole {

    export enum PrintType {
        Normal, Error, Instrumentation
    }

    export function write(text: string, type: PrintType): void {
        var typeClass = GetTypeClass(type);
        var line = "<span class=\"" + typeClass +
            "\">" + text + "</span>";

        $('#console div').append(line); 
    }

    export function writeLine(text: string, type: PrintType): void {

        var typeClass = GetTypeClass(type);
        var line = "<span class=\"" + typeClass +
            "\">" + text + "</span><br/>";

        $('#console div').append(line); 
    }

    export function clear() {
        $('#console div').text("");
    }

    function GetTypeClass(type: PrintType): string {
        var typeClass: string = "c_";

        return typeClass.concat(SimulatorConsole.PrintType[type].toLowerCase());    
    }
}