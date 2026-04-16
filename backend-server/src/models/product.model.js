const products = [
  { id: 1, name: "Sosis Sapi Bakar", category: "sosis", price: 25000, isPromo: true },
  { id: 2, name: "Nugget Ayam Crispy", category: "naget", price: 35000, isPromo: false },
  { id: 3, name: "Kentang Goreng Shoestring", category: "kentang", price: 28000, isPromo: false }
];

const getAllProducts = () => {
  return products;
};

const getProductById = (id) => {
  return products.find(p => p.id === parseInt(id));
};

module.exports = { getAllProducts, getProductById };