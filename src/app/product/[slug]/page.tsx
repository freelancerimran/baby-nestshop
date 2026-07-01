import { notFound } from "next/navigation";
import { products } from "@/data/products";
import Container from "@/components/ui/Container";
import OrderForm from "@/components/OrderForm";

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
  <main className="min-h-screen bg-gray-50 py-10">
    <Container>
      <div className="grid gap-10 lg:grid-cols-2">

        {/* Left Side */}
        <div>
          <div className="aspect-square rounded-2xl border bg-white flex items-center justify-center">
            <span className="text-gray-400">
              Product Image
            </span>
          </div>
        </div>

        {/* Right Side */}
        <div>

          <h1 className="text-4xl font-bold">
            {product.name}
          </h1>

          <p className="mt-4 text-gray-600">
            {product.description}
          </p>

          <p className="mt-6 text-3xl font-bold">
            ৳ {product.sellingPrice}
          </p>

          <div className="mt-8 rounded-2xl border bg-white p-6">
            <OrderForm product={product} />
          </div>

        </div>

      </div>
    </Container>
  </main>
);
}