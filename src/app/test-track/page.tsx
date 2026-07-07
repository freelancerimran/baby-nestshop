export default async function TestTrackPage() {
  const response = await fetch(
    "http://localhost:3000/api/track-order",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orderId: "BN-1782933340133",
        phone: "1877764185",
      }),
      cache: "no-store",
    }
  );

  const data = await response.json();

  return (
    <div className="p-10">
      <h1 className="mb-4 text-2xl font-bold">
        Track Order API Test
      </h1>

      <pre className="overflow-auto rounded-lg bg-gray-100 p-4">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}