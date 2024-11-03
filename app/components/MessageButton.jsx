"use client";
import { useSession } from "next-auth/react";
import { useNotification } from "../NotificationProvider";
import Image from "next/image";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function MessageButton({ userId }) {
  const { showNotification } = useNotification();
  const [form, setForm] = useState(false);
  const [text, setText] = useState('');

  const handleTextChange = (e) => {
    setText(e.target.value);
    console.log("current text is " + e.target.value);
  };

  const handleSend = (e) => {
    e.preventDefault(); 
    setText('');
    setForm(false);
    showNotification("Messaging will be supported soon!", "warning");
  };
  
  const handleMessage = () => {
    setForm(!form);
  };

  return (
    <div className="relative text-black">
      <AnimatePresence mode="wait">
        {!form ? (
          <motion.div
            key="message"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <Image
              src={"/images/message.svg"}
              height={60}
              width={60}
              onClick={handleMessage}
              className={`px-4 py-2 rounded bg-blue-500 text-white`}
            />
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <form className="flex flex-col" onSubmit={handleSend}>
              <input 
                type="text" 
                value={text}
                required={true}
                onChange={handleTextChange}
                className="border rounded p-2"
              />
              <div className="flex flex-row gap-2 justify-evenly mt-5">
                <button 
                  type="button" 
                  onClick={handleMessage}
                  className="p-1 rounded bg-blue-500"
                >
                  <Image
                    src={"/images/cancel.svg"}
                    height={40}
                    width={40}
                    alt="Cancel"
                    className="text-white"
                  />
                </button>
                <button 
                  type="submit" 
                  className="p-1 rounded bg-blue-500"
                >
                  <Image
                    src={"/images/send.svg"}
                    height={40}
                    width={40}
                    alt="Send"
                    className="text-white"
                  />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
