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
        },

        {
            id: 35,
            name: 'Batman',
            alias: 'Bibou',
            nbLikes: 5,
            nbDislikes: 3
        },

        {
            id: 36,
            name: 'Superman',
            alias: 'Shanti',
            nbLikes: 5,
            nbDislikes: 3
        },

        {
            id: 37,
            name: 'Thor',
            alias: 'Le roi du marteau',
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

function GraphicComponent(template) {
    // création du noeud DOM en fonction de la template
    let wrapper = document.createElement('div');
    wrapper.innerHTML = template.trim();
    if (wrapper.childElementCount != 1)
        console.error(`error in template : ${template}`)
    this.el = wrapper.firstChild;

    // extraction automatique des noeuds identifiés dans la template
    this.elements = {};
    wrapper.querySelectorAll('[component-id]').forEach((element) => {
        this.elements[element.getAttribute('component-id')] = element;
    })
}

GraphicComponent.prototype.rootElement = function () {
    return this.el;
}

/** HeroComponent */

function HeroComponent() {
    GraphicComponent.call(this, `
        <div class='hero-component'>
            <div component-id='display'>
                <span class='hero-name' component-id='name'></span> aka <span component-id='alias'></span><br/>
                <span component-id='nbLikes'></span> likes, <span component-id='nbDislikes'></span> dislikes<br/>
                <button component-id='delete'>Delete</button>
                <button component-id='select'>Edit</button>
            </div>
            <div component-id='form'>
            </div>
        </div>`);

    this.hero = null;

    this.form = new HeroFormComponent();
    this.elements.form.appendChild(this.form.rootElement());

    this.elements.delete.addEventListener('click', () => this.onDelete && this.onDelete());
    this.elements.select.addEventListener('click', () => {
        this.form.setHero(this.hero);
        this.elements.display.style.display = 'none';
        this.elements.form.style.display = null;

        this.form.focus();
    });

    this.form.onCancel = () => {
        this.elements.display.style.display = null;
        this.elements.form.style.display = 'none';
    };

    this.form.onValidate = (data) => {
        this.onSave && this.onSave(data);

        this.elements.display.style.display = null;
        this.elements.form.style.display = 'none';
    };

    this.elements.display.style.display = null;
    this.elements.form.style.display = 'none';
}

chainPrototypes(HeroComponent, GraphicComponent);

HeroComponent.prototype.setHero = function (hero) {
    this.hero = hero;
}

HeroComponent.prototype.updateDisplay = function () {
    for (let propertyName of ['name', 'alias', 'nbLikes', 'nbDislikes'])
        this.elements[propertyName].innerText = this.hero[propertyName];
}

/** HeroesListComponent */

function HeroesListComponent() {
    GraphicComponent.call(this, `
        <div class='hero-list-component'>
            <h1>Liste des héros</h1>
            <div component-id='heroesList'></div>
            <button component-id='newHeroButton'>New hero</button>
            <div component-id='heroForm'></div>
        </div>`);

    this.heroForm = new HeroFormComponent();
    this.elements.heroForm.appendChild(this.heroForm.rootElement());

    this.displayedHeroes = {};

    this.elements.newHeroButton.addEventListener('click', () => this.creationMode());

    this.resetMode();

    this.heroForm.onValidate = (data) => this.validateForm(data);
    this.heroForm.onCancel = () => this.resetMode();
}

chainPrototypes(HeroesListComponent, GraphicComponent);

HeroesListComponent.prototype.resetMode = function () {
    this.elements.heroForm.style.display = 'none';
    this.elements.newHeroButton.style.display = null;
}

HeroesListComponent.prototype.creationMode = function () {
    this.elements.heroForm.style.display = null;
    this.elements.newHeroButton.style.display = 'none';

    this.heroForm.setHero(null);
    this.heroForm.focus();
}

HeroesListComponent.prototype.validateForm = function (data) {
    dataService.postHero(data).then((hero) => {
        this.addHeroToDisplay(hero);
        this.resetMode();
    });
}

HeroesListComponent.prototype.load = function () {
    dataService.fetchAll().then(heroes => {
        this.elements.heroesList.innerHTML = '';
        this.displayedHeroes = {};

        for (let hero of heroes)
            this.addHeroToDisplay(hero);
    });
}

HeroesListComponent.prototype.addHeroToDisplay = function (hero) {
    let heroComponent = this.displayedHeroes[hero.id];

    if (!heroComponent) {
        heroComponent = new HeroComponent();
        heroComponent.setHero(hero);

        this.displayedHeroes[hero.id] = heroComponent;

        heroComponent.onDelete = () => {
            dataService.deleteHero(hero.id).then((result) => {
                if (result) {
                    heroComponent.rootElement().remove();
                    delete this.displayedHeroes[hero.id];
                }
            })
        }

        heroComponent.onSave = (data) => {
            let combined = Object.assign({}, hero);
            Object.assign(combined, data);

            dataService.putHero(combined).then((hero) => {
                this.addHeroToDisplay(hero);
                this.resetMode();
            });
        };

        this.elements.heroesList.appendChild(heroComponent.rootElement());
    }

    heroComponent.updateDisplay();
}

/** HeroFormComponent */

function HeroFormComponent() {
    GraphicComponent.call(this, `
        <form component-id='form'>
            <label>Name : <input component-id='name'/></label><br/>
            <label>Alias : <input component-id='alias'/></label><br/>
            <button component-id='validate'>Validate</button>
            <button type='button' component-id='cancel'>Cancel</button>
        </form>`);

    this.elements.form.addEventListener('submit', (event) => {
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

HeroFormComponent.prototype.focus = function () {
    this.elements.name.focus();
}

/** Application initialisation */

window.addEventListener('load', () => {
    let component = new HeroesListComponent();
    document.body.appendChild(component.rootElement());

    component.load();
});