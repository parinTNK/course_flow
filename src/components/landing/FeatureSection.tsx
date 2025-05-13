"use client";

import React from "react";
import { ShieldCheck, Users, Heart } from "lucide-react";
import Image from "next/image";

const features1 = [
  {
    icon: ShieldCheck,
    title: "Secure & Easy",
    desc: "A safe, simple, and intuitive experience.",
  },
  {
    icon: Heart,
    title: "Supports All Students",
    desc: "Inclusive and engaging tools for every learner.",
  },
];

const features2 = [
  {
    icon: Users,
    title: "Purely Collaborative",
    desc: "Work together with teachers and peers in real-time.",
  },
  {
    icon: Heart,
    title: "Community Driven",
    desc: "Create meaningful relationships through learning.",
  },
];

const FeatureSection: React.FC = () => {
  return (
    <section className="bg-white py-20 px-6">
      {/* Section 1 */}
      <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row items-center gap-12 mb-20">
        <Image src="/img/feature01.png" alt="Feature 1" width={600} height={400} className="w-full md:w-1/2 rounded-xl" />
        <div className="w-full md:w-1/2 space-y-6">
          <h2 className="text-2xl md:text-3xl font-semibold text-[#1A1A1A]">
            Learning experience enhanced with new technologies
          </h2>
          {features1.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-4">
              <div className="p-2 rounded-full border border-dashed border-[#93C5FD]">
                <Icon className="text-[#60A5FA] w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-[#1A1A1A]">{title}</h3>
                <p className="text-[#6B7280] text-sm">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2 */}
      <div className="max-w-screen-xl mx-auto flex flex-col-reverse md:flex-row items-center gap-12">
        <div className="w-full md:w-1/2 space-y-6">
          <h2 className="text-2xl md:text-3xl font-semibold text-[#1A1A1A]">
            Interactions between tutors and learners
          </h2>
          {features2.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-4">
              <div className="p-2 rounded-full border border-dashed border-[#93C5FD]">
                <Icon className="text-[#60A5FA] w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-[#1A1A1A]">{title}</h3>
                <p className="text-[#6B7280] text-sm">{desc}</p>
              </div>
            </div>
          ))}
        </div>
        <Image src="/img/feature02.png" alt="Feature 2" width={600} height={400} className="w-full md:w-1/2 rounded-xl" />
      </div>
    </section>
  );
};

export default FeatureSection;
