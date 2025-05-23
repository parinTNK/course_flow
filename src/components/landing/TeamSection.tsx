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
		<section className="bg-white px-[16px] sm:px-[80px] lg:px-[160px]">
			<div className="max-w-screen-xl mx-auto text-center">
				<h2 className="text-[24px] md:text-[36px] font-medium mb-[24px]">
					Our Professional Instructors
				</h2>

				<div className="flex flex-col md:flex-row justify-center items-center gap-[48px]">
					{teamMembers.map((member, index) => (
						<div key={index} className="text-center">
							<Image
								src={member.image}
								alt={member.name}
								width={357}
								height={420}
								className="object-cover rounded-lg mx-auto w-[342px] h-[403px] md:w-[357px] md:h-[420px]"
							/>
							<h3 className="mt-[16px] text-[20px] md:text-[24px] font-normal md:font-medium text-black">
								{member.name}
							</h3>
							<p className="text-blue-400 text-[16px] font-normal">
								{member.title}
							</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
};

export default TeamSection;
