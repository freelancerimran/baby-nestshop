"use client";

import {
  ChangeEvent,
  DragEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type {
  LandingPage,
  LandingPageProduct,
} from "@/types/landing-page";

type EditorMode = "create" | "edit";

type DeliveryMode = "free" | "paid";

type LandingPageWithDelivery =
  LandingPage & {
    deliveryMode: DeliveryMode;
    deliveryInsideDhaka: number;
    deliveryOutsideDhaka: number;
  };

type FormState = {
  id: number | null;
  productId: string | null;
  isManual: boolean;

  slug: string;
  status: "draft" | "published";

  pageTitle: string;
  shortDescription: string;
  description: string;

  regularPrice: string;
  offerPrice: string;

  images: string[];
  benefits: string[];
  features: string[];

  deliveryMode: DeliveryMode;
  deliveryInsideDhaka: string;
  deliveryOutsideDhaka: string;
};

const emptyForm: FormState = {
  id: null,

  productId: null,
  isManual: false,

  slug: "",
  status: "draft",

  pageTitle: "",
  shortDescription: "",
  description: "",

  regularPrice: "",
  offerPrice: "",

  images: [],
  benefits: [],
  features: [],

  deliveryMode: "free",
  deliveryInsideDhaka: "0",
  deliveryOutsideDhaka: "0",
};

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString(
      "en-BD",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  } catch {
    return value;
  }
}

/*
|--------------------------------------------------------------------------
| SAFE JSON RESPONSE
|--------------------------------------------------------------------------
*/

async function readJsonResponse(
  response: Response
) {
  const text =
    await response.text();

  if (!text.trim()) {
    throw new Error(
      `Server returned an empty response. HTTP ${response.status}.`
    );
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      `Server returned an invalid JSON response. HTTP ${response.status}.`
    );
  }
}

/*
|--------------------------------------------------------------------------
| NUMBER HELPERS
|--------------------------------------------------------------------------
*/

function safeNumber(
  value: unknown,
  fallback = 0
) {
  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
}

/*
|--------------------------------------------------------------------------
| NORMALIZE LANDING PAGE
|--------------------------------------------------------------------------
*/

function normalizeLandingPage(
  raw: any
): LandingPageWithDelivery {
  const deliveryMode: DeliveryMode =
    raw.deliveryMode === "paid" ||
    raw.delivery_mode === "paid"
      ? "paid"
      : "free";

  return {
    id: Number(raw.id),

    productId:
      raw.productId ??
      raw.product_id ??
      null,

    isManual: Boolean(
      raw.isManual ??
        raw.is_manual
    ),

    slug:
      raw.slug ??
      null,

    status:
      raw.status ===
      "published"
        ? "published"
        : "draft",

    pageTitle:
      raw.pageTitle ??
      raw.page_title ??
      null,

    shortDescription:
      raw.shortDescription ??
      raw.short_description ??
      null,

    description:
      raw.description ??
      null,

    regularPrice:
      raw.regularPrice ??
      raw.regular_price ??
      null,

    offerPrice:
      raw.offerPrice ??
      raw.offer_price ??
      null,

    images:
      Array.isArray(
        raw.images
      )
        ? raw.images
        : [],

    variants:
      Array.isArray(
        raw.variants
      )
        ? raw.variants
        : [],

    benefits:
      Array.isArray(
        raw.benefits
      )
        ? raw.benefits
        : [],

    features:
      Array.isArray(
        raw.features
      )
        ? raw.features
        : [],

    reviews:
      Array.isArray(
        raw.reviews
      )
        ? raw.reviews
        : [],

    facebookPixelId:
      raw.facebookPixelId ??
      raw.facebook_pixel_id ??
      null,

    publishedAt:
      raw.publishedAt ??
      raw.published_at ??
      null,

    createdAt:
      raw.createdAt ??
      raw.created_at ??
      "",

    updatedAt:
      raw.updatedAt ??
      raw.updated_at ??
      "",

    deliveryMode,

    deliveryInsideDhaka:
      safeNumber(
        raw.deliveryInsideDhaka ??
          raw.delivery_inside_dhaka,
        0
      ),

    deliveryOutsideDhaka:
      safeNumber(
        raw.deliveryOutsideDhaka ??
          raw.delivery_outside_dhaka,
        0
      ),
  };
}

export default function LandingPagesClient() {
  const [
    landingPages,
    setLandingPages,
  ] = useState<
    LandingPageWithDelivery[]
  >([]);

  const [
    products,
    setProducts,
  ] = useState<
    LandingPageProduct[]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    deletingId,
    setDeletingId,
  ] = useState<
    number | null
  >(null);

  const [
    editorOpen,
    setEditorOpen,
  ] = useState(false);

  const [
    editorMode,
    setEditorMode,
  ] = useState<EditorMode>(
    "create"
  );

  const [
    form,
    setForm,
  ] = useState<FormState>(
    emptyForm
  );

  const [
    selectedProductId,
    setSelectedProductId,
  ] = useState("");

  const [
    productSearch,
    setProductSearch,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  /*
  |--------------------------------------------------------------------------
  | IMAGE UPLOAD
  |--------------------------------------------------------------------------
  */

  const imageInputRef =
    useRef<HTMLInputElement>(
      null
    );

  const [
    imageUploading,
    setImageUploading,
  ] = useState(false);

  const [
    imageError,
    setImageError,
  ] = useState("");

  const [
    isDraggingImage,
    setIsDraggingImage,
  ] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | LOAD LANDING PAGES
  |--------------------------------------------------------------------------
  */

  async function loadLandingPages() {
    const response =
      await fetch(
        "/api/admin/landing-pages",
        {
          method: "GET",
          cache: "no-store",
        }
      );

    const result =
      await readJsonResponse(
        response
      );

    if (
      !response.ok ||
      !result?.success
    ) {
      throw new Error(
        result?.error ||
          result?.message ||
          `Failed to load landing pages. HTTP ${response.status}.`
      );
    }

    setLandingPages(
      Array.isArray(
        result.landingPages
      )
        ? result.landingPages.map(
            normalizeLandingPage
          )
        : []
    );
  }

  /*
  |--------------------------------------------------------------------------
  | LOAD PRODUCTS
  |--------------------------------------------------------------------------
  */

  async function loadProducts() {
    const response =
      await fetch(
        "/api/admin/products",
        {
          method: "GET",
          cache: "no-store",
        }
      );

    const result =
      await readJsonResponse(
        response
      );

    if (
      !response.ok ||
      !result?.success
    ) {
      throw new Error(
        result?.error ||
          result?.message ||
          `Failed to load products. HTTP ${response.status}.`
      );
    }

    setProducts(
      Array.isArray(
        result.products
      )
        ? result.products
        : []
    );
  }

  /*
  |--------------------------------------------------------------------------
  | LOAD ALL
  |--------------------------------------------------------------------------
  */

  async function loadAll() {
    try {
      setLoading(true);
      setError("");

      await Promise.all([
        loadLandingPages(),
        loadProducts(),
      ]);
    } catch (err) {
      console.error(
        "LANDING PAGE LOAD ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load data."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | PRODUCT SEARCH
  |--------------------------------------------------------------------------
  */

  const filteredProducts =
    useMemo(() => {
      const term =
        productSearch
          .trim()
          .toLowerCase();

      if (!term) {
        return products;
      }

      return products.filter(
        (product) =>
          product.productName
            .toLowerCase()
            .includes(term) ||
          product.productId
            .toLowerCase()
            .includes(term) ||
          product.slug
            .toLowerCase()
            .includes(term)
      );
    }, [
      products,
      productSearch,
    ]);

  /*
  |--------------------------------------------------------------------------
  | CREATE
  |--------------------------------------------------------------------------
  */

  function openCreate() {
    setEditorMode(
      "create"
    );

    setForm({
      ...emptyForm,
      images: [],
      benefits: [],
      features: [],
      deliveryMode: "free",
      deliveryInsideDhaka: "0",
      deliveryOutsideDhaka: "0",
    });

    setSelectedProductId(
      ""
    );

    setProductSearch("");
    setImageError("");
    setError("");
    setSuccess("");

    setEditorOpen(true);
  }

  /*
  |--------------------------------------------------------------------------
  | PRODUCT AUTO FILL
  |--------------------------------------------------------------------------
  */

  function selectProduct(
    productId: string
  ) {
    const product =
      products.find(
        (item) =>
          item.productId ===
          productId
      );

    if (!product) {
      return;
    }

    const images = [
      product.image,
      product.galleryImage1,
      product.galleryImage2,
      product.galleryImage3,
      product.galleryImage4,
    ].filter(
      (
        image
      ): image is string =>
        Boolean(image)
    );

    setSelectedProductId(
      productId
    );

    setForm(
      (current) => ({
        ...current,

        productId,

        isManual: false,

        pageTitle:
          product.productName ||
          "",

        shortDescription:
          product.description ||
          "",

        description:
          product.description ||
          "",

        regularPrice:
          String(
            product.regularPrice ??
              product.price ??
              0
          ),

        offerPrice:
          String(
            product.price ??
              0
          ),

        images,

        slug:
          product.slug ||
          "",

        /*
        IMPORTANT:
        Product selection must not
        reset delivery settings.
        */

        deliveryMode:
          current.deliveryMode,

        deliveryInsideDhaka:
          current.deliveryInsideDhaka,

        deliveryOutsideDhaka:
          current.deliveryOutsideDhaka,
      })
    );
  }

  /*
  |--------------------------------------------------------------------------
  | EDIT
  |--------------------------------------------------------------------------
  */

  function openEdit(
    landingPage: LandingPageWithDelivery
  ) {
    setEditorMode(
      "edit"
    );

    setForm({
      id:
        landingPage.id,

      productId:
        landingPage.productId,

      isManual:
        landingPage.isManual,

      slug:
        landingPage.slug ||
        "",

      status:
        landingPage.status,

      pageTitle:
        landingPage.pageTitle ||
        "",

      shortDescription:
        landingPage.shortDescription ||
        "",

      description:
        landingPage.description ||
        "",

      regularPrice:
        String(
          landingPage.regularPrice ??
            ""
        ),

      offerPrice:
        String(
          landingPage.offerPrice ??
            ""
        ),

      images:
        Array.isArray(
          landingPage.images
        )
          ? landingPage.images
          : [],

      benefits:
        Array.isArray(
          landingPage.benefits
        )
          ? landingPage.benefits
          : [],

      features:
        Array.isArray(
          landingPage.features
        )
          ? landingPage.features
          : [],

      deliveryMode:
        landingPage.deliveryMode,

      deliveryInsideDhaka:
        String(
          landingPage.deliveryInsideDhaka ??
            0
        ),

      deliveryOutsideDhaka:
        String(
          landingPage.deliveryOutsideDhaka ??
            0
        ),
    });

    setSelectedProductId(
      landingPage.productId ||
        ""
    );

    setImageError("");
    setError("");
    setSuccess("");

    setEditorOpen(true);
  }

  /*
  |--------------------------------------------------------------------------
  | IMAGE UPLOAD
  |--------------------------------------------------------------------------
  */

  async function uploadImages(
    files: FileList | File[]
  ) {
    const fileArray =
      Array.from(files);

    if (
      fileArray.length ===
      0
    ) {
      return;
    }

    setImageError("");

    /*
    Existing project rule:
    Maximum 8 images.
    */

    const remainingSlots =
      8 -
      form.images.length;

    if (
      remainingSlots <= 0
    ) {
      setImageError(
        "Maximum 8 images are allowed."
      );
      return;
    }

    const filesToUpload =
      fileArray.slice(
        0,
        remainingSlots
      );

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    const invalidType =
      filesToUpload.find(
        (file) =>
          !allowedTypes.includes(
            file.type
          )
      );

    if (invalidType) {
      setImageError(
        `Unsupported image type: ${invalidType.name}`
      );
      return;
    }

    const tooLarge =
      filesToUpload.find(
        (file) =>
          file.size >
          8 * 1024 * 1024
      );

    if (tooLarge) {
      setImageError(
        `${tooLarge.name} is larger than 8MB.`
      );
      return;
    }

    try {
      setImageUploading(
        true
      );

      const uploadedUrls: string[] =
        [];

      for (
        const file of filesToUpload
      ) {
        const formData =
          new FormData();

        formData.append(
          "file",
          file
        );

        const response =
          await fetch(
            "/api/admin/landing-pages/upload",
            {
              method: "POST",
              body: formData,
            }
          );

        const result =
          await readJsonResponse(
            response
          );

        if (
          !response.ok ||
          !result?.success
        ) {
          throw new Error(
            result?.error ||
              result?.message ||
              `Failed to upload ${file.name}.`
          );
        }

        if (
          typeof result.url ===
          "string"
        ) {
          uploadedUrls.push(
            result.url
          );
        }
      }

      if (
        uploadedUrls.length
      ) {
        setForm(
          (current) => ({
            ...current,

            images: [
              ...current.images,
              ...uploadedUrls,
            ],
          })
        );
      }
    } catch (err) {
      console.error(
        "LANDING IMAGE UPLOAD ERROR:",
        err
      );

      setImageError(
        err instanceof Error
          ? err.message
          : "Image upload failed."
      );
    } finally {
      setImageUploading(
        false
      );
    }
  }

  function handleImageInput(
    event: ChangeEvent<HTMLInputElement>
  ) {
    if (
      event.target.files
    ) {
      void uploadImages(
        event.target.files
      );
    }

    event.target.value = "";
  }

  function handleImageDrop(
    event: DragEvent<HTMLDivElement>
  ) {
    event.preventDefault();

    setIsDraggingImage(
      false
    );

    if (
      event.dataTransfer
        .files
    ) {
      void uploadImages(
        event.dataTransfer.files
      );
    }
  }

  function removeImage(
    index: number
  ) {
    setForm(
      (current) => ({
        ...current,

        images:
          current.images.filter(
            (
              _,
              imageIndex
            ) =>
              imageIndex !==
              index
          ),
      })
    );
  }

  /*
  |--------------------------------------------------------------------------
  | ARRAY FIELD HELPERS
  |--------------------------------------------------------------------------
  */

  function updateArrayField(
    field:
      | "benefits"
      | "features",
    index: number,
    value: string
  ) {
    setForm(
      (current) => {
        const values = [
          ...current[field],
        ];

        values[index] =
          value;

        return {
          ...current,
          [field]: values,
        };
      }
    );
  }

  function addArrayField(
    field:
      | "benefits"
      | "features"
  ) {
    setForm(
      (current) => ({
        ...current,

        [field]: [
          ...current[field],
          "",
        ],
      })
    );
  }

  function removeArrayField(
    field:
      | "benefits"
      | "features",
    index: number
  ) {
    setForm(
      (current) => ({
        ...current,

        [field]:
          current[
            field
          ].filter(
            (
              _,
              itemIndex
            ) =>
              itemIndex !==
              index
          ),
      })
    );
  }

  /*
  |--------------------------------------------------------------------------
  | DELIVERY MODE
  |--------------------------------------------------------------------------
  */

  function changeDeliveryMode(
    mode: DeliveryMode
  ) {
    setForm(
      (current) => ({
        ...current,

        deliveryMode:
          mode,

        /*
        Free means zero delivery.
        Paid restores the existing
        values instead of destroying
        them.
        */

        deliveryInsideDhaka:
          mode === "free"
            ? "0"
            : current
                .deliveryInsideDhaka ===
              "0"
            ? ""
            : current.deliveryInsideDhaka,

        deliveryOutsideDhaka:
          mode === "free"
            ? "0"
            : current
                .deliveryOutsideDhaka ===
              "0"
            ? ""
            : current.deliveryOutsideDhaka,
      })
    );
  }

  /*
  |--------------------------------------------------------------------------
  | SAVE
  |--------------------------------------------------------------------------
  */

  async function saveLandingPage() {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (
        !form.pageTitle.trim()
      ) {
        throw new Error(
          "Page title is required."
        );
      }

      if (
        !form.slug.trim()
      ) {
        throw new Error(
          "Slug is required."
        );
      }

      if (
        !form.isManual &&
        !form.productId
      ) {
        throw new Error(
          "Please select a product."
        );
      }

      if (
        form.images.length >
        8
      ) {
        throw new Error(
          "Maximum 8 images are allowed."
        );
      }

      const deliveryMode =
        form.deliveryMode;

      const deliveryInsideDhaka =
        deliveryMode === "paid"
          ? Math.max(
              0,
              safeNumber(
                form.deliveryInsideDhaka,
                0
              )
            )
          : 0;

      const deliveryOutsideDhaka =
        deliveryMode === "paid"
          ? Math.max(
              0,
              safeNumber(
                form.deliveryOutsideDhaka,
                0
              )
            )
          : 0;

      const payload = {
        productId:
          form.productId,

        isManual:
          form.isManual,

        slug:
          form.slug.trim(),

        status:
          form.status,

        pageTitle:
          form.pageTitle.trim(),

        shortDescription:
          form.shortDescription.trim(),

        description:
          form.description.trim(),

        regularPrice:
          form.regularPrice,

        offerPrice:
          form.offerPrice,

        images:
          form.images,

        benefits:
          form.benefits,

        features:
          form.features,

        /*
        ======================================================
        DELIVERY
        ======================================================
        */

        deliveryMode,

        deliveryInsideDhaka,

        deliveryOutsideDhaka,
      };

      const url =
        form.id
          ? `/api/admin/landing-pages/${form.id}`
          : "/api/admin/landing-pages";

      const method =
        form.id
          ? "PATCH"
          : "POST";

      const response =
        await fetch(
          url,
          {
            method,

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                payload
              ),
          }
        );

      const result =
        await readJsonResponse(
          response
        );

      if (
        !response.ok ||
        !result?.success
      ) {
        throw new Error(
          result?.error ||
            result?.message ||
            "Failed to save landing page."
        );
      }

      await loadLandingPages();

      setSuccess(
        form.id
          ? "Landing page updated successfully."
          : "Landing page created successfully."
      );

      setEditorOpen(
        false
      );
    } catch (err) {
      console.error(
        "LANDING PAGE SAVE ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to save landing page."
      );
    } finally {
      setSaving(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | DELETE
  |--------------------------------------------------------------------------
  */

  async function deleteLandingPage(
    id: number
  ) {
    const confirmed =
      window.confirm(
        "Delete this landing page permanently?\n\nThis will NOT delete the product, variant, stock, or orders."
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(id);
      setError("");
      setSuccess("");

      const response =
        await fetch(
          `/api/admin/landing-pages/${id}`,
          {
            method: "DELETE",
          }
        );

      const result =
        await readJsonResponse(
          response
        );

      if (
        !response.ok ||
        !result?.success
      ) {
        throw new Error(
          result?.error ||
            result?.message ||
            "Failed to delete landing page."
        );
      }

      setLandingPages(
        (current) =>
          current.filter(
            (item) =>
              item.id !== id
          )
      );

      setSuccess(
        "Landing page deleted successfully."
      );
    } catch (err) {
      console.error(
        "LANDING PAGE DELETE ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete landing page."
      );
    } finally {
      setDeletingId(
        null
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-full bg-slate-50/60 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Landing Pages
              </h1>

              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600">
                {
                  landingPages.length
                }
              </span>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Create and manage product landing pages for your campaigns.
            </p>
          </div>

          <button
            type="button"
            onClick={
              openCreate
            }
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            + Create Landing Page
          </button>
        </div>

        {/* ALERTS */}

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        )}

        {/* LIST */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="p-8 text-center text-sm text-slate-500">
              Loading landing pages...
            </div>
          ) : landingPages.length ===
            0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl">
                ✨
              </div>

              <h2 className="text-lg font-semibold text-slate-900">
                No landing pages yet
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Create your first landing page to start running campaigns.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {landingPages.map(
                (
                  landingPage
                ) => (
                  <div
                    key={
                      landingPage.id
                    }
                    className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                        {landingPage
                          .images?.[0] ? (
                          <img
                            src={
                              landingPage
                                .images[0]
                            }
                            alt=""
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                            No image
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate font-semibold text-slate-900">
                            {
                              landingPage.pageTitle
                            }
                          </h3>

                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                              landingPage.status ===
                              "published"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {
                              landingPage.status
                            }
                          </span>

                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                            {landingPage.isManual
                              ? "Manual"
                              : "Product"}
                          </span>

                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                              landingPage.deliveryMode ===
                              "paid"
                                ? "bg-orange-50 text-orange-700"
                                : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {landingPage.deliveryMode ===
                            "paid"
                              ? "Paid Delivery"
                              : "Free Delivery"}
                          </span>
                        </div>

                        <p className="mt-1 truncate text-sm text-slate-500">
                          /
                          {
                            landingPage.slug
                          }
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Updated{" "}
                          {formatDate(
                            landingPage.updatedAt
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {landingPage.slug && (
                        <a
                          href={`/lp/${landingPage.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          View
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          openEdit(
                            landingPage
                          )
                        }
                        className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        disabled={
                          deletingId ===
                          landingPage.id
                        }
                        onClick={() =>
                          deleteLandingPage(
                            landingPage.id
                          )
                        }
                        className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                      >
                        {deletingId ===
                        landingPage.id
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>

      {/* EDITOR MODAL */}

      {editorOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-2 backdrop-blur-sm sm:p-4">
          <div className="flex max-h-[96vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

            {/* MODAL HEADER */}

            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
                  {editorMode ===
                  "create"
                    ? "Create Landing Page"
                    : "Edit Landing Page"}
                </h2>

                <p className="mt-1 hidden text-xs text-slate-500 sm:block">
                  Existing product data is copied into this landing page. Editing it will not modify the original product.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setEditorOpen(
                    false
                  )
                }
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            {/* MODAL BODY */}

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="space-y-6">

                {/* MODE */}

                {editorMode ===
                  "create" && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">

                    <div className="mb-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setForm(
                            (
                              current
                            ) => ({
                              ...current,
                              isManual:
                                false,
                              productId:
                                null,
                            })
                          )
                        }
                        className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                          !form.isManual
                            ? "bg-blue-600 text-white"
                            : "bg-white text-slate-600"
                        }`}
                      >
                        Existing Product
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setForm(
                            (
                              current
                            ) => ({
                              ...current,
                              isManual:
                                true,
                              productId:
                                null,
                              pageTitle:
                                "",
                              shortDescription:
                                "",
                              description:
                                "",
                              regularPrice:
                                "",
                              offerPrice:
                                "",
                              images: [],
                            })
                          )
                        }
                        className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                          form.isManual
                            ? "bg-blue-600 text-white"
                            : "bg-white text-slate-600"
                        }`}
                      >
                        Manual
                      </button>
                    </div>

                    {!form.isManual && (
                      <>
                        <input
                          value={
                            productSearch
                          }
                          onChange={(
                            event
                          ) =>
                            setProductSearch(
                              event
                                .target
                                .value
                            )
                          }
                          placeholder="Search product..."
                          className="mb-3 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                        />

                        <select
                          value={
                            selectedProductId
                          }
                          onChange={(
                            event
                          ) =>
                            selectProduct(
                              event
                                .target
                                .value
                            )
                          }
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                        >
                          <option value="">
                            Select a product
                          </option>

                          {filteredProducts.map(
                            (
                              product
                            ) => (
                              <option
                                key={
                                  product.productId
                                }
                                value={
                                  product.productId
                                }
                              >
                                {
                                  product.productName
                                }{" "}
                                —{" "}
                                {
                                  product.productId
                                }
                              </option>
                            )
                          )}
                        </select>
                      </>
                    )}
                  </div>
                )}

                {/* BASIC INFORMATION */}

                <div className="grid gap-5 lg:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Page Title
                    </label>

                    <input
                      value={
                        form.pageTitle
                      }
                      onChange={(
                        event
                      ) =>
                        setForm(
                          (
                            current
                          ) => ({
                            ...current,
                            pageTitle:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Slug
                    </label>

                    <input
                      value={
                        form.slug
                      }
                      onChange={(
                        event
                      ) =>
                        setForm(
                          (
                            current
                          ) => ({
                            ...current,
                            slug:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                      placeholder="example-product-offer"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Regular Price
                    </label>

                    <input
                      type="number"
                      min="0"
                      value={
                        form.regularPrice
                      }
                      onChange={(
                        event
                      ) =>
                        setForm(
                          (
                            current
                          ) => ({
                            ...current,
                            regularPrice:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Offer Price
                    </label>

                    <input
                      type="number"
                      min="0"
                      value={
                        form.offerPrice
                      }
                      onChange={(
                        event
                      ) =>
                        setForm(
                          (
                            current
                          ) => ({
                            ...current,
                            offerPrice:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* DELIVERY SETTINGS */}

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4">
                    <h3 className="text-base font-bold text-slate-900">
                      Delivery Settings
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Configure delivery charges specifically for this landing page.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">

                    {/* FREE */}

                    <button
                      type="button"
                      onClick={() =>
                        changeDeliveryMode(
                          "free"
                        )
                      }
                      className={`rounded-2xl border p-4 text-left transition ${
                        form.deliveryMode ===
                        "free"
                          ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-100"
                          : "border-slate-200 bg-white hover:border-emerald-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-900">
                          Free Delivery
                        </span>

                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                            form.deliveryMode ===
                            "free"
                              ? "border-emerald-600 bg-emerald-600 text-white"
                              : "border-slate-300"
                          }`}
                        >
                          {form.deliveryMode ===
                          "free"
                            ? "✓"
                            : ""}
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-slate-500">
                        Customer pays no delivery charge.
                      </p>
                    </button>

                    {/* PAID */}

                    <button
                      type="button"
                      onClick={() =>
                        changeDeliveryMode(
                          "paid"
                        )
                      }
                      className={`rounded-2xl border p-4 text-left transition ${
                        form.deliveryMode ===
                        "paid"
                          ? "border-orange-500 bg-orange-50 ring-2 ring-orange-100"
                          : "border-slate-200 bg-white hover:border-orange-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-900">
                          Paid Delivery
                        </span>

                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                            form.deliveryMode ===
                            "paid"
                              ? "border-orange-600 bg-orange-600 text-white"
                              : "border-slate-300"
                          }`}
                        >
                          {form.deliveryMode ===
                          "paid"
                            ? "✓"
                            : ""}
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-slate-500">
                        Set separate Dhaka and outside Dhaka charges.
                      </p>
                    </button>
                  </div>

                  {form.deliveryMode ===
                    "paid" && (
                    <div className="mt-5 grid gap-5 sm:grid-cols-2">

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Inside Dhaka
                        </label>

                        <div className="relative">
                          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                            ৳
                          </span>

                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={
                              form.deliveryInsideDhaka
                            }
                            onChange={(
                              event
                            ) =>
                              setForm(
                                (
                                  current
                                ) => ({
                                  ...current,
                                  deliveryInsideDhaka:
                                    event
                                      .target
                                      .value,
                                })
                              )
                            }
                            placeholder="60"
                            className="w-full rounded-xl border border-slate-200 py-3 pl-9 pr-4 text-sm outline-none focus:border-orange-500"
                          />
                        </div>

                        <p className="mt-1 text-xs text-slate-400">
                          Delivery charge for Dhaka.
                        </p>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Outside Dhaka
                        </label>

                        <div className="relative">
                          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                            ৳
                          </span>

                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={
                              form.deliveryOutsideDhaka
                            }
                            onChange={(
                              event
                            ) =>
                              setForm(
                                (
                                  current
                                ) => ({
                                  ...current,
                                  deliveryOutsideDhaka:
                                    event
                                      .target
                                      .value,
                                })
                              )
                            }
                            placeholder="120"
                            className="w-full rounded-xl border border-slate-200 py-3 pl-9 pr-4 text-sm outline-none focus:border-orange-500"
                          />
                        </div>

                        <p className="mt-1 text-xs text-slate-400">
                          Delivery charge outside Dhaka.
                        </p>
                      </div>
                    </div>
                  )}

                  {form.deliveryMode ===
                    "free" && (
                    <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
                      Free delivery is active. Both delivery charges will be saved as ৳0.
                    </div>
                  )}
                </div>

                {/* SHORT DESCRIPTION */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Short Description
                  </label>

                  <textarea
                    rows={3}
                    value={
                      form.shortDescription
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (
                          current
                        ) => ({
                          ...current,
                          shortDescription:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                {/* DESCRIPTION */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Description
                  </label>

                  <textarea
                    rows={7}
                    value={
                      form.description
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (
                          current
                        ) => ({
                          ...current,
                          description:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                {/* IMAGES */}

                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <label className="text-sm font-semibold text-slate-700">
                      Images
                    </label>

                    <span className="text-xs font-medium text-slate-400">
                      {form.images.length}/8
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        imageInputRef.current?.click()
                      }
                      disabled={
                        imageUploading ||
                        form.images.length >=
                          8
                      }
                      className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 disabled:opacity-50"
                    >
                      {imageUploading
                        ? "Uploading..."
                        : "+ Add Image"}
                    </button>
                  </div>

                  <input
                    ref={
                      imageInputRef
                    }
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    multiple
                    onChange={
                      handleImageInput
                    }
                    className="hidden"
                  />

                  <div
                    onDragOver={(
                      event
                    ) => {
                      event.preventDefault();

                      setIsDraggingImage(
                        true
                      );
                    }}
                    onDragLeave={() =>
                      setIsDraggingImage(
                        false
                      )
                    }
                    onDrop={
                      handleImageDrop
                    }
                    onClick={() =>
                      imageInputRef.current?.click()
                    }
                    className={`cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition ${
                      isDraggingImage
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/50"
                    }`}
                  >
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
                      🖼️
                    </div>

                    <p className="mt-3 text-sm font-semibold text-slate-800">
                      Click to upload images
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Or drag & drop here · JPG, PNG, WEBP · Max 8MB each · Maximum 8 images
                    </p>
                  </div>

                  {imageError && (
                    <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                      {imageError}
                    </div>
                  )}

                  {form.images.length >
                    0 && (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {form.images.map(
                        (
                          image,
                          index
                        ) => (
                          <div
                            key={`${image}-${index}`}
                            className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                          >
                            <div className="aspect-square bg-slate-100">
                              <img
                                src={
                                  image
                                }
                                alt=""
                                loading="lazy"
                                className="h-full w-full object-cover"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                removeImage(
                                  index
                                )
                              }
                              className="w-full border-t border-slate-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                            >
                              Remove
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>

                {/* PRODUCT VARIANTS */}

                {!form.isManual &&
                  selectedProductId && (
                    <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
                      <h3 className="font-semibold text-blue-900">
                        Product Variants
                      </h3>

                      <p className="mt-1 text-xs text-blue-700">
                        These variants come from the original product and cannot be changed from the landing page editor.
                      </p>

                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        {(
                          products.find(
                            (
                              product
                            ) =>
                              product.productId ===
                              selectedProductId
                          )?.variants ||
                          []
                        ).map(
                          (
                            variant
                          ) => (
                            <div
                              key={
                                variant.id
                              }
                              className="rounded-xl bg-white p-3"
                            >
                              <div className="font-medium text-slate-900">
                                {
                                  variant.variantName
                                }
                              </div>

                              <div className="mt-1 text-xs text-slate-500">
                                {variant.sku ||
                                  "No SKU"}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {/* BENEFITS / FEATURES */}

                <div className="grid gap-6 lg:grid-cols-2">
                  {(
                    [
                      "benefits",
                      "features",
                    ] as const
                  ).map(
                    (field) => (
                      <div
                        key={
                          field
                        }
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <label className="text-sm font-semibold capitalize text-slate-700">
                            {field}
                          </label>

                          <button
                            type="button"
                            onClick={() =>
                              addArrayField(
                                field
                              )
                            }
                            className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                          >
                            + Add
                          </button>
                        </div>

                        <div className="space-y-2">
                          {form[
                            field
                          ].map(
                            (
                              value,
                              index
                            ) => (
                              <div
                                key={
                                  index
                                }
                                className="flex gap-2"
                              >
                                <input
                                  value={
                                    value
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    updateArrayField(
                                      field,
                                      index,
                                      event
                                        .target
                                        .value
                                    )
                                  }
                                  className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                                />

                                <button
                                  type="button"
                                  onClick={() =>
                                    removeArrayField(
                                      field,
                                      index
                                    )
                                  }
                                  className="rounded-xl bg-red-50 px-3 text-red-600 hover:bg-red-100"
                                >
                                  ×
                                </button>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )
                  )}
                </div>

                {/* STATUS */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Status
                  </label>

                  <select
                    value={
                      form.status
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (
                          current
                        ) => ({
                          ...current,
                          status:
                            event
                              .target
                              .value as
                              | "draft"
                              | "published",
                        })
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="draft">
                      Draft
                    </option>

                    <option value="published">
                      Published
                    </option>
                  </select>
                </div>
              </div>
            </div>

            {/* MODAL FOOTER */}

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
              <button
                type="button"
                onClick={() =>
                  setEditorOpen(
                    false
                  )
                }
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  saving ||
                  imageUploading
                }
                onClick={
                  saveLandingPage
                }
                className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : editorMode ===
                      "create"
                    ? "Create Landing Page"
                    : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}