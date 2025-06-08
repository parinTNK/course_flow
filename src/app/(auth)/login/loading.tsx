'use client';

import LoadingSpinner from "../../admin/components/LoadingSpinner";

export default function LoadingLogin() {
  return <div>
    <LoadingSpinner text="loading..." className="mt-40" size="lg" />
  </div>;
}