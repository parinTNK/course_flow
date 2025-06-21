"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/app/context/authContext";
import { useCustomToast } from "@/components/ui/CustomToast";
import { getBangkokISOString } from "@/lib/bangkokTime";

import BundleImage from "@/components/bundleCard/BundleImage ";
import BundleDetailSection from "@/components/bundleCard/BundleDetailSection";
import BundleCoursesSection from "@/components/bundleCard/BundleCoursesSection";
import BundleSidebar from "@/components/bundleCard/BundleSidebar";
import OtherBundlesCarousel from "@/components/bundleCard/OtherBundlesCarousel";
import BundleWishlistModal from "@/components/bundleCard/BundleWishlistModal";
import BundlePurchaseModal from "@/components/bundleCard/BundlePurchaseModal";

import LoadingSpinner from "@/app/admin/components/LoadingSpinner";
import CallToAction from "@/components/landing/CallToAction";

const BundleDetailPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const bundleId = params?.bundleId as string;

  const { user, loading } = useAuth();
  const isAuthenticated = !!user;
  const { success } = useCustomToast();

  // Bundle data state
  const [bundle, setBundle] = useState<any>(null);
  const [bundleCourses, setBundleCourses] = useState<any[]>([]);
  const [otherBundles, setOtherBundles] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(true);

  // User interaction state
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [isPurchased, setIsPurchased] = useState(false);
  const [showWishlistModal, setShowWishlistModal] = useState(false);
  const [isProcessingWishlist, setIsProcessingWishlist] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Fetch bundle data
  useEffect(() => {
    const fetchBundleData = async () => {
      if (!bundleId) return;

      setIsFetching(true);
      try {
        // Fetch bundle details
        const { data: bundleData, error: bundleError } = await supabase
          .from("bundles")
          .select("*")
          .eq("id", bundleId)
          .eq("status", "active")
          .single();

        if (bundleError) throw bundleError;
        setBundle(bundleData);

        // Fetch bundle courses (you'll need to implement this based on your schema)
        // For now, using placeholder data
        setBundleCourses([]);

        // Fetch other bundles
        const { data: otherBundlesData } = await supabase
          .from("bundles")
          .select("*")
          .eq("status", "active")
          .neq("id", bundleId)
          .limit(6);

        setOtherBundles(otherBundlesData || []);
      } catch (error) {
        console.error("Error fetching bundle data:", error);
      } finally {
        setIsFetching(false);
      }
    };

    fetchBundleData();
  }, [bundleId]);

  // Check if user has purchased bundle
  useEffect(() => {
    const checkPurchaseStatus = async () => {
      if (!user?.user_id || !bundleId) return;

      try {
        // Check if user has purchased this bundle
        // You'll need to implement this based on your payments/subscriptions schema
        setIsPurchased(false); // Placeholder
      } catch (error) {
        console.error("Error checking purchase status:", error);
      }
    };

    checkPurchaseStatus();
  }, [user, bundleId]);

  // Check if bundle is in wishlist
  useEffect(() => {
    const checkWishlistStatus = async () => {
      if (!user?.user_id || !bundleId) return;

      try {
        const { data } = await supabase
          .from("wishlist")
          .select("id")
          .eq("user_id", user.user_id)
          .eq("bundle_id", bundleId)
          .single();

        setIsWishlisted(!!data);
      } catch (error) {
        // Not in wishlist
        setIsWishlisted(false);
      }
    };

    checkWishlistStatus();
  }, [user, bundleId]);

  const handleToggleWishlist = async () => {
    if (!bundle?.id || !user?.user_id) return;

    setIsProcessingWishlist(true);
    setShowWishlistModal(false);

    try {
      if (!isWishlisted) {
        const { error } = await supabase.from("wishlist").insert({
          user_id: user.user_id,
          bundle_id: bundle.id,
          created_at: getBangkokISOString(),
        });
        if (error) throw error;
        setIsWishlisted(true);
        success("Added to Wishlist");
      } else {
        const { error } = await supabase
          .from("wishlist")
          .delete()
          .eq("user_id", user.user_id)
          .eq("bundle_id", bundle.id);
        if (error) throw error;
        setIsWishlisted(false);
        success("Removed from Wishlist");
      }
    } catch (err: any) {
      console.error("Wishlist error:", err.message);
    } finally {
      setIsProcessingWishlist(false);
    }
  };

  if (loading || isFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner text="Loading..." />
      </div>
    );
  }

  if (!bundle) {
    return <div className="text-center mt-32">Bundle not found.</div>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow container mx-auto mt-20 px-4 py-8">
        {/* Back Button */}
        <Link
          href="/course-bundle"
          className="text-blue-600 mb-6 inline-flex items-center"
        >
          <img src="/Left-Arrow.svg" alt="Back Button" className="mr-1" />
          <span>Back</span>
        </Link>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="md:col-span-2">
            <BundleImage
              imageUrl={bundle?.image_url}
              bundleName={bundle?.name}
            />
            <BundleDetailSection detail={bundle?.description} />
            <BundleCoursesSection
              courses={bundleCourses}
              isPurchased={isPurchased}
            />
          </div>

          <div className="md:col-span-1">
            <BundleSidebar
              isAuthenticated={isAuthenticated}
              isPurchased={isPurchased}
              isWishlisted={isWishlisted}
              bundleId={bundle?.id}
              bundleName={bundle?.name}
              description={bundle?.description}
              price={bundle?.price}
              coursesCount={bundleCourses.length}
              totalLearningTime={bundleCourses.reduce(
                (total, course) => total + (course.total_learning_time || 0),
                0
              )}
              onPurchaseClick={() => setShowPurchaseModal(true)}
              onWishlistClick={() => {
                if (!isProcessingWishlist) setShowWishlistModal(true);
              }}
            />
          </div>
        </div>

        {!isPurchased && <OtherBundlesCarousel bundles={otherBundles} />}
      </main>

      <BundleWishlistModal
        isOpen={showWishlistModal}
        bundleName={bundle?.name}
        isWishlisted={isWishlisted}
        onClose={() => setShowWishlistModal(false)}
        onConfirm={handleToggleWishlist}
      />

      <BundlePurchaseModal
        isOpen={showPurchaseModal}
        bundleName={bundle?.name}
        onClose={() => setShowPurchaseModal(false)}
        onConfirm={() => {
          setShowPurchaseModal(false);
          router.push(`/payment/${bundle?.id}`);
        }}
      />

      {!isAuthenticated && <CallToAction />}
    </div>
  );
};

export default BundleDetailPage;
