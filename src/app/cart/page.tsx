import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CartPage from "@/components/cart/CartPage";

export default function Cart() {
	return (
		<div className="min-h-screen flex flex-col">
			<Header />
			<main className="flex-grow">
				<CartPage />
			</main>
			<Footer />
		</div>
	);
}
