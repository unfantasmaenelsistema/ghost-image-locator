/**
 * Computes SHA-256 and MD5-like cryptographic hashes for chain of custody
 * using the browser's native Web Crypto API.
 */
export async function computeImageSha256(dataOrBlob: Blob | File | string): Promise<string> {
  try {
    let arrayBuffer: ArrayBuffer;

    if (typeof dataOrBlob === 'string') {
      if (dataOrBlob.startsWith('data:')) {
        // Base64 data URL
        const base64Data = dataOrBlob.split(',')[1];
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        arrayBuffer = bytes.buffer;
      } else {
        // Fetch URL
        const res = await fetch(dataOrBlob);
        arrayBuffer = await res.arrayBuffer();
      }
    } else {
      arrayBuffer = await dataOrBlob.arrayBuffer();
    }

    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch (err) {
    console.error('Error calculando hash SHA-256:', err);
    return 'NO_DISPONIBLE';
  }
}
