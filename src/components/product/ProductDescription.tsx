type Props = {
  description: string;
};

export default function ProductDescription({
  description,
}: Props) {
  return (
    <section className="mt-6 md:mt-8 rounded-3xl border border-gray-200 bg-white p-5 md:p-6 shadow-sm">

      <h2 className="mb-6 text-2xl md:text-3xl font-bold text-gray-900">
        Product Description
      </h2>

      <div
        className="
          whitespace-pre-line
          text-base
          md:text-lg
          leading-7
          text-gray-700
        "
      >
        {description}
      </div>

    </section>
  );
}