
class State {
    #state = [];

    ToggleCellActive(no) {
       const foundIndex = this.#state.indexOf(no);

       if(foundIndex > -1) {
           this.#state.splice(foundIndex, 1);
       } else {
           this.#state.push(no);
       }
    }

    IsCellActive(no) {
        const foundIndex = this.#state.indexOf(no);

        return foundIndex > -1;
    }
}

class LifeGenerator {

    #config = {};
    #state = new State();

    get State() {
        return this.#state;
    }

    get Config() {
        return this.#config;
    }

   InitConfig(value) {
       this.#config = value;
    }
}

const lifeGenerator = new LifeGenerator();

document.addEventListener('DOMContentLoaded', () => {
    const configForm = document.getElementById("config");
    const initContainer = document.getElementById("init");

    configForm.addEventListener('submit', (e) => {
        e.preventDefault();

        lifeGenerator.InitConfig({
            x: document.getElementById('x').value,
            y: document.getElementById('y').value,
            scale: document.getElementById('scale').value,
        });

        configForm.classList.add('hidden');

        const initContainerRoot = initContainer.getElementsByTagName('div')[0];
        const initButton = initContainer.getElementsByTagName('button')[0];
        initContainerRoot.innerHTML='';

        for(let no = 0; no <= lifeGenerator.Config.x; no++) {
           const child = document.createElement('div');
           child.onclick = (e) => {
               lifeGenerator.State.ToggleCellActive(no);
               if(lifeGenerator.State.IsCellActive(no)) {
                   if(!e.target.classList.contains('active')) {
                       e.target.classList.add('active');
                   }
               } else {
                   if(e.target.classList.contains('active')) {
                       e.target.classList.remove('active');
                   }
               }
           }
            initContainerRoot.appendChild(child);
        }

        initContainer.classList.remove('hidden');
    });
});