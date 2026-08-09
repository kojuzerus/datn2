// Chọn tối đa 2 thông số nổi bật của sản phẩm để hiện dạng chip trên card
// (kiểu "RAM 16GB", "SSD 512GB" như các trang bán lẻ lớn).
// Giá trị trong DB có thể rất dài ("16GB DDR5 4800MHz (2 khe, tối đa 64GB)")
// nên mỗi chip chỉ giữ lại phần cốt lõi, tối đa MAX_LEN ký tự.

export interface SpecRow { label: string; value: string }

const MAX_LEN = 16;

const capacityOf = (v: string) => v.match(/\d+(?:[.,]\d+)?\s*(?:TB|GB|MB)/i)?.[0].replace(/\s+/g, "");

// Bỏ phần trong ngoặc, cắt gọn nếu vẫn dài
function short(v: string): string {
  const s = v.split("(")[0].trim();
  return s.length > MAX_LEN ? s.slice(0, MAX_LEN).trimEnd() + "…" : s;
}

export function specChips(spec?: SpecRow[]): string[] {
  if (!spec?.length) return [];
  const find = (labels: string[]) =>
    spec.find((s) => labels.includes(s.label.trim().toLowerCase()));

  const chips: string[] = [];

  // "16GB DDR5 4800MHz (2 khe...)" → "RAM 16GB"
  const ram = find(["ram"]);
  if (ram) chips.push(`RAM ${capacityOf(ram.value) ?? short(ram.value)}`);

  // "512GB SSD NVMe PCIe 4.0 (...)" → "SSD 512GB"
  const storage = find(["rom", "ổ cứng", "bộ nhớ trong", "dung lượng lưu trữ"]);
  if (storage) {
    const cap  = capacityOf(storage.value);
    const type = storage.value.match(/SSD|HDD|eMMC/i)?.[0].toUpperCase();
    chips.push(cap ? `${type ?? ""} ${cap}`.trim() : short(storage.value));
  }

  if (chips.length < 2) {
    // "6.8 inch Dynamic AMOLED 2X" → "6.8 inch"
    const screen = find(["màn hình"]);
    if (screen) chips.push(screen.value.split(" ").slice(0, 2).join(" "));
  }
  if (chips.length < 2) {
    const cpu = find(["cpu", "bộ xử lý", "chip"]);
    if (cpu) chips.push(short(cpu.value));
  }
  if (chips.length < 2) {
    const pin = find(["pin", "thời lượng pin"]);
    if (pin) chips.push(`Pin ${short(pin.value)}`);
  }
  return chips.slice(0, 2);
}
