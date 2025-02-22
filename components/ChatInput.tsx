'use client'

import { PaperAirplaneIcon } from "@heroicons/react/24/solid";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { FormEvent } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { toast } from "react-hot-toast";
import ModelSelection from "./ModelSelection";
import { useSWRConfig } from "swr";
import useSWR from "swr"

type Props = {
    chatId: string;
}

function ChatInput({chatId}: Props) {
  const[prompt, setPrompt] = useState("");
  const {data: session} = useSession();
  
  const{data: model} = useSWR("model",{
    fallbackData:"text-davinci-003"
  });


  const sendMessage = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!prompt) return;

    const input = prompt.trim();
    setPrompt("");

    const message: Message = {
        text: input,
        createdAt: serverTimestamp(),
        user: {
            _id: session?.user?.email!, 
            name: session?.user?.name!,
            avatar: session?.user?.image! || `https://ui-avatar.com/api/?name=${session?.user?.name}`,
        }
    }

    await addDoc(collection(db, 'users', session?.user?.email!, 'chats', chatId, 'messages'),
    message
    );

    //Toast
const notification = toast.loading('MODEL is thinking...');


    await fetch('/api/askQuestion',{
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
           prompt: input, 
           chatId, 
           model, 
           session,
        })
    }).then (() => {
     toast.success('Responded',{
        id: notification,
     })
    })

  }

  
    return (
    <div className="bg-gray-700/50 text-black rounded-lg text-sm">
        <form onSubmit={sendMessage} className="p-5 space-x-5 flex">
            <input 
                className="bg-transparent focus:outline-none flex-1 disabled:cursor-not-allowed
                 disabled:text-gray-900 "
                 disabled={!session}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                type="text" 
                placeholder = "Escríbeme...."
                
            />
            <button 
            disabled={!prompt || !session}
            className="bg-[#5e80b3] hover:opacity-50 text-white  font-bold
            px-4 py-2 rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
            type="submit"> 
                <PaperAirplaneIcon className="h-4 w-4 -rotate-45" />
            </button>
        </form>
        <div className="md:hidden">
            <ModelSelection/>
        </div>
    </div>
  )
}

export default ChatInput