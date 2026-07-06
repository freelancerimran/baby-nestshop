"use client";

import { useState } from "react";

type ProductGalleryProps = {
  image: string;
  galleryImage1?: string;
  galleryImage2?: string;
  galleryImage3?: string;
  galleryImage4?: string;
  name: string;
};

export default function ProductGallery({
  image,
  galleryImage1,
  galleryImage2,
  galleryImage3,
  galleryImage4,
  name,
}: ProductGalleryProps) {

  const images = [
    image,
    galleryImage1,
    galleryImage2,
    galleryImage3,
    galleryImage4,
  ].filter(Boolean) as string[];

  const [selectedImage, setSelectedImage] =
    useState(images[0] || "");

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">

      <div className="overflow-hidden rounded-2xl border border-gray-100">

        {selectedImage ? (
          <img
            src={selectedImage}
            alt={name}
            className="aspect-square w-full object-cover"
          />
        ) : (
          <div className="aspect-square flex flex-col items-center justify-center bg-gradient-to-br from-teal-50 to-emerald-50">

            <div className="mb-4 text-7xl">
              📚
            </div>

            <h2 className="px-6 text-center text-2xl font-bold text-gray-800">
              {name}
            </h2>

            <p className="mt-3 text-gray-500">
              No Image Available
            </p>

          </div>
        )}

      </div>

      {images.length > 1 && (

        <div className="mt-4 grid grid-cols-5 gap-3">

          {images.map((img, index) => (

            <button
              key={index}
              onClick={() =>
                setSelectedImage(img)
              }
              className={`overflow-hidden rounded-xl border-2 transition-all ${
                selectedImage === img
                  ? "border-teal-500"
                  : "border-gray-200"
              }`}
            >

              <img
                src={img}
                alt={`${name}-${index}`}
                className="aspect-square w-full object-cover"
              />

            </button>

          ))}

        </div>

      )}

    </div>
  );
}