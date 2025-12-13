import { useState, useContext, createContext, useEffect } from "react";

export interface CartItem {
    id: number;
    name: string;
    price: number;
    quantity: number;
    image?: string;
}
interface CartContextType {
    cartItems: CartItem[];
    // addItem: (item: Omit<CartItem, "quantity">) => void;
    deleteItem: (id: number) => void;
    // updateQuantity: (id: number, quantity: number) => void;
    clearCart: () => void;
    printCart: () => void;
    addToCart: (item:CartItem) => void;
    // updateTotal: () => void;
    decrementProductQuantity:(id: number, amount:number) => void;
    incrementProductQuantity:(id: number, amount:number) => void;
    findItemCartQuantity:(id: number) => number;
    // getTotalPriceOfCart: () => number;
    // getTotalItemsInCart: () => number;
    totalPriceOfCart:number;
    totalItemsInCart:number;
}


const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider ({ children }: { children: React.ReactNode }) {
    const storedCart = localStorage.getItem("cart");
    const [cartItems, setCartData] = useState<CartItem[]>(storedCart ? JSON.parse(storedCart) : []);
    const [ totalPriceOfCart, setTotalPriceOfCart ] = useState(0);
    const [ totalItemsInCart, setTotalItemsInCart ] = useState(0);

    useEffect(() => {
        localStorage.setItem("cart", JSON.stringify(cartItems));
        setTotalPriceOfCart(getTotalPriceOfCart());
        setTotalItemsInCart(getTotalItemsInCart());
    }, [cartItems]);

    function addToCart(itemToBeAddedToCart:CartItem){
        var foundId = false;
        
        cartItems.forEach(cartItem => {     
            if (cartItem.id === itemToBeAddedToCart.id){
                incrementProductQuantity(cartItem.id, itemToBeAddedToCart.quantity);
                foundId = true;
            }
        });
        if (!foundId) {
            setCartData((prevItems) => [...prevItems, itemToBeAddedToCart]);
            alert(`added ${itemToBeAddedToCart.quantity} to cart`);
        }
    }

    function incrementProductQuantity(productId:number, amount:number) {
        setCartData(prevCartItems =>
            prevCartItems.map(cartItem =>
                cartItem.id === productId
                ? { ...cartItem, quantity: cartItem.quantity + amount }
                : cartItem
            )
          );
    }

    function decrementProductQuantity(productId:number, amount:number) {
        // alert("Decrement hit");
        setCartData(prevCartItems =>
            prevCartItems.map(cartItem =>
                cartItem.id === productId
                ? { ...cartItem, quantity: cartItem.quantity - amount }
                : cartItem
            )
          );
    }

    function findItemCartQuantity(id:number) {
        const product = cartItems.find((item) => item.id === id);
        return product?.quantity ?? 0;
    }

    function deleteItem(id:number){
        setCartData(cartItems.filter(item => item.id !== id));
    }

    const printCart = () => {
        console.log(cartItems);
    }

    const getTotalPriceOfCart = () => {
        return Number(cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2));
    }
    const getTotalItemsInCart = () => {
        return cartItems.reduce((sum, item) => sum + item.quantity, 0);
    }
    
    const clearCart = () => {
        setCartData([]);
    }

    return (
        <CartContext.Provider value={{cartItems, totalPriceOfCart, totalItemsInCart , printCart, addToCart, clearCart, deleteItem, incrementProductQuantity, decrementProductQuantity, findItemCartQuantity}}>
            {children}
        </CartContext.Provider>
    )
}

export const useCart = (): CartContextType => {
    const context = useContext(CartContext);
    if (!context) {
      throw new Error("failed to create cartContext");
    }
    return context;
  };