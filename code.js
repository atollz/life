
class State {
    #state = [];

    constructor(prevState, config) {
        if(prevState && config) {
            for (let cell of prevState.GetAffectedCells()) {
                if(prevState.IsCellAlive(cell, config)) {
                    this.#state.push(cell);
                }
            }
        }
    }

    ToggleCellActive(cellName) {
       const foundIndex = this.#state.indexOf(cellName);

       if(foundIndex > -1) {
           this.#state.splice(foundIndex, 1);
       } else {
           this.#state.push(cellName);
       }
    }

    IsCellActive(cellName) {
        const foundIndex = this.#state.indexOf(cellName);

        return foundIndex > -1;
    }

    IsCellAlive(cellName, config) {
        const activeNeighboursCount =
            this.GetCellNeighbours(cellName, config).filter(this.IsCellActive).length;

        if(this.IsCellActive(cellName)) {
            return activeNeighboursCount === 2 || activeNeighboursCount === 3;
        } else {
            return activeNeighboursCount === 3;
        }
    }

    GetCellNeighbours(cellName, config) {
        const coords = cellName.spit('-');
        const row = parseInt(coords[0]);
        const col = parseInt(coords[1]);

        const result = [];

        for(let rowShift = -1; rowShift <= 1; rowShift++) {
            for(let colShift = -1; colShift <= 1; colShift++) {
                if(!rowShift && !colShift) continue;

                let newRow = row + rowShift;
                if(newRow < 0) { newRow = config.x - 1; }
                if(newRow > config.x - 1) { newRow = 0; }

                let newCol = col + colShift;
                if(newCol < 0) { newCol = config.y - 1; }
                if(newCol > config.y - 1) { newCol = 0; }

                result.push(`${ newRow }-${ newCol }`);
            }
        }

        return result;
    }

    GetAffectedCells() {
        //Составить список всех клеток которые могут быть задействованы
        const affectedCells = new Set();
        for(const cell of this.#state) {
            affectedCells.add(cell);
            for(const neighbour of this.GetCellNeighbours(cell)) {
                affectedCells.add(neighbour);
            }
        }

        return Array.from(affectedCells);
    }

    IsEmpty() {
        return !this.#state.length;
    }

    IsSame(anotherState) {
        if(anotherState.length === this.#state.length) {
           return !this.#state.find((cell) => !anotherState.includes(cell));
        }

        return false;
    }

}

class LifeGenerator {

    #config = {};
    #state = new State();
    #prevState = null;

    get State() {
        return this.#state;
    }

    get PrevState() {
        return this.#prevState;
    }

    get Config() {
        return this.#config;
    }

   InitConfig(value) {
       this.#config = value;
    }

    [Symbol.iterator]() {
        return this;
    }

    #calcNextState() {
        if(!this.#prevState) {
            this.#prevState = this.#state;
            return true;
        }

        this.#prevState = this.#state;
        this.#state = new State(this.#prevState, this.#config);

        return !this.#state.IsEmpty() && !this.#state.IsSame(this.#prevState);
    }

    next() {
        if(this.#calcNextState()) {
            return {
                done: false,
                value: this.#state
            };
        } else {
            return {
                done: true
            };
        }
    }
}

const lifeGenerator = new LifeGenerator();

document.addEventListener('DOMContentLoaded', () => {
    const configForm = document.getElementById("config");

    const initContainer = document.getElementById("init");
    const initContainerRoot = initContainer.getElementsByTagName('div')[0];
    const initButton = initContainer.getElementsByTagName('button')[0];

    const lifeContainer = document.getElementById("life");
    const lifeContainerRoot = lifeContainer.getElementsByTagName('div')[0];
    const lifeButton = lifeContainer.getElementsByTagName('button')[0];
    const lifeHeader = lifeContainer.getElementsByTagName('h5')[0];

    configForm.addEventListener('submit', (e) => {
        e.preventDefault();

        lifeGenerator.InitConfig({
            x: document.getElementById('x').value,
            y: document.getElementById('y').value,
        });

        configForm.classList.add('hidden');


        initContainerRoot.innerHTML='';

        for(let row = 0; row < lifeGenerator.Config.y; row++) {
            const rowDiv = document.createElement('div');
            rowDiv.classList.add('row');

            for (let col = 0; col < lifeGenerator.Config.x; col++) {
                const colDiv = document.createElement('div');
                colDiv.onclick = (e) => {
                    lifeGenerator.State.ToggleCellActive(`${row}-${col}`);
                    if (lifeGenerator.State.IsCellActive(`${row}-${col}`)) {
                        if (!e.target.classList.contains('active')) {
                            e.target.classList.add('active');
                        }
                    } else {
                        if (e.target.classList.contains('active')) {
                            e.target.classList.remove('active');
                        }
                    }
                }

                rowDiv.appendChild(colDiv);
            }

            initContainerRoot.appendChild(rowDiv);
        }

        initContainer.classList.remove('hidden');

        // ------------

        initButton.onclick = () => {
            initContainerRoot.innerHTML='';
            initContainer.classList.add('hidden');

            for(let row = 0; row < lifeGenerator.Config.y; row++) {
                const rowDiv = document.createElement('div');
                rowDiv.classList.add('row');

                for (let col = 0; col < lifeGenerator.Config.x; col++) {
                    const colDiv = document.createElement('div');
                    if (lifeGenerator.State.IsCellActive(`${row}-${col}`)) {
                        if (!colDiv.classList.contains('active')) {
                            colDiv.classList.add('active');
                        }
                    } else {
                        if (colDiv.classList.contains('active')) {
                            colDiv.classList.remove('active');
                        }
                    }

                    rowDiv.appendChild(colDiv);
                }

                lifeContainerRoot.appendChild(rowDiv);
            }

            lifeContainer.classList.remove('hidden');

            let stop = false;
            lifeButton.onclick = () => stop = true;

            for(let currentLife of lifeGenerator) {
                if(stop) break;
            }
        }
    });
});