import SPK1_1 from './spk1_1.js';
import { ComputeMatrix, ComputeFixedPoint,
         MobiusOnPoint, DistQuaternion3D } from './util.js';

export default class DFSOperator {
    constructor(a, b, maxLevel, epsilon) {
        this.a = a;
        this.b = b;
        this.maxLevel = maxLevel;

        this.tags = new Array(1000);
        this.word = new Array(1000);
        
        this.gens = new Array(4 + 1);
        this.level = 1;
        this.fixedPoint = [new Array(5), new Array(5),
                           new Array(5), new Array(5),
                           new Array(5)];

        this.epsilon = Math.abs(epsilon);

        this.setGens(this.a, this.b);
		this.setFixedPoints();
        this.init();

        this.points = [];
    }

    init(){
        this.word[0] = SPK1_1.UNIT();
        this.level = 1;
        this.tags[1] = 1;
        this.word[1] = this.gens[1];
    }

     /**
     *
     * @param {SPK1_1} a
     * @param {SPK1_1} b
     */
    setGens(a, b) {
        this.gens[1] = a;
		this.gens[2] = b;
		this.gens[3] = a.inverse();
		this.gens[4] = b.inverse();
    }

    setFixedPoints() {
        const repet = [new Array(5), new Array(5),
                       new Array(5), new Array(5),
                       new Array(5)];
        repet[1][1] = ComputeMatrix(this.gens[2], this.gens[3], this.gens[4], this.gens[1]);
        repet[1][2] = this.gens[1];
        repet[1][3] = this.gens[2].mult(this.gens[1]);
        repet[1][4] = ComputeMatrix(this.gens[4], this.gens[3], this.gens[2], this.gens[1]);

        repet[2][1] = ComputeMatrix(this.gens[3], this.gens[4], this.gens[1], this.gens[2]);
        repet[2][2] = this.gens[2];
        repet[2][3] = this.gens[1].mult(this.gens[2]);
        repet[2][4] = ComputeMatrix(this.gens[1], this.gens[4], this.gens[3], this.gens[2]);

        repet[3][1] = ComputeMatrix(this.gens[4], this.gens[1], this.gens[2], this.gens[3]);
        repet[3][2] = this.gens[3];
        repet[3][3] = this.gens[4].mult(this.gens[3]);
        repet[3][4] = ComputeMatrix(this.gens[2], this.gens[1], this.gens[4], this.gens[3]);

        repet[4][1] = ComputeMatrix(this.gens[1], this.gens[2], this.gens[3], this.gens[4]);
        repet[4][2] = this.gens[4];
        repet[4][3] = this.gens[3].mult(this.gens[4]);
        repet[4][4] = ComputeMatrix(this.gens[3], this.gens[2], this.gens[1], this.gens[4]);

        for(let i = 1; i <= 4; i ++){
			for(let j = 1; j <= 4; j++){
				this.fixedPoint[i][j] = ComputeFixedPoint(repet[i][j]);
			}
		}
    }

    goForward(){
		this.level++;
		this.tags[this.level] = Math.abs((this.tags[this.level - 1] + 1)%4);
		if(this.tags[this.level] == 0)
			this.tags[this.level] = 4;
		//dumpWord();
		//System.out.println("go forward current level "+ level +"tag["+ level +"]"+ tags[level]);
		this.word[this.level] = this.word[this.level -1].mult(this.gens[this.tags[this.level]]);
	}

	goBackward(){
		this.level--;
		//System.out.println("go backward current level"+ level);
	}

	isAvailableTurn(){
		let t = Math.abs((this.tags[this.level] + 2)%4);
		if(t == 0)
			t = 4;
		let t2 = this.tags[this.level + 1] -1;
		if(t2 == 0)
			t2 = 4;
		if(t2  == t)
			return false;
		else
			return true;
	}

	turnAndGoForward(){
		this.tags[this.level + 1] = Math.abs((this.tags[this.level + 1]) - 1 % 4);
		if(this.tags[this.level +1] == 0)
			this.tags[this.level + 1] = 4;
		//dumpWord();
		if(this.level == 0)
			this.word[1] = this.gens[this.tags[1]];
		else
			this.word[this.level + 1] = this.word[this.level].mult(this.gens[this.tags[this.level + 1]]);
		this.level++;
		//System.out.println("turn and go forward current level"+ level);
	}
	
	//Indra's pearls p207 “ÁŽêŒêƒAƒ‹ƒSƒŠƒYƒ€
	branchTermination(){
		const z = new Array[4 + 1];
		//System.out.println(word[level]);
		for(let j = 1; j <= 4; j++){
			//System.out.println(fixPoint[tags[level]][j]);
			z[j] = MobiusOnPoint(this.word[this.level], this.fixedPoint[this.tags[this.level]][j]);
			//System.out.println(z[j]);
		}
		
		
		if(this.level == this.maxLevel ||
           (DistQuaternion3D(z[1], z[2]) <= this.epsilon &&
            DistQuaternion3D(z[2], z[3]) <= this.epsilon &&
            DistQuaternion3D(z[3], z[4]) <= this.epsilon)){
			//if(level == maxLevel) System.out.println("max level!");
			// double delta = Util.calcDelta(word[level]);
			// //System.out.println("delta "+ delta);
			// //System.out.println("trace "+ Math.abs(word[level].trace().re()));
			// if(GLInterface.ellipticCheck.isSelected()){
			// 	if(delta < -0.0000001 || 
			// 			(Math.abs(delta) < 0.00001 && 
			// 					Math.abs(word[level].b.k()) < 0.00001 && 
			// 					Math.abs(word[level].c.k()) < 0.00001 && 
			// 					Math.abs(word[level].trace().re()) < 2.0 - 0.000001 )){
			// 		System.out.println("elliptic");
			// 		System.out.println("delta "+ delta);
			// 		System.out.println("trace "+ Math.abs(word[level].trace().re()));
			// 	}
			// }
			const t = new Array(this.maxLevel + 1);
			for(let i = 1; i <= this.level; i++){
				//System.out.print(tags[i]);
				t[i] = this.tags[i];
			}
			//System.out.println();
			//l3DList.add(new Line3D(z[1], z[2], t, tags[1]));
			//l3DList.add(new Line3D(z[2], z[3], t, tags[1]));
			//l3DList.add(new Line3D(z[3], z[4], t, tags[1]));
            this.points.push(z[1]);
            this.points.push(z[2]);
            this.points.push(z[3]);
            this.points.push(z[4]);
			return true;
		}else{
			return false;
		}
	}
}