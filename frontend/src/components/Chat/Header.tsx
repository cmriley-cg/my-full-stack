import React from "react";
import { Flex, Text, Avatar, Float, Circle } from "@chakra-ui/react";

const Header: React.FC = () => {
  return (
    <Flex w="100%" align="center" p={4} borderBottom="1px solid" borderColor="gray.200" gap="4">
      <Avatar.Root size="lg" variant="subtle" colorPalette="gray">
        <Avatar.Fallback name="Dan Abrahmov" />
        <Avatar.Image src="https://bit.ly/dan-abramov" alt="Dan Abrahmov" />
        {/* Badge (v3 way) */}
        <Float placement="bottom-end" offsetX="1" offsetY="1">
          <Circle
            bg="green.500"
            size="8px"
            outline="0.2em solid"
            outlineColor="bg"
            rounded="full"
          />
        </Float>
      </Avatar.Root>

      <Flex direction="column" justify="center">
        <Text fontSize="lg" fontWeight="bold">Ferin Patel</Text>
        <Text color="green.500">Online</Text>
      </Flex>
    </Flex>
  );
};

export default Header;
