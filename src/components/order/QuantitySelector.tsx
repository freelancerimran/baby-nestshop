type QuantitySelectorProps = {
  quantity: number;
  availableStock: number;
  onIncrease: () => void;
  onDecrease: () => void;
};

export default function QuantitySelector({
  quantity,
  availableStock,
  onIncrease,
  onDecrease,
}: QuantitySelectorProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">

      <label className="mb-2 block text-sm font-medium text-gray-700">
        পরিমাণ (Quantity)
      </label>

      <div className="flex items-center gap-3">

        <button
          type="button"
          onClick={onDecrease}
          disabled={quantity <= 1}
          className="flex h-10 w-10 items-center justify-center rounded-xl border disabled:opacity-50"
        >
          −
        </button>

        <div className="min-w-[70px] text-center text-lg font-bold">
          {quantity}
        </div>

        <button
          type="button"
          onClick={onIncrease}
          disabled={quantity >= availableStock}
          className="flex h-10 w-10 items-center justify-center rounded-xl border disabled:opacity-50"
        >
          +
        </button>

      </div>

      <p className="mt-3 text-sm text-gray-500">
        Available Stock: {availableStock}
      </p>

    </div>
  );
}