import { notFound } from "next/navigation";
import Container from "@/components/ui/Container";

import ProductGallery from "@/components/product/ProductGallery";
import ProductCheckout from "@/components/product/ProductCheckout";
import ProductDescription from "@/components/product/ProductDescription";
import SimilarProducts from "@/components/product/SimilarProducts";

import { supabase } from "@/lib/supabase";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function ProductPage({
  params,
}: Props) {
  const { slug } = await params;

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!product) {
    notFound();
  }

  const formattedProduct = {
    id: Number(product.product_id),

    slug: product.slug,

    name: product.product_name,

    shortDescription:
      product.short_description || "",

    description:
      product.description || "",

    regularPrice:
  Number(product.regular_price || 0),

    sellingPrice:
      Number(product.price),

    deliveryInsideDhaka:
      Number(product.delivery_inside_dhaka),

    deliveryOutsideDhaka:
      Number(product.delivery_outside_dhaka),

    image: product.image || "",

    galleryImage1:
  product.gallery_image_1 || "",

galleryImage2:
  product.gallery_image_2 || "",

galleryImage3:
  product.gallery_image_3 || "",

galleryImage4:
  product.gallery_image_4 || "",  

    status: product.status,

    displayStock:
      Number(product.display_stock),
  };

  return (
    <main className="min-h-screen bg-gray-50 py-10 text-gray-900">
      <Container>

        <div className="grid items-start gap-10 lg:grid-cols-[1.2fr_0.8fr]">

<ProductGallery
  image={formattedProduct.image}
  galleryImage1={
    formattedProduct.galleryImage1
  }
  galleryImage2={
    formattedProduct.galleryImage2
  }
  galleryImage3={
    formattedProduct.galleryImage3
  }
  galleryImage4={
    formattedProduct.galleryImage4
  }
  name={formattedProduct.name}
/>

          <ProductCheckout
            product={formattedProduct}
          />

        </div>

        <ProductDescription
          description={formattedProduct.description}
        />

        <SimilarProducts
  currentSlug={formattedProduct.slug}
/>

      </Container>
    </main>
  );
}