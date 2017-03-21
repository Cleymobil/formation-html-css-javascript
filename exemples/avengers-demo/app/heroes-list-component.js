import dataService from './data-service';
import chainPrototypes from './chainPrototypes';
import GraphicComponent from './graphic-component';
import HeroFormComponent from './hero-form-component';
import HeroComponent from './hero-component';

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

    this.resetCreationForm();

    this.heroForm.onValidate = (data) => this.validateForm(data);
    this.heroForm.onCancel = () => this.resetCreationForm();
}

chainPrototypes(HeroesListComponent, GraphicComponent);

HeroesListComponent.prototype.resetCreationForm = function () {
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
        this.resetCreationForm();
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
        heroComponent.onDelete = () => this.deleteHero(hero);
        heroComponent.onSave = (data) => this.updateHero(hero, data);

        this.displayedHeroes[hero.id] = heroComponent;
        this.elements.heroesList.appendChild(heroComponent.rootElement());
    }

    heroComponent.setHero(hero);
    heroComponent.updateDisplay();
}

HeroesListComponent.prototype.updateHero = function (hero, data) {
    let combined = Object.assign({}, hero);
    Object.assign(combined, data);

    dataService.putHero(combined)
        .then((hero) => {
            this.addHeroToDisplay(hero);
        });
}

HeroesListComponent.prototype.deleteHero = function (hero) {
    dataService.deleteHero(hero.id)
        .then((result) => {
            if (result) {
                this.displayedHeroes[hero.id].rootElement().remove();
                delete this.displayedHeroes[hero.id];
            }
        })
}

export default HeroesListComponent;