import { createFileRoute } from "@tanstack/react-router"
import { Box, Button, Container, Heading, Text, VStack, Code, Table, Input, Alert, Card, HStack, Badge } from "@chakra-ui/react"
import { useEffect, useRef, useState } from "react"
import { OpenAPI } from "@/client"

const apiBase = (OpenAPI.BASE ?? "").replace(/\/$/, "")

type Fields = Record<string, string>
type AutoFillResponse = { fields: Fields; meta: Record<string, any> }

const formatElapsed = (ms: number) => {
  const totalSec = Math.floor(ms / 1000)
  const m = Math.floor(totalSec / 60).toString().padStart(2, "0")
  const s = (totalSec % 60).toString().padStart(2, "0")
  return `${m}:${s}`
}

const RecordNow = () => {
  const [status, setStatus] = useState<"idle" | "starting" | "recording" | "stopping" | "stopped" | "error">("idle")
  const [transcript, setTranscript] = useState<string>("")
  const [fields, setFields] = useState<Fields | null>(null)
  const [autoFillLoading, setAutoFillLoading] = useState(false)
  const [autoFillError, setAutoFillError] = useState<string | null>(null)
  const [saveLoading, setSaveLoading] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Timer state
  const [elapsedMs, setElapsedMs] = useState(0)
  const startTimeRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)

  const startTicker = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    const tick = () => {
      if (startTimeRef.current != null) {
        setElapsedMs(Date.now() - startTimeRef.current)
        rafRef.current = requestAnimationFrame(tick)
      }
    }
    rafRef.current = requestAnimationFrame(tick)
  }

  const stopTicker = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
  }

  useEffect(() => {
    return () => stopTicker()
  }, [])

  const startRecording = async () => {
    setStatus("starting")
    try {
      const res = await fetch(`${apiBase}/api/v1/record/start`, { method: `POST` })
      if (!res.ok) {
        setStatus("error")
        return
      }
      startTimeRef.current = Date.now()
      setElapsedMs(0)
      startTicker()
      setStatus("recording")
    } catch {
      setStatus("error")
    }
  }

  const stopRecording = async () => {
    setStatus("stopping")
    try {
      const res = await fetch(`${apiBase}/api/v1/record/stop`, { method: `POST` })
      if (!res.ok) {
        setStatus("error")
        return
      }
      const body = await res.json()
      setTranscript(body.transcript || "")
      stopTicker()
      startTimeRef.current = null
      setStatus("stopped")
    } catch {
      setStatus("error")
    }
  }

  const toggleRecording = async () => {
    if (status === "recording") {
      await stopRecording()
    } else if (status === "idle" || status === "stopped" || status === "error") {
      await startRecording()
    }
  }

  const testFileRecognition = async () => {
    stopTicker()
    startTimeRef.current = null
    setElapsedMs(0)
    setStatus("starting")
    try {
      const res = await fetch(`${apiBase}/api/v1/record/testfile`, { method: `POST` })
      if (!res.ok) return setStatus("error")
      const body = await res.json()
      setTranscript(body.transcript || "")
      setStatus("stopped")
    } catch {
      setStatus("error")
    }
  }

  const autoPopulate = async () => {
    setAutoFillError(null)
    setAutoFillLoading(true)
    setSaveSuccess(false)
    try {
      const res = await fetch(`${apiBase}/api/v1/forms/autofill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          form_type: "maintenance_report",
          transcript: transcript ?? "",
        }),
      })
      const data: AutoFillResponse | { detail?: string } = await res.json()
      if (!res.ok) {
        setAutoFillError((data as any).detail || "Form extraction failed")
        return
      }
      setFields((data as AutoFillResponse).fields || {})
    } catch (e: any) {
      setAutoFillError(e?.message || "Network error")
    } finally {
      setAutoFillLoading(false)
    }
  }

  const saveForm = async () => {
    setSaveError(null)
    setSaveSuccess(false)
    setSaveLoading(true)
    try {
      const res = await fetch(`${apiBase}/api/v1/forms/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          form_type: "maintenance_report",
          fields: fields,
          transcript: transcript,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSaveError(data?.detail || "Failed to save form")
        return
      }
      setSaveSuccess(true)
    } catch (e: any) {
      setSaveError(e?.message || "Network error")
    } finally {
      setSaveLoading(false)
    }
  }

  const progress = ((elapsedMs % 60000) / 60000) * 360

  return (
    <Container maxW="6xl" py={8}>
      <Heading size="lg" mb={6}>Voice Recording</Heading>

      <VStack gap={6} align="stretch">
        {/* Recording Control Card */}
        <Card.Root>
          <Card.Body>
            <VStack gap={6}>
              {/* Main Record Button with Circular Progress */}
              <Box position="relative" display="flex" flexDirection="column" alignItems="center" gap={4}>
                {/* Circular Progress Ring */}
                <Box position="relative" w="180px" h="180px">
                  {/* Background circle */}
                  <svg
                    width="180"
                    height="180"
                    style={{ position: "absolute", top: 0, left: 0, transform: "rotate(-90deg)" }}
                  >
                    <circle
                      cx="90"
                      cy="90"
                      r="82"
                      fill="none"
                      stroke="#e2e8f0"
                      strokeWidth="4"
                    />
                    {status === "recording" && (
                      <circle
                        cx="90"
                        cy="90"
                        r="82"
                        fill="none"
                        stroke="#3182ce"
                        strokeWidth="4"
                        strokeDasharray={`${(progress / 360) * 515} 515`}
                        strokeLinecap="round"
                        style={{ transition: "stroke-dasharray 0.2s linear" }}
                      />
                    )}
                  </svg>

                  {/* Record Button */}
                  <Button
                    position="absolute"
                    top="50%"
                    left="50%"
                    transform="translate(-50%, -50%)"
                    w="140px"
                    h="140px"
                    borderRadius="full"
                    colorPalette={status === "recording" ? "red" : "blue"}
                    onClick={toggleRecording}
                    disabled={status === "starting" || status === "stopping"}
                    fontSize="lg"
                    fontWeight="bold"
                    boxShadow="lg"
                    _hover={{
                      transform: "translate(-50%, -50%) scale(1.05)",
                      boxShadow: "xl",
                    }}
                    transition="all 0.2s"
                    css={
                      status === "recording"
                        ? {
                            animation: "pulse 2s ease-in-out infinite",
                            "@keyframes pulse": {
                              "0%, 100%": { boxShadow: "0 0 0 0 rgba(220, 38, 38, 0.7)" },
                              "50%": { boxShadow: "0 0 0 20px rgba(220, 38, 38, 0)" },
                            },
                          }
                        : undefined
                    }
                  >
                    <VStack gap={1}>
                      {status === "recording" ? (
                        <Box w="24px" h="24px" bg="white" borderRadius="sm" />
                      ) : (
                        <Box
                          as="span"
                          w="0"
                          h="0"
                          borderLeft="24px solid white"
                          borderTop="14px solid transparent"
                          borderBottom="14px solid transparent"
                          ml="4px"
                        />
                      )}
                      <Text fontSize="sm" color="white">
                        {status === "recording" ? "Stop" : "Record"}
                      </Text>
                    </VStack>
                  </Button>
                </Box>

                {/* Timer Display */}
                <VStack gap={1}>
                  <HStack gap={2} align="center">
                    <Badge
                      colorPalette={
                        status === "recording"
                          ? "red"
                          : status === "stopped"
                          ? "green"
                          : status === "error"
                          ? "red"
                          : "gray"
                      }
                      size="lg"
                    >
                      {status.toUpperCase()}
                    </Badge>
                    {(status === "recording" || elapsedMs > 0) && (
                      <Text fontSize="2xl" fontWeight="mono" fontFamily="mono">
                        {formatElapsed(elapsedMs)}
                      </Text>
                    )}
                  </HStack>
                  <Text fontSize="sm" color="gray.600">
                    {status === "recording"
                      ? "Recording in progress..."
                      : status === "stopped"
                      ? "Recording complete"
                      : "Press record to start"}
                  </Text>
                </VStack>
              </Box>

              {/* Test Button */}
              <Button
                colorPalette="teal"
                onClick={testFileRecognition}
                loading={status === "starting"}
                size="lg"
              >
                Test File Recognition
              </Button>
            </VStack>
          </Card.Body>
        </Card.Root>

        {/* Transcript Card */}
        {transcript && (
          <Card.Root>
            <Card.Header>
              <Heading size="md">Transcript</Heading>
            </Card.Header>
            <Card.Body>
              <Code
                display="block"
                p={4}
                whiteSpace="pre-wrap"
                w="full"
                bg="gray.50"
                borderRadius="md"
                fontSize="sm"
              >
                {transcript}
              </Code>
              <Button
                colorPalette="green"
                onClick={autoPopulate}
                disabled={!transcript || autoFillLoading}
                loading={autoFillLoading}
                mt={4}
                size="lg"
              >
                Auto Populate Form
              </Button>
              {autoFillError && (
                <Alert.Root status="error" mt={4}>
                  <Alert.Indicator />
                  <Alert.Title>{autoFillError}</Alert.Title>
                </Alert.Root>
              )}
            </Card.Body>
          </Card.Root>
        )}

        {/* Auto-filled Fields Card */}
        {fields && (
          <Card.Root>
            <Card.Header>
              <Heading size="md">Form Fields</Heading>
            </Card.Header>
            <Card.Body>
              <VStack gap={4} align="stretch">
                <Table.Root size="sm" variant="outline">
                  <Table.Body>
                    {Object.entries(fields).map(([key, value]) => (
                      <Table.Row key={key}>
                        <Table.Header w="240px" fontWeight="semibold">
                          {key}
                        </Table.Header>
                        <Table.Cell>
                          <Input
                            value={value ?? ""}
                            onChange={(e) =>
                              setFields((prev) => ({
                                ...(prev || {}),
                                [key]: e.target.value,
                              }))
                            }
                            size="md"
                          />
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>

                <Button
                  colorPalette="blue"
                  onClick={saveForm}
                  disabled={saveLoading}
                  loading={saveLoading}
                  size="lg"
                >
                  Save Form
                </Button>

                {saveError && (
                  <Alert.Root status="error">
                    <Alert.Indicator />
                    <Alert.Title>{saveError}</Alert.Title>
                  </Alert.Root>
                )}

                {saveSuccess && (
                  <Alert.Root status="success">
                    <Alert.Indicator />
                    <Alert.Title>Form saved successfully!</Alert.Title>
                  </Alert.Root>
                )}
              </VStack>
            </Card.Body>
          </Card.Root>
        )}
      </VStack>
    </Container>
  )
}

export const Route = createFileRoute('/_layout/record')({
  component: RecordNow,
})