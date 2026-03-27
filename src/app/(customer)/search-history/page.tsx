"use client";

import { useState } from "react";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${query}`);
      const data = await res.json();
      setProducts(data.products || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div>
      {/* Search Section */}
      <div className="flex flex-col items-center mt-20">
        <h1 className="text-3xl font-bold mb-6">
          Find Best Products with AI 🤖
        </h1>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search products (e.g. iPhone, shoes)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border p-3 w-80 rounded"
          />

          <button
            onClick={handleSearch}
            className="bg-blue-500 text-white px-5 py-3 rounded"
          >
            Search
          </button>
        </div>
      </div>

      {/* Results Section */}
      <div className="mt-10 px-10">
        {query && (
          <h2 className="text-2xl mb-4">
            Results for "{query}"
          </h2>
        )}

        {loading && <p>Loading products...</p>}

        {!loading && products.length === 0 && query && (
          <p>No products found</p>
        )}

        <div className="grid grid-cols-4 gap-4">
          {products.map((p, i) => (
            <div key={i} className="border p-3 rounded hover:shadow">
              <img
                src={p.image}
                alt={p.title}
                className="h-40 w-full object-cover mb-2"
              />

              <h3 className="font-semibold text-sm line-clamp-2">
                {p.title}
              </h3>

              <p className="text-green-600 font-bold">
                ₹{p.price}
              </p>

              <a
                href={p.link}
                target="_blank"
                className="text-blue-500 text-sm"
              >
                View Product →
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}