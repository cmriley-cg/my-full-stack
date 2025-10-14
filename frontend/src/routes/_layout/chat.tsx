import { createFileRoute } from "@tanstack/react-router"
import React, { useState } from "react";
import { Flex } from "@chakra-ui/react";
import Divider from "@/components/Chat/Divider"
import Footer from "@/components/Chat/Footer"
import Header from "@/components/Chat/Header"
import Messages, {ChatMessage } from "@/components/Chat/Messages"

export const Route = createFileRoute('/_layout/chat')({
  component: ChatPage,
})


function ChatPage() {
  // helper to give messages stable ids
  const makeMsg = (from: ChatMessage["from"], text: string): ChatMessage => ({
    id: crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2),
    from,
    text,
  });

  const [messages, setMessages] = useState<ChatMessage[]>([
    makeMsg("computer", "Hi, My Name is HoneyChat"),
    // makeMsg("me", "Hey there"),
    // makeMsg("me", "Myself Ferin Patel"),
    // makeMsg(
    //   "computer",
    //   "Nice to meet you. You can send me a message and I'll reply with the same message."
    // ),
  ]);

  const [inputMessage, setInputMessage] = useState<string>("");

  const handleSendMessage = () => {
    const data = inputMessage.trim();
    if (!data) return;

    setMessages((old) => [...old, makeMsg("me", data)]);
    setInputMessage("");

    // Simulated echo reply
    setTimeout(() => {
      setMessages((old) => [...old, makeMsg("computer", data)]);
    }, 1000);
  };

  return (
    <Flex w="100%" h="100vh" justify="center" align="center">
      <Flex w={["100%", "100%", "40%"]} h="90%" flexDir="column">
        <Header />
        <Divider />
        <Messages messages={messages} />
        <Divider />
        <Footer
          inputMessage={inputMessage}
          setInputMessage={setInputMessage}
          handleSendMessage={handleSendMessage}
        />
      </Flex>
    </Flex>
  );
}