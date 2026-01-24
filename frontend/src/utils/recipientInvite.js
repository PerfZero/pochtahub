export const encodeInviteData = (data) => {
  if (!data) return "";
  const jsonString = JSON.stringify(data);
  const bytes = new TextEncoder().encode(jsonString);
  let binaryString = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binaryString += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binaryString);
  return encodeURIComponent(base64);
};

export const decodeInviteData = (encoded) => {
  if (!encoded) return null;
  try {
    const decodedBase64 = decodeURIComponent(encoded);
    const binaryString = atob(decodedBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i += 1) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const decoded = new TextDecoder("utf-8").decode(bytes);
    return JSON.parse(decoded);
  } catch (error) {
    console.error("Ошибка декодирования данных приглашения:", error);
    return null;
  }
};
