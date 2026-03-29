require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");
const MenuItem = require("../models/MenuItem");

const menuSeed = [
  // PIZZAS
  {
    name: "Margherita",
    description: "Tomatensoße, Mozzarella, Basilikum - ein Klassiker",
    price: 6.00,
    category: "Pizza",
    image: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=900&h=900&fit=crop&auto=format",
    featured: true,
  },
  {
    name: "Marinara",
    description: "Tomatensoße, Knoblauch, Oregano - ohne Käse",
    price: 7.00,
    category: "Pizza",
    image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=900&h=900&fit=crop&auto=format",
    featured: false,
  },
  {
    name: "Pepperoni",
    description: "Tomatensoße, Mozzarella, Pepperoni",
    price: 7.00,
    category: "Pizza",
    image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=900&h=900&fit=crop&auto=format",
    featured: true,
  },
  {
    name: "Prosciutto",
    description: "Tomatensoße, Mozzarella, Rohschinken",
    price: 7.00,
    category: "Pizza",
    image: "https://images.unsplash.com/photo-1594007654729-407eedc4be65?w=900&h=900&fit=crop&auto=format",
    featured: true,
  },
  {
    name: "Quattro Formaggi",
    description: "Mozzarella, Gorgonzola, Feta, Parmigiano",
    price: 9.00,
    category: "Pizza",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=900&h=900&fit=crop&auto=format",
    featured: false,
  },
  {
    name: "Capricciosa",
    description: "Tomatensoße, Mozzarella, Schinken, Pilze, Artischocke",
    price: 8.00,
    category: "Pizza",
    image: "https://images.unsplash.com/photo-1548365328-9f547fb0953a?w=900&h=900&fit=crop&auto=format",
    featured: false,
  },
  {
    name: "Calzone",
    description: "Gefüllte Pizza mit Ricotta, Schinken, Mozzarella",
    price: 12.00,
    category: "Pizza",
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=900&h=900&fit=crop&auto=format",
    featured: false,
  },

  // PASTA
  {
    name: "Spaghetti Bolognese",
    description: "Spaghetti mit klassischer Ragu-Sauce und Parmigiano",
    price: 10.00,
    category: "Pasta",
    image: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=900&h=900&fit=crop&auto=format",
    featured: true,
  },
  {
    name: "Tagliatelle Carbonara",
    description: "Tagliatelle mit Speck, Ei und Parmigiano - cremig und köstlich",
    price: 10.50,
    category: "Pasta",
    image: "https://images.unsplash.com/photo-1563379091339-03246963d96c?w=900&h=900&fit=crop&auto=format",
    featured: true,
  },
  {
    name: "Lasagne",
    description: "Hausgemachte Lasagne mit Ragu und Béchamel-Sauce",
    price: 11.00,
    category: "Pasta",
    image: "https://images.unsplash.com/photo-1619895092538-128341789043?w=900&h=900&fit=crop&auto=format",
    featured: false,
  },

  // SALADS
  {
    name: "Insalata Mista",
    description: "Gemischter Salat mit Tomate, Gurke und italienischem Dressing",
    price: 7.50,
    category: "Salat",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=900&h=900&fit=crop&auto=format",
    featured: false,
  },
  {
    name: "Mozzarella Caprese",
    description: "Mozzarella di Bufala, Tomaten, Basilikum, Olivenöl und Balsamico",
    price: 10.00,
    category: "Salat",
    image: "https://images.unsplash.com/photo-1592417817098-8fd3d9eb14a5?w=900&h=900&fit=crop&auto=format",
    featured: true,
  },

  // PANINI
  {
    name: "Panini Ungefuellt",
    description: "Frisch gebackenes Panini ohne Belag",
    price: 4.20,
    category: "Panini",
    image: "https://images.unsplash.com/photo-1539252554453-80ab65ce3586?w=900&h=900&fit=crop&auto=format",
    featured: false,
  },
  {
    name: "Panini Knoblauch",
    description: "Panini mit Knoblauch und Kraeuteraroma",
    price: 5.50,
    category: "Panini",
    image: "https://images.unsplash.com/photo-1528736235302-52922df5c122?w=900&h=900&fit=crop&auto=format",
    featured: false,
  },
  {
    name: "Panini Kaese",
    description: "Panini mit geschmolzenem Kaese",
    price: 8.50,
    category: "Panini",
    image: "https://images.unsplash.com/photo-1539252554453-80ab65ce3586?w=900&h=900&fit=crop&auto=format",
    featured: false,
  },
  {
    name: "Panini Schinken Kaese",
    description: "Panini mit Schinken und Kaese",
    price: 9.00,
    category: "Panini",
    image: "https://images.unsplash.com/photo-1528736235302-52922df5c122?w=900&h=900&fit=crop&auto=format",
    featured: false,
  },
  {
    name: "Panini Feta",
    description: "Panini mit Feta",
    price: 9.00,
    category: "Panini",
    image: "https://images.unsplash.com/photo-1539252554453-80ab65ce3586?w=900&h=900&fit=crop&auto=format",
    featured: false,
  },
  {
    name: "Panini Mozzarella Basilikum",
    description: "Panini mit Mozzarella, Basilikum und Olivenoel",
    price: 9.50,
    category: "Panini",
    image: "https://images.unsplash.com/photo-1528736235302-52922df5c122?w=900&h=900&fit=crop&auto=format",
    featured: false,
  },
  {
    name: "Panini Tuna Kaese",
    description: "Panini mit Thunfisch und Kaese",
    price: 9.50,
    category: "Panini",
    image: "https://images.unsplash.com/photo-1539252554453-80ab65ce3586?w=900&h=900&fit=crop&auto=format",
    featured: false,
  },
  {
    name: "Panini Paprika Creme Kaese",
    description: "Panini mit Paprika-Creme und Kaese",
    price: 9.00,
    category: "Panini",
    image: "https://images.unsplash.com/photo-1528736235302-52922df5c122?w=900&h=900&fit=crop&auto=format",
    featured: false,
  },
  {
    name: "Panini Lachs Kaese",
    description: "Panini mit Lachs und Kaese",
    price: 9.50,
    category: "Panini",
    image: "https://images.unsplash.com/photo-1539252554453-80ab65ce3586?w=900&h=900&fit=crop&auto=format",
    featured: true,
  },
  {
    name: "Panini Tuerkische Salami Kaese",
    description: "Panini mit tuerkischer Salami und Kaese",
    price: 9.50,
    category: "Panini",
    image: "https://images.unsplash.com/photo-1528736235302-52922df5c122?w=900&h=900&fit=crop&auto=format",
    featured: false,
  },
  {
    name: "Panini Mais Haehnchen Curry",
    description: "Panini mit Mais, Haehnchen, Curry und Kaese",
    price: 9.80,
    category: "Panini",
    image: "https://images.unsplash.com/photo-1539252554453-80ab65ce3586?w=900&h=900&fit=crop&auto=format",
    featured: false,
  },
  {
    name: "Panini Salami Kaese",
    description: "Panini mit Salami und Kaese",
    price: 9.00,
    category: "Panini",
    image: "https://images.unsplash.com/photo-1528736235302-52922df5c122?w=900&h=900&fit=crop&auto=format",
    featured: false,
  },
  {
    name: "Panini Schinken Ananas Kaese",
    description: "Panini mit Schinken, Ananas und Kaese",
    price: 9.50,
    category: "Panini",
    image: "https://images.unsplash.com/photo-1539252554453-80ab65ce3586?w=900&h=900&fit=crop&auto=format",
    featured: false,
  },
  {
    name: "Panini Milde Peperoni Gyros",
    description: "Panini mit milder Peperoni, Gyros und Kaese",
    price: 9.50,
    category: "Panini",
    image: "https://images.unsplash.com/photo-1528736235302-52922df5c122?w=900&h=900&fit=crop&auto=format",
    featured: false,
  },
  {
    name: "Panini Krabben Knoblauch",
    description: "Panini mit Krabben, Knoblauch und Kaese",
    price: 9.50,
    category: "Panini",
    image: "https://images.unsplash.com/photo-1539252554453-80ab65ce3586?w=900&h=900&fit=crop&auto=format",
    featured: false,
  },
  {
    name: "Panini Hackfleisch Zwiebeln",
    description: "Panini mit Hackfleisch, Zwiebeln und Kaese",
    price: 9.50,
    category: "Panini",
    image: "https://images.unsplash.com/photo-1528736235302-52922df5c122?w=900&h=900&fit=crop&auto=format",
    featured: false,
  },
  {
    name: "Panini Schinken Spargel Hollandaise",
    description: "Panini mit Schinken, Spargel, Sauce Hollandaise und Kaese",
    price: 9.50,
    category: "Panini",
    image: "https://images.unsplash.com/photo-1539252554453-80ab65ce3586?w=900&h=900&fit=crop&auto=format",
    featured: false,
  },
  {
    name: "Panini Schinken Zwiebeln Creme Fraiche",
    description: "Panini mit Schinken, Zwiebeln, Creme Fraiche und Kaese",
    price: 9.50,
    category: "Panini",
    image: "https://images.unsplash.com/photo-1528736235302-52922df5c122?w=900&h=900&fit=crop&auto=format",
    featured: true,
  },

  // DESSERT
  {
    name: "Tiramisu",
    description: "Klassisches italienisches Dessert mit Mascarpone und Espresso",
    price: 5.50,
    category: "Dessert",
    image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=900&h=900&fit=crop&auto=format",
    featured: true,
  },
  {
    name: "Panna Cotta",
    description: "Vanille Panna Cotta mit Fruchtspiegel",
    price: 5.00,
    category: "Dessert",
    image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=900&h=900&fit=crop&auto=format",
    featured: false,
  },

  // GETRAENKE
  {
    name: "Coca Cola 0.33l",
    description: "Eiskalt serviert",
    price: 2.80,
    category: "Getraenke",
    image: "https://images.unsplash.com/photo-1581006852262-e4307cf6283a?w=900&h=900&fit=crop&auto=format",
    featured: false,
  },
  {
    name: "Fanta 0.33l",
    description: "Fruchtig und frisch",
    price: 2.80,
    category: "Getraenke",
    image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=900&h=900&fit=crop&auto=format",
    featured: false,
  },
  {
    name: "Sprite 0.33l",
    description: "Zitronig und spritzig",
    price: 2.80,
    category: "Getraenke",
    image: "https://images.unsplash.com/photo-1624517452488-04869289c4ca?w=900&h=900&fit=crop&auto=format",
    featured: false,
  },
  {
    name: "Mineralwasser 0.5l",
    description: "Still oder sprudelnd",
    price: 2.50,
    category: "Getraenke",
    image: "https://images.unsplash.com/photo-1523362628745-0c100150b504?w=900&h=900&fit=crop&auto=format",
    featured: false,
  },
];

const run = async () => {
  await connectDB();

  await User.deleteMany();
  await MenuItem.deleteMany();

  const admin = await User.create({
    name: "Admin",
    email: "admin@restaurant.com",
    password: "Admin123!",
    role: "admin",
  });

  await MenuItem.insertMany(menuSeed);

  console.log("Seed completed");
  console.log(`Admin login: ${admin.email} / Admin123!`);

  await mongoose.connection.close();
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
