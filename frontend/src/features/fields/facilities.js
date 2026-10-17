const aliases = {
  lights: 'ไฟส่องสว่าง', parking: 'ที่จอดรถ', restroom: 'ห้องน้ำ', shop: 'ร้านค้า',
  wifi: 'Wi-Fi ฟรี', 'wifi free': 'Wi-Fi ฟรี', aircon: 'ห้องปรับอากาศ',
};
/**
 * Legacy records may contain JSON text, indexed arrays, or boolean maps.
 * Never use numeric property keys as labels or interpret "false" as enabled.
 * @param {unknown} value
 * @returns {string[]}
 */
export function facilityLabels(value) {
  /** @param {unknown} input @param {number} depth @returns {string[]} */
  function read(input, depth) {
    if (depth > 4 || input == null) return [];
    if (typeof input === 'string') {
      const text = input.trim();
      if (!text) return [];
      if (/^[[{"]/.test(text)) {
        try { return read(JSON.parse(text), depth + 1); } catch { return []; }
      }
      return text.split(/[,\n]/);
    }
    if (Array.isArray(input)) return input.flatMap(item => typeof item === 'string' ? read(item, depth + 1) : []);
    if (typeof input !== 'object') return [];
    const entries = Object.entries(input);
    if (entries.length && entries.every(([key]) => /^\d+$/.test(key))) {
      const values = entries.sort(([a], [b]) => Number(a) - Number(b)).map(([, item]) => item);
      // Object-spread of a string creates one property per character.
      if (values.every(item => typeof item === 'string' && item.length === 1)) return read(values.join(''), depth + 1);
      return read(values, depth + 1);
    }
    return entries.filter(([key, enabled]) => !/^\d+$/.test(key) && (enabled === true || enabled === 1 || enabled === 'true')).map(([key]) => key);
  }
  return [...new Set(read(value, 0).map(label => label.trim()).filter(label => label && label.length <= 60 && !/^\d+$/.test(label) && !['true', 'false', 'null'].includes(label)).map(label => aliases[label.toLowerCase()] || label))];
}
