'use client'
import React, { useReducer } from 'react'

interface Action{
    type:"increment"|"decrement",
}

interface State{
    count:number,
    error:string|null|boolean
}

function page() {
function reducer(state:State, action:Action){
    const {type}=action;
    console.log(type)
    switch(type){
        case "increment":{
            const newCount = state.count + 1;
            if(newCount>10){
                return { ...state,error:"Count is too high!"}
            }
            return{ ...state,count:state.count+1, error:false}
        }
        case "decrement":{
            const newCount = state.count - 1;
            if(newCount<0){
                return { ...state,error:"Count is too low!"}
            }
            return { ...state,count:state.count--, error:false}
        }
    }
}

const [state,dispatch]=useReducer(reducer, {
    count:0,
    error:Boolean(false)
})

  return (
<div className={`flex flex-col align-middle items-center justify-center my-20 ${state.error ? " border-2 border-red-300" : ""}`}>
    <div>Currently it's:{state.count}</div>
    <button onClick={()=>dispatch({type:"increment"})} className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded m-5'>Increment</button>
    <button onClick={()=>dispatch({type:"decrement"})} className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded m-5'>Decrement</button>
    {state.error && <div className='text-red-500'>{state.error}</div>}
</div>
  )
}

export default page