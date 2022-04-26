function encodeFromTo(
  source: string,
  bufferEncodingFrom: BufferEncoding,
  bufferEncodingTo: BufferEncoding,
): string {
  return Buffer.from(source, bufferEncodingFrom).toString(bufferEncodingTo)
}

export function encodeBase64ToUtf8(source: string): string {
  return encodeFromTo(source, 'base64', 'utf8')
}

export function encodeUtf8ToBase64(source: string): string {
  return encodeFromTo(source, 'utf8', 'base64')
}
