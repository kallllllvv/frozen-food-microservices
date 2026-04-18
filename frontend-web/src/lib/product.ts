export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  image: string;
}

export const DUMMY_PRODUCTS: Product[] = [
  { id: 1, name: "Sosis Sapi Kimbo", category: "Sosis", price: 45000, stock: 15, image: "https://via.placeholder.com/300" },
  { id: 2, name: "Nugget Ayam Fiesta", category: "Nugget", price: 55000, stock: 5, image: "https://via.placeholder.com/300" },
  { id: 3, name: "Bakso Sapi Sumber Selera", category: "Bakso", price: 38000, stock: 12, image: "https://via.placeholder.com/300" },
];