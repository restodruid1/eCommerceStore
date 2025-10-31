import { useState, useContext, createContext } from "react";

export interface CartItem {
    id: number;
    name: string;
    price: number;
    quantity: number;
    image?: string;
}
interface CartContextType {
    cartItems?: CartItem[];
    addItem?: (item: Omit<CartItem, "quantity">) => void;
    deleteItem?: (id: number) => void;
    updateQuantity?: (id: number, quantity: number) => void;
    clearCart?: () => void;
    printCart?: () => void;
    addToCart?: (item:CartItem, stockQuantity:number) => void;
    total?: number;
    updateTotal?: () => void;
    decrementQuantity?:(id: number) => void;
    incrementQuantity?:(id: number) => void;
    cartTotalPrice?: () => number;
    cartTotalItems?: () => number;
}


const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider ({ children }: { children: React.ReactNode }) {
    const [cartItems, setCartData] = useState<CartItem[]>([]);


    function addToCart(item:CartItem, stockQuantity:number){
        var foundId = false;
        
        cartItems.forEach(curCartItem => {      // Update existing quantity else add item to cart
            if (curCartItem.id === item.id){
                if (curCartItem.quantity + item.quantity > stockQuantity) {
                    alert("quantity not in stock");
                } else {
                    curCartItem.quantity += item.quantity;
                    alert(`added ${item.quantity} to cart`);
                }
                foundId = true;
            }
        });
        if (!foundId) {
            setCartData((prevItems) => [...prevItems, item]);
            alert(`added ${item.quantity} to cart`);
        }
    }

    function incrementQuantity(id:number) {
        // alert("Increment hit");
        setCartData(prevItems =>
            prevItems.map(item =>
              item.id === id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            )
          );
    }

    function decrementQuantity(id:number) {
        // alert("Decrement hit");
        setCartData(prevItems =>
            prevItems.map(item =>
              item.id === id
                ? { ...item, quantity: item.quantity - 1 }
                : item
            )
          );
    }
    function deleteItem(id:number){
        setCartData(cartItems.filter(item => item.id !== id));
    }

    const printCart = () => {
        console.log(cartItems);
    }
    const cartTotalPrice = () => {
        return Number(cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2));
    }
    const cartTotalItems = () => {
        return cartItems.reduce((sum, item) => sum + item.quantity, 0);
    }
    
    const clearCart = () => {
        setCartData([]);
    }

    return (
        <CartContext.Provider value={{cartItems,cartTotalPrice,cartTotalItems, printCart, addToCart, clearCart,deleteItem, incrementQuantity, decrementQuantity}}>
            {children}
        </CartContext.Provider>
    )

}
export const useCart = (): CartContextType => {
    const context = useContext(CartContext);
    if (!context) {
      throw new Error("useCounter must be used within a CounterProvider");
    }
    return context;
  };