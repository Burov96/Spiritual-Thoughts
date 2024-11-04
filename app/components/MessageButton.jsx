"use client";
import { useNotification } from "../NotificationProvider";
import Image from "next/image";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loading } from "./Loading";

export default function MessageButton({ senderId, receiverId }) {
  const { showNotification } = useNotification();
  const [form, setForm] = useState(false);
  const [text, setText] = useState("");
  const receiverIdInt = receiverId * 1;

  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch("/api/messages/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ receiverIdInt, senderId, text }),
      });
      if (!response.ok) {
        throw new Error("Failed to send message");
      }
      const data = await response.json();
      console.log("Message sent: ", data);
      showNotification("Message sent:", "success");
    } catch (error) {
      console.error(error);
      showNotification("Message have not been sent!", "failure");
    } finally {
      setIsLoading(false);
      setText("");
      setForm(false);
    }
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
              alt="message"
              height={60}
              width={60}
              onClick={handleMessage}
              className={`px-4 py-2 rounded bg-blue-500 text-white`}
            />
          </motion.div>
        ) : (
          !isLoading?(<motion.div
            key="form"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <form className="flex flex-col" onSubmit={sendMessage}>
              <textarea
                rows={3}
                className="border rounded p-2 resize-none"
                maxLength={500}
                type="text"
                value={text}
                required={true}
                placeholder="Type your message..."
                onChange={(e) => setText(e.target.value)}
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
                  disabled={!text.trim()}
                  className={`p-1 rounded ${
                    !text.trim() ? "bg-blue-300" : "bg-blue-500"
                  }`}
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
          </motion.div>)
        :(<motion.div
          key="loadingScreen"
          className=" flex justify-center align-middle w-1 h-0 "
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
        ><Loading /></motion.div>)
        )}
      </AnimatePresence>
    </div>
  );
}
