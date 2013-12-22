module BranchPredictors {

    export interface BranchPredictor {
        predict(instruction: Instructions.Instruction, currentPc: number): number;
        branchTaken(prediction: boolean);
        branchNotTaken(prediction: boolean); //This method should set the program counter to where it would've been 

        LinkRegister:number[];
    }

    function isBranchInstruction(instruction: Instructions.Instruction) {
        if (instruction.type != Enums.ExecutionUnit.BranchUnit)
            throw Error("Can not predit a non branch instruction, you numpty");
    }

    export class Dynamic implements BranchPredictor {

        private BranchTable: number[][];
        public LinkRegister: number[];

        public WillBranch: boolean;

        constructor() {
            this.BranchTable = [];
        }

        predict(instruction: Instructions.Instruction, currentPc: number): number {
            isBranchInstruction(instruction);
            var nextPc: number;


            var key = currentPc;

            if (!this.BranchTable.hasOwnProperty(currentPc.toString())) {
                //add to the branch history, initialised as "strongly taken"
                this.BranchTable[key] = [3, +instruction.operands[0]];
            }

            this.LinkRegister = [key];

            if (instruction instanceof Instructions.B) {
                nextPc = +instruction.operands[0];
                instruction.willBranch = true;
            } else {
                if (this.BranchTable[key][0] > 1) {
                    //branch should be taken
                    instruction.willBranch = true;
                    nextPc = this.BranchTable[key][1];
                } else {
                    instruction.willBranch = false;
                    nextPc = currentPc + 1;
                }
            }
            return nextPc;
        }

        branchTaken(prediction : boolean) {

            var key = this.LinkRegister[0];

            if (!prediction)
                _cpu.setProgramCounter(this.BranchTable[key][1]);

            if (this.BranchTable[key][0] < 3)
                this.BranchTable[key][0]++;

            this.LinkRegister = null;
        }

        branchNotTaken(prediction: boolean) {
            var key = this.LinkRegister[0];

            if (prediction)
                _cpu.setProgramCounter(key + 1);

            if (this.BranchTable[key][0] > 0)
                this.BranchTable[key][0]--;

            this.LinkRegister = null;
        }
    }

    export class AlwaysTaken implements BranchPredictor {
        /// <summary>
        ///     All branches are always taken
        /// </summary>
        public LinkRegister: number[];

        constructor() {
        }

        predict(instruction: Instructions.Instruction, currentPc: number): number {
            isBranchInstruction(instruction);

            this.LinkRegister = [currentPc];

            var nextPc: number = +instruction.operands[0];
            instruction.willBranch = true;

            return nextPc;
        }

        branchTaken(prediction: boolean) {
            //therefore success
            this.LinkRegister = null;
        }

        branchNotTaken(prediction: boolean) {
            //prediction unsuccessful
            var pc = this.LinkRegister[0] + 1;
            _cpu.setProgramCounter(pc);
            this.LinkRegister = null;
        }

    }

    export class Displacement implements BranchPredictor {
        /// <summary>
        ///     Backward branches are always taken. Forward branches are not
        /// </summary>
        public LinkRegister :number[];

        constructor() {
        }

        predict(instruction: Instructions.Instruction, currentPc: number): number {
            isBranchInstruction(instruction);
            var posPc: number = +instruction.operands[0];

            this.LinkRegister = [currentPc, posPc];

            var nextPc: number;

            if (instruction instanceof Instructions.B) {
                nextPc = +instruction.operands[0];
                instruction.willBranch = true;
            } else {

                if (posPc > currentPc) {
                    //forward branch
                    instruction.willBranch = false;
                    nextPc = currentPc + 1;
                } else {
                    instruction.willBranch = true;
                    nextPc = posPc;
                }
            }
            return nextPc;
        }

        branchTaken(prediction:boolean) {
            if (!prediction) {
                //go to where the branch would've taken you
                _cpu.setProgramCounter(this.LinkRegister[1]);
            }

            this.LinkRegister = null;
        }

        branchNotTaken(prediction:boolean) {
            var pc = this.LinkRegister[0] + 1;

            if (prediction)
                _cpu.setProgramCounter(pc);

            this.LinkRegister = null;
        }

    }

    export class NeverTaken implements BranchPredictor {
        /// <summary>
        ///     No branches are to ever taken, except for an unconditional branch
        /// </summary>
        public LinkRegister: number[];

        constructor() {}

        predict(instruction: Instructions.Instruction, currentPc: number): number {
            isBranchInstruction(instruction);

            this.LinkRegister = [+instruction.operands[0]];
            
            var nextPc: number;
            instruction.willBranch = false;

            if (instruction instanceof Instructions.B) {
                nextPc = +instruction.operands[0];
            } else {
                nextPc = currentPc + 1;
            }

            return nextPc;
        }

        branchTaken(prediction: boolean) {
            //Prediction was unsuccessful
            var pc = this.LinkRegister[0];
            _cpu.setProgramCounter(pc);
            this.LinkRegister = null;
        }

        branchNotTaken(prediction: boolean) {
            //Prediction was successfull
            this.LinkRegister = null;
        }

    }

}