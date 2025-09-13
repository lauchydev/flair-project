/**
 *
 * This class converts blob URLs to base64 and back
 *
 * A blob URL is basically just a URL that stores objects in browser memory
 * Which means when the browser is refreshed that memory is cleared and the blob (object) gets cleared
 *
 * Blob url is used so that images (images are objects) appear immediately without uploading to a server which means its fast
 * The base64 thing is for persistence because they get cleared on browser refresh
 *
 */

/**
 * Convert a blob URL to a base64 data URL
 */
export async function blobUrlToBase64(blobUrl: string): Promise<string> {
	try {
		const response = await fetch(blobUrl);
		const blob = await response.blob();

		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => {
				if (typeof reader.result === "string") {
					resolve(reader.result);
				} else {
					reject(new Error("Failed to convert blob to base64"));
				}
			};
			reader.onerror = reject;
			reader.readAsDataURL(blob);
		});
	} catch (error) {
		console.error("Failed to convert blob URL to base64:", error);
		throw error;
	}
}

/**
 * Convert all blob URLs in a customization to base64 data URLs
 */
export async function convertBlobUrlsToBase64(
	customization: any
): Promise<any> {
	const convertedCustomization = JSON.parse(JSON.stringify(customization));

	if (!convertedCustomization.views) {
		return convertedCustomization;
	}

	for (const view of convertedCustomization.views) {
		if (!view.imageOverlays) {
			continue;
		}

		// Convert image overlays
		for (const imageOverlay of view.imageOverlays) {
			if (imageOverlay.url && imageOverlay.url.startsWith("blob:")) {
				try {
					const base64Url = await blobUrlToBase64(imageOverlay.url);

					// check if base64 is too large
					if (base64Url.length > 50000) {
						// Keep the blob URL
					} else {
						imageOverlay.url = base64Url;
					}
				} catch (error) {}
			}
		}
	}

	return convertedCustomization;
}

/**
 * Check if a URL is a blob URL
 */
export function isBlobUrl(url: string): boolean {
	return url.startsWith("blob:");
}

/**
 * Check if a URL is a data URL
 */
export function isDataUrl(url: string): boolean {
	return url.startsWith("data:");
}
