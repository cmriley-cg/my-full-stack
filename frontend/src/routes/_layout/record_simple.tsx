import { createFileRoute } from "@tanstack/react-router"
import { Box, Button, Container, Heading, Text, VStack, Code, Table, Input, Alert, keyframes } from "@chakra-ui/react"
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
  // const isBusy = status === "starting" || status === "stopping"
  // const isRecording = status === "recording"


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
    return () => stopTicker() // cleanup on unmount
  }, [])

  const startRecording = async () => {
    setStatus("starting")
    try {
      const res = await fetch(`${apiBase}/api/v1/record/start`, { method: `POST` })
      if (!res.ok) {
        setStatus("error")
        return
      }
      // init timer on successful start
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
      // stop timer
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
    // ensure timer is reset visually
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

  // Time bar width loops each minute so it always animates forward
  const minutePortion = ((elapsedMs % 60000) / 60000) * 100

  return (
    <Container maxW="full">
      <Heading size="sm" py={4}>Recording</Heading>
      <VStack gap={4} align="start" w="full">
        {/* Toggle Record Button + Test */}
        <Box>
          <Button
            colorPalette={status === "recording" ? "red" : "blue"}
            onClick={toggleRecording}
            disabled={status === "starting" || status === "stopping"}
            loading={status === "starting" || status === "stopping"}
            mr={2}
            leftIcon={
              status === "recording" ? (
                // Stop icon (square)
                (<Box as="span" display="inline-block" lineHeight={0}>
                  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="6" y="6" width="12" height="12" />
                  </svg>
                </Box>)
              ) : (
                // Play icon (triangle)
                (<Box as="span" display="inline-block" lineHeight={0}>
                  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                    <polygon points="8,5 19,12 8,19" />
                  </svg>
                </Box>)
              )
            }
          >
            {status === "recording" ? "Stop" : "Record"}
          </Button> 

          <Button
            colorPalette="green"
            onClick={testFileRecognition}
            loading={status === "starting"}
          >
            Test File Recognition
          </Button>
        </Box>

        {/* Status + Timer */}
        <Box w="full">
          <Text mb={1}>
            <strong>Status:</strong> {status}
            {status === "recording" && (
              <> • <strong>Elapsed:</strong> {formatElapsed(elapsedMs)}</>
            )}
            {(status === "stopped" || status === "error" || status === "idle") && elapsedMs > 0 && (
              <> • <strong>Last duration:</strong> {formatElapsed(elapsedMs)}</>
            )}
          </Text>

          {/* Time Bar */}
          <Box position="relative" w="full" h="2" bg="gray.200" rounded="sm" overflow="hidden">
            <Box
              position="absolute"
              top="0"
              left="0"
              h="100%"
              w={`${status === `recording` ? minutePortion : 0}%`}
              bg={status === "recording" ? "blue.500" : "gray.300"}
              transition="width 0.2s linear"
            />
          </Box>
          <Text fontSize="xs" color="gray.600" mt={1}>
            {status === "recording" ? "Filling each minute..." : "Not recording"}
          </Text>
        </Box>

        {/* Transcript */}
        <Box w="full">
          <Text mb={2}><strong>Transcript:</strong></Text>
          <Code display="block" p={4} whiteSpace="pre-wrap" w="full">
            {transcript || "(no transcript yet)"}
          </Code>
        </Box>

        {/* Auto-populate */}
        <Button
          colorPalette="green"
          onClick={autoPopulate}
          disabled={!transcript || autoFillLoading}
          loading={autoFillLoading}
        >
          Auto Populate Form
        </Button>

        {autoFillError && (
          <Alert.Root status="error">
            <Alert.Indicator />
            <Alert.Title>{autoFillError}</Alert.Title>
          </Alert.Root>
        )}

        {/* Auto-filled fields */}
        {fields && (
          <Box w="full">
            <Heading size="sm" mb={2}>Auto-filled Fields</Heading>
            <Table.Root size="sm" variant="outline">
              <Table.Body>
                {Object.entries(fields).map(([key, value]) => (
                  <Table.Row key={key}>
                    <Table.Header w="240px">{key}</Table.Header>
                    <Table.Cell>
                      <Input
                        value={value ?? ""}
                        onChange={(e) =>
                          setFields((prev) => ({
                            ...(prev || {}),
                            [key]: e.target.value,
                          }))
                        }
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
              mt={4}
            >
              Save Form
            </Button>

            {saveError && (
              <Alert.Root status="error" mt={2}>
                <Alert.Indicator />
                <Alert.Title>{saveError}</Alert.Title>
              </Alert.Root>
            )}

            {saveSuccess && (
              <Alert.Root status="success" mt={2}>
                <Alert.Indicator />
                <Alert.Title>Form saved successfully!</Alert.Title>
              </Alert.Root>
            )}
          </Box>
        )}
      </VStack>
    </Container>
  )
}

export const Route = createFileRoute('/_layout/record_simple')({
  component: RecordNow,
})
