'use client'

import { useRouter } from "next/navigation";
import Loading from "../components/Loading"
import { useNotification } from "../NotificationProvider";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {ProfileForm} from "@/app/components/ProfileForm"

export default function Profile(){
  const {data:session, status} = useSession();
  const [userData, setUserData] = useState(null);
  const {showNotification} = useNotification();
  const router = useRouter();
  useEffect(() => {
  if (status==="loading"){
    return <Loading/>
  }
  if(!session){
    router.push("/login");
    showNotification("In order to access your profile, first login","failure");
  }
  else{
    fetch(`/api/profile/`)
    .then((res) => res.json())
    .then((data) => setUserData(data))
    .catch((err) => showNotification(err,"failure"));
  }},[status, session])
  return(
    <div className="profile-counter">
      <h1>Your Profile</h1>
      {userData&&
      <ProfileForm user={userData} />
      }
    </div>
  )
}