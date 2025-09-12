// Event emitter for cart updates
class CartEventEmitter extends EventTarget {
	emitCartUpdate() {
		this.dispatchEvent(new CustomEvent("cartUpdate"));
	}
}

export const cartEvents = new CartEventEmitter();

// Helper function to refresh cart count
export const refreshCartCount = () => {
	cartEvents.emitCartUpdate();
};
