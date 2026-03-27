"use client";

import RecentSearch from "@/components/ecommerce/RecentSearch";
import RecentProducts from "@/components/ecommerce/RecentProducts";

export default function ProductsPage() {

  return (
    <div className="p-5 flex flex-col gap-5">
      <RecentSearch />
      <RecentProducts />
    </div>
  );
}