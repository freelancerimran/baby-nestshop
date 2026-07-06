import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 py-16">

        {/* Hero Section */}
        <div className="mb-16 text-center">
          <span className="mb-4 inline-block rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-700">
            About Baby Nest
          </span>

          <h1 className="mb-4 text-5xl font-bold text-gray-900">
            Helping Children Learn Through Play
          </h1>

          <p className="mx-auto max-w-3xl text-lg text-gray-600">
            Baby Nest is dedicated to bringing educational books, activity
            books, busy books, puzzles, and learning toys that make childhood
            more fun, creative, and meaningful.
          </p>
        </div>

        {/* About Section */}
        <div className="mb-16 rounded-3xl bg-white p-10 shadow-sm">
          <h2 className="mb-6 text-3xl font-bold">
            Who We Are
          </h2>

          <p className="mb-4 text-gray-600 leading-8">
            Baby Nest is a Bangladesh-based educational brand focused on
            helping children develop essential skills through engaging learning
            experiences. We carefully select products that encourage creativity,
            problem-solving, early childhood development, and independent learning.
          </p>

          <p className="text-gray-600 leading-8">
            Our goal is simple: provide parents with high-quality educational
            products that support their child's growth while making learning fun
            and enjoyable.
          </p>
        </div>

        {/* Mission & Vision */}
        <div className="mb-16 grid gap-8 md:grid-cols-2">

          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <div className="mb-4 text-4xl">🎯</div>

            <h3 className="mb-4 text-2xl font-bold">
              Our Mission
            </h3>

            <p className="text-gray-600 leading-7">
              To provide educational products that help children learn,
              explore, and grow while creating meaningful learning experiences
              for families across Bangladesh.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <div className="mb-4 text-4xl">🚀</div>

            <h3 className="mb-4 text-2xl font-bold">
              Our Vision
            </h3>

            <p className="text-gray-600 leading-7">
              To become the most trusted destination for educational books
              and learning toys, helping every child discover the joy of learning.
            </p>
          </div>

        </div>

        {/* Why Choose Us */}
        <div className="mb-16">
          <h2 className="mb-10 text-center text-3xl font-bold">
            Why Parents Choose Baby Nest
          </h2>

          <div className="grid gap-6 md:grid-cols-3">

            <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
              <div className="mb-4 text-4xl">📚</div>

              <h3 className="mb-3 font-semibold">
                Educational Products
              </h3>

              <p className="text-gray-600">
                Carefully selected books and learning toys designed to support
                child development.
              </p>
            </div>

            <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
              <div className="mb-4 text-4xl">⭐</div>

              <h3 className="mb-3 font-semibold">
                Trusted Quality
              </h3>

              <p className="text-gray-600">
                We focus on products that offer both educational value and
                long-lasting quality.
              </p>
            </div>

            <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
              <div className="mb-4 text-4xl">❤️</div>

              <h3 className="mb-3 font-semibold">
                Parent Approved
              </h3>

              <p className="text-gray-600">
                Thousands of parents trust educational products that make
                learning enjoyable.
              </p>
            </div>

          </div>
        </div>

        {/* Core Values */}
        <div className="mb-16">
          <h2 className="mb-10 text-center text-3xl font-bold">
            Our Core Values
          </h2>

          <div className="grid gap-6 md:grid-cols-4">

            <div className="rounded-3xl bg-white p-6 text-center shadow-sm">
              <div className="mb-3 text-3xl">🧠</div>
              <h3 className="font-semibold">Learning</h3>
            </div>

            <div className="rounded-3xl bg-white p-6 text-center shadow-sm">
              <div className="mb-3 text-3xl">🎨</div>
              <h3 className="font-semibold">Creativity</h3>
            </div>

            <div className="rounded-3xl bg-white p-6 text-center shadow-sm">
              <div className="mb-3 text-3xl">🌱</div>
              <h3 className="font-semibold">Growth</h3>
            </div>

            <div className="rounded-3xl bg-white p-6 text-center shadow-sm">
              <div className="mb-3 text-3xl">🤝</div>
              <h3 className="font-semibold">Trust</h3>
            </div>

          </div>
        </div>

        {/* CTA Section */}
        <div className="rounded-3xl bg-green-600 p-12 text-center text-white">

          <h2 className="mb-4 text-4xl font-bold">
            Start Your Child's Learning Journey Today
          </h2>

          <p className="mb-8 text-lg text-green-100">
            Explore educational books and learning toys designed to inspire
            curiosity, creativity, and growth.
          </p>

          <Link
            href="/shop"
            className="inline-flex rounded-xl bg-white px-8 py-4 font-semibold text-green-600"
          >
            Explore Products
          </Link>

        </div>

      </div>
    </div>
  );
}