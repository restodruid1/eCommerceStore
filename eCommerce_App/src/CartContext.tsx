import { useState, useContext, createContext, useEffect } from "react";

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
    incrementQuantity?:(id: number, amount:number) => void;
    findItemCartQuantity?:(id: number) => number;
    cartTotalPrice?: () => number;
    cartTotalItems?: () => number;
}


const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider ({ children }: { children: React.ReactNode }) {
    // const [cartItems, setCartData] = useState<CartItem[]>([]);
    const storedCart = localStorage.getItem("cart");
    const [cartItems, setCartData] = useState<CartItem[]>(storedCart ? JSON.parse(storedCart) as CartItem[] : []);


    useEffect(() => {
        localStorage.setItem("cart", JSON.stringify(cartItems));
    }, [cartItems]);

    function addToCart(item:CartItem, stockQuantity:number){
        var foundId = false;
        
        cartItems.forEach(curCartItem => {      // Update existing quantity else add item to cart
            if (curCartItem.id === item.id){
                if (curCartItem.quantity + item.quantity <= stockQuantity) {
                    // curCartItem.quantity += item.quantity;
                    incrementQuantity(curCartItem.id, item.quantity);
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

    function incrementQuantity(id:number, amount:number) {
        // alert("Increment hit");
        setCartData(prevItems =>
            prevItems.map(item =>
              item.id === id
                ? { ...item, quantity: item.quantity + amount }
                : item
            )
          );
    }
    function findItemCartQuantity(id:number) {
        const productinfo = cartItems.find((item) => item.id === id)!;
        // console.log("FIND ITEM QUANTITY IN CART: " + productinfo.quantity);
        return productinfo.quantity;

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
        <CartContext.Provider value={{cartItems,cartTotalPrice,cartTotalItems, printCart, addToCart, clearCart,deleteItem, incrementQuantity, decrementQuantity, findItemCartQuantity}}>
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