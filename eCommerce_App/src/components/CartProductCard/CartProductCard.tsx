import { useState, useEffect } from "react";
import { useCart } from "../../CartContext";
import type { CartItem } from "../../CartContext";
import type { DataInterface } from "../../pages/CustomizableProductPage/CustomizableProductPage";
import { FaTrashAlt } from 'react-icons/fa';
import type { IconType } from 'react-icons';
import { useFetch } from "../../helper/helpers";
import { ItemQuantityCard } from "../ItemQuantityCard/ItemQuantityCard";


interface CartProductCardProps {
    cartItemInfo: CartItem;
  }

export function CartProductCard ({ cartItemInfo }: CartProductCardProps){
    const cart = useCart();
    const TrashIcon: IconType = FaTrashAlt;
    const [ outOfStockMessage, setOutOfStockMessage] = useState<string>("");
    const { data } = useFetch<DataInterface[]>(`http://localhost:5000/products/${cartItemInfo.id}`);
    const [selectedQuantity, setSelectedQuantity] = useState<number>(cart.findItemCartQuantity(cartItemInfo.id));
    const [ errorMessage, setErrorMessage ] = useState("");
    const productStock = data?.[0].quantity;
    const productId = data?.[0].id;
    
    useEffect(() => {
        function showItemQuantityInCheckout(){
            if (!data) return;
            if (productId === undefined) return;
            if (productStock === undefined) return;

            const cartItemQuantity = cart.findItemCartQuantity(productId);

            if (cartItemQuantity > productStock) {
                cart.decrementProductQuantity(productId, cartItemQuantity - productStock);
                setSelectedQuantity(productStock);
            } else if ((cartItemQuantity === 0) && (productStock > 0)) {
                setSelectedQuantity(0);
            }
        }
        showItemQuantityInCheckout();
    },[productStock]);

    useEffect(()=>{
        if (!data) return;
        if (productId === undefined) return;

        const cartItemQuantity = cart.findItemCartQuantity(productId);
        if (cartItemQuantity < selectedQuantity) {
            cart.incrementProductQuantity(productId, selectedQuantity - cartItemQuantity);
        } else if (cartItemQuantity > selectedQuantity) {
            cart.decrementProductQuantity(productId, cartItemQuantity - selectedQuantity);
        }
    },[selectedQuantity])
    
    useEffect(() => {
        if (!outOfStockMessage) return;
      
        const timer = setTimeout(() => {
            setOutOfStockMessage("");
        }, 5000);
      
        return () => clearTimeout(timer); // cleanup
      }, [outOfStockMessage]);
    
    function handleDelete(itemId:number | undefined){
        if (itemId === undefined) return;
        cart.deleteItem(itemId);
    }

    
    return (
        <div>
            <div style={{display:"flex",flex:"1 1 0", alignContent:"center", gap:"5px"}}>
                <img src={`${cartItemInfo.image}`} style={{width:"100px", height:"100px",objectFit:"fill"}}/>
                <div>
                    <h2>${(cartItemInfo.price * cartItemInfo.quantity).toFixed(2)} <span style={{opacity:"50%", fontSize:"smaller"}}>({cartItemInfo.price} each)</span></h2>
                    <h3>{cartItemInfo.name}</h3>
                </div>
            </div>
            {errorMessage && <p style={{color:"red", textAlign:'center'}}>{errorMessage}</p>}
            <p style={{display:"flex", justifyContent:"center", alignItems:"center"}}>
                <ItemQuantityCard 
                    stock={productStock ?? 0}
                    selectedCartQuantityFromCheckout={selectedQuantity}
                    setSelectedQuantity={setSelectedQuantity}
                    setErrorMessage={setErrorMessage}
                />
                <TrashIcon style={{marginLeft:"5px", cursor:"pointer" }} onClick={()=>handleDelete(productId)}/>
            </p>
        </div>
    )
}