import Link from "next/link";

type ProductCardProps = {
  slug: string;
  name: string;
  description: string;
  price: number;
};

export default function ProductCard({
  slug,
  name,
  description,
  price,
}: ProductCardProps) {
  return (
    <Link href={`/product/${slug}`}>
      <div className="border rounded-xl p-6 shadow-sm hover:shadow-lg transition cursor-pointer">
        <h2 className="text-xl font-semibold">{name}</h2>

        <p className="mt-2 text-gray-600">{description}</p>

        <p className="mt-4 font-bold">৳ {price}</p>
      </div>
    </Link>
  );
}