import ViewSwitcher from "../controls/ViewSwitcher";
import PreviewCanvas from "../PreviewCanvas";
import type { ViewPose } from "../types";

interface PreviewSectionProps {
	// Product data
	product: any;
	selectedVariant: any;

	// View management
	availableViews: ViewPose[];
	selectedView: ViewPose;
	onViewSelect: (view: ViewPose) => void;

	// Color configuration
	availableColours: string[];
	selectedColor: string | null;

	// Current view customization
	currentViewCustomization: any;
	designAreaPercent: Record<ViewPose, any>;

	// Helper functions
	getColorImageMap: (
		product: any,
		colours: string[],
		color: string | null,
		view: ViewPose
	) => { url: string; altText: string };
	currentCenter: { x: number; y: number };

	// View update functions
	onViewCustomizationsChange: (updater: (prev: any) => any) => void;

	// Text properties
	customText: string;
	textPos: { x: number; y: number };
	textColor: string;
	textFont: string;
	textWidthPercent: number;
	textHeightPercent: number;
	textAngleDeg: number;

	// Image properties
	activeImageUrl: string | null;
	otherImages: any[];
	imagePos: { x: number; y: number };
	imageWidthPercent: number;
	imageHeightPercent: number;
	imageAngleDeg: number;
}

export default function PreviewSection({
	// Product data
	product,
	selectedVariant,

	// View management
	availableViews,
	selectedView,
	onViewSelect,

	// Color configuration
	availableColours,
	selectedColor,

	// Current view customization
	currentViewCustomization,
	designAreaPercent,

	// Helper functions
	getColorImageMap,
	currentCenter,

	// View update functions
	onViewCustomizationsChange,

	// Text properties
	customText,
	textPos,
	textColor,
	textFont,
	textWidthPercent,
	textHeightPercent,
	textAngleDeg,

	// Image properties
	activeImageUrl,
	otherImages,
	imagePos,
	imageWidthPercent,
	imageHeightPercent,
	imageAngleDeg,
}: PreviewSectionProps) {
	const updateView = (patch: any) => {
		onViewCustomizationsChange((prev) => ({
			...prev,
			[selectedView]: { ...prev[selectedView], ...patch },
		}));
	};

	const setImagePosition = (pos: { x: number; y: number }) => {
		onViewCustomizationsChange((prev) => {
			const view = prev[selectedView];
			const idx = view.activeImageIndex;
			let overlays = view.imageOverlays ?? [];
			if (idx !== null && overlays[idx])
				overlays = overlays.map((o: any, i: number) =>
					i === idx ? { ...o, x: pos.x, y: pos.y } : o
				);
			return {
				...prev,
				[selectedView]: {
					...view,
					imagePos: pos,
					imageOverlays: overlays,
				},
			};
		});
	};

	const setImageWidth = (w: number) => {
		onViewCustomizationsChange((prev) => {
			const view = prev[selectedView];
			const idx = view.activeImageIndex;
			let overlays = view.imageOverlays ?? [];
			if (idx !== null && overlays[idx])
				overlays = overlays.map((o: any, i: number) =>
					i === idx ? { ...o, widthPercent: w } : o
				);
			return {
				...prev,
				[selectedView]: {
					...view,
					imageWidthPercent: w,
					imageOverlays: overlays,
				},
			};
		});
	};

	const setImageHeight = (h: number) => {
		onViewCustomizationsChange((prev) => {
			const view = prev[selectedView];
			const idx = view.activeImageIndex;
			let overlays = view.imageOverlays ?? [];
			if (idx !== null && overlays[idx])
				overlays = overlays.map((o: any, i: number) =>
					i === idx ? { ...o, heightPercent: h } : o
				);
			return {
				...prev,
				[selectedView]: {
					...view,
					imageHeightPercent: h,
					imageOverlays: overlays,
				},
			};
		});
	};

	const setImageAngle = (a: number) => {
		onViewCustomizationsChange((prev) => {
			const view = prev[selectedView];
			const idx = view.activeImageIndex;
			let overlays = view.imageOverlays ?? [];
			if (idx !== null && overlays[idx])
				overlays = overlays.map((o: any, i: number) =>
					i === idx ? { ...o, angleDeg: a } : o
				);
			return {
				...prev,
				[selectedView]: {
					...view,
					imageAngleDeg: a,
					imageOverlays: overlays,
				},
			};
		});
	};

	const img = getColorImageMap(
		product,
		availableColours,
		selectedColor,
		selectedView
	);

	const textProps = {
		text: customText,
		textPosition: textPos,
		onTextPositionChange: (pos: { x: number; y: number }) =>
			updateView({ textPos: pos }),
		textColor,
		textFont,
		textWidthPercent,
		onTextWidthPercentChange: (w: number) =>
			updateView({ textWidthPercent: w }),
		textHeightPercent,
		onTextHeightPercentChange: (h: number) =>
			updateView({ textHeightPercent: h }),
		textAngleDeg,
		onTextAngleDegChange: (a: number) => updateView({ textAngleDeg: a }),
		onTextDelete: () => {
			onViewCustomizationsChange((prev) => ({
				...prev,
				[selectedView]: {
					...prev[selectedView],
					text: "",
					textPos: {
						x: currentCenter.x,
						y: currentCenter.y,
					},
					textWidthPercent: 40,
					textHeightPercent: 12,
					textAngleDeg: 0,
					textColor: "#000000",
					textFont:
						"Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
				},
			}));
		},
	};

	const imageProps = {
		uploadedImageUrl: activeImageUrl,
		otherImages,
		imagePosition: imagePos,
		onImagePositionChange: setImagePosition,
		imageWidthPercent,
		imageHeightPercent,
		imageAngleDeg,
		onImageWidthPercentChange: setImageWidth,
		onImageHeightPercentChange: setImageHeight,
		onImageAngleDegChange: setImageAngle,
	};

	return (
		<section className="lg:col-span-8">
			<div className="mx-auto w-fit rounded-3xl border-4 border-black bg-white p-4 shadow-xl">
				{/* View switcher */}
				<ViewSwitcher
					views={availableViews}
					selected={selectedView}
					onSelect={onViewSelect}
				/>

				{/* Canvas area */}
				<PreviewCanvas
					backgroundUrl={img.url}
					backgroundAlt={img.altText}
					view={selectedView}
					colorHex={selectedColor}
					{...textProps}
					{...imageProps}
					showDesignArea
					designArea={designAreaPercent[selectedView]}
				/>

				{/* Selection summary */}
				<div className="mt-4 text-sm font-extrabold text-gray-700">
					Selected: {selectedVariant?.title || "Default"} • View: {selectedView}
					{selectedColor && ` • Color: ${selectedColor}`}
				</div>
			</div>
		</section>
	);
}
