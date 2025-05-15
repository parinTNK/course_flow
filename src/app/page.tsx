"use client";

import React, { useState } from "react";
import NavBar from "@/components/nav";
import HeroSection from "@/components/landing/HeroSection";
import FeatureSection from "@/components/landing/FeatureSection";
import TeamSection from "@/components/landing/TeamSection";
import TestimonialSection from "@/components/landing/TestimonialSection";
import CallToAction from "@/components/landing/CallToAction";
import Footer from "@/components/footer";

function Home() {
  return (
    <>
      <NavBar />
      <HeroSection />
      <FeatureSection />
      <TeamSection />
      <TestimonialSection />
      <CallToAction />
      <Footer />
    </>
  );
}

export default Home;