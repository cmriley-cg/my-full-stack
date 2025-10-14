// import { Container, Heading, Stack } from "@chakra-ui/react"
// import { useTheme } from "next-themes"

// import { Radio, RadioGroup } from "@/components/ui/radio"

// const Appearance = () => {
//   const { theme, setTheme } = useTheme()

//   return (
//     <Container maxW="full">
//       <Heading size="sm" py={4}>
//         Appearance
//       </Heading>

//       <RadioGroup
//         onValueChange={(e) => setTheme(e.value ?? "system")}
//         value={theme}
//         colorPalette="teal"
//       >
//         <Stack>
//           <Radio value="system">System</Radio>
//           <Radio value="light">Light Mode</Radio>
//           <Radio value="dark">Dark Mode</Radio>
//         </Stack>
//       </RadioGroup>
//     </Container>
//   )
// }
// export default Appearance
import { Container, Heading, Stack } from "@chakra-ui/react"
import { useTheme } from "next-themes"

import { Radio, RadioGroup } from "@/components/ui/radio"

const Appearance = () => {
  const { theme, setTheme } = useTheme()

  return (
    <Container maxW="full">
      <Heading size="sm" py={4}>
        Appearance
      </Heading>

      <RadioGroup
        onValueChange={(e) => setTheme(e.value ?? "system")}
        value={theme}
        colorPalette="teal"
      >
        <Stack>
          <Radio value="system">System</Radio>
          <Radio value="light">Light Mode</Radio>
          <Radio value="dark">Dark Mode</Radio>
          <Radio value="ocean">Ocean Theme</Radio>
          <Radio value="forest">Forest Theme</Radio>
        </Stack>
      </RadioGroup>
    </Container>
  )
}

export default Appearance