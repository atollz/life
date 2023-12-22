class State {
    #state;
    #config;

    get Cells() {
        return this.#state;
    }

    get Length() {
        return this.#config.x * this.#config.y;
    }

    constructor(config, prevState) {
        this.#state = new Uint8Array(config.x * config.y);
        this.#config = config;

        if(prevState) {
            for(let cellIndex; cellIndex < this.Length; cellIndex++) {
                if(prevState.IsCellAlive(cellIndex)) {
                    this.#state[cellIndex] = 1;
                }
            }

            for (let cellIndex of prevState.GetAffectedCells()) {
                if(prevState.WillCellBeActive(cellIndex)) {
                    this.#state[cellIndex] = 1;
                }
            }
        }
    }

    Clear() {
        this.#state = new Uint8Array(this.Length);
    }

    IndexToColRow(index) {
        const row = Math.trunc(index / this.#config.x);
        const col = index - row * this.#config.x;

        return { row, col };
    }

    RowColToIndex(row, col) {
        return row * this.#config.x + col;
    }

    ToggleCellActive(row, col) {
        const index = this.RowColToIndex(row, col);
        this.#state[index] = this.#state[index] ? 0 : 1;
    }

    IsRowColActive(row, col) {
        const index = this.RowColToIndex(row, col);

        return this.#state[index] !== 0;
    }

    IsCellActive(index) {
        return this.#state[index] !== 0;
    }

    WillCellBeActive(index) {
        const { row, col } = this.IndexToColRow(index);

        let activeCount = 0;

        for(let rowShift = -1; rowShift <= 1; rowShift++) {
            for(let colShift = -1; colShift <= 1; colShift++) {
                if(!rowShift && !colShift) continue;

                let newRow = row + rowShift;
                if(newRow < 0) { newRow = this.#config.x - 1; }
                if(newRow > this.#config.x - 1) { newRow = 0; }

                let newCol = col + colShift;
                if(newCol < 0) { newCol = this.#config.y - 1; }
                if(newCol > this.#config.y - 1) { newCol = 0; }

                const newCellIndex = this.RowColToIndex(newRow, newCol);
                if(this.#state[newCellIndex]) {
                    activeCount ++;
                    if(activeCount > 4) return false;
                }
            }
        }

        if(this.#state[index]) {
            return activeCount === 2 || activeCount === 3;
        }

        return  activeCount === 3;
    }

    IsCellAlive(index) {
        const activeNeighboursCount =
            this.GetCellNeighbours(index).filter(neighbourCellIndex => this.IsCellActive(neighbourCellIndex)).length;

        if(this.IsCellActive(index)) {
            return activeNeighboursCount === 2 || activeNeighboursCount === 3;
        } else {
            return activeNeighboursCount === 3;
        }
    }

    GetCellNeighbours(index) {
        const { row, col } = this.IndexToColRow(index);

        const result = [];

        for(let rowShift = -1; rowShift <= 1; rowShift++) {
            for(let colShift = -1; colShift <= 1; colShift++) {
                if(!rowShift && !colShift) continue;

                let newRow = row + rowShift;
                if(newRow < 0) { newRow = this.#config.x - 1; }
                if(newRow > this.#config.x - 1) { newRow = 0; }

                let newCol = col + colShift;
                if(newCol < 0) { newCol = this.#config.y - 1; }
                if(newCol > this.#config.y - 1) { newCol = 0; }

                result.push(this.RowColToIndex(newRow, newCol));
            }
        }

        return result;
    }

    GetAffectedCells() {
        //Составить список всех клеток которые могут быть задействованы
        const affectedCells = new Set();
        for(let cellIndex = 0; cellIndex < this.Length; cellIndex++) {
            if(this.#state[cellIndex]) {
                affectedCells.add(cellIndex);
                for(const neighbour of this.GetCellNeighbours(cellIndex)) {
                    affectedCells.add(neighbour);
                }
            }
        }

        return Array.from(affectedCells);
    }

    IsEmpty() {
        return this.#state.every((value) => value === 0);
    }

    IsSame(anotherState) {
        return this.#state.every((value, index) => value === anotherState[index]);
    }
}

class LifeGenerator {

    #config ;
    #state;
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

   constructor(config) {
       this.#config = config;
       this.#state = new State(config);
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
        this.#state = new State(this.#config, this.PrevState);

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

    let lifeGenerator;

    configForm.addEventListener('submit', (e) => {
        e.preventDefault();

        lifeGenerator = new LifeGenerator({
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
                        lifeGenerator.State.ToggleCellActive(row, col);
                        if (lifeGenerator.State.IsRowColActive(row, col)) {
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
                    if (lifeGenerator.State.IsRowColActive(row, col)) {
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

                for(let cellIndex = 0; cellIndex < lifeGenerator.State.Length; cellIndex++) {
                    if(lifeGenerator.State.Cells[cellIndex] === lifeGenerator.PrevState.Cells[cellIndex]) {
                        continue;
                    }

                    const { row, col } = lifeGenerator.PrevState.IndexToColRow(cellIndex);
                    if(lifeGenerator.State.Cells[cellIndex]) {
                        if(!lifeContainerRows[row].getElementsByTagName('div')[col].classList.contains('active')) {
                            lifeContainerRows[row].getElementsByTagName('div')[col].classList.add('active');
                        }
                    } else {
                        lifeContainerRows[row].getElementsByTagName('div')[col].classList.remove('active');
                    }
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
                    const random = Math.trunc(Math.random()*10000);

                  if(!(random % 4)) {
                      lifeGenerator.State.ToggleCellActive(row, col);
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