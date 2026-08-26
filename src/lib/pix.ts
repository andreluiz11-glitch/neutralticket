import QRCode from "qrcode";

type PixPayloadInput = {
  key: string;
  receiverName: string;
  receiverCity: string;
  amount: number;
  txid: string;
  description?: string;
};

function onlyText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s@.+-]/g, "")
    .trim();
}

function emv(id: string, value: string) {
  const size = String(value.length).padStart(2, "0");
  return `${id}${size}${value}`;
}

function crc16(payload: string) {
  let crc = 0xffff;

  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;

    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc <<= 1;
      }

      crc &= 0xffff;
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function buildPixPayload(input: PixPayloadInput) {
  const key = input.key.trim();
  const receiverName = onlyText(input.receiverName).slice(0, 25);
  const receiverCity = onlyText(input.receiverCity).slice(0, 15);
  const txid = onlyText(input.txid).replace(/\s/g, "").slice(0, 25);
  const amount = input.amount.toFixed(2);

  const merchantAccountInfo = [
    emv("00", "br.gov.bcb.pix"),
    emv("01", key),
    input.description
      ? emv("02", onlyText(input.description).slice(0, 60))
      : "",
  ].join("");

  const additionalData = emv("05", txid);

  const payloadWithoutCRC = [
    emv("00", "01"),
    emv("01", "11"),
    emv("26", merchantAccountInfo),
    emv("52", "0000"),
    emv("53", "986"),
    emv("54", amount),
    emv("58", "BR"),
    emv("59", receiverName),
    emv("60", receiverCity),
    emv("62", additionalData),
    "6304",
  ].join("");

  return `${payloadWithoutCRC}${crc16(payloadWithoutCRC)}`;
}

export async function generatePixQrCodeDataUrl(payload: string) {
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 320,
  });
}