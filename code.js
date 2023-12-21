class State {
    #state = [];

    get Cells() {
        return this.#state;
    }

    constructor(prevState, config) {
        if(prevState && config) {
            for (let cell of prevState.GetAffectedCells(config)) {
                if(prevState.IsCellAlive(cell, config)) {
                    this.#state.push(cell);
                }
            }
            this.#state =  this.#state.sort();
        }
    }

    Clear() {
        this.#state = [];
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
            this.GetCellNeighbours(cellName, config).filter(neighbourCellName => this.IsCellActive(neighbourCellName)).length;

        if(this.IsCellActive(cellName)) {
            return activeNeighboursCount === 2 || activeNeighboursCount === 3;
        } else {
            return activeNeighboursCount === 3;
        }
    }

    GetCellNeighbours(cellName, config) {
        const coords = cellName.split('-');
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

    GetAffectedCells(config) {
        //Составить список всех клеток которые могут быть задействованы
        const affectedCells = new Set();
        for(const cell of this.#state) {
            affectedCells.add(cell);
            for(const neighbour of this.GetCellNeighbours(cell, config)) {
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
            return JSON.stringify(anotherState) === JSON.stringify(this.#state);
        }

        return false;
    }
}

class LifeGenerator {

    #config = {};
    #state = new State();
    #history = [];

    get State() {
        return this.#state;
    }

    get PrevState() {
        if(this.#history.length) {
            return this.#history[this.#history.length - 1];
        }

        return null;
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

    CalcNextState() {
        if(!this.PrevState) {
            this.#history.push(this.#state);
            return {
                success: true,
                step: this.#history.length,
                message: '',
                time: 0
            };
        }

        const startTime = Date.now();

        this.#history.push(this.#state);
        this.#state = new State(this.PrevState, this.#config);

        const endTime = Date.now();

        if (this.#state.IsEmpty()) {
            return {
                success: false,
                step: this.#history.length,
                message: 'завершена: пустое состояние',
                time: endTime - startTime
            };
        }

        if(this.#history.some(prevState => prevState.IsSame(this.#state.Cells))) {
            return {
                success: false,
                step: this.#history.length,
                message: 'завершена: повтор состояния',
                time: endTime - startTime
            };
        }

        return {
            success: true,
            step: this.#history.length,
            message: '',
            time: endTime - startTime
        };
    }
}

const lifeGenerator = new LifeGenerator();

document.addEventListener('DOMContentLoaded', () => {
    const configForm = document.getElementById("config");

    const initContainer = document.getElementById("init");
    const initContainerRoot = initContainer.getElementsByTagName('div')[0];
    const initRandomButton = initContainer.getElementsByTagName('button')[0];

    const startLifeButton = initContainer.getElementsByTagName('button')[1];


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

        function step2() {
            configForm.classList.add('hidden');
            lifeContainer.classList.add('hidden');
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
        }

        step2();

        let stop = false;
        let totalTime = 0;
        function step3() {
            lifeContainerRoot.innerHTML='';
            lifeButton.innerHTML = 'Остановить';
            lifeHeader.innerHTML =  'Жизнь';
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

            const lifeContainerRows = lifeContainerRoot.getElementsByClassName('row');

            function stopIteration(msg) {
                lifeHeader.innerHTML =  msg;
                lifeButton.innerHTML = 'Повторить';
                lifeButton.onclick = () => step2();
            }

            stop = false;
            totalTime = 0;

            function iterateLife() {

                const iterationResult = lifeGenerator.CalcNextState();
                totalTime += iterationResult.time;

                for(let cellName of lifeGenerator.PrevState.Cells) {
                    if(lifeGenerator.State.Cells.includes(cellName)) continue;

                    const coords = cellName.split('-');
                    const row = parseInt(coords[0]);
                    const col = parseInt(coords[1]);
                    lifeContainerRows[row].getElementsByTagName('div')[col].classList.remove('active');
                }

                for(let cellName of lifeGenerator.State.Cells) {
                    if(lifeGenerator.PrevState.Cells.includes(cellName)) continue;

                    const coords = cellName.split('-');
                    const row = parseInt(coords[0]);
                    const col = parseInt(coords[1]);
                    lifeContainerRows[row].getElementsByTagName('div')[col].classList.add('active');
                }

                if(!iterationResult.success) {
                    stopIteration(`Жизнь ${ iterationResult.message } / шагов ${ iterationResult.step } / ${ totalTime } ms`);
                    return;
                }

                if(stop) {
                    stopIteration(`Жизнь остановлена / шагов ${ iterationResult.step }  / ${ totalTime } ms`);
                    return;
                }

                lifeHeader.innerHTML =`Жизнь выполнео шагов ${ iterationResult.step }  / ${ totalTime } ms`

                setTimeout(iterateLife, 0);
            }

            iterateLife();
        }

        startLifeButton.onclick = () => {
            lifeButton.onclick = () => stop = true;
            step3();
        }

        initRandomButton.onclick = () => {

            const initRows = initContainerRoot.getElementsByClassName('row');

            lifeGenerator.State.Clear();

            for (let row = 0; row < lifeGenerator.Config.y; row++) {
                const cellDivs = initRows[row].getElementsByTagName('div');
                for (let col = 0; col < lifeGenerator.Config.x; col++) {
                    const random = Math.trunc(Math.random()*1000);

                  if(random % 2) {
                      lifeGenerator.State.ToggleCellActive(`${row}-${col}`);
                      if(!cellDivs[col].classList.contains('active')) {
                          cellDivs[col].classList.add('active');
                      }
                  } else {
                      cellDivs[col].classList.remove('active');
                  }
                }
            }
        }

    });
});