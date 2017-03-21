import HeroesListComponent from './heroes-list-component';

/** Application initialisation */

window.addEventListener('load', () => {
    let component = new HeroesListComponent();
    document.body.appendChild(component.rootElement());

    component.load();
});