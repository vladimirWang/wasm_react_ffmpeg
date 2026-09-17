/**
 * 图表配色工具：基于 antd 主题 token 的 colorPrimary 派生分类色板。
 * 饼图等多分类图表需要多个可区分的颜色，同时整体观感要与系统主题色一致，
 * 因此以主题色为基准，在其邻近色相上向两侧展开，并交错明度生成色板。
 */

/** #RRGGBB -> [h(0-360), s(0-100), l(0-100)] */
function hexToHsl(hex: string): [number, number, number] {
	const normalized = hex.replace("#", "");
	const r = parseInt(normalized.slice(0, 2), 16) / 255;
	const g = parseInt(normalized.slice(2, 4), 16) / 255;
	const b = parseInt(normalized.slice(4, 6), 16) / 255;

	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const l = (max + min) / 2;
	const d = max - min;
	const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));

	let h = 0;
	if (d !== 0) {
		if (max === r) h = 60 * (((g - b) / d) % 6);
		else if (max === g) h = 60 * ((b - r) / d + 2);
		else h = 60 * ((r - g) / d + 4);
	}

	return [(h + 360) % 360, s * 100, l * 100];
}

/** hsl(0-360, 0-100, 0-100) -> #RRGGBB */
function hslToHex(h: number, s: number, l: number): string {
	const sn = s / 100;
	const ln = l / 100;
	const k = (n: number) => (n + h / 30) % 12;
	const a = sn * Math.min(ln, 1 - ln);
	const f = (n: number) =>
		ln - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
	const toHex = (x: number) =>
		Math.round(x * 255)
			.toString(16)
			.padStart(2, "0");
	return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`.toUpperCase();
}

/** 各色相对主题色相的偏移（第一个固定为主题色本身），在红—橙—黄邻近色内向两侧展开 */
const HUE_OFFSETS = [0, 20, -20, 34, -34, 10, -28, 28];
/** 与偏移一一对应的明度，交错排布以拉开扇区间的层次（首色沿用主题色本身，不参与） */
const LIGHTNESS = [0, 64, 43, 72, 55, 47, 75, 59];
/** 派生色饱和度：略低于主题色，避免高饱和暖色产生荧光感 */
const DERIVED_SATURATION = 85;

/**
 * 基于系统主题色生成图表分类色板。
 * @param primary antd theme token 的 colorPrimary
 * @param count 需要的颜色数量（默认 8，超出后自动循环）
 */
export function buildThemePalette(primary: string, count = 8): string[] {
	const [baseH, , baseL] = hexToHsl(primary);

	return Array.from({ length: count }, (_, i) => {
		const index = i % HUE_OFFSETS.length;
		// 首色直接使用主题色，保证与系统 token 完全一致
		if (index === 0) return primary.toUpperCase();
		const h = (baseH + HUE_OFFSETS[index] + 360) % 360;
		return hslToHex(h, DERIVED_SATURATION, LIGHTNESS[index] || baseL);
	});
}
