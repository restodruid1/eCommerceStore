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
    removeItem?: (id: number) => void;
    updateQuantity?: (id: number, quantity: number) => void;
    clearCart?: () => void;
    printCart?: () => void;
    addToCart?: (item:CartItem, stockQuantity:number) => void;
    total?: number;
    updateTotal?: () => void;
}


const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider ({ children }: { children: React.ReactNode }) {
    const [cartItems, setCartData] = useState<CartItem[]>([]);
    const [total, setTotal] = useState<number>(0);


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

    const printCart = () => {
        console.log(cartItems);
    }
    const updateTotal = () => {
        setTotal(total + 1);
    }
    
    const clearCart = () => {
        setCartData([]);
    }

    return (
        <CartContext.Provider value={{cartItems,total,updateTotal, printCart, addToCart, clearCart}}>
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