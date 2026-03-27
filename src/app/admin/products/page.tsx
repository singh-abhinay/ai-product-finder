"use client";

import { useState, useMemo } from "react";
import ProductCard from "@/components/common/ProductCard";
import ProductFilters from "@/components/common/ProductFilters";

const productsData = [
  { id: "1", name: "iPhone 15", price: 79999, category: "mobile", image: "/images/products/p1.jpg" },
  { id: "2", name: "Samsung S24", price: 69999, category: "mobile", image: "/images/products/p2.jpg" },
  { id: "3", name: "MacBook Air", price: 99999, category: "laptop", image: "/images/products/p3.jpg" },
  { id: "4", name: "Dell XPS", price: 49999, category: "laptop", image: "/images/products/p4.jpg" },
];

export default function ProductsPage() {
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    price: "",
    sort: "",
  });

  const filteredProducts = useMemo(() => {
    let data = [...productsData];

    if (filters.search) {
      data = data.filter((p) =>
        p.name.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    if (filters.category) {
      data = data.filter((p) => p.category === filters.category);
    }

    if (filters.price === "low") {
      data = data.filter((p) => p.price < 50000);
    } else if (filters.price === "high") {
      data = data.filter((p) => p.price >= 50000);
    }

    if (filters.sort === "lowToHigh") {
      data.sort((a, b) => a.price - b.price);
    } else if (filters.sort === "highToLow") {
      data.sort((a, b) => b.price - a.price);
    }

    return data;
  }, [filters]);

  return (
    <div className="p-5">
      <h1 className="mb-5 text-2xl font-semibold">Products</h1>

      <ProductFilters filters={filters} setFilters={setFilters} />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <p className="mt-5 text-gray-500">No products found</p>
      )}
    </div>
  );
}