import { notFound } from "next/navigation";
import { products } from "@/data/products";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;

  const product = products.find((item) => item.slug === slug);

  if (!product) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <h1 className="text-4xl font-bold">
          {product.name}
        </h1>

        <p className="mt-4 text-gray-600">
          {product.description}
        </p>

        <p className="mt-6 text-2xl font-bold">
          ৳ {product.sellingPrice}
        </p>
      </div>
    </main>
  );
}