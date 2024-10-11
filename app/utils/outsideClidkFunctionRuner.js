import { useEffect } from "react";

export function useOutsideClick(ref, callback, exception, exception2) {
  let e;
  useEffect(() => {
    function handleClickOutside(event) {
      e = event.target;
      if (!exception?.current?.contains(e) && !exception2?.current?.contains(e)) {
        if (ref.current && !ref.current.contains(e)){
          callback(false);
        } else {
          callback(true);
        }
      }
      if (exception2?.current?.contains(e)){
        setTimeout(() => {
            callback(true);
          }, 70);
        }
      

    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref, callback]);
}