// JSON Parser for AI Responses
// Extracts JSON from markdown format if needed

export function parseAIResponse(text: string): any {
  try {
    // Try direct JSON parse first
    return JSON.parse(text)
  } catch (error) {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1])
      } catch (innerError) {
        // If still fails, try cleaning the text
        const cleanedJson = jsonMatch[1]
          .replace(/^[^{[\s]*/, '') // Remove opening non-JSON characters
          .replace(/[^}\]\s]*$/, '') // Remove trailing non-JSON characters
          .trim()
        return JSON.parse(cleanedJson)
      }
    }

    // Fallback: try to extract JSON-like content
    const jsonStart = text.indexOf('{')
    const jsonEnd = text.lastIndexOf('}')
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      const jsonContent = text.substring(jsonStart, jsonEnd + 1)
      return JSON.parse(jsonContent)
    }

    throw new Error('Could not parse JSON from AI response')
  }
}