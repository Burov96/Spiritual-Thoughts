"use client";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import {randomColor} from 'randomcolor'
import { useSession } from "next-auth/react";


export default function UserOP({ id }) {
  const [userData, setUserData] = useState(null);
  const [color, setColor] = useState(randomColor());
  const [randomized, setRandomized] = useState(false)
  const loggedInUser = useSession()
   
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
      } catch (error) {
        console.error(error);
      }
    }
    if (id) {
      fetchUserOP();
    }
  }, [id]);

  useEffect(() => {
    if(loggedInUser.data.user.name === userData?.name) {
      setInterval(() => {
        setColor(randomColor());
        setRandomized((prev)=>!prev);
      }, 7000);
    }
      
      setTimeout(() => {
        setColor(userData?.color);
      }, 1000);
    }, [userData, randomized])
  return (
    (
  userData &&
      <div className=" flex italic m-2 p-1">
      <Image src={userData.profilePicture ||"/images/user.png" || "https://i.ibb.co/Qv0nQSg/user.png"} width={32} height={32}/>
      <div className="transition-all duration-500 font-semibold capitalize mx-1 font-mono" style={{ color: color }}>
      {userData.name} 
      </div>
      <span className="text-sm font-mono">
       {`:    just thought about:`}
      </span>
      </div>
    )
);
}
