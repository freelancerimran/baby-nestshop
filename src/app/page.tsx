import ProductCard from "@/components/ProductCard";
import { products } from "@/data/products";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <h1 className="text-4xl font-bold text-center">
          Baby Nest
        </h1>

        <p className="text-center text-gray-600 mt-4">
          Welcome to Baby Nest
        </p>

        <div className="grid gap-6 md:grid-cols-2 mt-10">
          {products.map((product) => (
            <ProductCard
key={product.id}
  id={product.id}
  slug={product.slug}
  name={product.name}
  description={product.description}
  price={product.sellingPrice}
/>
          ))}
        </div>
      </div>
    </main>
  );
}