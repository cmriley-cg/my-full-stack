import React, { useEffect, useRef } from "react";
import { Avatar, Flex, Text } from "@chakra-ui/react";

export type Author = "me" | "computer";

export interface ChatMessage {
  id?: string;
  from: Author;
  text: string;
}

interface MessagesProps {
  messages: ChatMessage[];
}

const Messages: React.FC<MessagesProps> = ({ messages }) => {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  // const firstRender = useRef(true);

  // useEffect(() => {
  //   bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  // }, [messages]);

//   useEffect(() => {
//   if (firstRender.current) { firstRender.current = false; return; }
//   bottomRef.current?.scrollIntoView({ behavior: "smooth" });
// }, [messages.length]);


  return (
    <Flex w="100%" h="80%" overflowY="auto" flexDirection="column" p="3" gap="2">
      {messages.map((item, index) => {
        const key = item.id ?? String(index);

        if (item.from === "me") {
          return (
            <Flex key={key} w="100%" justify="flex-end">
              <Flex
                bg="black"
                color="white"
                minW="100px"
                maxW="350px"
                my="1"
                p="3"
                borderRadius="lg"
              >
                <Text>{item.text}</Text>
              </Flex>
            </Flex>
          );
        }

        return (
          <Flex key={key} w="100%" align="flex-start" gap="2">
            {/* v3 slot API */}
            <Avatar.Root size="md" variant="subtle">
              <Avatar.Fallback>AI</Avatar.Fallback>
              <Avatar.Image
                src="https://avataaars.io/?avatarStyle=Transparent&topType=LongHairStraight&accessoriesType=Blank&hairColor=BrownDark&facialHairType=Blank&clotheType=BlazerShirt&eyeType=Default&eyebrowType=Default&mouthType=Default&skinColor=Light"
                alt="Computer"
              />
            </Avatar.Root>

            <Flex
              bg="gray.100"
              color="black"
              minW="100px"
              maxW="350px"
              my="1"
              p="3"
              borderRadius="lg"
              border="1px solid"
              borderColor="gray.200"
            >
              <Text>{item.text}</Text>
            </Flex>
          </Flex>
        );
      })}
      <div ref={bottomRef} />
    </Flex>
  );
};

export default Messages;
