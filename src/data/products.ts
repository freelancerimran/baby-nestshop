import { Product } from "@/types/product";

export const products: Product[] = [
  {
    id: 1,
    slug: "alphabet-book",

    name: "Alphabet Sensory Book",

    shortDescription: "Perfect learning book",

    description: "Interactive sensory learning book for children.",

    costPrice: 450,

    sellingPrice: 890,

    deliveryInsideDhaka: 80,

    deliveryOutsideDhaka: 130,

    image: "/images/alphabet-book.jpg",

    status: "active",
  },

  {
    id: 2,
    slug: "math-book",

    name: "Math Learning Book",

    shortDescription: "Fun learning",

    description: "Fun and engaging math learning activities.",

    costPrice: 500,

    sellingPrice: 990,

    deliveryInsideDhaka: 80,

    deliveryOutsideDhaka: 130,

    image: "/images/math-book.jpg",

    status: "active",
  },
];