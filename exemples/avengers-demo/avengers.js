/** Service de données */

let dataService = {
    nextId: 333,

    database: [
        {
            id: 33,
            name: 'Zorro',
            alias: 'Z',
            nbLikes: 3,
            nbDislikes: 5
        },

        {
            id: 34,
            name: 'Youplouplou',
            alias: 'Youyou',
            nbLikes: 5,
            nbDislikes: 3
        }
    ],

    fetchAll: function () {
        return new Promise((resolve, reject) => {
            resolve(this.database);
        });
    },

    postHero: function (data) {
        return new Promise((resolve, reject) => {
            data.id = this.nextId++;
            data.nbLikes = 0;
            data.nbDislikes = 0;
            data = Object.assign({}, data);
            this.database.push(data);
            resolve(data);
        });
    },

    putHero: function (hero) {
        return new Promise((resolve, reject) => {
            let existing = this.database.find(e => e.id === hero.id);
            Object.assign(existing, hero);
            resolve(existing);
        });
    },

    deleteHero: function (id) {
        return new Promise((resolve, reject) => {
            let existing = this.database.find(e => e.id === id);
            if (existing)
                this.database.splice(this.database.indexOf(existing), 1);

            resolve(true);
        });
    }
}

/** Fonction d'aide pour chainer des prototypes */

function chainPrototypes(childClassConstructor, baseClassConstructor) {
    childClassConstructor.prototype = Object.create(baseClassConstructor.prototype);
    childClassConstructor.prototype.constructor = childClassConstructor;
}

/** Code de base pour les composants graphiques */

// TODO On pourrait rajouter la gestion de l'envoi d'évènements custom sur le noeud racine du composant

function GraphicComponent(template) {
    // création du noeud DOM en fonction de la template
    let wrapper = document.createElement('div');
    wrapper.innerHTML = template.trim();
    if (wrapper.childElementCount != 1)
        console.error(`error in template : ${template}`)
    this.el = wrapper.firstChild;

    // extraction automatique des noeuds identifiés dans la template
    this.elements = {};
    this.el.querySelectorAll('[component-id]').forEach((element) => {
        this.elements[element.getAttribute('component-id')] = element;
    })

    console.log(`created dom element ${this.el} from template : ${this.el.outerHTML}`);
}

GraphicComponent.prototype.rootElement = function () {
    return this.el;
}

/** HeroComponent */

function HeroComponent() {
    GraphicComponent.call(this, `
        <div>
        <span component-id='name'></span> as <span component-id='alias'></span><br/>
        <span component-id='nbLikes'></span> likes, <span component-id='nbDislikes'></span> dislikes<br/>
        <button component-id='delete'>Delete</button>
        <button component-id='select'>Select</button>
        </div>`);
        
    this.hero = null;

    this.elements.delete.addEventListener('click', () => this.onDelete && this.onDelete());
    this.elements.select.addEventListener('click', () => this.onSelect && this.onSelect());
}

chainPrototypes(HeroComponent, GraphicComponent);

HeroComponent.prototype.setHero = function (hero) {
    this.hero = hero;
}

HeroComponent.prototype.updateDisplay = function () {
    for (let propertyName of ['name', 'alias', 'nbLikes', 'nbDislikes']) {
        this.elements[propertyName].innerText = this.hero[propertyName];
    }
}

/** HeroesListComponent */

function HeroesListComponent() {
    GraphicComponent.call(this, `
        <div>
            <div>Liste des héros</div>
            <div component-id='heroesList'></div>
            <button component-id='newHeroButton'>New hero</button>
            <div component-id='heroForm'></div>
        </div>`);

    this.heroForm = new HeroFormComponent();
    this.elements.heroForm.appendChild(this.heroForm.rootElement());

    this.heroes = [];
    this.displayedHeroes = {};

    this.elements.newHeroButton.addEventListener('click', () => {
        this.creationMode();
    });

    this.resetMode();

    this.heroForm.onValidate = (data) => { this.validateForm(data) }
    this.heroForm.onCancel = () => { this.resetMode(); };
}

chainPrototypes(HeroesListComponent, GraphicComponent);

HeroesListComponent.prototype.resetMode = function () {
    this.editedHero = null;
    this.elements.heroForm.style.display = 'none';
    this.elements.newHeroButton.style.display = null;
}

HeroesListComponent.prototype.creationMode = function () {
    this.editedHero = null;

    this.elements.heroForm.style.display = null;
    this.elements.newHeroButton.style.display = 'none';

    this.heroForm.setHero(null);
}

HeroesListComponent.prototype.editionMode = function (hero) {
    this.editedHero = hero;

    this.elements.heroForm.style.display = null;
    this.elements.newHeroButton.style.display = 'none';

    this.heroForm.setHero(hero);
}

HeroesListComponent.prototype.validateForm = function (data) {
    if (this.editedHero) {
        let combined = Object.assign({}, this.editedHero);
        Object.assign(combined, data);

        dataService.putHero(combined).then(hero => {
            this.displayedHeroes[hero.id].setHero(hero);
            this.displayedHeroes[hero.id].updateDisplay();
            this.resetMode();
        });
    }
    else {
        dataService.postHero(data).then(hero => {
            this.addHeroToDisplay(hero);
            this.resetMode();
        });
    }
}

HeroesListComponent.prototype.load = function () {
    dataService.fetchAll().then(avengers => {
        this.heroes = avengers;

        this.updateDisplay();
    });
}

HeroesListComponent.prototype.updateDisplay = function () {
    this.elements.heroesList.innerHTML = '';
    this.displayedHeroes = {};

    for (let hero of this.heroes)
        this.addHeroToDisplay(hero);
}

HeroesListComponent.prototype.addHeroToDisplay = function (hero) {
    // construction d'un composant pour le héro
    let heroComponent = new HeroComponent();
    heroComponent.setHero(hero);
    heroComponent.updateDisplay();

    this.displayedHeroes[hero.id] = heroComponent;

    heroComponent.onDelete = () => {
        dataService.deleteHero(hero.id).then((result) => {
            if (result)
                heroComponent.rootElement().remove();
        })
    }

    heroComponent.onSelect = () => {
        this.editionMode(hero);
    }

    this.elements.heroesList.appendChild(heroComponent.rootElement());
}

/** HeroFormComponent */

function HeroFormComponent() {
    GraphicComponent.call(this, `
        <form>
            <label>Name : <input component-id='name'/></label><br/>
            <label>Alias : <input component-id='alias'/></label><br/>
            <button component-id='validate'>Validate</button>
            <button type='button' component-id='cancel'>Cancel</button>
        </form>`);

    this.el.addEventListener('submit', (event) => {
        event.preventDefault();
        event.stopPropagation();

        this.onValidate && this.onValidate({
            name: this.elements.name.value,
            alias: this.elements.alias.value
        });
    });

    this.elements.cancel.addEventListener('click', () => { this.onCancel && this.onCancel() });
}

chainPrototypes(HeroFormComponent, GraphicComponent);

HeroFormComponent.prototype.setHero = function (hero) {
    this.elements.name.value = hero ? hero.name : '';
    this.elements.alias.value = hero ? hero.alias : '';
}

/** Application initialisation */

window.addEventListener('load', () => {
    let component = new HeroesListComponent();
    document.body.appendChild(component.rootElement());

    component.load();
});