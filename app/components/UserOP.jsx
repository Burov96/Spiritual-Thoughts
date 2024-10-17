"use client";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import {randomColor} from 'randomcolor'


export default function UserOP({ id }) {
  const [userData, setUserData] = useState(null);
  const [color, setColor] = useState(randomColor());
  useEffect(() => {
    async function fetchUserOP() {
      try {
        const response = await fetch(`/api/userOP/${id}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (!response.ok) {
          throw new Error(`failed to fetch user data`);
        }
        const data = await response.json();
        setUserData(data);
        setTimeout(() => {
          setColor(data.color);
        }, 800);
      } catch (error) {
        console.error(error);
      }
    }
    if (id) {
      fetchUserOP();
    }
  }, [id]);
  return (
    (
  userData &&
      <div className=" flex italic m-2 p-1">
      <Image src={userData.profilePicture} width={32} height={32}/>
      <div className="transition-all duration-700 font-semibold capitalize mx-1 font-mono" style={{ color: color }}>
      {userData.name} 
      </div>
      <span className="text-sm font-mono">
       {`:    just thought about:`}
      </span>
      </div>
    )
);
}
