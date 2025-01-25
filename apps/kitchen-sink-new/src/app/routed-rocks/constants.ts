const colors = [
	{ color: '#042A2B', label: 'Rich Black', slug: 'rich-black' },
	{ color: '#5EB1BF', label: 'Maximum Blue', slug: 'maximum-blue' },
	{ color: '#CDEDF6', label: 'Light Cyan', slug: 'light-cyan' },
	{ color: '#EF7B45', label: 'Mandarin', slug: 'mandarin' },
	{ color: '#D84727', label: 'Vermilion', slug: 'vermilion' },
] as const;

export const menus = colors.map((color, index) => ({
	id: index + 1,
	slug: color.slug,
	label: color.label,
	name: `rock-${color.slug}`,
	path: `/routed-rocks/rocks/${color.slug}`,
	color: color.color,
	angle: ((360 / colors.length) * index * Math.PI) / 180,
}));
