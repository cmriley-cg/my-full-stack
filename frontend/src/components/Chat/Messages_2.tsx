import React, { useEffect, useRef, useState } from "react";
import { Avatar, Box, Flex, IconButton, Text } from "@chakra-ui/react";
import { ChevronDownIcon } from "@chakra-ui/icons";

export type Author = "me" | "computer";
export interface ChatMessage { id?: string; from: Author; text: string; }

interface MessagesProps {
  messages: ChatMessage[];
  bottomThresholdPx?: number; // how close to bottom counts as "at bottom" (default 40px)
}

const Messages: React.FC<MessagesProps> = ({ messages, bottomThresholdPx = 40 }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const prevLenRef = useRef<number>(messages.length);
  const [isAtBottom, setIsAtBottom] = useState(true); // assume bottom until user scrolls

  // Helper: are we close enough to the bottom?
  const computeIsAtBottom = () => {
    const el = containerRef.current;
    if (!el) return true;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    return distance <= bottomThresholdPx;
    };
  
  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  };

  // Update isAtBottom when user scrolls
  const onScroll = () => setIsAtBottom(computeIsAtBottom());

  // Only auto-scroll when:
  // 1) messages length increased, AND
  // 2) the user is already at (or near) the bottom.
  useEffect(() => {
    const lenIncreased = messages.length > prevLenRef.current;
    if (lenIncreased && isAtBottom) {
      scrollToBottom();
    }
    prevLenRef.current = messages.length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  // On mount: do NOT force-scroll. Just compute current position.
  useEffect(() => {
    setIsAtBottom(computeIsAtBottom());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box position="relative">
      <Flex
        ref={containerRef}
        onScroll={onScroll}
        w="100%"
        h="80%"
        overflowY="auto"
        flexDirection="column"
        p="3"
        gap="2"
        scrollBehavior="smooth"
      >
        {messages.map((item, idx) => {
          const key = item.id ?? String(idx);

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
              {/* Chakra v3 Avatar slots */}
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
      </Flex>

      {/* “Scroll to latest” button appears when you're not at the bottom */}
      {!isAtBottom && (
        <IconButton
          aria-label="Scroll to latest"
          icon={<ChevronDownIcon />}
          position="absolute"
          bottom="3"
          right="3"
          onClick={() => {
            scrollToBottom("instant"); // or "smooth"
            setIsAtBottom(true);
          }}
        />
      )}
    </Box>
  );
};

export default Messages;
