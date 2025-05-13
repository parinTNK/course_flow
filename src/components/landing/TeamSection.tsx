"use client";

import React from "react";
import Image from "next/image";

const teamMembers = [
  {
    name: "Jane Cooper",
    title: "UX/UI Designer",
    image: "/img/Teacher01.png",
  },
  {
    name: "Esther Howard",
    title: "Program Manager",
    image: "/img/Teacher02.png",
  },
  {
    name: "Brooklyn Simmons",
    title: "Software Engineer",
    image: "/img/Teacher03.png",
  },
];

const TeamSection: React.FC = () => {
  return (
    <section className="bg-white py-20 px-6">
      <div className="max-w-screen-xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-12">
          Our Professional Instructors
        </h2>

        <div className="flex flex-col md:flex-row justify-center items-center gap-12">
          {teamMembers.map((member, index) => (
            <div key={index} className="text-center">
              <Image
                src={member.image}
                alt={member.name}
                width={256}
                height={256}
                className="object-cover rounded-lg mx-auto"
              />
              <h3 className="mt-4 text-lg font-semibold text-black">
                {member.name}
              </h3>
              <p className="text-blue-500 text-sm">{member.title}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TeamSection;
