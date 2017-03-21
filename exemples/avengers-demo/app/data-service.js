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
};

export default dataService;