import * as React from "react";
import Autoplay from "embla-carousel-autoplay";

import { Card } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";


const testimonials = [
{
  name: "Lena Torres",
  role: "Instructor",
  message:
    "Creating and sharing lessons has never been easier. I love how responsive and flexible the platform is.",
  image: "https://i.pravatar.cc/150?img=47",
},
{
  name: "Noah Bennett",
  role: "Student",
  message:
    "This platform gave me the confidence to pursue topics I once thought were too hard. Now I enjoy learning every day.",
  image: "https://i.pravatar.cc/150?img=48",
},
{
  name: "Priya Mehra",
  role: "Mentor",
  message:
    "Helping students feels more impactful when the tools are this well-designed. Highly recommended.",
  image: "https://i.pravatar.cc/150?img=49",
},
{
  name: "Marco Silva",
  role: "Student",
  message:
    "The bite-sized lessons and interactive features kept me hooked. Learning has never been this fun.",
  image: "https://i.pravatar.cc/150?img=50",
},
{
  name: "Chloe Andersen",
  role: "Student",
  message:
    "I love how the platform adapts to my pace. It's like having a personal tutor available anytime.",
  image: "https://i.pravatar.cc/150?img=51",
},
{
  name: "Jinwoo Park",
  role: "Student",
  message:
    "From the first click, everything felt intuitive. I’ve finally found a place where I enjoy studying.",
  image: "https://i.pravatar.cc/150?img=52",
}

];

const TestimonialSection: React.FC = () => {
  const plugin = React.useRef(
    Autoplay({ delay: 3000, stopOnInteraction: true })
  );

  return (
    <section className="bg-white overflow-hidden">
      <div className="max-w-screen-xl mx-auto px-[16px] sm:px-[80px] my-[64px] lg:my-[160px]">
        <h2 className="text-[24px] md:text-[36px] font-medium text-center text-black mb-[40px]">
          Our Graduates
        </h2>

        <Carousel
          plugins={[plugin.current]}
          className="w-full"
          onMouseEnter={plugin.current.stop}
          onMouseLeave={plugin.current.reset}
        >
          <CarouselContent>
            {testimonials.map((item, index) => (
              <CarouselItem
                key={index}
                className="md:basis-2/3 lg:basis-1/2  py-[24px]"
              >
                <Card className="flex flex-col md:flex-row items-center bg-[#EAF1FF] rounded-xl shadow-md p-[24px]">
                  {/* Avatar */}
                  <div className="flex-shrink-0 w-[96px] h-[96px] md:w-[128px] md:h-[128px] rounded-full overflow-hidden border-[4px] border-white shadow-md mb-[16px] md:mb-0 md:mr-[24px]">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Testimonial Content */}
                  <div className="text-left">
                    <p className="text-[#1E293B] mb-[16px] text-[14px] leading-relaxed">
                      <span className="text-[30px] text-[#94A3B8]">“</span>
                      {item.message}
                      <span className="text-[30px] text-[#94A3B8]">”</span>
                    </p>
                    <p className="text-[#2F5FAC] font-semibold">{item.name}</p>
                    <p className="text-[14px] text-[#64748B]">{item.role}</p>
                  </div>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>

          {/* Navigation Buttons */}
          <div className="flex justify-center mt-[24px] gap-[16px]">
            <CarouselPrevious className="bg-white text-[#2F5FAC] hover:bg-[#E2E8F0]" />
            <CarouselNext className="bg-white text-[#2F5FAC] hover:bg-[#E2E8F0]" />
          </div>
        </Carousel>
      </div>
    </section>
  );
};

export default TestimonialSection;
