"use client";

import React, { useState, useEffect } from "react";
import BundleCard from "@/components/bundleCard/BundleCard";
import axios from "axios";
import type { Bundle } from "@/types/bundle";
import { useAuth } from "@/app/context/authContext";
import LoadingSpinner from "../../admin/components/LoadingSpinner";
import { AlertCircle } from "lucide-react";
import Pagination from "@/app/admin/components/Pagination";
import BackgroundSVGs from "@/components/BackgroundSVGs";

const MyBundles: React.FC = () => {
  const [tab, setTab] = useState<"all" | "purchased" | "wishlist">("all");
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(6);

  // Count for all tabs
  const [allBundlesCount, setAllBundlesCount] = useState(0);
  const [purchasedCount, setPurchasedCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!user?.user_id) {
      setBundles([]);
      return;
    }

    const fetchBundles = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(
          `/api/users/${user?.user_id}/bundles?page=${currentPage}&limit=${limit}&tab=${tab}`
        );
        setBundles(res.data.data);
        setTotalPages(res.data.pagination.totalPages);
        setAllBundlesCount(res.data.pagination.allCount || 0);
        setPurchasedCount(res.data.pagination.purchasedCount || 0);
        setWishlistCount(res.data.pagination.wishlistCount || 0);
      } catch (err: any) {
        setError(err.message || "Failed to fetch bundles");
      } finally {
        setLoading(false);
      }
    };
    fetchBundles();
  }, [user?.user_id, authLoading, currentPage, limit, tab]);

  const handleTabChange = (newTab: "all" | "purchased" | "wishlist") => {
    setTab(newTab);
    setCurrentPage(1);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner text="Loading..." className="" size="md" />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <BackgroundSVGs />
      <main className="flex-1 pt-30">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col gap-8 max-w-6xl mx-auto">
            {/* Tabs */}
            <div className="w-full">
              <div className="flex flex-col w-full max-w-md mx-auto gap-10">
                <h1 className="text-center text-2xl font-semibold">
                  My Bundles
                </h1>
                <div className="flex items-center justify-center gap-6">
                  <button
                    className={`pb-2 font-semibold border-b-2 cursor-pointer ${
                      tab === "all"
                        ? "border-black"
                        : "border-transparent text-gray-400"
                    }`}
                    onClick={() => handleTabChange("all")}
                  >
                    All Bundles
                  </button>
                  <button
                    className={`pb-2 font-semibold border-b-2 cursor-pointer ${
                      tab === "purchased"
                        ? "border-black"
                        : "border-transparent text-gray-400"
                    }`}
                    onClick={() => handleTabChange("purchased")}
                  >
                    Purchased
                  </button>
                  <button
                    className={`pb-2 font-semibold border-b-2 cursor-pointer ${
                      tab === "wishlist"
                        ? "border-black"
                        : "border-transparent text-gray-400"
                    }`}
                    onClick={() => handleTabChange("wishlist")}
                  >
                    Wishlist
                  </button>
                </div>
              </div>
            </div>
            {/* Main Content: Sidebar + Grid */}
            <div className="flex flex-col md:flex-row gap-8 w-full">
              {/* Sidebar */}
              <Sidebar
                name={user?.full_name}
                avatarUrl={user?.profile_picture}
                allBundlesCount={allBundlesCount}
                purchasedCount={purchasedCount}
                wishlistCount={wishlistCount}
                variant="desktop"
              />
              {/* Bundles Grid */}
              <section className="w-full md:w-3/4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {loading ? (
                    <div className="col-span-2 flex flex-col items-center justify-center py-20">
                      <LoadingSpinner
                        text="Loading bundles..."
                        className=""
                        size="md"
                      />
                    </div>
                  ) : error ? (
                    <div className="col-span-2 flex flex-col items-center justify-center py-20">
                      <div className="bg-red-50 border border-red-200 rounded-lg px-6 py-8 flex flex-col items-center shadow-sm">
                        <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
                        <span className="text-red-600 font-semibold text-lg mb-1">
                          Unable to load your bundles
                        </span>
                        <span className="text-gray-500 text-sm text-center">
                          {error}
                        </span>
                      </div>
                    </div>
                  ) : bundles.length === 0 ? (
                    <div className="col-span-2 text-center text-gray-400 py-20">
                      No bundles found.
                    </div>
                  ) : (
                    bundles.map((bundle) => (
                      <BundleCard key={bundle.id} bundle={bundle} />
                    ))
                  )}
                </div>
                {/* Pagination */}
                {!loading && !error && bundles.length > 0 && (
                  <div className="mt-8">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      </main>
      <div className="block md:hidden">
        <Sidebar
          name={user?.full_name}
          avatarUrl={user?.profile_picture}
          allBundlesCount={allBundlesCount}
          purchasedCount={purchasedCount}
          wishlistCount={wishlistCount}
          variant="mobile"
        />
      </div>
    </div>
  );
};

export default MyBundles;

const Sidebar: React.FC<{
  name: string | undefined;
  avatarUrl: string | undefined;
  allBundlesCount: number | undefined;
  purchasedCount: number | undefined;
  wishlistCount: number | undefined;
  variant: "desktop" | "mobile";
}> = ({
  name,
  avatarUrl,
  allBundlesCount,
  purchasedCount,
  wishlistCount,
  variant,
}) => {
  if (variant === "desktop") {
    return (
      <aside className="hidden md:flex w-full md:w-1/3 flex-col items-center">
        <div className="bg-white rounded-xl shadow p-6 w-full flex flex-col items-center sticky top-24">
          <div className="w-[120px] h-[120px] rounded-full overflow-hidden flex items-center justify-center">
            <img src={avatarUrl} alt="Profile" className="w-full h-full" />
          </div>
          <h2 className="mt-4 text-xl text-gray-800">{name}</h2>
          <div className="flex justify-between w-full mt-6 gap-2">
            <div className="flex flex-col bg-gray-200 gap-4 p-4 rounded-[8px] w-1/3">
              <div className="text-sm text-gray-700">All Bundles</div>
              <div className="text-xl font-bold">{allBundlesCount}</div>
            </div>
            <div className="flex flex-col bg-gray-200 gap-4 p-4 rounded-[8px] w-1/3">
              <div className="text-sm text-gray-700">Purchased</div>
              <div className="text-xl font-bold">{purchasedCount}</div>
            </div>
            <div className="flex flex-col bg-gray-200 gap-4 p-4 rounded-[8px] w-1/3">
              <div className="text-sm text-gray-700">Wishlist</div>
              <div className="text-xl font-bold">{wishlistCount}</div>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  // mobile
  return (
    <aside className="w-full flex flex-col items-center md:hidden">
      <div className="bg-white shadow p-4 w-full">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-[40px] h-[40px] rounded-full overflow-hidden flex items-center justify-center">
            <img src={avatarUrl} alt="Profile" className="w-full h-full" />
          </div>
          <span className="text-[17px] font-medium text-[#444]">{name}</span>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center justify-between bg-gray-100 rounded-lg px-3 py-2 flex-1">
            <span className="text-xs text-gray-400">All Bundles</span>
            <span className="text-lg font-bold text-gray-700">
              {allBundlesCount}
            </span>
          </div>
          <div className="flex items-center justify-between bg-gray-100 rounded-lg px-3 py-2 flex-1">
            <span className="text-xs text-gray-400">Purchased</span>
            <span className="text-lg font-bold text-gray-700">
              {purchasedCount}
            </span>
          </div>
          <div className="flex items-center justify-between bg-gray-100 rounded-lg px-3 py-2 flex-1">
            <span className="text-xs text-gray-400">Wishlist</span>
            <span className="text-lg font-bold text-gray-700">
              {wishlistCount}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
