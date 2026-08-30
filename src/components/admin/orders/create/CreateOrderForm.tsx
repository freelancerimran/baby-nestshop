"use client";

import {
  ChangeEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import Link from "next/link";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Minus,
  Package,
  Plus,
  Search,
  ShoppingBag,
  Trash2,
  User,
  MapPin,
  CreditCard,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Truck,
  Wallet,
  StickyNote,
  ScanText,
  ImagePlus,
  X,
  Upload,
} from "lucide-react";

/* =========================================================
   TYPES
========================================================= */

interface Product {
  productId?: string | number | null;
  product_id?: string | number | null;
  id?: string | number | null;

  productName?: string | null;
  product_name?: string | null;
  name?: string | null;
  title?: string | null;

  productSlug?: string | null;
  product_slug?: string | null;
  slug?: string | null;

  price?: number | string | null;
  selling_price?: number | string | null;
  sale_price?: number | string | null;

  realStock?: number | null;
  displayStock?: number | null;
  real_stock?: number | null;
  display_stock?: number | null;
  stock?: number | null;
  quantity?: number | null;

  image_url?: string | null;
  image?: string | null;
  imageUrl?: string | null;
  thumbnail?: string | null;
  featured_image?: string | null;
  featuredImage?: string | null;

  status?: string | null;
}

interface OrderItem {
  productId: string;
  productName: string;
  productSlug: string;
  quantity: number;
  unitPrice: number;
  imageUrl: string;
  stock: number;
}

type DeliveryMode =
  | "inside"
  | "outside"
  | "custom";

interface FormState {
  customerName: string;
  phone: string;
  district: string;
  address: string;
  note: string;

  deliveryMode: DeliveryMode;
  customDeliveryCharge: number;

  discount: number;
  couponCode: string;

  paidAmount: number;
  paymentMethod: string;
  orderStatus: string;
}

interface SmartCustomerData {
  customerName: string;
  phone: string;
  address: string;
  district: string;
}

type SmartFillTab =
  | "text"
  | "image";
/* =========================================================
   CONSTANTS
========================================================= */

const DISTRICTS = [
  "Bagerhat",
  "Bandarban",
  "Barguna",
  "Barishal",
  "Bhola",
  "Bogura",
  "Brahmanbaria",
  "Chandpur",
  "Chattogram",
  "Chuadanga",
  "Cox's Bazar",
  "Cumilla",
  "Dhaka",
  "Dinajpur",
  "Faridpur",
  "Feni",
  "Gaibandha",
  "Gazipur",
  "Gopalganj",
  "Habiganj",
  "Jamalpur",
  "Jashore",
  "Jhalokathi",
  "Jhenaidah",
  "Joypurhat",
  "Khagrachhari",
  "Khulna",
  "Kishoreganj",
  "Kurigram",
  "Kushtia",
  "Lakshmipur",
  "Lalmonirhat",
  "Madaripur",
  "Magura",
  "Manikganj",
  "Meherpur",
  "Moulvibazar",
  "Munshiganj",
  "Mymensingh",
  "Naogaon",
  "Narail",
  "Narayanganj",
  "Narsingdi",
  "Natore",
  "Netrokona",
  "Nilphamari",
  "Noakhali",
  "Pabna",
  "Panchagarh",
  "Patuakhali",
  "Pirojpur",
  "Rajbari",
  "Rajshahi",
  "Rangamati",
  "Rangpur",
  "Satkhira",
  "Shariatpur",
  "Sherpur",
  "Sirajganj",
  "Sunamganj",
  "Sylhet",
  "Tangail",
  "Thakurgaon",
];

const PAYMENT_METHODS = [
  "COD",
  "Cash",
  "bKash",
  "Nagad",
  "Bank",
  "Card",
  "Other",
];

const PRODUCTS_PER_PAGE = 6;

const INSIDE_DHAKA_CHARGE = 80;
const OUTSIDE_DHAKA_CHARGE = 130;

/* =========================================================
   HELPERS
========================================================= */

function money(value: number) {
  return `৳${Number(value || 0).toLocaleString(
    "en-BD"
  )}`;
}

function numberValue(value: unknown) {
  const number = Number(value ?? 0);

  return Number.isFinite(number)
    ? number
    : 0;
}

function productId(product: Product) {
  const raw = product as Product & {
    productId?: string | number | null;
  };

  const value =
    raw.productId ??
    product.product_id ??
    product.id ??
    "";

  return String(value).trim();
}

function productName(product: Product) {
  const raw = product as Product & {
    productName?: string | null;
  };

  return (
    raw.productName ??
    product.product_name ??
    product.name ??
    product.title ??
    "Unnamed Product"
  );
}

function productSlug(product: Product) {
  const raw = product as Product & {
    productSlug?: string | null;
  };

  return String(
    raw.productSlug ??
      product.product_slug ??
      product.slug ??
      ""
  );
}

function productPrice(product: Product) {
  const raw = product as Product & {
    productPrice?: number | string | null;
  };

  return numberValue(
    raw.productPrice ??
      product.price ??
      product.selling_price ??
      product.sale_price ??
      0
  );
}

function productStock(product: Product) {
  const raw = product as Product & {
    realStock?: number | null;
    displayStock?: number | null;
  };

  // realStock is the authoritative stock used for ordering.
  // displayStock is only the storefront/display counter.
  return Math.max(
    0,
    numberValue(
      raw.realStock ??
        product.real_stock ??
        product.stock ??
        product.quantity ??
        0
    )
  );
}

function productImage(product: Product) {
  const raw = product as Product & {
    image?: string | null;
    imageUrl?: string | null;
  };

  return (
    raw.image ??
    raw.imageUrl ??
    product.image_url ??
    product.thumbnail ??
    product.featured_image ??
    product.featuredImage ??
    ""
  );
}

/* =========================================================
   SMART CUSTOMER PARSER
========================================================= */

function normalizeBangladeshPhone(
  value: string
) {
  const cleaned =
    value
      .replace(
        /[^\d+]/g,
        ""
      )
      .trim();

  let digits =
    cleaned.replace(
      /\D/g,
      ""
    );

  if (
    digits.startsWith(
      "880"
    ) &&
    digits.length >= 13
  ) {
    digits =
      `0${digits.slice(3)}`;
  }

  if (
    digits.startsWith(
      "1"
    ) &&
    digits.length === 10
  ) {
    digits =
      `0${digits}`;
  }

  if (
    /^01\d{9}$/.test(
      digits
    )
  ) {
    return digits;
  }

  return "";
}

function extractBangladeshPhone(
  text: string
) {
  const matches =
    text.match(
      /(?:\+?88)?01[3-9][0-9\s-]{8,11}/g
    ) ?? [];

  for (
    const match of matches
  ) {
    const phone =
      normalizeBangladeshPhone(
        match
      );

    if (phone) {
      return phone;
    }
  }

  return "";
}

function cleanLine(
  value: string
) {
  return value
    .replace(
      /\s+/g,
      " "
    )
    .replace(
      /^[\s:;,\-|]+/,
      ""
    )
    .replace(
      /[\s:;,\-|]+$/,
      ""
    )
    .trim();
}

function detectDistrictFromText(
  text: string
) {
  const normalized =
    text.toLowerCase();

  const sortedDistricts =
    [...DISTRICTS].sort(
      (
        first,
        second
      ) =>
        second.length -
        first.length
    );

  for (
    const district of sortedDistricts
  ) {
    const lowerDistrict =
      district.toLowerCase();

    if (
      normalized.includes(
        lowerDistrict
      )
    ) {
      return district;
    }
  }

  /*
   * Common Bangladesh
   * district aliases.
   */

  const aliases:
    Record<string, string> = {
      chittagong:
        "Chattogram",

      comilla:
        "Cumilla",

      barisal:
        "Barishal",

      jessore:
        "Jashore",

      sylhet:
        "Sylhet",

      coxsbazar:
        "Cox's Bazar",

      "cox's bazar":
        "Cox's Bazar",
    };

  for (
    const [
      alias,
      district,
    ] of Object.entries(
      aliases
    )
  ) {
    if (
      normalized.includes(
        alias
      )
    ) {
      return district;
    }
  }

  return "";
}

function isLikelyLabel(
  line: string
) {
  const normalized =
    line
      .toLowerCase()
      .replace(
        /\s+/g,
        " "
      )
      .trim();

  const labels = [
    "name",
    "customer name",
    "phone",
    "phone number",
    "mobile",
    "mobile number",
    "address",
    "full address",
    "district",
    "thana",
    "area",
    "ঠিকানা",
    "নাম",
    "ফোন",
    "মোবাইল",
    "জেলা",
  ];

  return labels.some(
    (label) =>
      normalized === label
  );
}

function extractValueAfterLabel(
  lines: string[],
  labels: string[]
) {
  for (
    const line of lines
  ) {
    const lowerLine =
      line.toLowerCase();

    for (
      const label of labels
    ) {
      const lowerLabel =
        label.toLowerCase();

      if (
        lowerLine.startsWith(
          lowerLabel
        )
      ) {
        const value =
          cleanLine(
            line
              .slice(
                lowerLabel.length
              )
              .replace(
                /^[:\-–—]+/,
                ""
              )
          );

        if (value) {
          return value;
        }
      }
    }
  }

  return "";
}

function looksLikePhoneLine(
  line: string
) {
  return Boolean(
    extractBangladeshPhone(
      line
    )
  );
}

function looksLikeAddress(
  line: string
) {
  const normalized =
    line.toLowerCase();

  const addressWords = [
    "road",
    "rd",
    "house",
    "flat",
    "floor",
    "block",
    "sector",
    "village",
    "village",
    "para",
    "bazar",
    "thana",
    "upazila",
    "district",
    "dhaka",
    "chattogram",
    "cumilla",
    "bangladesh",
    "বাসা",
    "বাড়ি",
    "বাড়ি",
    "রোড",
    "থানা",
    "জেলা",
    "গ্রাম",
  ];

  if (
    line.length >= 12 &&
    addressWords.some(
      (word) =>
        normalized.includes(
          word
        )
    )
  ) {
    return true;
  }

  if (
    line.includes(
      ","
    ) &&
    line.length >= 12
  ) {
    return true;
  }

  return false;
}

function looksLikeName(
  line: string
) {
  const value =
    cleanLine(line);

  if (
    !value ||
    value.length < 2 ||
    value.length > 70
  ) {
    return false;
  }

  if (
    looksLikePhoneLine(
      value
    )
  ) {
    return false;
  }

  if (
    looksLikeAddress(
      value
    )
  ) {
    return false;
  }

  if (
    isLikelyLabel(
      value
    )
  ) {
    return false;
  }

  const lower =
    value.toLowerCase();

  const invalidWords = [
    "message",
    "messenger",
    "facebook",
    "today",
    "yesterday",
    "seen",
    "typing",
    "reply",
    "order",
    "cash on delivery",
    "cod",
    "delivery",
    "address",
    "phone",
    "mobile",
  ];

  if (
    invalidWords.some(
      (word) =>
        lower === word
    )
  ) {
    return false;
  }

  /*
   * A name should generally
   * not contain too many numbers.
   */

  const digits =
    (
      value.match(
        /\d/g
      ) ?? []
    ).length;

  if (
    digits > 1
  ) {
    return false;
  }

  return true;
}

function extractSmartCustomerData(
  rawText: string
): SmartCustomerData {
  const text =
    rawText
      .replace(
        /\r/g,
        "\n"
      )
      .replace(
        /\n{3,}/g,
        "\n\n"
      )
      .trim();

  const rawLines =
    text
      .split("\n")
      .map(
        cleanLine
      )
      .filter(Boolean);

  const customerNameFromLabel =
    extractValueAfterLabel(
      rawLines,
      [
        "customer name",
        "name",
        "নাম",
      ]
    );

  const phone =
    extractBangladeshPhone(
      text
    );

  let address =
    extractValueAfterLabel(
      rawLines,
      [
        "full address",
        "address",
        "ঠিকানা",
      ]
    );

  /*
   * If address is not explicitly
   * labeled, collect likely
   * address lines.
   */

  if (!address) {
    const addressLines =
      rawLines.filter(
        (
          line,
          index
        ) => {
          if (
            looksLikePhoneLine(
              line
            )
          ) {
            return false;
          }

          if (
            isLikelyLabel(
              line
            )
          ) {
            return false;
          }

          if (
            looksLikeAddress(
              line
            )
          ) {
            return true;
          }

          /*
           * Lines immediately
           * after a phone number
           * are often addresses.
           */

          const previous =
            rawLines[
              index - 1
            ];

          if (
            previous &&
            looksLikePhoneLine(
              previous
            ) &&
            line.length >= 8
          ) {
            return true;
          }

          return false;
        }
      );

    address =
      addressLines
        .slice(
          0,
          3
        )
        .join(", ");
  }

  let customerName =
    customerNameFromLabel;

  if (!customerName) {
    /*
     * First suitable line is
     * treated as the probable name.
     */

    const nameLine =
      rawLines.find(
        (
          line,
          index
        ) => {
          if (
            !looksLikeName(
              line
            )
          ) {
            return false;
          }

          /*
           * Prefer lines before
           * phone/address details.
           */

          if (
            index <= 3
          ) {
            return true;
          }

          return false;
        }
      );

    customerName =
      nameLine ?? "";
  }

  /*
   * Do not accidentally use
   * the address as a name.
   */

  if (
    customerName &&
    address &&
    customerName ===
      address
  ) {
    customerName = "";
  }

  const district =
    detectDistrictFromText(
      `${address}\n${text}`
    );

  return {
    customerName:
      cleanLine(
        customerName
      ),

    phone,

    address:
      cleanLine(
        address
      ),

    district,
  };
}

/* =========================================================
   COMPONENT
========================================================= */

export default function CreateOrderForm() {
  const [products, setProducts] =
    useState<Product[]>([]);

  const [items, setItems] =
    useState<OrderItem[]>([]);

  const [loadingProducts, setLoadingProducts] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [productPage, setProductPage] =
    useState(1);

  const [successMessage, setSuccessMessage] =
    useState("");

  const [error, setError] =
    useState("");

  /* =======================================================
     SMART CUSTOMER FILL
  ======================================================= */

  const [smartFillTab, setSmartFillTab] =
    useState<SmartFillTab>("text");

  const [smartText, setSmartText] =
    useState("");

  const [smartFillLoading, setSmartFillLoading] =
    useState(false);

  const [smartFillMessage, setSmartFillMessage] =
    useState("");

  const [ocrLoading, setOcrLoading] =
    useState(false);

  const [ocrPreview, setOcrPreview] =
    useState("");

  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const [form, setForm] =
    useState<FormState>({
      customerName: "",
      phone: "",
      district: "",
      address: "",
      note: "",

      deliveryMode: "inside",
      customDeliveryCharge: 0,

      discount: 0,
      couponCode: "",

      paidAmount: 0,
      paymentMethod: "COD",
      orderStatus: "Pending",
    });

  /* =======================================================
     LOAD PRODUCTS
  ======================================================= */

  async function loadProducts() {
    try {
      setLoadingProducts(true);
      setError("");

      const response = await fetch(
        "/api/admin/products",
        {
          cache: "no-store",
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "Failed to load products."
        );
      }

      const list =
        result?.products ??
        result?.data ??
        result ??
        [];

      if (!Array.isArray(list)) {
        throw new Error(
          "Invalid product response."
        );
      }

      setProducts(list);
    } catch (err) {
      console.error(
        "LOAD PRODUCTS ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load products."
      );
    } finally {
      setLoadingProducts(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  /* =======================================================
     FILTER PRODUCTS
  ======================================================= */

  const filteredProducts =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return products;
      }

      return products.filter(
        (product) => {
          const name =
            productName(
              product
            ).toLowerCase();

          const id =
            productId(
              product
            ).toLowerCase();

          const slug =
            productSlug(
              product
            ).toLowerCase();

          return (
            name.includes(query) ||
            id.includes(query) ||
            slug.includes(query)
          );
        }
      );
    }, [
      products,
      search,
    ]);

  /* =======================================================
     PRODUCT PAGINATION
  ======================================================= */

  const totalProductPages =
    Math.max(
      1,
      Math.ceil(
        filteredProducts.length /
          PRODUCTS_PER_PAGE
      )
    );

  const safeProductPage =
    Math.min(
      productPage,
      totalProductPages
    );

  const visibleProducts =
    useMemo(() => {
      const start =
        (safeProductPage - 1) *
        PRODUCTS_PER_PAGE;

      return filteredProducts.slice(
        start,
        start +
          PRODUCTS_PER_PAGE
      );
    }, [
      filteredProducts,
      safeProductPage,
    ]);

  useEffect(() => {
    setProductPage(1);
  }, [search]);

  useEffect(() => {
    if (
      productPage >
      totalProductPages
    ) {
      setProductPage(
        totalProductPages
      );
    }
  }, [
    productPage,
    totalProductPages,
  ]);

  /* =======================================================
     SMART CUSTOMER FILL FUNCTIONS
  ======================================================= */

  function applySmartCustomerData(
    data: SmartCustomerData
  ) {
    setForm((current) => ({
      ...current,

      customerName:
        data.customerName ||
        current.customerName,

      phone:
        data.phone ||
        current.phone,

      address:
        data.address ||
        current.address,

      district:
        data.district ||
        current.district,
    }));
  }

  async function parseSmartText(
    textToParse?: string
  ) {
    const sourceText =
      (
        textToParse ??
        smartText
      ).trim();

    if (!sourceText) {
      setSmartFillMessage(
        "Please enter or paste customer information first."
      );

      return;
    }

    try {
      setSmartFillLoading(true);
      setSmartFillMessage("");
      setError("");

      const response =
        await fetch(
          "/api/admin/orders/parse-text",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              text: sourceText,
            }),
          }
        );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result?.success
      ) {
        throw new Error(
          result?.error ||
            "Failed to extract customer information."
        );
      }

      const data:
        SmartCustomerData = {
          customerName:
            String(
              result?.data
                ?.customerName ??
                ""
            ),

          phone:
            String(
              result?.data
                ?.phone ??
                ""
            ),

          address:
            String(
              result?.data
                ?.address ??
                ""
            ),

          district:
            String(
              result?.data
                ?.district ??
                ""
            ),
        };

      applySmartCustomerData(
        data
      );

      const foundFields = [
        data.customerName
          ? "name"
          : "",

        data.phone
          ? "phone"
          : "",

        data.address
          ? "address"
          : "",

        data.district
          ? "district"
          : "",
      ].filter(Boolean);

      if (
        foundFields.length ===
        0
      ) {
        setSmartFillMessage(
          "No customer information could be detected. Please fill the fields manually."
        );

        return;
      }

      setSmartFillMessage(
        `Successfully filled: ${foundFields.join(
          ", "
        )}. Please review before creating the order.`
      );
    } catch (err) {
      console.error(
        "SMART FILL ERROR:",
        err
      );

      setSmartFillMessage(
        err instanceof Error
          ? err.message
          : "Failed to process customer information."
      );
    } finally {
      setSmartFillLoading(false);
    }
  }

  /* =======================================================
     IMAGE OCR
  ======================================================= */

  async function handleSmartImageUpload(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    /*
     * Reset input so the same image
     * can be selected again.
     */
    event.target.value = "";

    if (!file) {
      return;
    }

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      setSmartFillMessage(
        "Please select a valid image file."
      );

      return;
    }

    const maxFileSize =
      10 * 1024 * 1024;

    if (
      file.size >
      maxFileSize
    ) {
      setSmartFillMessage(
        "Image is too large. Please select an image smaller than 10 MB."
      );

      return;
    }

    let previewUrl = "";

    try {
      setOcrLoading(true);
      setSmartFillMessage("");
      setError("");

      /*
       * Create local image preview.
       */
      previewUrl =
        URL.createObjectURL(
          file
        );

      setOcrPreview(
        previewUrl
      );

      /*
       * Load Tesseract only when
       * image OCR is actually used.
       */
      const {
        createWorker,
      } = await import(
        "tesseract.js"
      );

      const worker =
        await createWorker(
          "eng"
        );

      const result =
        await worker.recognize(
          file
        );

      const extractedText =
        result?.data?.text?.trim() ??
        "";

      await worker.terminate();

      if (!extractedText) {
        setSmartFillMessage(
          "No readable text was found in this image. Please try a clearer screenshot."
        );

        return;
      }

      /*
       * Keep extracted OCR text
       * available in the text tab.
       */
      setSmartText(
        extractedText
      );

      /*
       * Use the existing parser
       * to extract customer data.
       */
      await parseSmartText(
        extractedText
      );

    } catch (err) {
      console.error(
        "IMAGE OCR ERROR:",
        err
      );

      setSmartFillMessage(
        err instanceof Error
          ? err.message
          : "Failed to read text from the image."
      );
    } finally {
      setOcrLoading(false);
    }
  }

  function removeSmartImage() {
    if (
      ocrPreview
    ) {
      URL.revokeObjectURL(
        ocrPreview
      );
    }

    setOcrPreview("");

    setSmartFillMessage("");

    if (
      fileInputRef.current
    ) {
      fileInputRef.current.value =
        "";
    }
  }

  /* =======================================================
     FORM UPDATE
  ======================================================= */

  function updateForm(
    key: keyof FormState,
    value:
      | string
      | number
      | DeliveryMode
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  /* =======================================================
     DELIVERY
  ======================================================= */

  const deliveryCharge =
    useMemo(() => {
      if (
        form.deliveryMode ===
        "inside"
      ) {
        return INSIDE_DHAKA_CHARGE;
      }

      if (
        form.deliveryMode ===
        "outside"
      ) {
        return OUTSIDE_DHAKA_CHARGE;
      }

      return Math.max(
        0,
        numberValue(
          form.customDeliveryCharge
        )
      );
    }, [
      form.deliveryMode,
      form.customDeliveryCharge,
    ]);

  /* =======================================================
     ADD PRODUCT
  ======================================================= */

  function addProduct(
    product: Product
  ) {
    setError("");

    const id =
      productId(product);

    if (!id) {
      setError(
        "This product does not have a valid product ID."
      );

      return;
    }

    const stock =
      productStock(product);

    if (stock <= 0) {
      setError(
        `${productName(
          product
        )} is out of stock.`
      );

      return;
    }

    const existing =
      items.find(
        (item) =>
          item.productId ===
          id
      );

    if (existing) {
      if (
        existing.quantity >=
        existing.stock
      ) {
        setError(
          `Only ${existing.stock} pcs available for ${existing.productName}.`
        );

        return;
      }

      setItems((current) =>
        current.map((item) =>
          item.productId === id
            ? {
                ...item,
                quantity:
                  item.quantity + 1,
              }
            : item
        )
      );

      return;
    }

    setItems((current) => [
      ...current,
      {
        productId: id,
        productName:
          productName(product),
        productSlug:
          productSlug(product),
        quantity: 1,
        unitPrice:
          productPrice(product),
        imageUrl:
          productImage(product),
        stock,
      },
    ]);
  }

  /* =======================================================
     REMOVE PRODUCT
  ======================================================= */

  function removeProduct(
    productIdValue: string
  ) {
    setItems((current) =>
      current.filter(
        (item) =>
          item.productId !==
          productIdValue
      )
    );
  }

  /* =======================================================
     QUANTITY
  ======================================================= */

  function changeQuantity(
    productIdValue: string,
    change: number
  ) {
    setItems((current) =>
      current.map((item) => {
        if (
          item.productId !==
          productIdValue
        ) {
          return item;
        }

        const nextQuantity =
          item.quantity +
          change;

        return {
          ...item,
          quantity: Math.min(
            item.stock,
            Math.max(
              1,
              nextQuantity
            )
          ),
        };
      })
    );
  }

  function setQuantity(
    productIdValue: string,
    value: number
  ) {
    if (
      !Number.isFinite(value)
    ) {
      return;
    }

    setItems((current) =>
      current.map((item) => {
        if (
          item.productId !==
          productIdValue
        ) {
          return item;
        }

        const next =
          Math.max(
            1,
            Math.min(
              item.stock,
              Math.floor(value)
            )
          );

        return {
          ...item,
          quantity: next,
        };
      })
    );
  }

  /* =======================================================
     PRICE
  ======================================================= */

  function setItemPrice(
    productIdValue: string,
    value: number
  ) {
    setItems((current) =>
      current.map((item) =>
        item.productId ===
        productIdValue
          ? {
              ...item,
              unitPrice:
                Math.max(
                  0,
                  numberValue(
                    value
                  )
                ),
            }
          : item
      )
    );
  }

  /* =======================================================
     CALCULATIONS
  ======================================================= */

  const subtotal =
    useMemo(() => {
      return items.reduce(
        (
          total,
          item
        ) =>
          total +
          item.quantity *
            item.unitPrice,
        0
      );
    }, [items]);

  const totalItems =
    useMemo(() => {
      return items.reduce(
        (
          total,
          item
        ) =>
          total +
          item.quantity,
        0
      );
    }, [items]);

  const manualDiscount =
    Math.min(
      subtotal,
      Math.max(
        0,
        numberValue(
          form.discount
        )
      )
    );

  const grandTotal =
    Math.max(
      0,
      subtotal +
        deliveryCharge -
        manualDiscount
    );

  const paidAmount =
    Math.min(
      grandTotal,
      Math.max(
        0,
        numberValue(
          form.paidAmount
        )
      )
    );

  const dueAmount =
    Math.max(
      0,
      grandTotal -
        paidAmount
    );

  /* =======================================================
     CREATE ORDER
  ======================================================= */

  async function createOrder() {
    try {
      setSubmitting(true);
      setError("");
      setSuccessMessage("");

      if (
        !form.customerName.trim()
      ) {
        throw new Error(
          "Customer name is required."
        );
      }

      if (
        !form.phone.trim()
      ) {
        throw new Error(
          "Customer phone number is required."
        );
      }

      if (
        !form.district
      ) {
        throw new Error(
          "Please select a district."
        );
      }

      if (
        !form.address.trim()
      ) {
        throw new Error(
          "Customer address is required."
        );
      }

      if (
        items.length === 0
      ) {
        throw new Error(
          "Please add at least one product."
        );
      }

      const invalidItem =
        items.find(
          (item) =>
            item.quantity <= 0 ||
            item.quantity >
              item.stock
        );

      if (invalidItem) {
        throw new Error(
          `Invalid quantity for ${invalidItem.productName}.`
        );
      }

      const response =
        await fetch(
          "/api/admin/orders/create",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              customer_name:
                form.customerName.trim(),

              phone:
                form.phone.trim(),

              district:
                form.district,

              /*
               * Delivery Area intentionally
               * removed from the new UI.
               */

              address:
                form.address.trim(),

              note:
                form.note.trim()
                  ? form.note.trim()
                  : null,

              delivery_charge:
                deliveryCharge,

              discount:
                manualDiscount,

              coupon_code:
                form.couponCode.trim()
                  ? form.couponCode.trim()
                  : null,

              paid_amount:
                paidAmount,

              payment_method:
                form.paymentMethod,

              status:
                form.orderStatus,

              items: items.map(
                (item) => ({
                  productId:
                    item.productId,

                  productName:
                    item.productName,

                  productSlug:
                    item.productSlug,

                  quantity:
                    item.quantity,

                  unitPrice:
                    item.unitPrice,
                })
              ),
            }),
          }
        );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result?.success
      ) {
        throw new Error(
          result?.error ||
            "Failed to create order."
        );
      }

      const orderId =
        result?.order?.orderId ??
        result?.orderId ??
        "";

      setSuccessMessage(
        orderId
          ? `Order ${orderId} created successfully.`
          : "Order created successfully."
      );

      setItems([]);

      setSearch("");

      setProductPage(1);

      setForm({
        customerName: "",
        phone: "",
        district: "",
        address: "",
        note: "",

        deliveryMode: "inside",
        customDeliveryCharge: 0,

        discount: 0,
        couponCode: "",

        paidAmount: 0,
        paymentMethod: "COD",
        orderStatus: "Pending",
      });

      await loadProducts();
    } catch (err) {
      console.error(
        "CREATE ORDER ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to create order."
      );
    } finally {
      setSubmitting(false);
    }
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="min-h-full bg-[#f8fafc] pb-10">
      <div className="mx-auto max-w-[1500px] px-4 py-6 lg:px-7">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link
              href="/admin/orders"
              className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-blue-600 transition hover:text-blue-700"
            >
              <ArrowLeft size={16} />
              Orders
            </Link>

            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-900">
                  Create New Order
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Create a manual order for your customer.
                </p>
              </div>

              <div className="hidden h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-sm sm:flex">
                <ShoppingBag size={21} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-bold text-blue-700">
            <Sparkles size={15} />
            Admin Order
          </div>
        </div>

        {/* =================================================
            ALERTS
        ================================================= */}

        {successMessage && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm font-semibold text-emerald-700 shadow-sm">
            <CheckCircle2
              size={19}
              className="mt-0.5 shrink-0"
            />

            <div>
              <p className="font-black">
                Order Created
              </p>

              <p className="mt-0.5 font-medium">
                {successMessage}
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm font-semibold text-red-700 shadow-sm">
            <AlertCircle
              size={19}
              className="mt-0.5 shrink-0"
            />

            <div>
              <p className="font-black">
                Unable to continue
              </p>

              <p className="mt-0.5 font-medium">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* =================================================
            MAIN GRID
        ================================================= */}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">

          {/* =================================================
              LEFT
          ================================================= */}

          <div className="space-y-6">

            {/* ===============================================
                CUSTOMER
            =============================================== */}

            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">

              <div className="border-b border-slate-100 px-6 py-5">
                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <User size={19} />
                  </div>

                  <div>
                    <h2 className="font-black text-slate-900">
                      Customer Information
                    </h2>

                    <p className="mt-0.5 text-xs text-slate-500">
                      Enter customer delivery information.
                    </p>
                  </div>

                </div>
              </div>

              <div className="p-6">

                                {/* ===========================================
                    SMART CUSTOMER FILL
                ============================================ */}

                <div className="mb-6 overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/80 via-white to-violet-50/50">

                  {/* HEADER */}

                  <div className="flex flex-col gap-4 border-b border-blue-100/80 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">

                    <div className="flex items-center gap-3">

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">

                        <Sparkles
                          size={18}
                        />

                      </div>

                      <div>

                        <h3 className="text-sm font-black text-slate-900">
                          Smart Customer Fill
                        </h3>

                        <p className="mt-0.5 text-xs leading-5 text-slate-500">
                          Paste customer details or upload a screenshot to fill the form automatically.
                        </p>

                      </div>

                    </div>

                    {/* TABS */}

                    <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">

                      <button
                        type="button"
                        onClick={() => {
                          setSmartFillTab(
                            "text"
                          );

                          setSmartFillMessage(
                            ""
                          );
                        }}
                        className={`flex h-9 items-center justify-center gap-2 rounded-lg px-3 text-xs font-bold transition ${
                          smartFillTab ===
                          "text"
                            ? "bg-blue-600 text-white shadow-sm"
                            : "text-slate-500 hover:bg-slate-50"
                        }`}
                      >

                        <ScanText
                          size={15}
                        />

                        Text

                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSmartFillTab(
                            "image"
                          );

                          setSmartFillMessage(
                            ""
                          );
                        }}
                        className={`flex h-9 items-center justify-center gap-2 rounded-lg px-3 text-xs font-bold transition ${
                          smartFillTab ===
                          "image"
                            ? "bg-blue-600 text-white shadow-sm"
                            : "text-slate-500 hover:bg-slate-50"
                        }`}
                      >

                        <ImagePlus
                          size={15}
                        />

                        Image OCR

                      </button>

                    </div>

                  </div>

                  <div className="p-4">

                    {/* =======================================
                        TEXT TAB
                    ======================================= */}

                    {smartFillTab ===
                      "text" && (

                      <div>

                        <textarea
                          value={
                            smartText
                          }
                          onChange={(
                            event
                          ) =>
                            setSmartText(
                              event.target.value
                            )
                          }
                          placeholder={`Example:

Name: MD Imran
Phone: 017XXXXXXXX
Address: House 10, Road 5, Banasree
District: Dhaka`}
                          rows={5}
                          className="min-h-[130px] w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                        />

                        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                          <p className="text-[11px] leading-5 text-slate-400">
                            Paste customer name, phone number and address. Smart Fill will detect available information automatically.
                          </p>

                          <button
                            type="button"
                            onClick={() =>
                              parseSmartText()
                            }
                            disabled={
                              smartFillLoading ||
                              !smartText.trim()
                            }
                            className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-xs font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >

                            {smartFillLoading ? (

                              <>
                                <Loader2
                                  size={16}
                                  className="animate-spin"
                                />

                                Processing...

                              </>

                            ) : (

                              <>
                                <Sparkles
                                  size={16}
                                />

                                Smart Fill

                              </>

                            )}

                          </button>

                        </div>

                      </div>
                    )}

                    {/* =======================================
                        IMAGE OCR TAB
                    ======================================= */}

                    {smartFillTab ===
                      "image" && (

                      <div>

                        {!ocrPreview ? (

                          <div className="rounded-2xl border border-dashed border-blue-200 bg-white p-5">

                            <input
                              ref={
                                fileInputRef
                              }
                              type="file"
                              accept="image/png,image/jpeg,image/jpg,image/webp"
                              onChange={
                                handleSmartImageUpload
                              }
                              className="hidden"
                            />

                            <div className="flex flex-col items-center justify-center text-center">

                              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">

                                <ImagePlus
                                  size={24}
                                />

                              </div>

                              <h4 className="mt-3 text-sm font-black text-slate-800">
                                Upload Customer Screenshot
                              </h4>

                              <p className="mt-1 max-w-md text-xs leading-5 text-slate-400">
                                Upload a screenshot containing customer name, phone number and address.
                              </p>

                              <button
                                type="button"
                                onClick={() =>
                                  fileInputRef.current?.click()
                                }
                                disabled={
                                  ocrLoading
                                }
                                className="mt-4 flex h-11 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-5 text-xs font-black text-blue-600 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                              >

                                {ocrLoading ? (

                                  <>
                                    <Loader2
                                      size={16}
                                      className="animate-spin"
                                    />

                                    Reading Image...

                                  </>

                                ) : (

                                  <>
                                    <Upload
                                      size={16}
                                    />

                                    Choose Image

                                  </>

                                )}

                              </button>

                              <p className="mt-3 text-[10px] font-medium text-slate-400">
                                PNG, JPG or WEBP • Maximum 10 MB
                              </p>

                            </div>

                          </div>

                        ) : (

                          <div className="rounded-2xl border border-slate-200 bg-white p-3">

                            <div className="flex flex-col gap-4 sm:flex-row">

                              {/* IMAGE PREVIEW */}

                              <div className="relative h-44 w-full shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 sm:w-60">

                                <img
                                  src={
                                    ocrPreview
                                  }
                                  alt="Customer information preview"
                                  className="h-full w-full object-contain"
                                />

                                <button
                                  type="button"
                                  onClick={
                                    removeSmartImage
                                  }
                                  disabled={
                                    ocrLoading
                                  }
                                  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg bg-white text-red-500 shadow-md transition hover:bg-red-50 disabled:opacity-50"
                                  aria-label="Remove image"
                                >

                                  <X
                                    size={16}
                                  />

                                </button>

                              </div>

                              {/* OCR STATUS */}

                              <div className="flex min-w-0 flex-1 flex-col justify-center">

                                {ocrLoading ? (

                                  <>

                                    <div className="flex items-center gap-2 text-blue-600">

                                      <Loader2
                                        size={18}
                                        className="animate-spin"
                                      />

                                      <span className="text-sm font-black">
                                        Reading image with OCR...
                                      </span>

                                    </div>

                                    <p className="mt-2 text-xs leading-5 text-slate-400">
                                      Extracting customer information. This may take a few seconds.
                                    </p>

                                  </>

                                ) : (

                                  <>

                                    <div className="flex items-center gap-2 text-emerald-600">

                                      <CheckCircle2
                                        size={18}
                                      />

                                      <span className="text-sm font-black">
                                        Image processed successfully
                                      </span>

                                    </div>

                                    <p className="mt-2 text-xs leading-5 text-slate-500">
                                      Detected text has been processed using Smart Fill. Please review the customer fields below.
                                    </p>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        removeSmartImage();

                                        fileInputRef.current?.click();
                                      }}
                                      className="mt-4 flex h-10 w-fit items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 text-xs font-bold text-slate-600 transition hover:bg-slate-100"
                                    >

                                      <Upload
                                        size={15}
                                      />

                                      Choose Another Image

                                    </button>

                                  </>

                                )}

                              </div>

                            </div>

                          </div>

                        )}

                      </div>
                    )}

                    {/* =======================================
                        SMART FILL MESSAGE
                    ======================================= */}

                    {smartFillMessage && (

                      <div
                        className={`mt-4 flex items-start gap-3 rounded-xl border px-4 py-3 ${
                          smartFillMessage.startsWith(
                            "Successfully"
                          ) ||
                          smartFillMessage.startsWith(
                            "Image processed"
                          )
                            ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                            : "border-amber-100 bg-amber-50 text-amber-700"
                        }`}
                      >

                        {smartFillMessage.startsWith(
                          "Successfully"
                        ) ||
                        smartFillMessage.startsWith(
                          "Image processed"
                        ) ? (

                          <CheckCircle2
                            size={17}
                            className="mt-0.5 shrink-0"
                          />

                        ) : (

                          <AlertCircle
                            size={17}
                            className="mt-0.5 shrink-0"
                          />

                        )}

                        <p className="text-xs font-medium leading-5">
                          {
                            smartFillMessage
                          }
                        </p>

                      </div>
                    )}

                  </div>

                </div>

                <div className="grid gap-4 md:grid-cols-2">

                  {/* NAME */}

                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-slate-600">
                      Customer Name
                      <span className="ml-1 text-red-500">
                        *
                      </span>
                    </label>

                    <input
                      value={
                        form.customerName
                      }
                      onChange={(
                        event
                      ) =>
                        updateForm(
                          "customerName",
                          event.target.value
                        )
                      }
                      placeholder="Enter customer name"
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>

                  {/* PHONE */}

                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-slate-600">
                      Phone Number
                      <span className="ml-1 text-red-500">
                        *
                      </span>
                    </label>

                    <input
                      value={
                        form.phone
                      }
                      onChange={(
                        event
                      ) =>
                        updateForm(
                          "phone",
                          event.target.value
                        )
                      }
                      placeholder="01XXXXXXXXX"
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>

                  {/* DISTRICT */}

                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-slate-600">
                      District
                      <span className="ml-1 text-red-500">
                        *
                      </span>
                    </label>

                    <div className="relative">

                      <MapPin
                        size={16}
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <select
                        value={
                          form.district
                        }
                        onChange={(
                          event
                        ) =>
                          updateForm(
                            "district",
                            event.target.value
                          )
                        }
                        className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-10 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                      >
                        <option value="">
                          Select district
                        </option>

                        {DISTRICTS.map(
                          (
                            district
                          ) => (
                            <option
                              key={
                                district
                              }
                              value={
                                district
                              }
                            >
                              {
                                district
                              }
                            </option>
                          )
                        )}
                      </select>

                      <ChevronDown
                        size={17}
                        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                    </div>
                  </div>

                  {/* ADDRESS */}

                  <div className="md:col-span-2">

                    <label className="mb-1.5 block text-xs font-bold text-slate-600">
                      Full Address
                      <span className="ml-1 text-red-500">
                        *
                      </span>
                    </label>

                    <textarea
                      value={
                        form.address
                      }
                      onChange={(
                        event
                      ) =>
                        updateForm(
                          "address",
                          event.target.value
                        )
                      }
                      placeholder="House, Road, Area, Thana, District"
                      rows={3}
                      className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                    />

                  </div>

                  {/* NOTE */}

                  <div className="md:col-span-2">

                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-600">
                      <StickyNote
                        size={14}
                        className="text-amber-500"
                      />
                      Note
                    </label>

                    <textarea
                      value={
                        form.note
                      }
                      onChange={(
                        event
                      ) =>
                        updateForm(
                          "note",
                          event.target.value
                        )
                      }
                      placeholder="Example: Deliver within 28th, call before delivery, customer requested evening delivery..."
                      rows={3}
                      className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                    />

                    <p className="mt-1.5 text-[11px] font-medium text-slate-400">
                      This note will be saved with the order for fulfillment and courier instructions.
                    </p>

                  </div>

                </div>
              </div>
            </section>

            {/* ===============================================
                PRODUCTS
            =============================================== */}

            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">

              {/* PRODUCT HEADER */}

              <div className="border-b border-slate-100 px-6 py-5">

                <div className="flex flex-wrap items-center justify-between gap-4">

                  <div className="flex items-center gap-3">

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                      <Package size={19} />
                    </div>

                    <div>
                      <h2 className="font-black text-slate-900">
                        Products
                      </h2>

                      <p className="mt-0.5 text-xs text-slate-500">
                        Select products and add them to this order.
                      </p>
                    </div>

                  </div>

                  <div className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
                    {filteredProducts.length} products
                  </div>

                </div>

                {/* SEARCH */}

                <div className="relative mt-5">

                  <Search
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    value={
                      search
                    }
                    onChange={(
                      event
                    ) =>
                      setSearch(
                        event.target.value
                      )
                    }
                    placeholder="Search product by name, ID or SKU..."
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  />

                </div>

              </div>

              {/* AVAILABLE PRODUCTS */}

              <div className="px-6 py-5">

                {loadingProducts ? (

                  <div className="flex min-h-[180px] items-center justify-center">

                    <div className="text-center">

                      <Loader2
                        size={28}
                        className="mx-auto animate-spin text-blue-600"
                      />

                      <p className="mt-3 text-sm font-semibold text-slate-500">
                        Loading products...
                      </p>

                    </div>

                  </div>

                ) : visibleProducts.length ===
                  0 ? (

                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">

                    <Package
                      size={30}
                      className="mx-auto text-slate-300"
                    />

                    <p className="mt-3 text-sm font-bold text-slate-500">
                      No products found
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Try another product name or ID.
                    </p>

                  </div>

                ) : (

                  <div className="grid gap-3 md:grid-cols-2">

                    {visibleProducts.map(
                      (
                        product,
                        index
                      ) => {

                        const id =
                          productId(
                            product
                          );

                        const name =
                          productName(
                            product
                          );

                        const price =
                          productPrice(
                            product
                          );

                        const stock =
                          productStock(
                            product
                          );

                        const image =
                          productImage(
                            product
                          );

                        const alreadyAdded =
                          items.some(
                            (
                              item
                            ) =>
                              item.productId ===
                              id
                          );

                        /*
                         * Fallback key prevents
                         * duplicate empty keys.
                         */

                        const safeKey =
                          id ||
                          `${name}-${safeProductPage}-${index}`;

                        return (

                          <button
                            key={
                              safeKey
                            }
                            type="button"
                            onClick={() =>
                              addProduct(
                                product
                              )
                            }
                            disabled={
                              stock <=
                              0
                            }
                            className={`group relative flex min-h-[108px] items-center gap-4 rounded-2xl border p-3 text-left transition-all duration-200 ${
                              stock <=
                              0
                                ? "cursor-not-allowed border-slate-100 bg-slate-50 opacity-60"
                                : alreadyAdded
                                ? "border-blue-200 bg-blue-50/50 shadow-sm"
                                : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/30 hover:shadow-md"
                            }`}
                          >

                            {/* IMAGE */}

                            <div className="relative h-[82px] w-[82px] shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-50">

                              {image ? (

                                <img
                                  src={
                                    image
                                  }
                                  alt={
                                    name
                                  }
                                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                  onError={(
                                    event
                                  ) => {
                                    event.currentTarget.style.display =
                                      "none";
                                  }}
                                />

                              ) : (

                                <div className="flex h-full w-full items-center justify-center text-slate-300">
                                  <Package
                                    size={
                                      28
                                    }
                                  />
                                </div>

                              )}

                              {alreadyAdded && (
                                <div className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white shadow-md">
                                  <Check
                                    size={
                                      13
                                    }
                                    strokeWidth={
                                      3
                                    }
                                  />
                                </div>
                              )}

                            </div>

                            {/* INFO */}

                            <div className="min-w-0 flex-1">

                              <p className="line-clamp-2 text-sm font-black leading-5 text-slate-900">
                                {
                                  name
                                }
                              </p>

                              <p className="mt-1.5 text-base font-black text-blue-600">
                                {money(
                                  price
                                )}
                              </p>

                              <div className="mt-1 flex items-center gap-1.5">

                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${
                                    stock >
                                    0
                                      ? "bg-emerald-500"
                                      : "bg-red-500"
                                  }`}
                                />

                                <span
                                  className={`text-[11px] font-bold ${
                                    stock >
                                    0
                                      ? "text-emerald-600"
                                      : "text-red-500"
                                  }`}
                                >
                                  {stock >
                                  0
                                    ? `Stock: ${stock} pcs`
                                    : "Out of stock"}
                                </span>

                              </div>

                            </div>

                            {/* ADD */}

                            <div className="shrink-0">

                              <div
                                className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
                                  stock >
                                  0
                                    ? alreadyAdded
                                      ? "bg-blue-600 text-white"
                                      : "bg-slate-100 text-slate-600 group-hover:bg-blue-600 group-hover:text-white"
                                    : "bg-slate-100 text-slate-300"
                                }`}
                              >

                                {alreadyAdded ? (
                                  <Check
                                    size={
                                      17
                                    }
                                  />
                                ) : (
                                  <Plus
                                    size={
                                      17
                                    }
                                  />
                                )}

                              </div>

                            </div>

                          </button>
                        );
                      }
                    )}

                  </div>

                )}

                {/* PAGINATION */}

                {totalProductPages >
                  1 && (

                  <div className="mt-5 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">

                    <button
                      type="button"
                      onClick={() =>
                        setProductPage(
                          (page) =>
                            Math.max(
                              1,
                              page -
                                1
                            )
                        )
                      }
                      disabled={
                        safeProductPage ===
                        1
                      }
                      className="flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft
                        size={
                          15
                        }
                      />
                      Previous
                    </button>

                    <div className="text-xs font-black text-slate-600">
                      Page{" "}
                      {safeProductPage}{" "}
                      of{" "}
                      {
                        totalProductPages
                      }
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setProductPage(
                          (page) =>
                            Math.min(
                              totalProductPages,
                              page +
                                1
                            )
                        )
                      }
                      disabled={
                        safeProductPage ===
                        totalProductPages
                      }
                      className="flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next
                      <ChevronRight
                        size={
                          15
                        }
                      />
                    </button>

                  </div>
                )}

              </div>

              {/* =============================================
                  SELECTED PRODUCTS
              ============================================= */}

              {items.length >
                0 && (

                <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-5">

                  <div className="mb-4 flex items-center justify-between">

                    <div>

                      <h3 className="text-sm font-black text-slate-900">
                        Selected Products
                      </h3>

                      <p className="mt-0.5 text-xs text-slate-500">
                        {items.length} product
                        {items.length !==
                        1
                          ? "s"
                          : ""}{" "}
                        ·{" "}
                        {totalItems} items
                      </p>

                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setItems(
                          []
                        )
                      }
                      className="text-xs font-bold text-red-500 hover:text-red-600"
                    >
                      Clear All
                    </button>

                  </div>

                  <div className="space-y-3">

                    {items.map(
                      (
                        item
                      ) => (

                        <div
                          key={
                            item.productId
                          }
                          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                        >

                          <div className="flex flex-wrap items-center gap-4">

                            {/* IMAGE */}

                            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-50">

                              {item.imageUrl ? (

                                <img
                                  src={
                                    item.imageUrl
                                  }
                                  alt={
                                    item.productName
                                  }
                                  className="h-full w-full object-cover"
                                />

                              ) : (

                                <div className="flex h-full w-full items-center justify-center text-slate-300">
                                  <Package
                                    size={
                                      21
                                    }
                                  />
                                </div>

                              )}

                            </div>

                            {/* NAME */}

                            <div className="min-w-[180px] flex-1">

                              <p className="text-sm font-black text-slate-900">
                                {
                                  item.productName
                                }
                              </p>

                              <p className="mt-1 text-xs font-medium text-slate-400">
                                Available Stock:{" "}
                                {
                                  item.stock
                                }{" "}
                                pcs
                              </p>

                            </div>

                            {/* QUANTITY */}

                            <div>

                              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                Quantity
                              </p>

                              <div className="flex h-10 items-center overflow-hidden rounded-xl border border-slate-200 bg-white">

                                <button
                                  type="button"
                                  onClick={() =>
                                    changeQuantity(
                                      item.productId,
                                      -1
                                    )
                                  }
                                  disabled={
                                    item.quantity <=
                                    1
                                  }
                                  className="flex h-full w-9 items-center justify-center text-slate-500 transition hover:bg-slate-50 disabled:opacity-30"
                                >
                                  <Minus
                                    size={
                                      15
                                    }
                                  />
                                </button>

                                <input
                                  type="number"
                                  min="1"
                                  max={
                                    item.stock
                                  }
                                  value={
                                    item.quantity
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    setQuantity(
                                      item.productId,
                                      Number(
                                        event
                                          .target
                                          .value
                                      )
                                    )
                                  }
                                  className="h-full w-12 border-x border-slate-200 text-center text-sm font-black text-slate-900 outline-none"
                                />

                                <button
                                  type="button"
                                  onClick={() =>
                                    changeQuantity(
                                      item.productId,
                                      1
                                    )
                                  }
                                  disabled={
                                    item.quantity >=
                                    item.stock
                                  }
                                  className="flex h-full w-9 items-center justify-center text-slate-500 transition hover:bg-slate-50 disabled:opacity-30"
                                >
                                  <Plus
                                    size={
                                      15
                                    }
                                  />
                                </button>

                              </div>

                            </div>

                            {/* UNIT PRICE */}

                            <div className="w-[110px]">

                              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                Price
                              </p>

                              <input
                                type="number"
                                min="0"
                                value={
                                  item.unitPrice
                                }
                                onChange={(
                                  event
                                ) =>
                                  setItemPrice(
                                    item.productId,
                                    Number(
                                      event
                                        .target
                                        .value
                                    )
                                  )
                                }
                                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                              />

                            </div>

                            {/* TOTAL */}

                            <div className="min-w-[100px] text-right">

                              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                Total
                              </p>

                              <p className="text-sm font-black text-slate-900">
                                {money(
                                  item.quantity *
                                    item.unitPrice
                                )}
                              </p>

                            </div>

                            {/* DELETE */}

                            <button
                              type="button"
                              onClick={() =>
                                removeProduct(
                                  item.productId
                                )
                              }
                              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-500 transition hover:bg-red-100"
                              aria-label="Remove product"
                            >
                              <Trash2
                                size={
                                  16
                                }
                              />
                            </button>

                          </div>

                        </div>
                      )
                    )}

                  </div>

                </div>
              )}

            </section>
          </div>

          {/* =================================================
              RIGHT SUMMARY
          ================================================= */}

          <aside className="h-fit xl:sticky xl:top-6">

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.07)]">

              {/* HEADER */}

              <div className="border-b border-slate-100 bg-gradient-to-br from-blue-50/70 to-white px-6 py-5">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                    <CreditCard
                      size={
                        19
                      }
                    />
                  </div>

                  <div>
                    <h2 className="font-black text-slate-900">
                      Order Summary
                    </h2>

                    <p className="mt-0.5 text-xs text-slate-500">
                      Review before creating order.
                    </p>
                  </div>

                </div>

              </div>

              <div className="p-6">

                {/* SUBTOTAL */}

                <div className="flex items-center justify-between">

                  <span className="text-sm font-semibold text-slate-500">
                    Subtotal
                  </span>

                  <span className="text-sm font-black text-slate-900">
                    {money(
                      subtotal
                    )}
                  </span>

                </div>

                <div className="mt-1 text-right text-[11px] font-medium text-slate-400">
                  {totalItems} item
                  {totalItems !==
                  1
                    ? "s"
                    : ""}
                </div>

                {/* DISCOUNT */}

                <div className="mt-5">

                  <label className="mb-1.5 block text-xs font-bold text-slate-600">
                    Custom Discount
                  </label>

                  <div className="relative">

                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                      ৳
                    </span>

                    <input
                      type="number"
                      min="0"
                      max={
                        subtotal
                      }
                      value={
                        form.discount
                      }
                      onChange={(
                        event
                      ) =>
                        updateForm(
                          "discount",
                          Number(
                            event
                              .target
                              .value
                          )
                        )
                      }
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                    />

                  </div>

                </div>

                {/* COUPON */}

                <div className="mt-4">

                  <label className="mb-1.5 block text-xs font-bold text-slate-600">
                    Coupon Code
                  </label>

                  <div className="flex gap-2">

                    <input
                      value={
                        form.couponCode
                      }
                      onChange={(
                        event
                      ) =>
                        updateForm(
                          "couponCode",
                          event.target.value.toUpperCase()
                        )
                      }
                      placeholder="OPTIONAL"
                      className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold uppercase text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                    />

                    <button
                      type="button"
                      onClick={() => {
                        setError("");

                        if (
                          !form.couponCode.trim()
                        ) {
                          setError(
                            "Please enter a coupon code."
                          );
                          return;
                        }

                        setError(
                          "Coupon will be validated automatically when the order is created."
                        );
                      }}
                      className="h-11 shrink-0 rounded-xl border border-blue-200 bg-blue-50 px-4 text-xs font-black text-blue-600 transition hover:bg-blue-100"
                    >
                      Apply
                    </button>

                  </div>

                </div>

                {/* DELIVERY */}

                <div className="mt-5">

                  <div className="mb-2 flex items-center justify-between">

                    <label className="text-xs font-bold text-slate-600">
                      Delivery Charge
                    </label>

                    <span className="text-[10px] font-bold text-slate-400">
                      Select one
                    </span>

                  </div>

                  <div className="grid grid-cols-3 gap-2">

                    {/* INSIDE */}

                    <button
                      type="button"
                      onClick={() =>
                        updateForm(
                          "deliveryMode",
                          "inside"
                        )
                      }
                      className={`rounded-xl border px-2 py-3 text-center transition ${
                        form.deliveryMode ===
                        "inside"
                          ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                          : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300"
                      }`}
                    >
                      <Truck
                        size={
                          16
                        }
                        className="mx-auto mb-1"
                      />

                      <span className="block text-[10px] font-black">
                        Dhaka
                      </span>

                      <span className="mt-0.5 block text-xs font-black">
                        ৳80
                      </span>
                    </button>

                    {/* OUTSIDE */}

                    <button
                      type="button"
                      onClick={() =>
                        updateForm(
                          "deliveryMode",
                          "outside"
                        )
                      }
                      className={`rounded-xl border px-2 py-3 text-center transition ${
                        form.deliveryMode ===
                        "outside"
                          ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                          : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300"
                      }`}
                    >
                      <Truck
                        size={
                          16
                        }
                        className="mx-auto mb-1"
                      />

                      <span className="block text-[10px] font-black">
                        Outside
                      </span>

                      <span className="mt-0.5 block text-xs font-black">
                        ৳130
                      </span>
                    </button>

                    {/* CUSTOM */}

                    <button
                      type="button"
                      onClick={() =>
                        updateForm(
                          "deliveryMode",
                          "custom"
                        )
                      }
                      className={`rounded-xl border px-2 py-3 text-center transition ${
                        form.deliveryMode ===
                        "custom"
                          ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                          : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300"
                      }`}
                    >
                      <Wallet
                        size={
                          16
                        }
                        className="mx-auto mb-1"
                      />

                      <span className="block text-[10px] font-black">
                        Custom
                      </span>

                      <span className="mt-0.5 block text-xs font-black">
                        Set
                      </span>
                    </button>

                  </div>

                  {form.deliveryMode ===
                    "custom" && (

                    <div className="relative mt-3">

                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                        ৳
                      </span>

                      <input
                        type="number"
                        min="0"
                        value={
                          form.customDeliveryCharge
                        }
                        onChange={(
                          event
                        ) =>
                          updateForm(
                            "customDeliveryCharge",
                            Number(
                              event
                                .target
                                .value
                            )
                          )
                        }
                        placeholder="Enter custom delivery charge"
                        className="h-11 w-full rounded-xl border border-blue-200 bg-blue-50/40 pl-8 pr-3 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                      />

                    </div>
                  )}

                  <div className="mt-2 flex items-center justify-between text-[11px] font-bold">

                    <span className="text-slate-400">
                      Selected charge
                    </span>

                    <span className="text-slate-700">
                      {money(
                        deliveryCharge
                      )}
                    </span>

                  </div>

                </div>

                {/* TOTAL */}

                <div className="my-5 border-y border-slate-100 py-5">

                  <div className="flex items-end justify-between gap-4">

                    <div>

                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        Grand Total
                      </p>

                      <p className="mt-1 text-2xl font-black tracking-tight text-slate-900">
                        {money(
                          grandTotal
                        )}
                      </p>

                    </div>

                    <div className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-black text-blue-600">
                      {totalItems} pcs
                    </div>

                  </div>

                </div>

                {/* PAID */}

                <div>

                  <label className="mb-1.5 block text-xs font-bold text-slate-600">
                    Paid Amount
                  </label>

                  <div className="relative">

                    <Wallet
                      size={16}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="number"
                      min="0"
                      max={
                        grandTotal
                      }
                      value={
                        form.paidAmount
                      }
                      onChange={(
                        event
                      ) =>
                        updateForm(
                          "paidAmount",
                          Number(
                            event
                              .target
                              .value
                          )
                        )
                      }
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                    />

                  </div>

                </div>

                {/* DUE */}

                <div className="mt-4 flex items-center justify-between rounded-2xl border border-red-100 bg-red-50 px-4 py-3.5">

                  <div>

                    <p className="text-xs font-bold text-red-500">
                      Due Amount
                    </p>

                    <p className="mt-0.5 text-[11px] font-medium text-red-400">
                      Remaining payment
                    </p>

                  </div>

                  <p className="text-lg font-black text-red-600">
                    {money(
                      dueAmount
                    )}
                  </p>

                </div>

                {/* PAYMENT */}

                <div className="mt-5">

                  <label className="mb-1.5 block text-xs font-bold text-slate-600">
                    Payment Method
                  </label>

                  <div className="relative">

                    <CreditCard
                      size={16}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <select
                      value={
                        form.paymentMethod
                      }
                      onChange={(
                        event
                      ) =>
                        updateForm(
                          "paymentMethod",
                          event.target.value
                        )
                      }
                      className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-10 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                    >

                      {PAYMENT_METHODS.map(
                        (
                          method
                        ) => (

                          <option
                            key={
                              method
                            }
                            value={
                              method
                            }
                          >
                            {
                              method
                            }
                          </option>

                        )
                      )}

                    </select>

                    <ChevronDown
                      size={17}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                  </div>

                </div>

                {/* STATUS */}

                <div className="mt-4">

                  <label className="mb-1.5 block text-xs font-bold text-slate-600">
                    Order Status
                  </label>

                  <div className="relative">

                    <select
                      value={
                        form.orderStatus
                      }
                      onChange={(
                        event
                      ) =>
                        updateForm(
                          "orderStatus",
                          event.target.value
                        )
                      }
                      className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 pr-10 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                    >

                      <option value="Pending">
                        Pending
                      </option>

                      <option value="Confirmed">
                        Confirmed
                      </option>

                      <option value="Processing">
                        Processing
                      </option>

                    </select>

                    <ChevronDown
                      size={17}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                  </div>

                </div>

                {/* CREATE BUTTON */}

                <button
                  type="button"
                  onClick={
                    createOrder
                  }
                  disabled={
                    submitting ||
                    items.length ===
                      0
                  }
                  className="mt-6 flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/25 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                >

                  {submitting ? (

                    <>
                      <Loader2
                        size={
                          18
                        }
                        className="animate-spin"
                      />
                      Creating Order...
                    </>

                  ) : (

                    <>
                      <ShoppingBag
                        size={
                          18
                        }
                      />
                      Create Order
                    </>

                  )}

                </button>

                <p className="mt-3 text-center text-[11px] font-medium leading-5 text-slate-400">
                  Stock will be updated automatically after the order is created.
                </p>

              </div>
            </div>
          </aside>

        </div>

        {/* =================================================
            BOTTOM FEATURES
        ================================================= */}

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

            <div className="flex items-center gap-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <CheckCircle2
                  size={
                    18
                  }
                />
              </div>

              <div>

                <p className="text-xs font-black text-slate-800">
                  Secure Order
                </p>

                <p className="mt-0.5 text-[11px] text-slate-400">
                  Controlled admin ordering
                </p>

              </div>

            </div>

          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

            <div className="flex items-center gap-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Package
                  size={
                    18
                  }
                />
              </div>

              <div>

                <p className="text-xs font-black text-slate-800">
                  Auto Stock Update
                </p>

                <p className="mt-0.5 text-[11px] text-slate-400">
                  Stock updates automatically
                </p>

              </div>

            </div>

          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

            <div className="flex items-center gap-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <ShoppingBag
                  size={
                    18
                  }
                />
              </div>

              <div>

                <p className="text-xs font-black text-slate-800">
                  Multiple Products
                </p>

                <p className="mt-0.5 text-[11px] text-slate-400">
                  Add multiple products
                </p>

              </div>

            </div>

          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

            <div className="flex items-center gap-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Sparkles
                  size={
                    18
                  }
                />
              </div>

              <div>

                <p className="text-xs font-black text-slate-800">
                  Fast & Easy
                </p>

                <p className="mt-0.5 text-[11px] text-slate-400">
                  Create orders in seconds
                </p>

              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}