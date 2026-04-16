// models/data.js
let users = [];
let orders = [];
const frozenProducts = [
    { id: 1, name: 'Fiesta Chicken Nugget 500g', price: 45000, category: 'Ayam', stock: 20, isPromo: false },
    { id: 2, name: 'Kanzler Sosis Bakar', price: 55000, category: 'Sosis', stock: 15, isPromo: true, promoPrice: 49000 },
    { id: 3, name: 'Belfoods Kentang Goreng 1kg', price: 32000, category: 'Kentang', stock: 50, isPromo: false },
    { id: 4, name: 'Cedea Dumpling Keju', price: 28000, category: 'Seafood', stock: 10, isPromo: true, promoPrice: 25000 }
];

module.exports = { users, orders, frozenProducts };