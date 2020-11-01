const User = require('../models/users')
const Movie = require('../models/movies')
const { ROLES } = require('../utils/config')

const initialMovies = [
    {
        "title": "Moonlight",
        "description": " A young African-American man grapples with his identity and sexuality while experiencing the everyday struggles of childhood, adolescence, and burgeoning adulthood.",
        "posters": [
            "https://upload.wikimedia.org/wikipedia/en/8/84/Moonlight_%282016_film%29.png"
        ],
        "stock": 10,
        "rentalPrice": 20,
        "salePrice": 40,
        "availability": true,
        "likes": 100
    },
    {
        "title": "Your Name",
        "description": " Two strangers find themselves linked in a bizarre way. When a connection forms, will distance be the only thing to keep them apart?",
        "posters": [
            "https://upload.wikimedia.org/wikipedia/en/0/0b/Your_Name_poster.png"
        ],
        "stock": 10,
        "rentalPrice": 20,
        "salePrice": 40,
        "availability": true,
        "likes": 80
    },
    {
        "title": "Hell Or High Water",
        "description": " A divorced father and his ex-con older brother resort to a desperate scheme in order to save their family's ranch in West Texas.",
        "posters": [
            "https://upload.wikimedia.org/wikipedia/en/8/8f/Hell_or_High_Water_film_poster.png"
        ],
        "stock": 10,
        "rentalPrice": 20,
        "salePrice": 40,
        "availability": true,
        "likes": 1009
    },
    {
        "title": "Rogue One: A Star Wars",
        "description": " The daughter of an Imperial scientist joins the Rebel Alliance in a risky move to steal the plans for the Death Star.",
        "posters": [
            "https://upload.wikimedia.org/wikipedia/en/d/d4/Rogue_One%2C_A_Star_Wars_Story_poster.png"
        ],
        "stock": 10,
        "rentalPrice": 20,
        "salePrice": 40,
        "availability": true,
        "likes": 1000
    },
    {
        "title": "Green Room",
        "description": " A punk rock band is forced to fight for survival after witnessing a murder at a neo-Nazi skinhead bar.",
        "posters": [
            "https://upload.wikimedia.org/wikipedia/en/e/e5/Green_Room_%28film%29_POSTER.jpg"
        ],
        "stock": 10,
        "rentalPrice": 20,
        "salePrice": 40,
        "availability": true,
        "likes": 100
    },
    {
        "title": "My Life as a Zucchini",
        "description": " After losing his mother, a young boy is sent to a foster home with other orphans his age where he begins to learn the meaning of trust and true love.",
        "posters": [
            "https://upload.wikimedia.org/wikipedia/en/8/85/My_Life_as_a_Zucchini.jpg"
        ],
        "stock": 10,
        "rentalPrice": 20,
        "salePrice": 40,
        "availability": true,
        "likes": 2000
    },
    {
        "title": "Eye in the Sky",
        "description": " Col. Katherine Powell, a military officer in command of an operation to capture terrorists in Kenya, sees her mission escalate when a girl enters the kill zone triggering an international dispute over the implications of modern warfare.",
        "posters": [
            "https://upload.wikimedia.org/wikipedia/en/f/fe/Eye_in_the_Sky_2015_film_poster.jpg"
        ],
        "stock": 10,
        "rentalPrice": 20,
        "salePrice": 40,
        "availability": true,
        "likes": 80
    },
    {
        "title": "13th",
        "description": " An in-depth look at the prison system in the United States and how it reveals the nation's history of racial inequality.",
        "posters": [
            "https://upload.wikimedia.org/wikipedia/en/6/6b/13th_%28film%29.png"
        ],
        "stock": 10,
        "rentalPrice": 20,
        "salePrice": 40,
        "availability": true,
        "likes": 1000
    },
    {
        "title": "The Handmaiden",
        "description": " A woman is hired as a handmaiden to a Japanese heiress, but secretly she is involved in a plot to defraud her.",
        "posters": [
            "https://upload.wikimedia.org/wikipedia/en/a/a2/The_Handmaiden_film.png"
        ],
        "stock": 10,
        "rentalPrice": 20,
        "salePrice": 40,
        "availability": true,
        "likes": 1000
    },
    {
        "title": "The Jungle Book",
        "description": " After a threat from the tiger Shere Khan forces him to flee the jungle, a man-cub named Mowgli embarks on a journey of self discovery with the help of panther Bagheera and free-spirited bear Baloo.",
        "posters": [
            "https://upload.wikimedia.org/wikipedia/en/a/a4/The_Jungle_Book_%282016%29.jpg"
        ],
        "stock": 10,
        "rentalPrice": 20,
        "salePrice": 40,
        "availability": true,
        "likes": 1200
    }
]

const initialUsers = [
    {
        email: 'root@admin.com',
        userName: 'root',
        role: ROLES.ADMIN,
        password: 'admin'
    },
    {
        email: 'testuser1@test.com',
        userName: 'testuser',
        password: 'test1'
    }
]

const usersInDB = async () => {
    const users = await User.find({})
    return users.map(user => user.toJSON())
}

const moviesInDB = async () => {
    const movies = await Movie.find({})
    return movies.map(movie => movie.toJSON())
}

const testMovie = {
    title: 'Test movie',
    description: 'This is just a test movie object. It will be deleted soon.',
    posters: [
        "https://upload.wikimedia.org/wikipedia/en/a/a4/The_Jungle_Book_%282016%29.jpg"
    ],
    stock: 10,
    rentalPrice: 30,
    salePrice: 40,
    availability: true,
    likes: 1000
}

const mockMovie = async (isAvailable = false) => {
    let movie = new Movie({...testMovie, availability: isAvailable})
    return await movie.save()
}

module.exports = {
    initialMovies,
    initialUsers,
    testMovie,
    moviesInDB,
    mockMovie,
    usersInDB
}