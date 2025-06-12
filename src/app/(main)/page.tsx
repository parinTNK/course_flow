"use client"
import React, { useState } from "react"

import { ButtonT } from "@/components/ui/ButtonT";
import DropdownSelect, {DropdownOption} from "@/components/ui/DropdownSelect"
// import DatePicker from "@/components/ui/DatePicker"
import NavBar from "@/components/nav"
import Footer from "@/components/footer"

function page() {
  const [selected, setSelected] = useState<string | undefined>(undefined);

  const mockUser = {
    name: "John Donut",
    avatarUrl: "https://i.pravatar.cc/150?img=45",
  };
  
  const fruitOptions: DropdownOption[] = [
    { label: "Apple", value: "apple" },
    { label: "Banana", value: "banana" },
    { label: "Mango", value: "mango" },
    { label: "Grape", value: "grape" },
  ]

  return (
    <>
    {/* <NavBar user={null} /> */}

    <Footer />

    <div className="flex flex-row justify-center">
      <div className="border-2 border-red-500 w-1/2 p-10 m-5 rounded-3xl">
         <h1 className="text-black font-semibold text-2xl mb-10 underline underline-offset-6">Color</h1>
        <div className="flex flex-col gap-4 justify-center items-center bg-white ">
          <div className="rounded-full bg-blue-200 font-bold text-2xl text-black w-[300px] h-[100px] justify-center items-center flex">
            blue-200
          </div>
          <div className="rounded-full bg-[var(--blue-200)] font-bold text-2xl text-black w-[300px] h-[100px] justify-center items-center flex">
            var blue-200
          </div>
          <div className="bg-linear1  rounded-full font-bold text-2xl text-black w-[300px] h-[100px] justify-center items-center flex">
            Linear Gradient
          </div>
          <div className="bg-linear2 rounded-full font-bold text-2xl text-black w-[300px] h-[100px] justify-center items-center flex">
            Linear Gradient
          </div>
        </div>
        <div className="box-shadow2 my-10 rounded-xl font-bold text-2xl text-black w-[300px] h-[100px] justify-center items-center flex">
          Box Shadow2
        </div>
        <div className="box-shadow1 rounded-xl font-bold text-2xl text-black w-[300px] h-[100px] justify-center items-center flex">
          Box Shadow1
        </div>
      </div>
      <div className="border-2 border-red-500 w-1/2 p-10 m-5 rounded-3xl">
         <h1 className="text-black font-semibold text-2xl mb-10 underline underline-offset-6">Font</h1>
        <div className="flex flex-col justify-center items-start bg-white pb-10 gap-10">
        <DropdownSelect
            options={fruitOptions}
            placeholder="Select a fruit"
            value={selected}
            onValueChange={(val) => setSelected(val)}
          />
            {/* <DatePicker 
              isOpen={true} 
              toggle={() => console.log("Toggle DatePicker")} 
              onConfirm={(date) => console.log("Selected date:", date)} 
            /> */}
            <h1 className="text-h1">Headline1</h1>
            <h2 className="text-h2">Headline2</h2>
            <h3 className="text-h3">Headline3</h3>
            <p className="text-b1">Body1</p>
            <p className="text-b2">Body2</p>
            <p className="text-b3">Body3</p>
            <p className="text-b4">Body4</p>
        </div>
      </div>

    </div>
    </>
  )
}

export default page